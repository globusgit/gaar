import WorkOrder from "@/models/WorkOrder";
import connectDB from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activityLog";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";
import ReceivableInfo from "@/models/ReceivableInfo";
import PaymentInfo from "@/models/PaymentInfo";
import TransactionInfo from "@/models/TransactionInfo";

const SAFE_WORK_ORDER_UPDATE_FIELDS = [
  "woNo","woTitle","tenderNo","tenderDesc","woDate","woType","vertical","subVertical","projectCompletionDate","actualStartDate","actualEndDate","client","bgAmount","bgMaturityDate","woValue","country","state","clientId","status","bgReceivedStatus","projectManager","scm",
];

export async function GET(request, { params }) {
  const token = await requireAuth(request);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const { id } = await params;
    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) {
      return NextResponse.json(
        { message: "Work order not found" },
        { status: 404 }
      );
    }

    const scope = await requireOrgScope(request, workOrder.orgId, token.orgId);
    if (scope instanceof Response) return scope;

    return NextResponse.json(workOrder);
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching work order" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const token = await requireAuth(request);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const existing = await WorkOrder.findById(id);
    if (!existing) {
      return NextResponse.json(
        { message: "Work order not found" },
        { status: 404 }
      );
    }

    const scope = await requireOrgScope(request, existing.orgId, token.orgId);
    if (scope instanceof Response) return scope;

    if (existing.status === "Completed") {
      return NextResponse.json(
        { message: "Forbidden: Completed work orders cannot be updated" },
        { status: 403 }
      );
    }

    const updateData = {};
    for (const key of SAFE_WORK_ORDER_UPDATE_FIELDS) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const updatedWorkOrder = await WorkOrder.findByIdAndUpdate(
      id,
      updateData,
      { returnDocument: "after" }
    );
    if (!updatedWorkOrder) {
      return NextResponse.json(
        { message: "Work order not found" },
        { status: 404 }
      );
    }

    await logActivity({
      activity: "Work Order Updated",
      description: `Work Order ${updatedWorkOrder.woNo} was updated`,
      entity: "Work Order",
      entityId: updatedWorkOrder._id.toString(),
      orgId: updatedWorkOrder.orgId,
      req: request,
    });

    return NextResponse.json(
      { message: "Work Order updated!" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error updating work order" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const token = await requireAuth(request);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const { id } = await params;

    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) {
      return NextResponse.json(
        { message: "Work order not found" },
        { status: 404 }
      );
    }

    const scope = await requireOrgScope(request, workOrder.orgId, token.orgId);
    if (scope instanceof Response) return scope;

    const woNo = workOrder.woNo;
    const orgId = workOrder.orgId;

    const relatedPayments = await PaymentInfo.find({
      woNo,
      orgId,
    }).select("_id");
    const paymentIds = relatedPayments.map((p) => p._id);

    const relatedReceivables = await ReceivableInfo.find({
      woNo,
      orgId,
    }).select("_id");
    const receivableIds = relatedReceivables.map((r) => r._id);

    await TransactionInfo.deleteMany({
      orgId,
      $or: [
        { entityType: "PAYMENT", entityId: { $in: paymentIds } },
        { entityType: "RECEIVABLE", entityId: { $in: receivableIds } },
      ],
    });

    await PaymentInfo.deleteMany({ woNo, orgId });
    await ReceivableInfo.deleteMany({ woNo, orgId });
    await WorkOrder.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Work order deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error deleting work order" },
      { status: 500 }
    );
  }
}
