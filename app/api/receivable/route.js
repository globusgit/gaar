import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import ReceivableInfo from "@/models/ReceivableInfo";
import { logActivity } from "@/lib/activityLog";
import { notifyOrg } from "@/lib/notification";
import { requireAuth } from "@/lib/apiGuard";

const SAFE_RECEIVABLE_FIELDS = [
  "type","description","receivableAmount","woNo","woTitle","vertical","subVertical","paymentFrom","owner","status","receivedDate","invoiceNo","dueDate","tenderNo","tenderDesc","state",
];

const SAFE_RECEIVABLE_UPDATE_FIELDS = [
  "description","type","paymentFrom","vertical","subVertical","woNo","woTitle","tenderNo","tenderDesc","state","dueDate","invoiceNo","receivedDate","status",
];

export async function GET(req) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    const [receivables, total] = await Promise.all([
      ReceivableInfo.find({ orgId: token.orgId }).skip(skip).limit(limit),
      ReceivableInfo.countDocuments({ orgId: token.orgId }),
    ]);
    return NextResponse.json(
      {
        data: receivables,
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

export async function POST(req) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const body = await req.json();

    const receivableData = {};
    for (const f of SAFE_RECEIVABLE_FIELDS) {
      if (body[f] !== undefined) receivableData[f] = body[f];
    }
    receivableData.orgId = token.orgId;
    receivableData.balanceReceivableAmount = receivableData.receivableAmount || 0;
    receivableData.receivedAmount = 0;

    const receivable = await ReceivableInfo.create(receivableData);

    await logActivity({
      activity: "Receivable Created",
      description: `Receivable for ${receivableData.paymentFrom} was created`,
      entity: "Receivable",
      entityId: receivable._id.toString(),
      orgId: receivable.orgId,
      req: req,
    });

    await notifyOrg(
      receivable.orgId,
      "Receivable created",
      `Receivable from ${receivableData.paymentFrom ?? "customer"} was created.`,
      "success"
    );

    return NextResponse.json(
      { message: "Receivable Info created successfully!" },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const body = await req.json();
    const { id } = body;

    const existing = await ReceivableInfo.findById(id);
    if (!existing) {
      return NextResponse.json(
        { message: "Receivable Info not found!" },
        { status: 404 },
      );
    }

    const scope = await requireOrgScope(req, existing.orgId, token.orgId);
    if (scope instanceof Response) return scope;

    const update = {};
    for (const f of SAFE_RECEIVABLE_UPDATE_FIELDS) {
      if (body[f] !== undefined) update[f] = body[f];
    }

    const updated = await ReceivableInfo.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!updated) {
      return NextResponse.json(
        { message: "Receivable Info not found!" },
        { status: 404 },
      );
    }

    await logActivity({
      activity: "Receivable Updated",
      description: `Receivable ${updated._id} was updated`,
      entity: "Receivable",
      entityId: updated._id.toString(),
      orgId: updated.orgId,
      req: req,
    });

    return NextResponse.json(
      { message: "Receivable Info updated successfully!", data: updated },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
