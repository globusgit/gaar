import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import PaymentInfo from "@/models/PaymentInfo";
import { notifyOrg } from "@/lib/notification";
import { requireAuth, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

const SAFE_PAYMENT_FIELDS = [
  "paymentType","frType","woNo","woTitle","tenderNo","tenderDesc","description","requestAmount","paidAmount","vertical","subVertical","paymentTo","requestedBy","isApproved","approvedBy","approvedDate","isAuthorized","authorizedBy","authorizationDate","status","requestedDate","paymentPriority","dueDate","paidDate","requestNo","state","requestedById","approvedById","authorizedById",
];

export async function GET(req) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = parseInt(searchParams.get("limit")) || 10;

  const sortField = sanitizeSortField(searchParams.get("sortField") || "createdAt");
  const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

  const skip = (page - 1) * limit;

  let query = { orgId: token.orgId };

  if (search && search.length >= 3) {
    const escapedSearch = sanitizeRegex(search);
    query.$or = [
      { description: { $regex: escapedSearch, $options: "i" } },
      { status: { $regex: escapedSearch, $options: "i" } },
      { requestedBy: { $regex: escapedSearch, $options: "i" } },
      { priority: { $regex: escapedSearch, $options: "i" } },
      { vertical: { $regex: escapedSearch, $options: "i" } },
      { state: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const [data, total] = await Promise.all([
    PaymentInfo.find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit),
    PaymentInfo.countDocuments(query),
  ]);

  return NextResponse.json({ data, total, totalPages: Math.ceil(total / limit), page, limit });
}

export async function POST(req) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    const body = await req.json();

    const data = {};
    for (const f of SAFE_PAYMENT_FIELDS) {
      if (body[f] !== undefined) data[f] = body[f];
    }
    data.orgId = token.orgId;
    if (data.requestAmount && !data.balanceAmount) {
      data.balanceAmount = data.requestAmount - (data.paidAmount || 0);
    }

    const payment = await PaymentInfo.create(data);

    await notifyOrg(
      payment.orgId,
      "Payment created",
      `Payment of ₹${payment.amount ?? ""} was created${payment.description ? ` (${payment.description})` : ""}.`,
      "success"
    );

    return NextResponse.json(
      { message: "Payment created successfully!", data: payment },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}
