import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const orgId = token.orgId;

    const totalUsers = await User.countDocuments({ orgId });
    const firstLoginPending = await User.countDocuments({ orgId, isFirstLogin: true });

    return NextResponse.json(
      {
        totalUsers,
        firstLoginPending,
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
