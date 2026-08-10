import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Employee from "@/models/Employee";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1)
    const limit = Number(searchParams.get("limit") || 10)
    const search = sanitizeRegex(searchParams.get("search") || "")
    const orgId = token.orgId

    const query = { orgId }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { empId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ]
    }
    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query);

    return NextResponse.json({
      data: employees,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: "Something went wrong!" }, { status: 500 });
  }
}
