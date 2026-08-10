import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import WorkOrder from "@/models/WorkOrder";
import { requireAuth, sanitizeRegex } from "@/lib/apiGuard";

export async function GET(req) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const { searchParams } = new URL(req.url);
    const orgId = token.orgId;
    const searchWorkOrder = searchParams.get("search") || searchParams.get("q") || "";
    const safeSearchWorkOrder = sanitizeRegex(searchWorkOrder);

    const query = { orgId };
    let regex;
    if (safeSearchWorkOrder) {
      regex = new RegExp(safeSearchWorkOrder, "i");
      query.$or = [
        { woNo: regex },
        { woTitle: regex },
        { tenderNo: regex },
      ];
    }

    const [workOrders, total] = await Promise.all([
      WorkOrder.find(query),
      WorkOrder.countDocuments(query),
    ]);
    return NextResponse.json(
      {
        data: workOrders,
        total,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
