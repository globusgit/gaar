import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Organization from "@/models/Organization";
import Client from "@/models/Client";
import Employee from "@/models/Employee";
import TenderInfo from "@/models/TenderInfo";
import WorkOrder from "@/models/WorkOrder";
import FundRequest from "@/models/FundRequest";
import PaymentInfo from "@/models/PaymentInfo";
import ReceivableInfo from "@/models/ReceivableInfo";
import User from "@/models/User";
import SystemList from "@/models/SystemList";
import Config from "@/models/Config";
import { logActivity } from "@/lib/activityLog";
import { requireAuth, isAdminOrSysAdmin } from "@/lib/apiGuard";

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

  if (org.orgId !== token.orgId && token.role !== "SYS_ADMIN") {
    return NextResponse.json({ message: "Organization not found" }, { status: 404 });
  }

  return NextResponse.json(org);
}

export async function DELETE(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;
  if (token.role !== "SYS_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const { id } = await params;
  const organization = await Organization.findById(id);
  if (!organization) {
    return NextResponse.json({ message: "Organization not found" }, { status: 404 });
  }
  if (organization.orgId === token.orgId) {
    return NextResponse.json({ message: "You cannot delete your own organization" }, { status: 409 });
  }

  const orgId = organization.orgId;
  const businessModels = [Client, Employee, TenderInfo, WorkOrder, FundRequest, PaymentInfo, ReceivableInfo];
  const counts = await Promise.all(businessModels.map((model) => model.countDocuments({ orgId })));
  if (counts.some((count) => count > 0)) {
    return NextResponse.json(
      { message: "Cannot delete an organization that contains business data" },
      { status: 409 },
    );
  }

  await Promise.all([
    User.deleteMany({ orgId }),
    SystemList.deleteMany({ orgId }),
    Config.deleteMany({ orgId }),
    Organization.deleteOne({ _id: id }),
  ]);
  return NextResponse.json({ message: "Organization deleted successfully" });
}

export async function PUT(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  if (!isAdminOrSysAdmin(token)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const body = await req.json();
  const { id } = await params;

  const existing = await Organization.findById(id);
  if (!existing) {
    return NextResponse.json(
      { message: "Organization not found" },
      { status: 404 },
    );
  }

  if (existing.orgId !== token.orgId && token.role !== "SYS_ADMIN") {
    return NextResponse.json({ message: "Organization not found" }, { status: 404 });
  }

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

  if ("website" in updateData && !String(updateData.website || "").trim()) {
    delete updateData.website;
    updateData.$unset = { website: 1 };
  }

  const org = await Organization.findOneAndUpdate(
    token.role === "SYS_ADMIN" ? { _id: id } : { _id: id, orgId: token.orgId },
    updateData, {
    returnDocument: "after",
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
