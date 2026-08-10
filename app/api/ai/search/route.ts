import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import { generateStructuredResponse, generateText, getProviderName, getModelName } from "@/lib/llm";
import { aiSearchSchema, aiSearchResponseSchema, MODULE_PATHS } from "@/lib/aiSchemas";
import { requireAuth, sanitizeRegex } from "@/lib/apiGuard";
import { getSearchPrompt } from "@/lib/prompts";
import TenderInfo from "@/models/TenderInfo";
import PaymentInfo from "@/models/PaymentInfo";
import ReceivableInfo from "@/models/ReceivableInfo";
import FundRequest from "@/models/FundRequest";
import WorkOrder from "@/models/WorkOrder";
import Client from "@/models/Client";
import Employee from "@/models/Employee";
import User from "@/models/User";
import Organization from "@/models/Organization";

const FIELD_MAP: Record<string, string[]> = {
  tenders: ["tenderNo", "description", "client", "status", "position", "tenderingDepartment", "owner", "tenderManager", "scm", "totalValue"],
  "work-orders": ["woNo", "title", "status", "owner", "projectManager", "totalValue", "scmOwner"],
  payments: ["paymentType", "status", "amount", "paidAmount", "balanceAmount", "paymentFrom", "description"],
  receivables: ["paymentFrom", "invoiceNumber", "status", "receivableAmount", "balanceReceivableAmount", "paidAmount", "dueDate"],
  "fund-requests": ["frNo", "title", "requestAmount", "status", "isApproved", "isAuthorized", "requestFrom"],
  employees: ["employeeName", "empId", "designation", "department", "status", "phone", "email"],
  clients: ["clientName", "clientId", "status", "state", "gstNo", "contactPerson", "website"],
  organizations: ["orgName", "orgId", "state", "country"],
  users: ["username", "employeeName", "role", "status"],
};

const MAX_SEARCH_LIMIT = 100;

function getSafeLimit(value: unknown, fallback = 20): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), 1), MAX_SEARCH_LIMIT);
}

function hasModuleAccess(userModules: string[], targetModule: string): boolean {
  if (targetModule === "all" || targetModule === "dashboard") return true;
  return userModules.includes(targetModule);
}

function hasAiAccess(auth: { role?: string; modules?: string[] }): boolean {
  return auth.role === "SYS_ADMIN" || auth.modules?.includes("ai") === true;
}

async function executeSearch(
  orgId: string,
  module: string,
  filters: Array<{ field: string; operator: string; value: string | number | boolean }>,
  sort?: string,
  limit: number = 20
) {
  const query: Record<string, unknown> = { orgId };

  for (const filter of filters) {
    const { field, operator, value } = filter;
    const fieldName = field.includes(".") ? field.split(".")[1] : field;
    if (!FIELD_MAP[module]?.includes(fieldName)) continue;
    switch (operator) {
      case "eq":
        query[fieldName] = value;
        break;
      case "gt":
        query[fieldName] = { $gt: Number(value) };
        break;
      case "lt":
        query[fieldName] = { $lt: Number(value) };
        break;
      case "gte":
        query[fieldName] = { $gte: Number(value) };
        break;
      case "lte":
        query[fieldName] = { $lte: Number(value) };
        break;
      case "contains":
        query[fieldName] = { $regex: sanitizeRegex(String(value)), $options: "i" };
        break;
    }
  }

  let Model;
  switch (module) {
    case "tenders": Model = TenderInfo; break;
    case "work-orders": Model = WorkOrder; break;
    case "payments": Model = PaymentInfo; break;
    case "receivables": Model = ReceivableInfo; break;
    case "fund-requests": Model = FundRequest; break;
    case "employees": Model = Employee; break;
    case "clients": Model = Client; break;
    case "organizations": Model = Organization; break;
    case "users": Model = User; break;
    default: return { data: [], total: 0, modulePath: MODULE_PATHS[module] };
  }

  if (!Model) {
    return { data: [], total: 0, modulePath: MODULE_PATHS[module] };
  }

  const sortObj: Record<string, 1 | -1> = {};
  if (sort) {
    const [sortField, sortDir] = sort.split("|");
    const sortFieldName = sortField.includes(".") ? sortField.split(".")[1] : sortField;
    if (FIELD_MAP[module]?.includes(sortFieldName)) {
      sortObj[sortFieldName] = sortDir === "desc" ? -1 : 1;
    }
  } else {
    sortObj.createdAt = -1;
  }

  const [data, total] = await Promise.all([
    Model.find(query).select("-password").sort(sortObj).limit(getSafeLimit(limit)).lean(),
    Model.countDocuments(query),
  ]);

  return { data, total, modulePath: MODULE_PATHS[module] };
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  if (!hasAiAccess(auth)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("q") || "";
  const orgId = auth.orgId as string;
  const moduleParam = url.searchParams.get("module") || "all";
  const limit = getSafeLimit(url.searchParams.get("limit") || 20);
  const language = url.searchParams.get("language") || "english";

  if (!query.trim()) {
    return NextResponse.json({ results: [], total: 0, explanation: "No query provided" });
  }

  await connectDB();

  if (!hasModuleAccess(auth.modules || [], moduleParam)) {
    return NextResponse.json(
      { error: "Forbidden", explanation: `You do not have access to the ${moduleParam} module. Contact your administrator.` },
      { status: 403 }
    );
  }

  const availableFields = moduleParam === "all"
    ? Object.entries(FIELD_MAP).flatMap(([m, fields]) => fields.map((f) => `${m}.${f}`))
    : FIELD_MAP[moduleParam] || [];

  let parsedFilters;
  try {
    const searchPrompt = getSearchPrompt(query, availableFields, language);
    const response = await generateStructuredResponse<unknown>(
      "You are a query parser for a multi-tenant ERP system (GAAR). Extract structured search filters from natural language queries and return ONLY valid JSON.",
      searchPrompt,
      {}
    );
    const parsedResult = aiSearchResponseSchema.safeParse(response);
    if (!parsedResult.success) throw new Error("Invalid AI search response");
    parsedFilters = parsedResult.data;
  } catch {
    const lowerQuery = query.toLowerCase();
    let fallbackModule = moduleParam;
    for (const mod of Object.keys(FIELD_MAP)) {
      const singular = mod.replace(/s$/, "");
      if (lowerQuery.includes(mod) || lowerQuery.includes(singular)) {
        fallbackModule = mod;
        break;
      }
    }
    parsedFilters = {
      module: fallbackModule,
      filters: [],
      intent: `Search across ${fallbackModule}`,
      limit: 20,
    };
  }

  const targetModule = (parsedFilters.module && FIELD_MAP[parsedFilters.module] ? parsedFilters.module : moduleParam) as string;

  if (!hasModuleAccess(auth.modules || [], targetModule)) {
    const modulePath = MODULE_PATHS[targetModule] || `/${targetModule}`;
    return NextResponse.json(
      {
        error: "Forbidden",
        explanation: `You do not have access to the ${targetModule} module. It is available at ${modulePath}. Contact your administrator to request access.`,
        modulePath,
      },
      { status: 403 }
    );
  }

  const filters = parsedFilters.filters || [];
  const sort = parsedFilters.sort || undefined;
  const effectiveLimit = getSafeLimit(parsedFilters.limit, limit);

  const results = await executeSearch(orgId, targetModule, filters, sort, effectiveLimit);

  const explanation = parsedFilters.intent || `Natural language search "${query}" translated to ${targetModule} query`;

  return NextResponse.json({
    ...results,
    explanation,
    provider: getProviderName(),
    model: getModelName(),
    query,
    language,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  if (!hasAiAccess(auth)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parseResult = aiSearchSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parseResult.error.issues.map((i: { message: string }) => i.message) },
      { status: 400 }
    );
  }

  const { query, orgId, module, limit, language } = parseResult.data;

  await connectDB();

  if (orgId !== auth.orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const targetModule = module === "all" ? "dashboard" : module;

  if (!hasModuleAccess(auth.modules || [], targetModule)) {
    const modulePath = MODULE_PATHS[targetModule] || `/${targetModule}`;
    return NextResponse.json(
      {
        error: "Forbidden",
        explanation: `You do not have access to the ${targetModule} module. It is available at ${modulePath}. Contact your administrator to request access.`,
        modulePath,
      },
      { status: 403 }
    );
  }

  const availableFields = !FIELD_MAP[targetModule]
    ? Object.entries(FIELD_MAP).flatMap(([m, fields]) => fields.map((f) => `${m}.${f}`))
    : FIELD_MAP[targetModule] || [];

  let parsedFilters;
  let explanation = "";

  try {
    const fieldList = availableFields.length > 0 ? availableFields.join(", ") : "No specific fields available";
    const searchPrompt = getSearchPrompt(query, availableFields, language || "english");
    const response = await generateStructuredResponse<unknown>(
      "You are a query parser for a multi-tenant ERP system (GAAR). Extract structured search filters from natural language queries. Return ONLY valid JSON matching the required schema.",
      `User query: "${query}"\nModule: ${module}\nAvailable fields: ${fieldList}`,
      {}
    );
    const parsedResult = aiSearchResponseSchema.safeParse(response);
    if (!parsedResult.success) throw new Error("Invalid AI search response");
    parsedFilters = parsedResult.data;
    explanation = parsedFilters.intent || `Search query "${query}" processed`;
  } catch {
    parsedFilters = { filters: [], explanation: "Could not parse query" };
  }

  const effectiveModule = (parsedFilters.module && FIELD_MAP[parsedFilters.module] ? parsedFilters.module : targetModule) || "tenders";

  if (!hasModuleAccess(auth.modules || [], effectiveModule)) {
    const modulePath = MODULE_PATHS[effectiveModule] || `/${effectiveModule}`;
    return NextResponse.json(
      {
        error: "Forbidden",
        explanation: `You do not have access to the ${effectiveModule} module. It is available at ${modulePath}. Contact your administrator to request access.`,
        modulePath,
      },
      { status: 403 }
    );
  }

  const filters = parsedFilters.filters || [];
  const sort = parsedFilters.sort || undefined;
  const effectiveLimit = getSafeLimit(parsedFilters.limit, limit);

  if (filters.length === 0) {
    return NextResponse.json({
      results: [],
      total: 0,
      explanation: `No structured filters extracted from "${query}". Try a more specific query (e.g., "show unpaid receivables over 5000").`,
      provider: getProviderName(),
      model: getModelName(),
      language,
    });
  }

  const results = await executeSearch(orgId, effectiveModule, filters, sort, effectiveLimit);

  return NextResponse.json({
    ...results,
    explanation,
    provider: getProviderName(),
    model: getModelName(),
    language,
  });
}
