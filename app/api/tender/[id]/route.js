import connectDB from "@/lib/mongoose";
import TenderInfo from "@/models/TenderInfo";
import { NextRequest, NextResponse } from "next/server";
import ReceivableInfo from "@/models/ReceivableInfo";
import { logActivity } from "@/lib/activityLog";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();
  const { id } = await params;
  const data = await TenderInfo.findById(id);
  if (data && data.orgId !== token.orgId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
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

    if (body.status === "Cancelled") {
      if (body.documentFeePaymentStatus === "Paid") {
        const existingTender = await TenderInfo.findById(id);
        if (existingTender.status !== body.status) {
          const receivableRecordToCreate = new ReceivableInfo({
            type: "Document Fee Refund",
            description: "Refund of the cancelled tender's document fee",
            amount: body.documentFee,
            vertical: body.vertical,
            subVertical: body.subVertical,
            paymentFrom: body.paymentTo,
            tenderNo: body.tenderNo,
            tenderDesc: body.tenderDesc,
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
          const receivable = await ReceivableInfo.create(receivableRecordToCreate);
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
    ];
    const updateData = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const updated = await TenderInfo.findByIdAndUpdate(id, updateData, {
      new: true,
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
  } catch (error) {
    return NextResponse.json(
      { message: "Error updating tender" },
      { status: 500 },
    );
  }
}
