import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Employee from "@/models/Employee";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { EMPLOYEE_UPLOAD_DIR } from "@/lib/uploadConfig";
import { logActivity } from "@/lib/activityLog";
import { notifyOrg } from "@/lib/notification";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

const ALL_MODULES = [
  "dashboard",
  "employees",
  "clients",
  "work-orders",
  "tenders",
  "fund-request",
  "payments",
  "receivables",
  "organizations",
  "users",
  "settings",
  "master-lists",
  "system-settings",
  "audit-logs",
];

function getDefaultModules(role: string) {
  switch (role) {
    case "SYS_ADMIN":
      return ALL_MODULES;
    case "ADMIN":
      return ALL_MODULES.filter((m) => m !== "system-settings");
    case "MANAGER":
      return [
        "dashboard",
        "employees",
        "clients",
        "work-orders",
        "tenders",
        "fund-request",
        "payments",
        "receivables",
      ];
    case "ACCOUNTANT":
      return ["dashboard", "payments", "receivables", "fund-request"];
    case "ORG_USER":
      return ["dashboard", "fund-request", "users", "settings"];
    default:
      return ["dashboard", "fund-request", "settings"];
  }
}

function getSafeFileName(originalName: string): string {
  const base = path.basename(originalName).replace(/\s+/g, "_");
  const timestamp = Date.now();
  const ext = path.extname(base);
  const name = path.basename(base, ext).replace(/[^a-zA-Z0-9_-]/g, "");
  return `${timestamp}-${name}${ext}`;
}

export async function GET(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;
    const orgId = token.orgId;

    const [employees, total] = await Promise.all([
      Employee.find({ orgId }).skip(skip).limit(limit),
      Employee.countDocuments({ orgId }),
    ]);

    return NextResponse.json(
      {
        data: employees,
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
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const formData = await req.formData();
    const file = formData.get("photo");

    let fileName = "default-avatar.jpg";
    if (file && typeof file !== "string") {
      if (!fs.existsSync(EMPLOYEE_UPLOAD_DIR)) {
        fs.mkdirSync(EMPLOYEE_UPLOAD_DIR, { recursive: true });
      }
      fileName = getSafeFileName(file.name || "upload.jpg");
      const filePath = path.join(EMPLOYEE_UPLOAD_DIR, fileName);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      fs.writeFileSync(filePath, buffer);
    }

    const modulesValue = formData.getAll("modules");
    const modules = modulesValue.filter(Boolean);
    const orgId = token.orgId;

    const emp = await Employee.create({
      name: formData.get("name"),
      empId: formData.get("employeeId"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      designation: formData.get("designation"),
      isManager: formData.get("isManager") === "true",
      managerObjId: formData.get("managerId"),
      managerName: formData.get("managerName"),
      orgId: orgId,
      photo: fileName,
      modules,
    });

    if (emp) {
      const defaultPassword = process.env.DEFAULT_EMP_PASSWORD;
      if (!defaultPassword) {
        return NextResponse.json(
          { message: "Server misconfiguration: DEFAULT_EMP_PASSWORD is not set" },
          { status: 500 },
        );
      }
      const hashedPws = await bcrypt.hash(defaultPassword, 10);
      let roleName = "USER";
      if (emp.isManager) {
        roleName = "MANAGER";
      }
      if (emp.designation === "Director") {
        roleName = "ADMIN";
      }
      if (emp.designation === "ACCOUNTANT") {
        roleName = "ACCOUNTANT";
      }
      const userModules = modules.length > 0 ? modules : getDefaultModules(roleName);
      const newUser = new User({
        username: (emp.empId || "").toString().trim(),
        password: hashedPws,
        employeeName: emp.name,
        status: "Active",
        role: roleName,
        isFirstLogin: true,
        empId: emp.empId,
        orgId: emp.orgId,
        modules: userModules,
      });
      const createdUser = await User.create(newUser);

      await notifyOrg(
        emp.orgId,
        "Employee created",
        `${emp.name} (${emp.empId}) was added as ${roleName}.`,
        "info"
      );

      return NextResponse.json({
        message: "Employee created successfully",
        employee: emp,
        user: {
          username: createdUser.username,
          role: createdUser.role,
          modules: createdUser.modules,
          isFirstLogin: createdUser.isFirstLogin,
        },
      }, { status: 201 });
    }

    return NextResponse.json({ message: "Employee created successfully" }, { status: 201 });
  } catch (err) {
    console.error("Employee creation error:", err);
    return NextResponse.json(
      { message: "Failed to create employee" },
      { status: 500 },
    );
  }
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
    managerObjId: formData.get("managerId"),
    orgId: formData.get("orgId"),
  };

  const file = formData.get("photo");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file && file.size > 0) {
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

  if (!updated) {
    return NextResponse.json(
      { message: "Employee not found" },
      { status: 404 },
    );
  }

  const orgId = (formData.get("orgId") as string | null) || updated.orgId;

  await logActivity({
    activity: "Employee Updated",
    description: `Employee ${updated.name} (${updated.empId}) was updated`,
    entity: "Employee",
    entityId: updated._id.toString(),
    orgId: orgId,
    req: req,
  });

  return NextResponse.json(updated);
}
