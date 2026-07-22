import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Config from "@/models/Config";
import { logActivity } from "@/lib/activityLog";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

const DEFAULT_ORG_ID = "GLOBAL";

const ALLOWED_CONFIG_KEYS = new Set([
  "appName", "appVersion", "timezone", "currency", "dateFormat",
  "emailHost", "emailPort", "emailUser", "emailPassword",
  "smtpHost", "smtpPort", "smtpUser", "smtpPassword",
]);

export async function GET(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    let orgId = searchParams.get("orgId") || DEFAULT_ORG_ID;

    if (token.role !== "SYS_ADMIN" && token.role !== "ADMIN") {
      orgId = token.orgId || DEFAULT_ORG_ID;
    }

    const configs = await Config.find({ orgId });
    const settings: Record<string, string> = {};

    configs.forEach((c) => {
      settings[c.name] = c.value;
    });

    return NextResponse.json({ data: settings }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  if (token.role !== "SYS_ADMIN" && token.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  try {
    const body = await req.json();
    let orgId = body.orgId || DEFAULT_ORG_ID;
    const settings = body.settings || {};

    if (token.role !== "SYS_ADMIN") {
      orgId = token.orgId || DEFAULT_ORG_ID;
    }

    const allowedKeys = Object.keys(settings).filter((key) =>
      ALLOWED_CONFIG_KEYS.has(key),
    );

    if (allowedKeys.length === 0) {
      return NextResponse.json(
        { message: "No valid configuration keys provided" },
        { status: 400 },
      );
    }

    for (const key of allowedKeys) {
      const value = String(settings[key]);
      await Config.findOneAndUpdate(
        { name: key, orgId },
        { name: key, value, orgId },
        { upsert: true, new: true },
      );
    }

    await logActivity({
      activity: "System Settings Updated",
      description: `System settings were updated: ${allowedKeys.join(", ")}`,
      entity: "System",
      entityId: orgId,
      orgId: orgId,
      req: req,
    });

    return NextResponse.json(
      { message: "System settings saved successfully!" },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
