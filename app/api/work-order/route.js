import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import WorkOrder from "@/models/WorkOrder";
import { logActivity } from "@/lib/activityLog";
import { notifyOrg } from "@/lib/notification";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

const SAFE_WORK_ORDER_UPDATE_FIELDS = [
  "woNo","woTitle","tenderNo","tenderDesc","woDate","woType","vertical","subVertical","projectCompletionDate","actualStartDate","actualEndDate","client","bgAmount","bgMaturityDate","woValue","country","state","clientId","status","bgReceivedStatus","projectManager","scm",
];

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
      "projectManager",
      "scm",
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
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const scope = await requireOrgScope(req, null, token.orgId);
    if (scope instanceof Response) return scope;

    const { searchParams } = new URL(req.url);
    const orgId = token.orgId;
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    const query = { orgId };

    if (search) {
      const escapedSearch = sanitizeRegex(search);
      query.$or = [
        { woNo: { $regex: escapedSearch, $options: "i" } },
        { woTitle: { $regex: escapedSearch, $options: "i" } },
        { client: { $regex: escapedSearch, $options: "i" } },
        { tenderNo: { $regex: escapedSearch, $options: "i" } },
        { status: { $regex: escapedSearch, $options: "i" } },
        { woType: { $regex: escapedSearch, $options: "i" } },
        { vertical: { $regex: escapedSearch, $options: "i" } },
        { subVertical: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const [workOrders, total] = await Promise.all([
      WorkOrder.find(query).skip(skip).limit(limit),
      WorkOrder.countDocuments(query),
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
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const body = await req.json();

    const { woNo } = body;
    if (!woNo) {
      return NextResponse.json(
        { message: "Work Order No is required" },
        { status: 400 }
      );
    }

    const existing = await WorkOrder.findOne({ woNo, orgId: token.orgId });
    if (!existing) {
      return NextResponse.json(
        { message: "Work order not found" },
        { status: 404 }
      );
    }

    const scope = await requireOrgScope(req, existing.orgId, token.orgId);
    if (scope instanceof Response) return scope;

    if (existing.status === "Completed") {
      return NextResponse.json(
        { message: "Forbidden: Completed work orders cannot be updated" },
        { status: 403 }
      );
    }

    const updateData = {};
    for (const key of SAFE_WORK_ORDER_UPDATE_FIELDS) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const updatedWorkOrder = await WorkOrder.findOneAndUpdate(
      { woNo, orgId: token.orgId },
      updateData,
      { returnDocument: "after" }
    );

    if (!updatedWorkOrder) {
      return NextResponse.json(
        { message: "Work order not found" },
        { status: 404 }
      );
    }

    await logActivity({
      activity: "Work Order Updated",
      description: `Work Order ${updatedWorkOrder.woNo} was updated`,
      entity: "Work Order",
      entityId: updatedWorkOrder._id.toString(),
      orgId: updatedWorkOrder.orgId,
      req: req,
    });

    return NextResponse.json(
      { message: "Successfully saved Work Order!", data: updatedWorkOrder },
      { status: 200 }
    );
  } catch (err) {
    console.error("Work order update error:", err);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "ID is required" },
        { status: 400 }
      );
    }

    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) {
      return NextResponse.json(
        { message: "Work order not found" },
        { status: 404 }
      );
    }

    const scope = await requireOrgScope(req, workOrder.orgId, token.orgId);
    if (scope instanceof Response) return scope;

    await WorkOrder.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Work order deleted successfully!" },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}
