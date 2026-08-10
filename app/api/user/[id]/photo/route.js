import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import Employee from "@/models/Employee";
import { requireAuth } from "@/lib/apiGuard";
import fs from "fs";
import path from "path";
import { EMPLOYEE_UPLOAD_DIR } from "@/lib/uploadConfig";
import { logActivity } from "@/lib/activityLog";

function getSafeFileName(originalName) {
  const base = path.basename(originalName).replace(/\s+/g, "_");
  const timestamp = Date.now();
  const ext = path.extname(base);
  const name = path.basename(base, ext).replace(/[^a-zA-Z0-9_-]/g, "");
  return `${timestamp}-${name}${ext}`;
}

export async function PUT(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();

  try {
    const { id } = await params;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (token.role !== "SYS_ADMIN" && token.role !== "ADMIN" && token.id !== id) {
      return NextResponse.json(
        { message: "You can only update your own profile picture" },
        { status: 403 }
      );
    }

    if (user.orgId !== token.orgId && token.role !== "SYS_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 },
      );
    }

    const employee = await Employee.findOne({
      orgId: user.orgId,
      empId: user.username,
    });

    if (!employee && user.role !== "ORG_USER") {
      return NextResponse.json(
        { message: "Employee record not found" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("photo");

    if (!file || typeof file === "string" || file.size === 0) {
      return NextResponse.json(
        { message: "Photo file is required" },
        { status: 400 }
      );
    }

    if (!fs.existsSync(/* turbopackIgnore: true */ EMPLOYEE_UPLOAD_DIR)) {
      fs.mkdirSync(/* turbopackIgnore: true */ EMPLOYEE_UPLOAD_DIR, { recursive: true });
    }

    const safeName = getSafeFileName(file.name);
    const fullPath = path.join(/* turbopackIgnore: true */ EMPLOYEE_UPLOAD_DIR, safeName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    fs.writeFileSync(/* turbopackIgnore: true */ fullPath, buffer);

    if (employee) {
      employee.photo = safeName;
      await employee.save();
    } else {
      user.photo = safeName;
      await user.save();
    }

    await logActivity({
      activity: "Profile Picture Updated",
      description: `Profile picture updated for user ${user.username}`,
      entity: "User",
      entityId: user._id.toString(),
      orgId: user.orgId,
      req,
    });

    return NextResponse.json(
      { message: "Profile picture updated successfully", data: employee || user },
      { status: 200 }
    );
  } catch (err) {
    console.error("Profile picture update error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
