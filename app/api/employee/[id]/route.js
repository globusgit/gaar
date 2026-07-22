import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Employee from "@/models/Employee";
import { logActivity } from "@/lib/activityLog";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";
import fs from "fs";
import path from "path";
import { EMPLOYEE_UPLOAD_DIR } from "@/lib/uploadConfig";

export async function GET(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();
  const { id } = await params;

  try {
    const employee = await Employee.findById(id).select("-modules");
    if (!employee) {
      return NextResponse.json(
        { message: "Employee not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(employee, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}

function getSafeFileName(originalName: string): string {
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

  const { id } = await params;
  const formData = await req.formData();

  const updateData: Record<string, unknown> = {
    name: formData.get("name"),
    employeeId: formData.get("employeeId"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    designation: formData.get("designation"),
    isManager: formData.get("isManager") === "true",
    managerName: formData.get("managerName"),
    orgId: formData.get("orgId"),
  };

  const file = formData.get("photo");

  if (file && typeof file !== "string" && file.size > 0) {
    if (!fs.existsSync(EMPLOYEE_UPLOAD_DIR)) {
      fs.mkdirSync(EMPLOYEE_UPLOAD_DIR, { recursive: true });
    }

    const safeName = getSafeFileName(file.name);
    const fullPath = path.join(EMPLOYEE_UPLOAD_DIR, safeName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    fs.writeFileSync(fullPath, buffer);

    updateData.photo = safeName;
  }

  const updated = await Employee.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  if (updated) {
    await logActivity({
      activity: "Employee Updated",
      description: `Employee ${updated.name} was updated`,
      entity: "Employee",
      entityId: updated._id.toString(),
      orgId: updated.orgId,
      req: req,
    });
  }

  return NextResponse.json(updated);
}
