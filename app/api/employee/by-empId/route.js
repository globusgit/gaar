import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Employee from "@/models/Employee";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const empId = searchParams.get("empId");
    const orgId = token.orgId;

    const query = { orgId };
    if (empId) {
      query.empId = empId;
    }

    const employee = await Employee.findOne(query);
    return NextResponse.json(
      {
        data: employee,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
