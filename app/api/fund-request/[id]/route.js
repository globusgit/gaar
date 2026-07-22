import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import FundRequest from "@/models/FundRequest";
import PaymentInfo from "@/models/PaymentInfo";
import { requireAuth, requireOrgScope } from "@/lib/apiGuard";

const SAFE_FR_UPDATE_FIELDS = [
  "frType","paymentType","woNo","woTitle","amount","vertical","subVertical","paymentTo","requestedBy","isApproved","approvedBy","approvalDate","isAuthorized","authorizedBy","authorizationDate","requestedDate","paymentPriority","dueDate","state","tenderNo","tenderDesc","woDepartment","bgMaturityDate","description",
];

export async function GET(req, { params }) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  const { id } = await params;
  const fr = await FundRequest.findById(id);
  if (!fr) {
    return NextResponse.json(
      { message: "Fund Request not found" },
      { status: 404 },
    );
  }

  const scope = await requireOrgScope(req, fr.orgId, token.orgId);
  if (scope instanceof Response) return scope;

  return NextResponse.json(fr);
}

export async function PUT(req, { params }) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  const body = await req.json();
  const { id } = await params;

  const existingFR = await FundRequest.findById(id);
  if (!existingFR) {
    return NextResponse.json(
      { message: "Fund Request not found" },
      { status: 404 },
    );
  }

  const scope = await requireOrgScope(req, existingFR.orgId, token.orgId);
  if (scope instanceof Response) return scope;

  if (existingFR.isAuthorized) {
    return NextResponse.json(
      { error: "Already authorized. Cannot edit." },
      { status: 403 },
    );
  }

  const update = {};
  for (const f of SAFE_FR_UPDATE_FIELDS) {
    if (body[f] !== undefined) update[f] = body[f];
  }

  if (body.isApproved && !existingFR.isApproved) {
    update.status = "Pending Authorization";
  }

  if (body.isAuthorized && !existingFR.isAuthorized) {
    update.status = "Pending Payment";
  }

  const fr = await FundRequest.findOneAndUpdate({ _id: id }, update, {
    new: true,
  });

  if (fr.isAuthorized) {
    await PaymentInfo.create({
      paymentType: fr.paymentType,
      frType: fr.frType,
      woNo: fr.woNo,
      woTitle: fr.woTitle,
      tenderNo: fr.tenderNo,
      tenderDesc: fr.tenderDesc,
      description: fr.description,
      requestAmount: fr.amount,
      paidAmount: 0,
      balanceAmount: fr.amount,
      vertical: fr.vertical,
      subVertical: fr.subVertical,
      paymentTo: fr.paymentTo,
      requestedBy: fr.requestedBy,
      isApproved: fr.isApproved,
      approvedBy: fr.approvedBy,
      approvedDate: fr.approvedDate,
      isAuthorized: fr.isAuthorized,
      authorizedBy: fr.authorizedBy,
      authorizationDate: fr.authorizationDate,
      status: fr.status,
      requestedDate: fr.requestedDate,
      paymentPriority: fr.paymentPriority,
      dueDate: fr.dueDate,
      paidDate: null,
      requestNo: fr.frNo,
      state: fr.state,
      orgId: fr.orgId,
    });

    await logActivity({
      activity: "Fund Request Authorized",
      description: `Fund Request ${fr.frNo} was authorized and payment created`,
      entity: "Fund Request",
      entityId: fr._id.toString(),
      orgId: fr.orgId,
      req: req,
    });
  } else {
    await logActivity({
      activity: "Fund Request Updated",
      description: `Fund Request ${fr.frNo} was updated`,
      entity: "Fund Request",
      entityId: fr._id.toString(),
      orgId: fr.orgId,
      req: req,
    });
  }

  return NextResponse.json({ message: "Updated Successfully" });
}
