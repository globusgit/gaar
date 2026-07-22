import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import WorkOrder from "@/models/WorkOrder";
import { logActivity } from "@/lib/activityLog";
import { notifyOrg } from "@/lib/notification";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function POST(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const body = await req.json();

    const allowedFields = [
      "woNo",
      "woTitle",
      "tenderNo",
      "tenderDesc",
      "woDate",
      "woType",
      "vertical",
      "subVertical",
      "projectCompletionDate",
      "actualStartDate",
      "actualEndDate",
      "client",
      "bgAmount",
      "bgMaturityDate",
      "woValue",
      "country",
      "state",
      "clientId",
    ];
    const safeBody = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) safeBody[key] = body[key];
    }

    const woToCreate = new WorkOrder({
      ...safeBody,
      orgId: token.orgId,
      status: "Live",
      bgReceivedStatus: "Pending to Pay",
    });
    const createdWorkOrder = await WorkOrder.create(woToCreate);

    await logActivity({
      activity: "Work Order Created",
      description: `Work Order ${createdWorkOrder.woNo} was created`,
      entity: "WorkOrder",
      entityId: createdWorkOrder._id.toString(),
      orgId: token.orgId,
      req: req,
    });

    await notifyOrg(
      token.orgId,
      "Work order created",
      `Work Order ${createdWorkOrder.woNo} was created.`,
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
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const { searchParams } = new URL(req.url);
    const orgId = token.orgId;
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    const [workOrders, total] = await Promise.all([
      WorkOrder.find({ orgId }).skip(skip).limit(limit),
      WorkOrder.countDocuments({ orgId }),
    ]);
    return NextResponse.json(
      {
        data: workOrders,
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
    const { woNo, ...rest } = body;

    const allowedUpdateFields = [
      "woNo",
      "woTitle",
      "tenderNo",
      "tenderDesc",
      "woDate",
      "woType",
      "vertical",
      "subVertical",
      "projectCompletionDate",
      "actualStartDate",
      "actualEndDate",
      "client",
      "bgAmount",
      "bgMaturityDate",
      "woValue",
      "country",
      "state",
      "clientId",
    ];
    const updateData = {};
    for (const key of allowedUpdateFields) {
      if (rest[key] !== undefined) updateData[key] = rest[key];
    }

    const updatedWorkOrder = await WorkOrder.findOneAndUpdate(
      { woNo, orgId: token.orgId },
      updateData,
      { new: true },
    );

    return NextResponse.json(
      { message: "Successfully saved Work Order !", data: updatedWorkOrder },
      { status: 200 },
    );
  } catch (err) {
    console.error("Work order update error:", err);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
