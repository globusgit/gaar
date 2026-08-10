import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import TenderInfo from "@/models/TenderInfo";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const orgId = token.orgId;

    const totalTenders = await TenderInfo.countDocuments({ orgId });
    const totalActive = await TenderInfo.countDocuments({ orgId, status: "Active" });
    const pendingTenders = await TenderInfo.countDocuments({
      orgId,
      status: { $in: ["Submitted", "Draft", "Pending"] },
    });
    const l1Tenders = await TenderInfo.countDocuments({ orgId, position: "L1" });
    const l2Tenders = await TenderInfo.countDocuments({ orgId, position: "L2" });
    const lostTenders = await TenderInfo.countDocuments({
      orgId,
      status: "Lost",
    });

    return NextResponse.json(
      {
        totalTenders,
        totalActive,
        pendingTenders,
        l1Tenders,
        l2Tenders,
        lostTenders,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
