import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import ActivityLog from "@/models/ActivityLog";
import User from "@/models/User";
import { requireAuth, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

const ALLOWED_ROLES = ["SYS_ADMIN", "ADMIN", "ACCOUNTS"];

const SAFE_ACTIVITY_FIELDS = [
  "activity","description","entity","entityId","loggedBy","username",
];

export async function GET(req) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  const caller = await User.findById(token.id).lean();

  if (!caller || caller.status !== "Active") {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!ALLOWED_ROLES.includes(caller.role)) {
    return NextResponse.json(
      { message: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const entity = searchParams.get("entity");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;
    const skip = (page - 1) * limit;
    const sortField = sanitizeSortField(searchParams.get("sortField") || "date");
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    let query = { orgId: token.orgId };
    if (entity) {
      const escapedEntity = sanitizeRegex(entity);
      query.entity = { $regex: escapedEntity, $options: "i" };
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        data: logs,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    const body = await req.json();

    const data = {};
    for (const f of SAFE_ACTIVITY_FIELDS) {
      if (body[f] !== undefined) data[f] = body[f];
    }
    data.date = new Date();
    data.orgId = token.orgId;

    const log = await ActivityLog.create(data);

    return NextResponse.json(
      { message: "Log created successfully!", data: log },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}
