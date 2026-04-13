import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import FundRequest from "@/models/FundRequest";
import PaymentInfo from "@/models/PaymentInfo";

export async function GET(req, params) {
  await connectDB();
  const data = await FundRequest.findOne({ frNo: params.frNo });
  return NextResponse.json(data);
}

export async function PUT(req, params) {
  await connectDB();
  const body = await req.json();

  const updated = await FundRequest.findOneAndUpdate(
    { frNo: params.frNo },
    body,
    { new: true },
  );

  // Sync Payment Info
  await PaymentInfo.findOneAndUpdate(
    { refNo: params.frNo },
    {
      status: updated.status,
    },
  );

  return NextResponse.json(updated);
}
