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

    return NextResponse.json(
      {
        totalTenders,
        totalActive,
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
