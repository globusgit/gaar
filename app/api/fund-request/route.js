import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import PaymentInfo from "@/models/PaymentInfo";
import ReceivableIno from "@/models/ReceivableInfo";
import FundRequest from "@/models/FundRequest";
import Config from "@/models/Config";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Employee from "@/models/Employee";

/**
 * Get all Payments Info of an organization
 */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const orgId = searchParams.get("orgId");
    const search = searchParams.get("search") || "";

    // SORT PARAMS
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const employee = await Employee.findOne({
      phone: user.username,
      orgId,
    });

    let filter = { orgId };

    if (!["ADMIN", "ACCOUNTS"].includes(user.role)) {
      filter.requestedById = employee._id;
    }

    // SEARCH
    if (search) {
      filter.$or = [
        { frNo: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { vertical: { $regex: search, $options: "i" } },
        { subVertical: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ];
    }

    //  APPLY SORT HERE
    const [frs, total] = await Promise.all([
      FundRequest.find(filter)
        .sort({ [sortField]: sortOrder }) // ⭐ THIS LINE
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
  const body = await req.json();

  const config = await Config.findOne({ name: "FR Count" });

  const frNo = "FR" + config.value.toString();

  const fr = await FundRequest.create({
    ...body,
    frNo,
    status: "Pending Approval",
    requestedDate: new Date(),
  });

  if (fr) {
    // Create Payment Record
    // console.log("Requested FR: ", fr);
    await PaymentInfo.create({
      paymentType: fr.paymentType,
      frType: fr.frType,
      woNo: fr.woNo,
      woTitle: fr.woTitle,
      tenderNo: fr.tenderNo,
      tenderName: fr.tenderName,
      description: fr.description,
      requestAmount: fr.amount,
      paidAmount: 0,
      balanceAmount: fr.amount,
      vertical: fr.vertical,
      subVertical: fr.subVertical,
      paymentTo: fr.paymentTo,
      requestedBy: fr.requestedBy,
      isApproved: false,
      approvedBy: null,
      approvedDate: null,
      isAuthorized: false,
      authorizedBy: null,
      authorizationDate: null,
      status: fr.status,
      requestedDate: fr.requestedDate,
      paymentPriority: fr.paymentPriority,
      dueDate: fr.dueDate,
      paidDate: null,
      requestNo: fr.frNo,
      state: fr.state,
      orgId: fr.orgId,
    });
    //console.log("Created Payment Record: ")
    let frCount = parseInt(config.value, 10) + 1;
    await Config.findOneAndUpdate(
      { name: "FR Count" },
      { value: frCount.toString() },
    );
  }

  return NextResponse.json("Fund Request successfully submitted!", {
    status: 200,
  });
}
