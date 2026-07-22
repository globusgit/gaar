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
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "orgId is required" },
        { status: 400 }
      );
    }

    const totalEmployees = await Employee.countDocuments({ orgId });
    const totalManagers = await Employee.countDocuments({ orgId, isManager: true });
    const totalActive = await Employee.countDocuments({ orgId, status: "Active" });

    return NextResponse.json(
      {
        totalEmployees,
        totalManagers,
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
