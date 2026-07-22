import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Client from "@/models/Client";
import { logActivity } from "@/lib/activityLog";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();
  const { id } = await params;
  const client = await Client.findById(id);
  if (!client) {
    return NextResponse.json(
      { message: "Client not found" },
      { status: 404 },
    );
  }
  return NextResponse.json(client);
}

export async function PUT(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();
  const body = await req.json();
  const { id } = await params;

  const allowedFields = [
    "client", "clientId", "website", "emailId", "phone", "gstNo", "state",
  ];
  const updateData = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  const client = await Client.findOneAndUpdate({ _id: id }, updateData, {
    new: true,
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
