import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Client from "@/models/Client";
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

    const totalClients = await Client.countDocuments({ orgId });

    return NextResponse.json(
      {
        totalClients,
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
