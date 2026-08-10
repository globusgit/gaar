import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Employee from "@/models/Employee";
import User from "@/models/User";
import { logActivity } from "@/lib/activityLog";
import { requireAuth, hasModuleAccess } from "@/lib/apiGuard";
import fs from "fs";
import path from "path";
import { EMPLOYEE_UPLOAD_DIR } from "@/lib/uploadConfig";

export async function GET(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();
  const { id } = await params;

  try {
    const employee = await Employee.findOne({ _id: id, orgId: token.orgId });
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
  if (!hasModuleAccess(token, "employees")) {
    return NextResponse.json({ message: "Forbidden: Employees module required" }, { status: 403 });
  }

  await connectDB();

  const { id } = await params;
  const formData = await req.formData();

  const existing = await Employee.findOne({ _id: id, orgId: token.orgId });
  if (!existing) {
    return NextResponse.json(
      { message: "Employee not found" },
      { status: 404 },
    );
  }

  const updateData = {
    name: formData.get("name"),
    empId: (formData.get("employeeId") || "").toString().trim(),
    phone: formData.get("phone"),
    email: formData.get("email"),
    designation: formData.get("designation"),
    isManager: formData.get("isManager") === "true",
    managerName: formData.get("managerName"),
    orgId: existing.orgId,
  };

const modulesValue = formData.getAll("modules");
   const modules = modulesValue.filter(Boolean);
   if (modules.length > 0) {
     updateData.modules = modules;
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

   const updated = await Employee.findOneAndUpdate({ _id: id, orgId: token.orgId }, updateData, {
     returnDocument: "after",
   });

   if (updated && modules.length > 0) {
     await User.updateOne(
       { username: updated.empId, orgId: token.orgId },
       { $set: { modules } },
     );
   }

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

export async function DELETE(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;
  if (!hasModuleAccess(token, "employees")) {
    return NextResponse.json({ message: "Forbidden: Employees module required" }, { status: 403 });
  }
  await connectDB();
  const { id } = await params;
  const employee = await Employee.findOne({ _id: id, orgId: token.orgId });
  if (!employee) return NextResponse.json({ message: "Employee not found" }, { status: 404 });
  if (employee.empId === token.username || employee.phone === token.username) {
    return NextResponse.json({ message: "You cannot delete your own employee record" }, { status: 409 });
  }
  await Promise.all([
    Employee.deleteOne({ _id: id, orgId: token.orgId }),
    User.deleteOne({ username: employee.empId, orgId: token.orgId }),
  ]);
  return NextResponse.json({ message: "Employee deleted successfully" });
}
