import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function usesSecureCookies(req: NextRequest): boolean {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  return forwardedProto === "https" || req.nextUrl.protocol === "https:";
}

export async function getAuthToken(req: NextRequest) {
  return getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    // Auth.js uses a different cookie name for HTTP and HTTPS. Let it select
    // the matching default instead of hard-coding the production-only name.
    secureCookie: usesSecureCookies(req),
  });
}

export async function requireAuth(req: NextRequest) {
  const token = await getAuthToken(req);

  if (!token?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return token;
}

export async function requireOrgScope(req: NextRequest, entityOrgId?: string | null, tokenOrgId?: string | null) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const orgId = tokenOrgId || auth.orgId;

  if (!orgId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (entityOrgId && entityOrgId !== orgId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return orgId;
}

export function sanitizeSortField(field: string): string {
  const allowed = new Set([
    "createdAt",
    "updatedAt",
    "name",
    "orgId",
    "status",
    "tenderNo",
    "empId",
    "employeeId",
    "phone",
    "email",
    "amount",
    "balanceAmount",
    "paidAmount",
    "requestAmount",
    "receivableAmount",
    "receivedAmount",
    "frNo",
    "woNo",
    "clientName",
    "contactName",
    "designation",
    "title",
    "subject",
    "isActive",
    "isApproved",
    "isAuthorized",
    "role",
    "_id",
  ]);
  return allowed.has(field) ? field : "createdAt";
}

export function sanitizeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isAdminOrSysAdmin(token: { role: string } | null | undefined): boolean {
  return token?.role === "SYS_ADMIN" || token?.role === "ADMIN";
}

export function isSysAdmin(token: { role?: string } | null | undefined): boolean {
  return token?.role === "SYS_ADMIN";
}

export function hasModuleAccess(
  token: { role?: string; modules?: string[] } | null | undefined,
  module: string,
): boolean {
  return Boolean(
    token &&
      (token.role === "SYS_ADMIN" ||
        (Array.isArray(token.modules) && token.modules.includes(module))),
  );
}

const ROLE_LEVEL: Record<string, number> = {
  USER: 10,
  ACCOUNTANT: 20,
  ACCOUNTS: 20,
  MANAGER: 30,
  ORG_USER: 40,
  ADMIN: 40,
  SYS_ADMIN: 100,
};

export function canAssignRole(
  actor: { role?: string } | null | undefined,
  targetRole: string,
): boolean {
  if (!actor?.role || !(targetRole in ROLE_LEVEL)) return false;
  if (targetRole === "SYS_ADMIN") return actor.role === "SYS_ADMIN";
  return (ROLE_LEVEL[actor.role] ?? 0) >= ROLE_LEVEL[targetRole];
}

export function canManageRole(
  actor: { role?: string } | null | undefined,
  existingRole: string,
): boolean {
  if (!actor?.role || !(existingRole in ROLE_LEVEL)) return false;
  if (actor.role === "SYS_ADMIN") return true;
  if (existingRole === "SYS_ADMIN") return false;
  return (ROLE_LEVEL[actor.role] ?? 0) >= ROLE_LEVEL[existingRole];
}

export function canAccessOrg(
  token: { role?: string; orgId?: string | null } | null | undefined,
  orgId: string | null | undefined,
): boolean {
  return Boolean(token && orgId && (token.orgId === orgId || isSysAdmin(token)));
}
