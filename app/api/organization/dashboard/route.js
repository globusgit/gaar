import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Organization from "@/models/Organization";
import { requireAuth } from "@/lib/apiGuard";

export async function GET(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();

    let query = {};
    if (token.role !== "SYS_ADMIN") {
      query.orgId = token.orgId;
    }

    const totalOrganizations = await Organization.countDocuments(query);

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
