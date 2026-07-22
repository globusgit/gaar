import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import WorkOrder from "@/models/WorkOrder";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const orgId = token.orgId;
    const totalWorkOrders = await WorkOrder.countDocuments({ orgId: orgId });
    const totalCompletedWorkOrders = await WorkOrder.countDocuments({
      orgId: orgId,
      status: "Completed",
    });
    const totalPendingWorkOrders = await WorkOrder.countDocuments({
      orgId: orgId,
      status: "Pending",
    });
    const totalOverdueWorkOrders = await WorkOrder.countDocuments({
      orgId: orgId,
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
