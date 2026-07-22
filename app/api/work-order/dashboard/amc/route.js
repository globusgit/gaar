import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import WorkOrder from "@/models/WorkOrder";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req, res) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const orgId = token.orgId;
    let filter = { orgId: orgId };
    filter.woType = "AMC";
    const totalWorkOrders = await WorkOrder.countDocuments(filter);
    const totalCompletedWorkOrders = await WorkOrder.countDocuments({
      ...filter,
      status: "Completed",
    });
    const totalPendingWorkOrders = await WorkOrder.countDocuments({
      ...filter,
      status: "Pending",
    });
    const totalOverdueWorkOrders = await WorkOrder.countDocuments({
      ...filter,
      dueDate: { $lt: new Date() },
      status: { $ne: "Completed" },
    });
    return NextResponse.json(
      {
        totalWorkOrders,
        totalCompletedWorkOrders,
        totalPendingWorkOrders,
        totalOverdueWorkOrders,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
