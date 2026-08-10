import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import PaymentInfo from "@/models/PaymentInfo";
import Employee from "@/models/Employee";
import { requireAuth, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 10;

  const sortField = sanitizeSortField(searchParams.get("sortField") || "createdAt");
  const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

  const skip = (page - 1) * limit;

  let query = { orgId: token.orgId };

  if (token.role !== "ADMIN" && token.role !== "SYS_ADMIN") {
    const employee = await Employee.findOne({
      $or: [
        { empId: token.username },
        { phone: token.username },
      ],
      orgId: token.orgId,
    }).lean();

    if (employee) {
      query.requestedById = employee._id;
    } else {
      query.requestedById = null;
    }
  }

  const status = searchParams.get("status") || "";

  if (status) {
    query.status = status;
  }

  const data = await PaymentInfo.find(query)
    .sort({ [sortField]: sortOrder })
    .skip(skip)
    .limit(limit);

  const total = await PaymentInfo.countDocuments(query);

  return NextResponse.json({ data, total });
}
