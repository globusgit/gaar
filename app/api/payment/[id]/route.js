import connectDB from "@/lib/mongoose";
import PaymentInfo from "@/models/PaymentInfo";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activityLog";
import { requireAuth, requireOrgScope } from "@/lib/apiGuard";

const SAFE_PAYMENT_UPDATE_FIELDS = [
  "description","priority","vertical","state","requestedBy","dueDate","paymentType","frType","woNo","woTitle","tenderNo","tenderDesc","paymentTo","requestNo","paymentPriority","isApproved","approvedBy","approvedDate","isAuthorized","authorizedBy","authorizationDate",
];

export async function GET(req, { params }) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  const { id } = await params;
  const data = await PaymentInfo.findById(id);
  if (!data) {
    return NextResponse.json(
      { message: "Payment info not found" },
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

  const existingPayment = await PaymentInfo.findById(id);
  if (!existingPayment) {
    return NextResponse.json(
      { error: "Payment info not found" },
      { status: 404 },
    );
  }

  const scope = await requireOrgScope(req, existingPayment.orgId, token.orgId);
  if (scope instanceof Response) return scope;

  const update = {};
  for (const f of SAFE_PAYMENT_UPDATE_FIELDS) {
    if (body[f] !== undefined) update[f] = body[f];
  }

  if (body.requestedAmount !== undefined && body.requestedAmount !== existingPayment.requestedAmount) {
    update.requestedAmount = body.requestedAmount;
    update.balanceAmount = body.requestedAmount - existingPayment.paidAmount;
  }

  const updated = await PaymentInfo.findByIdAndUpdate(id, update, {
    new: true,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Payment info not found" },
      { status: 404 },
    );
  }

  await logActivity({
    activity: "Payment Updated",
    description: `Payment ${updated._id} was updated`,
    entity: "Payment",
    entityId: updated._id.toString(),
    orgId: updated.orgId,
    req: req,
  });

  return NextResponse.json(updated);
}
