import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Client from "@/models/Client";
import { logActivity } from "@/lib/activityLog";
import { notifyOrg } from "@/lib/notification";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function POST(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  const body = await req.json();
  const { client, website, emailId, phone, gstNo, state } = body;
  const orgId = token.orgId;

  if (!client || client.trim() === "") {
    return NextResponse.json("Client can't be empty", { status: 400 });
  }

  const clientShort =
    client?.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "") || "CLNT";
  try {
    await connectDB();
    const recordCount = await Client.countDocuments({ orgId });
    const clientToCreate = new Client({
      client,
      clientId: clientShort + recordCount,
      website,
      emailId,
      phone,
      gstNo,
      state,
      orgId,
    });
    const createdClient = await Client.create(clientToCreate);

    await logActivity({
      activity: "Client Created",
      description: `Client ${createdClient.client} (${createdClient.clientId}) was created`,
      entity: "Client",
      entityId: createdClient._id.toString(),
      orgId: orgId,
      req: req,
    });

    await notifyOrg(
      orgId,
      "Client created",
      `Client ${createdClient.client} (${createdClient.clientId}) was created.`,
      "success"
    );

    return NextResponse.json({ message: "Success!" }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
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

    const [clients, total] = await Promise.all([
      Client.find({ orgId }).skip(skip).limit(limit),
      Client.countDocuments({ orgId }),
    ]);
    return NextResponse.json(
      {
        data: clients,
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

export async function PATCH(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const body = await req.json();
    const { id } = body;

    const allowedFields = [
      "client", "clientId", "website", "emailId", "phone", "gstNo", "state",
    ];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const updated = await Client.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (updated) {
      await logActivity({
        activity: "Client Updated",
        description: `Client ${updated.client} was updated`,
        entity: "Client",
        entityId: updated._id.toString(),
        orgId: updated.orgId,
        req: req,
      });
    }

    return NextResponse.json(
      { message: "Successfully saved Client!", data: updated },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
