import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function requireAuth(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: true,
    cookieName: "__Secure-authjs.session-token",
  });

  if (!token?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return token;
}

export async function requireOrgScope(req: NextRequest, entityOrgId?: string | null, tokenOrgId?: string | null) {
  const orgId = tokenOrgId || (await requireAuth(req))?.orgId;

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
    "requestedAmount",
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
