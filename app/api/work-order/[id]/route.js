import WorkOrder from "@/models/WorkOrder";
import connectDB from "@/lib/mongoose";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activityLog";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(request, { params }) {
  const token = await requireAuth(request);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const { id } = await params;
    const workOrder = await WorkOrder.findById(id);
    if (!workOrder) {
      return NextResponse.json(
        { message: "Work order not found" },
        { status: 404 },
      );
    }
    if (workOrder.orgId !== token.orgId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(workOrder);
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching work order" },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  const token = await requireAuth(request);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const { id } = await params;
    const { body } = await request.json();

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
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const updatedWorkOrder = await WorkOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );
    if (!updatedWorkOrder) {
      return NextResponse.json(
        { message: "Work order not found" },
        { status: 404 },
      );
    }

    await logActivity({
      activity: "Work Order Updated",
      description: `Work Order ${updatedWorkOrder.woNo} was updated`,
      entity: "Work Order",
      entityId: updatedWorkOrder._id.toString(),
      orgId: updatedWorkOrder.orgId,
      req: request,
    });

    return NextResponse.json(
      { message: "Work Order updated!" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error updating work order" },
      { status: 500 },
    );
  }
}
