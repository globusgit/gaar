import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import FundRequest from "@/models/FundRequest";
import { requireAuth } from "@/lib/apiGuard";

export async function GET(req, res) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const { searchParams } = new URL(req.url);
    let filter = { orgId: token.orgId };
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    filter.isApproved = false;
    filter.isAuthorized = false;

    const data = await FundRequest.find(filter).skip(skip).limit(limit);
    const total = await FundRequest.countDocuments(filter);

    return NextResponse.json({ data, page, limit, total }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
