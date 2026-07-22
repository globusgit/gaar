import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Client from "@/models/Client";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const orgId = token.orgId;
    const searchName = sanitizeRegex(searchParams.get("search") || "");

    const query = { orgId };
    if (searchName) {
      query.client = { $regex: searchName, $options: "i" };
    }

    const [clients, total] = await Promise.all([
      Client.find(query),
      Client.countDocuments(query),
    ]);
    return NextResponse.json(
      {
        data: clients,
        total,
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
