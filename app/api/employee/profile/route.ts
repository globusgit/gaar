import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Employee from "@/models/Employee";
import User from "@/models/User";
import Organization from "@/models/Organization";
import { requireAuth } from "@/lib/apiGuard";

export async function GET(req: NextRequest) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const empId = searchParams.get("empId") || token.username;

    const employee = await Employee.findOne({
      orgId: token.orgId,
      empId,
    });

    if (!employee) {
      const user = await User.findOne({
        _id: token.id,
        orgId: token.orgId,
        role: "ORG_USER",
      }).select("-password").lean();

      if (user) {
        const organization = await Organization.findOne({ orgId: token.orgId })
          .select("orgName phone email contactDesignation")
          .lean();

        return NextResponse.json({
          data: {
            name: user.employeeName,
            empId: user.username,
            phone: organization?.phone || user.username,
            email: organization?.email || "",
            designation: organization?.contactDesignation || "Organization User",
            orgId: user.orgId,
            orgName: organization?.orgName,
            photo: user.photo,
            isOrganizationUser: true,
          },
        }, { status: 200 });
      }

      return NextResponse.json(
        { message: "Employee profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: employee }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();

  try {
    const body = await req.json();

    const { searchParams } = new URL(req.url);
    const empId = searchParams.get("empId") || token.username;

    const employee = await Employee.findOne({
      orgId: token.orgId,
      empId,
    });

    if (!employee) {
      return NextResponse.json(
        { message: "Employee profile not found" },
        { status: 404 },
      );
    }

    const allowedFieldsForAdmins = ["name", "phone", "email", "designation", "managerName"];
    const allowedFieldsForUsers: string[] = [];
    const allowedFields = token.role === "SYS_ADMIN" || token.role === "ADMIN"
      ? allowedFieldsForAdmins
      : allowedFieldsForUsers;
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body && body[field] !== undefined && body[field] !== "") {
        updateData[field] = body[field];
      }
    }

    const updated = await Employee.findByIdAndUpdate(employee._id, updateData, {
      returnDocument: "after",
    });

    return NextResponse.json(
      { message: "Profile updated successfully", data: updated },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
