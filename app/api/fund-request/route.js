import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import PaymentInfo from "@/models/PaymentInfo";
import FundRequest from "@/models/FundRequest";
import Config from "@/models/Config";
import Employee from "@/models/Employee";
import { logActivity } from "@/lib/activityLog";
import { notifyOrg } from "@/lib/notification";
import { requireAuth, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

const SAFE_FR_CREATE_FIELDS = [
  "frType","paymentType","woNo","woTitle","amount","vertical","subVertical","paymentTo","requestedBy","isApproved","approvedBy","approvalDate","isAuthorized","authorizedBy","authorizationDate","requestedDate","paymentPriority","dueDate","state","tenderNo","tenderDesc","woDepartment","bgMaturityDate","description",
];

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const search = searchParams.get("search") || "";

    const sortField = sanitizeSortField(searchParams.get("sortField") || "createdAt");
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const employee = await Employee.findOne({
      phone: token.username,
      orgId: token.orgId,
    });

    let filter = { orgId: token.orgId };

    if (!["SYS_ADMIN", "ADMIN", "ACCOUNTS"].includes(token.role)) {
      if (!employee) {
        return NextResponse.json({ data: [], total: 0, page, limit, totalPages: 0 });
      }
      filter.requestedById = employee._id;
    }

    if (search) {
      const escapedSearch = sanitizeRegex(search);
      filter.$or = [
        { frNo: { $regex: escapedSearch, $options: "i" } },
        { state: { $regex: escapedSearch, $options: "i" } },
        { vertical: { $regex: escapedSearch, $options: "i" } },
        { subVertical: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
        { status: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const [frs, total] = await Promise.all([
      FundRequest.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),

      FundRequest.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: frs,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    const body = await req.json();

    const config = await Config.findOne({ name: "FR Count" });

    const frNo = "FR" + config.value.toString();

    const data = {};
    for (const f of SAFE_FR_CREATE_FIELDS) {
      if (body[f] !== undefined) data[f] = body[f];
    }
    data.orgId = token.orgId;
    data.frNo = frNo;
    data.status = "Pending Approval";
    data.requestedDate = new Date();

    const fr = await FundRequest.create(data);

    if (fr) {
      let frCount = parseInt(config.value, 10) + 1;
      await Config.findOneAndUpdate(
        { name: "FR Count" },
        { value: frCount.toString() },
      );
    }

    await logActivity({
      activity: "Fund Request Created",
      description: `Fund Request ${fr.frNo} was created`,
      entity: "FundRequest",
      entityId: fr._id.toString(),
      orgId: fr.orgId,
      req: req,
    });

    await notifyOrg(
      fr.orgId,
      "Fund request created",
      `Fund Request ${fr.frNo} was submitted for approval.`,
      "info"
    );

    return NextResponse.json(
      { message: "Fund Request successfully submitted!", data: fr },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}
