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
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField, hasModuleAccess, canAssignRole } from "@/lib/apiGuard";

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
  "ai",
  "settings",
  "master-lists",
  "system-settings",
  "audit-logs",
];

function getDefaultModules(role) {
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
      return [
        "dashboard",
        "employees",
        "clients",
        "work-orders",
        "fund-request",
        "payments",
        "receivables",
      ];
    case "ORG_USER":
      return ALL_MODULES;
    default:
      return ["dashboard", "fund-request", "settings"];
  }
}

function getSafeFileName(originalName) {
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

  if (!hasModuleAccess(token, "employees")) {
    return NextResponse.json({ message: "Forbidden: Employees module required" }, { status: 403 });
  }

  try {
    await connectDB();
    const formData = await req.formData();
    const file = formData.get("photo");

    let fileName = "default-avatar.jpg";
    if (file && typeof file !== "string") {
      if (!fs.existsSync(/* turbopackIgnore: true */ EMPLOYEE_UPLOAD_DIR)) {
        fs.mkdirSync(/* turbopackIgnore: true */ EMPLOYEE_UPLOAD_DIR, { recursive: true });
      }
      fileName = getSafeFileName(file.name || "upload.jpg");
      const filePath = path.join(/* turbopackIgnore: true */ EMPLOYEE_UPLOAD_DIR, fileName);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      fs.writeFileSync(/* turbopackIgnore: true */ filePath, buffer);
    }

    const modulesValue = formData.getAll("modules");
    const modules = modulesValue.filter(Boolean);
    const requestedOrgId = formData.get("orgId");
    const orgId = token.role === "SYS_ADMIN" && requestedOrgId
      ? requestedOrgId
      : token.orgId;

    let requestedRole = "USER";
    if (formData.get("isManager") === "true") requestedRole = "MANAGER";
    if (formData.get("designation") === "Director") requestedRole = "ADMIN";
    if (formData.get("designation") === "ACCOUNTANT") requestedRole = "ACCOUNTANT";
    if (!canAssignRole(token, requestedRole)) {
      return NextResponse.json(
        { message: "You cannot create an employee with a role above your own authority" },
        { status: 403 },
      );
    }

    const emp = await Employee.create({
      name: formData.get("name"),
      empId: (formData.get("employeeId") || "").toString().trim(),
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
      const roleName = requestedRole;
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

export async function PUT(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  if (!hasModuleAccess(token, "employees")) {
    return NextResponse.json({ message: "Forbidden: Employees module required" }, { status: 403 });
  }

  await connectDB();

  const formData = await req.formData();
  const id = formData.get("id");
  if (!id) {
    return NextResponse.json({ message: "Employee ID is required" }, { status: 400 });
  }

  const updateData = {
    name: formData.get("name"),
    empId: (formData.get("employeeId") || "").toString().trim(),
    phone: formData.get("phone"),
    email: formData.get("email"),
    designation: formData.get("designation"),
    isManager: formData.get("isManager") === "true",
    managerName: formData.get("managerName"),
    managerObjId: formData.get("managerId"),
  };

  const requestedOrgId = formData.get("orgId");
  if (requestedOrgId && token.role === "SYS_ADMIN") {
    updateData.orgId = requestedOrgId;
  }

  const file = formData.get("photo");

  if (file && typeof file !== "string" && file.size > 0) {
    if (!fs.existsSync(/* turbopackIgnore: true */ EMPLOYEE_UPLOAD_DIR)) {
      fs.mkdirSync(/* turbopackIgnore: true */ EMPLOYEE_UPLOAD_DIR, { recursive: true });
    }

    const safeName = getSafeFileName(file.name);
    const fullPath = path.join(/* turbopackIgnore: true */ EMPLOYEE_UPLOAD_DIR, safeName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    fs.writeFileSync(/* turbopackIgnore: true */ fullPath, buffer);

    updateData.photo = safeName;
  }

  const existing = await Employee.findOne({ _id: id, orgId: token.orgId });
  if (!existing) {
    return NextResponse.json(
      { message: "Employee not found" },
      { status: 404 },
    );
  }

  const scope = await requireOrgScope(req, existing.orgId, token.orgId);
  if (scope instanceof Response) return scope;

  const updated = await Employee.findOneAndUpdate({ _id: id, orgId: token.orgId }, updateData, {
    returnDocument: "after",
  });

  if (!updated) {
    return NextResponse.json(
      { message: "Employee not found" },
      { status: 404 },
    );
  }

  const orgId = updateData.orgId || existing.orgId;

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
