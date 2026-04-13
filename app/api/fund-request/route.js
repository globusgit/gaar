import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import PaymentInfo from "@/models/PaymentInfo";
import ReceivableIno from "@/models/ReceivableInfo";
import FundRequest from "@/models/FundRequest";
import Config from "@/models/Config";

/**
 * Get all Payments Info of an organization
 */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;
    const orgId = searchParams.get("orgId");

    const [frs, total] = await Promise.all([
      FundRequest.find({ orgId: orgId }).skip(skip).limit(limit),
      FundRequest.countDocuments(),
    ]);

    return NextResponse.json(
      {
        data: frs,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();

  const config = await Config.findOne({ name: "FR Count" });

  const frNo = "FR" + config.value.toString();

  const fr = await FundRequest.create({
    ...body,
    frNo,
    status: "Payment Requested",
    requestedDate: new Date(),
  });

  if (fr) {
    // Increment FR Count

    // Create Receivable Record
    if (fr.frType === "BG" || fr.frType === "EMD") {
      await ReceivableIno.create({
        type: fr.frType,
        description: fr.description,
        amount: fr.amount,
        vertical: fr.vertical,
        subVertical: fr.subVertical,
        paymentFrom: fr.paymentTo,
        owner: "System",
        status: "Payment Requested",
        receivedDate: fr.receivedDate,
        invoiceNo: null,
        dueDate: null,
        tenderNo: fr.tenderNo,
        tenderName: fr.tenderName,
        state: fr.state,
        orgId: fr.orgId,
      });
    }

    // Create Payment Record
    await PaymentInfo.create({
      paymentType: fr.frType,
      description: fr.description,
      amount: fr.amount,
      vertical: fr.vertical,
      subVertical: fr.subVertical,
      paymentTo: fr.paymentTo,
      requestedBy: fr.requestedBy,
      isApproved: false,
      approvedBy: null,
      isAuthorized: false,
      authorizedBy: null,
      authorizationDate: null,
      status: "Pending Approval",
      requestedDate: fr.requestedDate,
      paymentPriority: fr.paymentPriority,
      dueDate: fr.dueDate,
      paidDate: null,
      requestNo: fr.frNo,
      state: fr.state,
      orgId: fr.orgId,
    });

    let frCount = parseInt(config.value, 10) + 1;
    await Config.findOneAndUpdate(
      { name: "FR Count" },
      { value: frCount.toString() },
    );
  }

  return NextResponse.json("Fund Request successfully submitted!", {
    status: 200,
  });
}
