import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import { logActivity } from "@/lib/activityLog";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();
  const { id } = await params;

  try {
    const user = await User.findById(id).select("-password");

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 },
      );
    }

    if (user.orgId !== token.orgId && token.role !== "SYS_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}

export async function PUT(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();
  const { id } = await params;

  try {
    const body = await req.json();

    if (token.role !== "SYS_ADMIN" && token.role !== "ADMIN" && token.role !== "ORG_USER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const allowedFields = ["role", "status", "modules"];
    const updateData = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 },
      );
    }

    await logActivity({
      activity: "User Updated",
      description: `User ${updated.username} role/modules updated`,
      entity: "User",
      entityId: updated._id.toString(),
      orgId: updated.orgId,
      req: req,
    });

    return NextResponse.json(
      { message: "User updated successfully!", data: updated },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
