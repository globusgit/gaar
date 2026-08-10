import connectDB from "@/lib/mongoose";
import PaymentInfo from "@/models/PaymentInfo";
import Employee from "@/models/Employee";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activityLog";
import { requireAuth, requireOrgScope } from "@/lib/apiGuard";
import TransactionInfo from "@/models/TransactionInfo";
import ReceivableInfo from "@/models/ReceivableInfo";

const SAFE_PAYMENT_UPDATE_FIELDS = [
  "description","paymentPriority","vertical","state","requestedBy","dueDate","paymentType","frType","woNo","woTitle","tenderNo","tenderDesc","paymentTo","requestNo","isApproved","approvedBy","approvedDate","isAuthorized","authorizedBy","authorizationDate","requestAmount","paidAmount","balanceAmount",
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

  if (token.role !== "ADMIN" && token.role !== "SYS_ADMIN") {
    const employee = await Employee.findOne({
      $or: [
        { empId: token.username },
        { phone: token.username },
      ],
      orgId: token.orgId,
    }).lean();

    if (!employee || data.requestedById !== employee._id.toString()) {
      return NextResponse.json(
        { message: "Forbidden: Access denied" },
        { status: 403 },
      );
    }
  }

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

  if (token.role !== "ADMIN" && token.role !== "SYS_ADMIN") {
    const employee = await Employee.findOne({
      $or: [
        { empId: token.username },
        { phone: token.username },
      ],
      orgId: token.orgId,
    }).lean();

    if (!employee || existingPayment.requestedById !== employee._id.toString()) {
      return NextResponse.json(
        { error: "Forbidden: Access denied" },
        { status: 403 },
      );
    }
  }

  const update = {};
  for (const f of SAFE_PAYMENT_UPDATE_FIELDS) {
    if (body[f] !== undefined) update[f] = body[f];
  }

  if (body.requestAmount !== undefined && body.requestAmount !== existingPayment.requestAmount) {
    update.requestAmount = body.requestAmount;
    update.balanceAmount = body.requestAmount - existingPayment.paidAmount;
  }

  const updated = await PaymentInfo.findOneAndUpdate({ _id: id, orgId: token.orgId }, update, {
    returnDocument: "after",
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

export async function DELETE(req, { params }) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  const { id } = await params;

  const payment = await PaymentInfo.findById(id);
  if (!payment) {
    return NextResponse.json(
      { message: "Payment info not found" },
      { status: 404 }
    );
  }

  const scope = await requireOrgScope(req, payment.orgId, token.orgId);
  if (scope instanceof Response) return scope;

  if (token.role !== "ADMIN" && token.role !== "SYS_ADMIN") {
    const employee = await Employee.findOne({
      $or: [
        { empId: token.username },
        { phone: token.username },
      ],
      orgId: token.orgId,
    }).lean();

    if (!employee || payment.requestedById !== employee._id.toString()) {
      return NextResponse.json(
        { message: "Forbidden: Access denied" },
        { status: 403 },
      );
    }
  }

  const relatedReceivables = await ReceivableInfo.find({
    paymentId: id,
    orgId: payment.orgId,
  }).select("_id");
  const receivableIds = relatedReceivables.map((r) => r._id);

  await TransactionInfo.deleteMany({
    orgId: payment.orgId,
    $or: [
      { entityType: "PAYMENT", entityId: id },
      { entityType: "RECEIVABLE", entityId: { $in: receivableIds } },
    ],
  });

  await ReceivableInfo.deleteMany({ paymentId: id, orgId: payment.orgId });
  await PaymentInfo.deleteOne({ _id: id, orgId: token.orgId });

  return NextResponse.json(
    { message: "Payment deleted successfully!" },
    { status: 200 }
  );
}
