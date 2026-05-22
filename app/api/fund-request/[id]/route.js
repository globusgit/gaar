import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import FundRequest from "@/models/FundRequest";
import PaymentInfo from "@/models/PaymentInfo";

export async function GET(req, { params }) {
  await connectDB();
  const { id } = await params;
  const fr = await FundRequest.findById(id);
  if (!fr) {
    return NextResponse.json(
      { message: "Fund Request not found" },
      { status: 404 },
    );
  }
  return NextResponse.json(fr);
}

export async function PUT(req, { params }) {
  await connectDB();
  const body = await req.json();
  const { id } = await params;

  const existingFR = await FundRequest.findById(id);
  console.log("existingFR:", existingFR);
  if (existingFR.isAuthorized) {
    return NextResponse.json(
      { error: "Already authorized. Cannot edit." },
      { status: 403 },
    );
  }

  if (body.isApproved && !existingFR.isApproved) {
    body.status = "Pending Authorization";
  }

  if (body.isAuthorized && !existingFR.isAuthorized) {
    body.status = "Pending Payment";
  }
  console.log("Update body:", body);
  const fr = await FundRequest.findOneAndUpdate({ _id: id }, body, {
    new: true,
  });
  console.log("Updated FR:", fr);
  if (fr) {
    await PaymentInfo.findOneAndUpdate(
      { requestNo: fr.frNo, orgId: fr.orgId },
      {
        paymentType: fr.paymentType,
        frType: fr.frType,
        description: fr.description,
        amount: fr.amount,
        vertical: fr.vertical,
        subVertical: fr.subVertical,
        paymentTo: fr.paymentTo,
        paymentPriority: fr.paymentPriority,
        dueDate: fr.dueDate,
        state: fr.state,
        status: fr.status,
        isApproved: fr.isApproved,
        approvedBy: fr.approvedBy,
        approvedDate: fr.approvalDate,
        isAuthorized: fr.isAuthorized,
        authorizedBy: fr.authorizedBy,
        authorizationDate: fr.authorizationDate,
        woNo: fr.woNo,
        woTitle: fr.woTitle,
        tenderNo: fr.tenderNo,
        tenderName: fr.tenderName,
      },
    );
  }

  return NextResponse.json({ message: "Updated Successfully" });
}
