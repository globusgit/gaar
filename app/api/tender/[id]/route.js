import connectDB from "@/lib/mongoose";
import TenderInfo from "@/models/TenderInfo";
import { NextResponse } from "next/server";
import ReceivableInfo from "@/models/ReceivableInfo";
import WorkOrder from "@/models/WorkOrder";
import PaymentInfo from "@/models/PaymentInfo";
import { logActivity } from "@/lib/activityLog";
import { requireAuth, requireOrgScope } from "@/lib/apiGuard";

export async function GET(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();
  const { id } = await params;
  const data = await TenderInfo.findOne({ _id: id, orgId: token.orgId });
  if (!data) {
    return NextResponse.json(
      { message: "Tender not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
}

export async function PUT(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const body = await req.json();
    const { id } = await params;

    const existingTender = await TenderInfo.findOne({ _id: id, orgId: token.orgId });
    if (!existingTender) {
      return NextResponse.json(
        { message: "Tender not found" },
        { status: 404 },
      );
    }

    if (body.status === "Cancelled") {
      if (body.documentFeePaymentStatus === "Paid") {
        if (existingTender.status !== body.status) {
          await ReceivableInfo.create({
            type: "Document Fee Refund",
            description: "Refund of the cancelled tender's document fee",
            receivableAmount: body.documentFee,
            balanceReceivableAmount: body.documentFee,
            receivedAmount: 0,
            vertical: body.vertical,
            subVertical: body.subVertical,
            paymentFrom: body.client,
            tenderNo: body.tenderNo,
            tenderDesc: body.description,
            woNo: "",
            woTitle: "",
            owner: "System",
            status: "Pending",
            receivedDate: null,
            invoiceNo: null,
            dueDate: null,
            state: body.state,
            orgId: token.orgId,
          });
        }
      }
    }

    const allowedFields = [
      "tenderNo",
      "description",
      "tenderDate",
      "tenderType",
      "preBidMeetingDate",
      "tenderSubmissionLastDate",
      "tenderOpeningDate",
      "status",
      "position",
      "state",
      "country",
      "vertical",
      "subVertical",
      "emdAmount",
      "documentFee",
      "transactionFee",
      "corpusFund",
      "bgAmount",
      "tenderingDepartment",
      "client",
      "tenderValue",
      "owner",
      "remarks",
      "isMAFRequired",
      "tenderManager",
      "tenderManagerEmail",
      "tenderManagerPhone",
      "tenderOwner",
      "scm",
      "clientId",
      "emdRefundStatus",
      "emdRefundDate",
      "bgRefundStatus",
      "bgRefundDate",
    ];
    const updateData = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const updated = await TenderInfo.findOneAndUpdate({ _id: id, orgId: token.orgId }, updateData, {
      returnDocument: "after",
    });

    if (!updated) {
      return NextResponse.json(
        { message: "Tender not found" },
        { status: 404 },
      );
    }

    await logActivity({
      activity: "Tender Updated",
      description: `Tender ${updated.tenderNo} was updated`,
      entity: "Tender",
      entityId: updated._id.toString(),
      orgId: updated.orgId,
      req: req,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Tender update error:", err);
    return NextResponse.json(
      { message: "Error updating tender", error: err.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;
  await connectDB();
  const { id } = await params;
  const tender = await TenderInfo.findOne({ _id: id, orgId: token.orgId });
  if (!tender) return NextResponse.json({ message: "Tender not found" }, { status: 404 });

  const [workOrder, payment, receivable] = await Promise.all([
    WorkOrder.exists({ tenderNo: tender.tenderNo, orgId: token.orgId }),
    PaymentInfo.exists({ tenderNo: tender.tenderNo, orgId: token.orgId }),
    ReceivableInfo.exists({ tenderNo: tender.tenderNo, orgId: token.orgId }),
  ]);
  if (workOrder || payment || receivable) {
    return NextResponse.json(
      { message: "Cannot delete a tender referenced by financial or work-order records" },
      { status: 409 },
    );
  }
  await TenderInfo.deleteOne({ _id: id, orgId: token.orgId });
  return NextResponse.json({ message: "Tender deleted successfully" });
}
