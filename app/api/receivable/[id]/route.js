import connectDB from "@/lib/mongoose";
import ReceivableInfo from "@/models/ReceivableInfo";
import { NextResponse } from "next/server";
import { requireAuth, requireOrgScope } from "@/lib/apiGuard";

export async function GET(req, { params }) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  const { id } = await params;
  const data = await ReceivableInfo.findById(id);
  if (!data) {
    return NextResponse.json(
      { message: "Receivable info not found" },
      { status: 404 }
    );
  }

  const scope = await requireOrgScope(req, data.orgId, token.orgId);
  if (scope instanceof Response) return scope;

  return NextResponse.json(data);
}
