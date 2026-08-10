import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import TenderInfo from "@/models/TenderInfo";
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
      "tenderNo",
      "description",
      "tenderDate",
      "tenderType",
      "preBidMeetingDate",
      "tenderSubmissionLastDate",
      "tenderOpeningDate",
      "state",
      "country",
      "vertical",
      "subVertical",
      "emdAmount",
      "documentFee",
      "transactionFee",
      "corpusFund",
      "bgAmount",
      "tenderingDepartment",
      "client",
      "tenderValue",
      "owner",
      "remarks",
      "isMAFRequired",
      "tenderManager",
      "tenderManagerEmail",
      "tenderManagerPhone",
      "tenderOwner",
      "scm",
      "clientId",
    ];
    const safeBody = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) safeBody[key] = body[key];
    }

    const tenderToCreate = new TenderInfo({
      ...safeBody,
      orgId: token.orgId,
      status: "Draft",
      position: "Draft",
      emdPaymentStatus: "Pending",
      documentFeePaymentStatus: "Pending",
      corpusFundPaymentStatus: "Pending",
      bgPaymentStatus: "Pending",
      transactionFeePaymentStatus: "Pending",
      emdPaymentDate: null,
      documentFeePaymentDate: null,
      corpusFundPaymentDate: null,
      bgPaymentDate: null,
      transactionFeePaymentDate: null,
      bgRefundDate: null,
      emdRefundDate: null,
      bgRefundStatus: "Pending",
      emdRefundStatus: "Pending",
    });
    const createdTender = await TenderInfo.create(tenderToCreate);

    await logActivity({
      activity: "Tender Created",
      description: `Tender ${createdTender.tenderNo} was created`,
      entity: "Tender",
      entityId: createdTender._id.toString(),
      orgId: token.orgId,
      req: req,
    });

    await notifyOrg(
      token.orgId,
      "Tender created",
      `Tender ${createdTender.tenderNo} was created.`,
      "success"
    );

    return NextResponse.json({ message: "Success!", data: createdTender }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json(
        { message: "Tender with this number already exists!" },
        { status: 400 },
      );
    }
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
    const search = searchParams.get("search") || "";

    const query = { orgId };

    if (search) {
      const escapedSearch = sanitizeRegex(search);
      query.$or = [
        { tenderNo: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
        { client: { $regex: escapedSearch, $options: "i" } },
        { status: { $regex: escapedSearch, $options: "i" } },
        { position: { $regex: escapedSearch, $options: "i" } },
        { tenderingDepartment: { $regex: escapedSearch, $options: "i" } },
        { vertical: { $regex: escapedSearch, $options: "i" } },
        { subVertical: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const [tenders, total] = await Promise.all([
      TenderInfo.find(query).skip(skip).limit(limit),
      TenderInfo.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        data: tenders,
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
