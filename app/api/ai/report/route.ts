import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import { generateText, getProviderName, getModelName } from "@/lib/llm";
import { aiReportSchema, MODULE_PATHS } from "@/lib/aiSchemas";
import { requireAuth } from "@/lib/apiGuard";
import { getReportPrompt } from "@/lib/prompts";
import Organization from "@/models/Organization";
import TenderInfo from "@/models/TenderInfo";
import PaymentInfo from "@/models/PaymentInfo";
import ReceivableInfo from "@/models/ReceivableInfo";
import FundRequest from "@/models/FundRequest";
import WorkOrder from "@/models/WorkOrder";
import Client from "@/models/Client";
import Employee from "@/models/Employee";
import User from "@/models/User";

function hasModuleAccess(userModules: string[], targetModule: string): boolean {
  if (targetModule === "dashboard") return true;
  return userModules.includes(targetModule);
}

function hasAiAccess(auth: { role?: string; modules?: string[] }): boolean {
  return auth.role === "SYS_ADMIN" || auth.modules?.includes("ai") === true;
}

async function fetchModuleData(orgId: string, module: string, period: string) {
  const periodMs: Record<string, number> = {
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    quarter: 90 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };
  const dateFilter = period === "all" ? {} : {
    createdAt: {
      $gte: new Date(Date.now() - (periodMs[period] || periodMs.month)),
    },
  };

  switch (module) {
    case "tenders": {
      const total = await TenderInfo.countDocuments({ orgId, ...dateFilter });
      const active = await TenderInfo.countDocuments({ orgId, status: "Active", ...dateFilter });
      const won = await TenderInfo.countDocuments({ orgId, status: "Won", ...dateFilter });
      const lost = await TenderInfo.countDocuments({ orgId, status: "Lost", ...dateFilter });
      const draft = await TenderInfo.countDocuments({ orgId, status: "Draft", ...dateFilter });
      const recent = await TenderInfo.find({ orgId, ...dateFilter })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      return { total, active, won, lost, draft, recent };
    }
    case "payments": {
      const total = await PaymentInfo.countDocuments({ orgId, ...dateFilter });
      const totalAmount = await PaymentInfo.aggregate([
        { $match: { orgId, ...dateFilter } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const paid = await PaymentInfo.countDocuments({ orgId, isPaid: true, ...dateFilter });
      const pending = await PaymentInfo.countDocuments({ orgId, isPaid: false, ...dateFilter });
      const recent = await PaymentInfo.find({ orgId, ...dateFilter })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      return { total, totalAmount: totalAmount[0]?.total || 0, paid, pending, recent };
    }
    case "receivables": {
      const total = await ReceivableInfo.countDocuments({ orgId, ...dateFilter });
      const totalAmount = await ReceivableInfo.aggregate([
        { $match: { orgId, ...dateFilter } },
        { $group: { _id: null, total: { $sum: "$receivableAmount" } } },
      ]);
      const paid = await ReceivableInfo.countDocuments({ orgId, status: "Paid", ...dateFilter });
      const pending = await ReceivableInfo.countDocuments({ orgId, status: { $nin: ["Paid", "Overdue"] }, ...dateFilter });
      const overdue = await ReceivableInfo.countDocuments({ orgId, status: "Overdue", ...dateFilter });
      const recent = await ReceivableInfo.find({ orgId, ...dateFilter })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      return { total, totalAmount: totalAmount[0]?.total || 0, paid, pending, overdue, recent };
    }
    case "fund-requests": {
      const total = await FundRequest.countDocuments({ orgId, ...dateFilter });
      const totalAmount = await FundRequest.aggregate([
        { $match: { orgId, ...dateFilter } },
        { $group: { _id: null, total: { $sum: "$requestAmount" } } },
      ]);
      const approved = await FundRequest.countDocuments({ orgId, isApproved: true, ...dateFilter });
      const pending = await FundRequest.countDocuments({ orgId, isApproved: false, isAuthorized: false, ...dateFilter });
      const authorized = await FundRequest.countDocuments({ orgId, isApproved: true, isAuthorized: true, ...dateFilter });
      const recent = await FundRequest.find({ orgId, ...dateFilter })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      return { total, totalAmount: totalAmount[0]?.total || 0, approved, pending, authorized, recent };
    }
    case "work-orders": {
      const total = await WorkOrder.countDocuments({ orgId, ...dateFilter });
      const active = await WorkOrder.countDocuments({ orgId, status: "Active", ...dateFilter });
      const completed = await WorkOrder.countDocuments({ orgId, status: "Completed", ...dateFilter });
      const totalValue = await WorkOrder.aggregate([
        { $match: { orgId, ...dateFilter } },
        { $group: { _id: null, total: { $sum: "$totalValue" } } },
      ]);
      const recent = await WorkOrder.find({ orgId, ...dateFilter })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      return { total, active, completed, totalValue: totalValue[0]?.total || 0, recent };
    }
    case "employees": {
      const total = await Employee.countDocuments({ orgId, ...dateFilter });
      const byDesignation = await Employee.aggregate([
        { $match: { orgId, ...dateFilter } },
        { $group: { _id: "$designation", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      const recent = await Employee.find({ orgId, ...dateFilter })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      return { total, byDesignation, recent };
    }
    case "clients": {
      const total = await Client.countDocuments({ orgId, ...dateFilter });
      const active = await Client.countDocuments({ orgId, isActive: true, ...dateFilter });
      const byState = await Client.aggregate([
        { $match: { orgId, ...dateFilter } },
        { $group: { _id: "$state", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      const recent = await Client.find({ orgId, ...dateFilter })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      return { total, active, byState, recent };
    }
    case "organizations": {
      const total = await Organization.countDocuments();
      const recent = Organization.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      return { total, recent, note: "Organizations data is platform-wide and may be restricted to SYS_ADMIN" };
    }
    case "users": {
      const total = await User.countDocuments({ orgId, ...dateFilter });
      const byRole = await User.aggregate([
        { $match: { orgId, ...dateFilter } },
        { $group: { _id: "$role", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      const recent = await User.find({ orgId, ...dateFilter })
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      return { total, byRole, recent };
    }
    case "dashboard": {
      const tenders = await TenderInfo.countDocuments({ orgId });
      const payments = await PaymentInfo.countDocuments({ orgId });
      const receivables = await ReceivableInfo.countDocuments({ orgId });
      const fundRequests = await FundRequest.countDocuments({ orgId });
      const workOrders = await WorkOrder.countDocuments({ orgId });
      const clients = await Client.countDocuments({ orgId });
      const employees = await Employee.countDocuments({ orgId });
      return { tenders, payments, receivables, fundRequests, workOrders, clients, employees };
    }
    default:
      return {};
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  if (!hasAiAccess(auth)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const orgId = auth.orgId as string;
  const org = await Organization.findOne({ orgId });
  const orgName = org?.orgName || "Unknown Organization";

  const url = new URL(req.url);
  const reportModule = url.searchParams.get("module") || "dashboard";
  const period = url.searchParams.get("period") || "month";
  const language = url.searchParams.get("language") || "english";

  if (!hasModuleAccess(auth.modules || [], reportModule)) {
    const modulePath = MODULE_PATHS[reportModule] || `/${reportModule}`;
    return NextResponse.json(
      {
        error: "Forbidden",
        explanation: `You do not have access to the ${reportModule} module. It is available at ${modulePath}. Contact your administrator to request access.`,
        modulePath,
      },
      { status: 403 }
    );
  }

  const data = await fetchModuleData(orgId, reportModule, period);
  const prompt = getReportPrompt(reportModule, orgName, data, language);

  let report;
  try {
    report = await generateText(
      "You are an expert business analyst specializing in ERP data analysis. Generate clear, actionable reports in Markdown format.",
      prompt,
      { temperature: 0.3, maxTokens: 4096 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "AI report generation failed", details: (err as Error).message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    report,
    provider: getProviderName(),
    model: getModelName(),
    module: reportModule,
    modulePath: MODULE_PATHS[reportModule] || `/${reportModule}`,
    orgName,
    language,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  if (!hasAiAccess(auth)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parseResult = aiReportSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parseResult.error.issues.map((i: { message: string }) => i.message) },
      { status: 400 }
    );
  }

  const { module, orgId, options, language } = parseResult.data;

  await connectDB();

  if (orgId !== auth.orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!hasModuleAccess(auth.modules || [], module)) {
    const modulePath = MODULE_PATHS[module] || `/${module}`;
    return NextResponse.json(
      {
        error: "Forbidden",
        explanation: `You do not have access to the ${module} module. It is available at ${modulePath}. Contact your administrator to request access.`,
        modulePath,
      },
      { status: 403 }
    );
  }

  const org = await Organization.findOne({ orgId });
  const orgName = org?.orgName || "Unknown Organization";

  const data = await fetchModuleData(orgId, module, options?.period || "month");
  const prompt = getReportPrompt(module, orgName, data, language || "english");

  let report;
  try {
    report = await generateText(
      "You are GAAR's AI report analyst for a multi-tenant ERP system. Generate structured, professional business reports. Include executive summary, key metrics, trends, risk assessment, and recommendations.",
      prompt,
      {
        temperature: 0.3,
        maxTokens: options?.format === "html" ? 8192 : 4096,
      }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "AI report generation failed", details: (err as Error).message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    report,
    provider: getProviderName(),
    model: getModelName(),
    module,
    modulePath: MODULE_PATHS[module] || `/${module}`,
    orgName,
    language: language || "english",
    timestamp: new Date().toISOString(),
  });
}
