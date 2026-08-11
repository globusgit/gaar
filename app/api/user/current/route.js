import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";
import { BASIC_USER_MODULES } from "@/lib/userModules";

const ORG_USER_DEFAULT_MODULES = [
  "dashboard",
  "fund-request",
  "payments",
  "receivables",
  "employees",
  "clients",
  "work-orders",
  "tenders",
  "organizations",
  "users",
  "ai",
  "settings",
  "master-lists",
  "system-settings",
  "audit-logs",
];

export async function GET(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();

  try {
    const user = await User.findById(token.id).select("-password");

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Older organization-contact accounts were created before modules were
    // assigned. Restore only their established default access.
    if (user.role === "ORG_USER" && (!Array.isArray(user.modules) || user.modules.length === 0)) {
      user.modules = ORG_USER_DEFAULT_MODULES;
      await user.save();
    }

    if (user.role === "SYS_ADMIN" && (!Array.isArray(user.modules) || user.modules.length === 0)) {
      user.modules = ORG_USER_DEFAULT_MODULES;
      await user.save();
    }

    if (
      user.role === "USER" &&
      JSON.stringify(user.modules || []) !== JSON.stringify(BASIC_USER_MODULES)
    ) {
      user.modules = BASIC_USER_MODULES;
      await user.save();
    }

    return NextResponse.json({ data: user }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}
