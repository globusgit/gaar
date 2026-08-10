import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Employee from "@/models/Employee";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const phone = searchParams.get("phone");
    const orgId = token.orgId;

    const query = { orgId };

    if (phone) {
      query.phone = phone;
    }

    const employees = await Employee.findOne(query);
    return NextResponse.json(
      {
        data: employees,
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
