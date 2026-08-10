import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import FundRequest from "@/models/FundRequest";
import PaymentInfo from "@/models/PaymentInfo";
import Employee from "@/models/Employee";
import FundRequestDocument from "@/models/FundRequestDocument";
import { requireAuth, hasModuleAccess } from "@/lib/apiGuard";

const SAFE_FR_UPDATE_FIELDS = [
  "frType","paymentType","woNo","woTitle","amount","vertical","subVertical","paymentTo","requestedBy","isApproved","approvedBy","approvalDate","isAuthorized","authorizedBy","authorizationDate","requestedDate","paymentPriority","dueDate","state","tenderNo","tenderDesc","woDepartment","bgMaturityDate","description",
];

export async function GET(req, { params }) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  const { id } = await params;
  const fr = await FundRequest.findOne({ _id: id, orgId: token.orgId });
  if (!fr) {
    return NextResponse.json(
      { message: "Fund Request not found" },
      { status: 404 },
    );
  }

  if (!["ADMIN", "SYS_ADMIN", "MANAGER"].includes(token.role)) {
    const employee = await Employee.findOne({
      $or: [
        { empId: token.username },
        { phone: token.username },
      ],
      orgId: token.orgId,
    }).lean();

    if (!employee || fr.requestedById !== employee._id.toString()) {
      return NextResponse.json(
        { message: "Forbidden: Access denied" },
        { status: 403 },
      );
    }
  }

  return NextResponse.json(fr);
}

export async function PUT(req, { params }) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    const body = await req.json();
    const { id } = await params;

    const existingFR = await FundRequest.findOne({ _id: id, orgId: token.orgId });
    if (!existingFR) {
      return NextResponse.json(
        { message: "Fund Request not found" },
        { status: 404 },
      );
    }

    if (!hasModuleAccess(token, "fund-request")) {
      return NextResponse.json(
        { error: "Forbidden: Fund Requests module required" },
        { status: 403 },
      );
    }

    if (!["SYS_ADMIN", "ADMIN", "MANAGER"].includes(token.role)) {
      const employee = await Employee.findOne({
        $or: [{ empId: token.username }, { phone: token.username }],
        orgId: token.orgId,
      }).lean();
      if (!employee || existingFR.requestedById !== employee._id.toString()) {
        return NextResponse.json(
          { error: "Forbidden: You can update only your own fund requests" },
          { status: 403 },
        );
      }
    }

    if (
      (body.isApproved !== undefined && body.isApproved !== existingFR.isApproved) ||
      (body.isAuthorized !== undefined && body.isAuthorized !== existingFR.isAuthorized)
    ) {
      if (token.designation !== "Director") {
        return NextResponse.json(
          { error: "Forbidden: Only Directors can approve or authorize" },
          { status: 403 },
        );
      }
    }

    if (existingFR.isAuthorized) {
      return NextResponse.json(
        { error: "Already authorized. Cannot edit." },
        { status: 403 },
      );
    }

    const update = {};
    for (const f of SAFE_FR_UPDATE_FIELDS) {
      if (body[f] !== undefined) update[f] = body[f];
    }

    if (body.isApproved && !existingFR.isApproved) {
      update.status = "Pending Authorization";
    }

    if (body.isAuthorized && !existingFR.isAuthorized) {
      update.status = "Pending Payment";
    }

    if (existingFR.isApproved && !existingFR.isAuthorized && body.isApproved !== false) {
      delete update.isApproved;
      delete update.approvedBy;
      delete update.approvalDate;
    }

    if (body.isApproved === false && existingFR.isApproved) {
      update.status = "Pending Approval";
    }

    if (existingFR.isAuthorized) {
      delete update.isAuthorized;
      delete update.authorizedBy;
      delete update.authorizationDate;
    }

    const fr = await FundRequest.findOneAndUpdate({ _id: id, orgId: token.orgId }, update, {
      returnDocument: "after",
    });

    if (!fr) {
      return NextResponse.json(
        { message: "Failed to update fund request" },
        { status: 500 },
      );
    }

    if (fr.isAuthorized) {
      try {
        const existingPayment = await PaymentInfo.findOne({
          requestNo: fr.frNo,
          orgId: fr.orgId,
        });

        if (!existingPayment) {
          await PaymentInfo.create({
          paymentType: fr.paymentType,
          frType: fr.frType,
          woNo: fr.woNo,
          woTitle: fr.woTitle,
          tenderNo: fr.tenderNo,
          tenderDesc: fr.tenderDesc,
          description: fr.description,
          requestAmount: fr.amount,
          paidAmount: 0,
          balanceAmount: fr.amount,
          vertical: fr.vertical,
          subVertical: fr.subVertical,
          paymentTo: fr.paymentTo,
          requestedBy: fr.requestedBy,
          requestedById: fr.requestedById,
          isApproved: fr.isApproved,
          approvedBy: fr.approvedBy,
           approvedDate: fr.approvalDate,
          isAuthorized: fr.isAuthorized,
          authorizedBy: fr.authorizedBy,
          authorizationDate: fr.authorizationDate,
          status: fr.status,
          requestedDate: fr.requestedDate,
          paymentPriority: fr.paymentPriority,
          dueDate: fr.dueDate,
          paidDate: null,
          requestNo: fr.frNo,
          state: fr.state,
          orgId: fr.orgId,
        });
        }

        await logActivity({
          activity: "Fund Request Authorized",
          description: `Fund Request ${fr.frNo} was authorized and payment created`,
          entity: "Fund Request",
          entityId: fr._id.toString(),
          orgId: fr.orgId,
          req: req,
        });
      } catch (paymentError) {
        console.error("Payment creation or logging error:", paymentError);
      }
    } else {
      try {
        await logActivity({
          activity: "Fund Request Updated",
          description: `Fund Request ${fr.frNo} was updated`,
          entity: "Fund Request",
          entityId: fr._id.toString(),
          orgId: fr.orgId,
          req: req,
        });
      } catch (logError) {
        console.error("Activity log error:", logError);
      }
    }

    return NextResponse.json({ message: "Updated Successfully" });
  } catch (err) {
    console.error("Fund request update error:", err);
    return NextResponse.json(
      { message: err?.message || "Something went wrong!" },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;
  if (!hasModuleAccess(token, "fund-request")) {
    return NextResponse.json({ message: "Forbidden: Fund Requests module required" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;
  const fundRequest = await FundRequest.findOne({ _id: id, orgId: token.orgId });
  if (!fundRequest) {
    return NextResponse.json({ message: "Fund Request not found" }, { status: 404 });
  }

  if (!["SYS_ADMIN", "ADMIN", "MANAGER"].includes(token.role)) {
    const employee = await Employee.findOne({
      $or: [{ empId: token.username }, { phone: token.username }],
      orgId: token.orgId,
    }).lean();
    if (!employee || fundRequest.requestedById !== employee._id.toString()) {
      return NextResponse.json(
        { message: "Forbidden: You can delete only your own fund requests" },
        { status: 403 },
      );
    }
  }

  const hasPayments = await PaymentInfo.exists({
    requestNo: fundRequest.frNo,
    orgId: token.orgId,
  });
  if (hasPayments) {
    return NextResponse.json(
      { message: "Cannot delete a fund request that has a payment record" },
      { status: 409 },
    );
  }

  await Promise.all([
    FundRequest.deleteOne({ _id: id, orgId: token.orgId }),
    FundRequestDocument.deleteMany({ requestNo: fundRequest.frNo, orgId: token.orgId }),
  ]);
  return NextResponse.json({ message: "Fund Request deleted successfully" });
}
