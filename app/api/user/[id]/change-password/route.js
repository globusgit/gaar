import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activityLog";
import { requireAuth } from "@/lib/apiGuard";

export async function PUT(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();

  try {
    const callerId = token.id;
    const { id } = await params;

    const caller = await User.findById(callerId).lean();
    if (!caller || caller.status !== "Active") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (caller.role !== "SYS_ADMIN" && caller.role !== "ADMIN" && callerId !== id) {
      return NextResponse.json(
        { message: "You can only change your own password" },
        { status: 403 }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { message: "Password must contain at least one letter and one number" },
        { status: 400 }
      );
    }

    const user = await User.findById(id).select("+password");

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (callerId !== id && caller.role !== "SYS_ADMIN" && user.orgId !== caller.orgId) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 },
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    if (bcrypt.compareSync(newPassword, user.password)) {
      return NextResponse.json(
        { message: "New password must be different from current password" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(id, {
      password: hashedPassword,
      isFirstLogin: false,
    });

    try {
      await logActivity({
        activity: "Password Changed",
        description: `Password changed for user ${user.username}`,
        entity: "User",
        entityId: user._id.toString(),
        orgId: user.orgId,
        req,
      });
    } catch (logErr) {
      console.error("Activity log error:", logErr);
    }

    return NextResponse.json(
      { message: "Password changed successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
