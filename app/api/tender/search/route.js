import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import TenderInfo from "@/models/TenderInfo";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const { searchParams } = new URL(req.url);
    const orgId = token.orgId;
    const searchName = searchParams.get("q") || "";
    const safeSearchName = sanitizeRegex(searchName);

    const tenders = await TenderInfo.find({
      orgId,
      $or: [
        {
          tenderName: {
            $regex: safeSearchName,
            $options: "i",
          },
        },
        {
          tenderNo: {
            $regex: safeSearchName,
            $options: "i",
          },
        },
        {
          client: {
            $regex: safeSearchName,
            $options: "i",
          },
        },
        {
          tenderingDepartment: {
            $regex: safeSearchName,
            $options: "i",
          },
        },
      ],
    }).limit(20);

    return NextResponse.json(
      {
        data: tenders,
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
