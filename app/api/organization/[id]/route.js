import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Organization from "@/models/Organization";
import { logActivity } from "@/lib/activityLog";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();
  const { id } = await params;
  const org = await Organization.findById(id);
  if (!org) {
    return NextResponse.json(
      { message: "Organization not found" },
      { status: 404 },
    );
  }
  return NextResponse.json(org);
}

export async function PUT(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  if (token.role !== "SYS_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const { id } = await params;

  const allowedFields = [
    "orgName", "contactName", "contactDesignation", "phone", "email",
    "website", "address", "city", "state", "country", "pincode",
    "pan", "gstNo", "industryType", "modeOfRegistration", "orgType",
    "status",
  ];
  const updateData = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  const org = await Organization.findOneAndUpdate({ _id: id }, updateData, {
    new: true,
  });

  if (org) {
    await logActivity({
      activity: "Organization Updated",
      description: `Organization ${org.orgName} was updated`,
      entity: "Organization",
      entityId: org._id.toString(),
      orgId: org.orgId,
      req: req,
    });
  }

  return NextResponse.json({ message: "Updated Successfully" });
}
