import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import FundRequest from "@/models/FundRequest";
import Employee from "@/models/Employee";
import { requireAuth } from "@/lib/apiGuard";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const { searchParams } = new URL(req.url);
    let filter = { orgId: token.orgId };
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    filter.isAuthorized = false;

    if (!["ADMIN", "SYS_ADMIN", "MANAGER"].includes(token.role)) {
      const employee = await Employee.findOne({
        $or: [
          { empId: token.username },
          { phone: token.username },
        ],
        orgId: token.orgId,
      }).lean();

      if (!employee) {
        return NextResponse.json({ data: [], total: 0, page, limit, totalPages: 0 });
      }
      filter.requestedById = employee._id;
    }

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
