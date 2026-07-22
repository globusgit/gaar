import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import ReceivableInfo from "@/models/ReceivableInfo";
import { requireAuth } from "@/lib/apiGuard";

export async function GET(req, res) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const { searchParams } = new URL(req.url);

    const totalReceivableAmount = await ReceivableInfo.aggregate([
      { $match: { orgId: token.orgId } },
      { $group: { _id: null, total: { $sum: "$receivableAmount" } } },
    ]);
    const totalReceivedAmount = await ReceivableInfo.aggregate([
      { $match: { orgId: token.orgId } },
      { $group: { _id: null, total: { $sum: "$receivedAmount" } } },
    ]);
    const totalBalanceReceivableAmount = await ReceivableInfo.aggregate([
      { $match: { orgId: token.orgId } },
      { $group: { _id: null, total: { $sum: "$balanceReceivableAmount" } } },
    ]);
    const totalPastDueDateReceivables = await ReceivableInfo.countDocuments({
      orgId: token.orgId,
      dueDate: { $lt: new Date() },
      balanceReceivableAmount: { $gt: 0 },
    });
    return NextResponse.json(
      {
        totalReceivableAmount: totalReceivableAmount[0]?.total || 0,
        totalReceivedAmount: totalReceivedAmount[0]?.total || 0,
        totalBalanceReceivableAmount:
          totalBalanceReceivableAmount[0]?.total || 0,
        totalPastDueDateReceivables: totalPastDueDateReceivables,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
