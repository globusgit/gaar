import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Client from "@/models/Client";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const orgId = token.orgId;

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
