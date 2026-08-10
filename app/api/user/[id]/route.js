import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import { logActivity } from "@/lib/activityLog";
import { requireAuth, requireOrgScope, hasModuleAccess, canAssignRole, canManageRole } from "@/lib/apiGuard";
import { normalizeUserModules } from "@/lib/userModules";

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

  const existing = await User.findById(id);
  if (!existing) {
    return NextResponse.json(
      { message: "User not found" },
      { status: 404 },
    );
  }

  const scope = await requireOrgScope(req, existing.orgId, token.orgId);
  if (scope instanceof Response) return scope;

  try {
    const body = await req.json();

    if (!hasModuleAccess(token, "users")) {
      return NextResponse.json({ message: "Forbidden: Users module required" }, { status: 403 });
    }

    if (!canManageRole(token, existing.role)) {
      return NextResponse.json({ message: "You cannot manage a user above your authority" }, { status: 403 });
    }

    if (body.role === "SYS_ADMIN" && token.role !== "SYS_ADMIN") {
      return NextResponse.json({ message: "Only SYS_ADMIN can assign SYS_ADMIN" }, { status: 403 });
    }

    if (body.role && !canAssignRole(token, body.role)) {
      return NextResponse.json({ message: "You cannot assign a role above your own authority" }, { status: 403 });
    }

    if (body.role && !["SYS_ADMIN", "ADMIN", "ORG_USER", "USER", "MANAGER", "ACCOUNTANT", "ACCOUNTS"].includes(body.role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    if (body.status && !["Active", "Inactive", "Suspended"].includes(body.status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    if ("modules" in body) {
      const modules = normalizeUserModules(body.modules);
      if (!modules) {
        return NextResponse.json({ message: "One or more selected modules are invalid" }, { status: 400 });
      }
      body.modules = modules;
    }

    const allowedFields = ["role", "status", "modules"];
    const updateData = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const updated = await User.findOneAndUpdate(
      { _id: id, orgId: token.orgId },
      updateData,
      { returnDocument: "after", runValidators: true },
    );

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

export async function DELETE(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;
  if (!hasModuleAccess(token, "users")) {
    return NextResponse.json({ message: "Forbidden: Users module required" }, { status: 403 });
  }
  const { id } = await params;
  if (id === token.id) {
    return NextResponse.json({ message: "You cannot delete your own account" }, { status: 409 });
  }
  await connectDB();
  const target = await User.findOne({ _id: id, orgId: token.orgId });
  if (!target) return NextResponse.json({ message: "User not found" }, { status: 404 });
  if (!canManageRole(token, target.role)) {
    return NextResponse.json({ message: "You cannot delete a user above your authority" }, { status: 403 });
  }
  const deleted = await User.findOneAndDelete({ _id: id, orgId: token.orgId });
  if (!deleted) return NextResponse.json({ message: "User not found" }, { status: 404 });
  return NextResponse.json({ message: "User deleted successfully" });
}
