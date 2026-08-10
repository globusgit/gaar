import connectDB from "@/lib/mongoose";
import ReceivableInfo from "@/models/ReceivableInfo";
import { NextResponse } from "next/server";
import { requireAuth, requireOrgScope } from "@/lib/apiGuard";
import TransactionInfo from "@/models/TransactionInfo";

const SAFE_RECEIVABLE_UPDATE_FIELDS = [
  "description","type","paymentFrom","vertical","subVertical","woNo","woTitle","tenderNo","tenderDesc","state","dueDate","invoiceNo","receivedDate","status",
];

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

export async function PUT(req, { params }) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  const body = await req.json();
  const { id } = await params;

  const existing = await ReceivableInfo.findById(id);
  if (!existing) {
    return NextResponse.json(
      { message: "Receivable info not found" },
      { status: 404 }
    );
  }

  const scope = await requireOrgScope(req, existing.orgId, token.orgId);
  if (scope instanceof Response) return scope;

  const update = {};
  for (const f of SAFE_RECEIVABLE_UPDATE_FIELDS) {
    if (body[f] !== undefined) update[f] = body[f];
  }

  const updated = await ReceivableInfo.findOneAndUpdate({ _id: id, orgId: token.orgId }, update, {
    returnDocument: "after",
  });

  if (!updated) {
    return NextResponse.json(
      { message: "Receivable info not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { message: "Receivable updated successfully!", data: updated },
    { status: 200 }
  );
}

export async function DELETE(req, { params }) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  const { id } = await params;

  const receivable = await ReceivableInfo.findById(id);
  if (!receivable) {
    return NextResponse.json(
      { message: "Receivable info not found" },
      { status: 404 }
    );
  }

  const scope = await requireOrgScope(req, receivable.orgId, token.orgId);
  if (scope instanceof Response) return scope;

  await TransactionInfo.deleteMany({
    orgId: receivable.orgId,
    entityType: "RECEIVABLE",
    entityId: id,
  });

  await ReceivableInfo.deleteOne({ _id: id, orgId: token.orgId });

  return NextResponse.json(
    { message: "Receivable deleted successfully!" },
    { status: 200 }
  );
}
