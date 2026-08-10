import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Client from "@/models/Client";
import WorkOrder from "@/models/WorkOrder";
import TenderInfo from "@/models/TenderInfo";
import { logActivity } from "@/lib/activityLog";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();
  const { id } = await params;
  const client = await Client.findOne({ _id: id, orgId: token.orgId });
  if (!client) {
    return NextResponse.json(
      { message: "Client not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(client);
}

export async function DELETE(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;
  await connectDB();
  const { id } = await params;
  const client = await Client.findOne({ _id: id, orgId: token.orgId });
  if (!client) return NextResponse.json({ message: "Client not found" }, { status: 404 });
  const [workOrder, tender] = await Promise.all([
    WorkOrder.exists({ clientId: client.clientId, orgId: token.orgId }),
    TenderInfo.exists({ clientId: client.clientId, orgId: token.orgId }),
  ]);
  if (workOrder || tender) {
    return NextResponse.json(
      { message: "Cannot delete a client referenced by tenders or work orders" },
      { status: 409 },
    );
  }
  await Client.deleteOne({ _id: id, orgId: token.orgId });
  return NextResponse.json({ message: "Client deleted successfully" });
}

export async function PUT(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();
  const body = await req.json();
  const { id } = await params;

  const existing = await Client.findOne({ _id: id, orgId: token.orgId });
  if (!existing) {
    return NextResponse.json(
      { message: "Client not found" },
      { status: 404 },
    );
  }

  const allowedFields = [
    "client", "clientId", "website", "emailId", "phone", "gstNo", "state",
  ];
  const updateData = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  const client = await Client.findOneAndUpdate({ _id: id, orgId: token.orgId }, updateData, {
    returnDocument: "after",
  });

  if (!client) {
    return NextResponse.json(
      { message: "Client not found" },
      { status: 404 },
    );
  }

  await logActivity({
    activity: "Client Updated",
    description: `Client ${client.client} was updated`,
    entity: "Client",
    entityId: client._id.toString(),
    orgId: client.orgId,
    req: req,
  });

  return NextResponse.json({ message: "Updated Successfully!" });
}
