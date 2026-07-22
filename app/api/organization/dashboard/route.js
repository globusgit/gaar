import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Organization from "@/models/Organization";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();

    const totalOrganizations = await Organization.countDocuments();

    return NextResponse.json(
      {
        totalOrganizations,
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
