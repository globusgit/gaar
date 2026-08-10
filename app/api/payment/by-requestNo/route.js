import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import PaymentInfo from "@/models/PaymentInfo";
import { requireAuth, requireOrgScope } from "@/lib/apiGuard";

export async function GET(req) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const scope = await requireOrgScope(req, null, token.orgId);
    if (scope instanceof Response) return scope;

    const { searchParams } = new URL(req.url);
    const requestNo = searchParams.get("requestNo");

    if (!requestNo) {
      return NextResponse.json(
        { message: "requestNo is required" },
        { status: 400 },
      );
    }

    const payments = await PaymentInfo.find({
      orgId: token.orgId,
      requestNo,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ data: payments });
  } catch (err) {
    console.error("Payment by requestNo error:", err);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
