import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import TransactionInfo from "@/models/TransactionInfo";
import PaymentInfo from "@/models/PaymentInfo";
import ReceivableInfo from "@/models/ReceivableInfo";
import TenderInfo from "@/models/TenderInfo";
import WorkOrder from "@/models/WorkOrder";
import FundRequest from "@/models/FundRequest";
import { requireAuth, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

const SAFE_TRANSACTION_FIELDS = [
  "entityType","entityId","amount","txnDate","txnType","paidTo","txnNote",
];

export async function POST(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  const body = await req.json();

  try {
    await connectDB();

    const data = {};
    for (const f of SAFE_TRANSACTION_FIELDS) {
      if (body[f] !== undefined) data[f] = body[f];
    }
    data.orgId = token.orgId;

    const amount = Number(data.amount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      return NextResponse.json(
        { message: "Invalid transaction amount" },
        { status: 400 }
      );
    }

    if (!data.entityId || !["PAYMENT", "RECEIVABLE"].includes(data.entityType)) {
      return NextResponse.json(
        { message: "A valid transaction entity is required" },
        { status: 400 },
      );
    }

    const targetEntity = data.entityType === "PAYMENT"
      ? await PaymentInfo.findOne({ _id: data.entityId, orgId: token.orgId })
      : await ReceivableInfo.findOne({ _id: data.entityId, orgId: token.orgId });

    if (!targetEntity) {
      return NextResponse.json({ message: "Transaction entity not found" }, { status: 404 });
    }

    const availableBalance = data.entityType === "PAYMENT"
      ? Number(targetEntity.balanceAmount || 0)
      : Number(targetEntity.balanceReceivableAmount || 0);
    if (amount > availableBalance) {
      return NextResponse.json(
        { message: "Transaction amount cannot exceed the outstanding balance" },
        { status: 400 },
      );
    }

    const createdTxn = await TransactionInfo.create(data);
    if (createdTxn) {
      if (body.entityType === "PAYMENT") {
        const paymentData = targetEntity;
        const balanceAmount =
          Number(paymentData.balanceAmount) - Number(body.amount);

        let paymentStatus = "Partially Paid";
        if (Number(balanceAmount) <= 0) {
          paymentStatus = "Paid";
        }

        const up = await PaymentInfo.findOneAndUpdate(
          { _id: body.entityId, orgId: token.orgId },
          {
            $inc: {
              balanceAmount: -body.amount,
              paidAmount: +body.amount,
            },
            $set: {
              status: paymentStatus,
            },
          },
          { returnDocument: "after" },
        );

        if (up) {
          const updatedFundRequest = await FundRequest.findOneAndUpdate(
            {
              frNo: up.requestNo,
              orgId: token.orgId,
            },
            {
              status: paymentStatus,
            },
            { returnDocument: "after" },
          );
        }

        if (
          up.paymentType === "BG" ||
          up.paymentType === "EMD" ||
          up.paymentType === "Transaction Fee" ||
          up.paymentType === "Corpus Fund" ||
          up.paymentType === "Document Fee"
        ) {
          if (up.paymentType === "BG") {
            await TenderInfo.findOneAndUpdate(
              {
                tenderNo: up.tenderNo,
                orgId: token.orgId,
              },
              {
                bgPaymentDate: createdTxn.txnDate,
                bgPaymentStatus: paymentStatus,
              },
            );
          }
          if (up.paymentType === "EMD") {
            await TenderInfo.findOneAndUpdate(
              {
                tenderNo: up.tenderNo,
                orgId: token.orgId,
              },
              {
                emdPaymentDate: createdTxn.txnDate,
                emdPaymentStatus: paymentStatus,
              },
            );
          }
          if (up.paymentType === "Transaction Fee") {
            await TenderInfo.findOneAndUpdate(
              {
                tenderNo: up.tenderNo,
                orgId: token.orgId,
              },
              {
                transactionFeePaymentDate: createdTxn.txnDate,
                transactionFeePaymentStatus: paymentStatus,
              },
            );
          }
          if (up.paymentType === "Corpus Fund") {
            await TenderInfo.findOneAndUpdate(
              {
                tenderNo: up.tenderNo,
                orgId: token.orgId,
              },
              {
                corpusFundPaymentDate: createdTxn.txnDate,
                corpusFundPaymentStatus: paymentStatus,
              },
            );
          }
          if (up.paymentType === "Document Fee") {
            await TenderInfo.findOneAndUpdate(
              {
                tenderNo: up.tenderNo,
                orgId: token.orgId,
              },
              {
                documentFeePaymentDate: createdTxn.txnDate,
                documentFeePaymentStatus: paymentStatus,
              },
            );
          }
        }

        if (up.paymentType === "BG" || up.paymentType === "EMD") {
          if (Number(up.balanceAmount) === 0) {
            await ReceivableInfo.create({
              type: up.paymentType,
              woNo: up.woNo,
              woTitle: up.woTitle,
              description: up.description,
              receivableAmount: up.requestAmount,
              balanceReceivableAmount: up.requestAmount,
              receivedAmount: 0,
              vertical: up.vertical,
              subVertical: up.subVertical,
              paymentFrom: up.paymentTo,
              owner: "System",
              status: "Pending",
              receivedDate: up.receivedDate,
              invoiceNo: null,
              dueDate: null,
              tenderNo: up.tenderNo,
              tenderDesc: up.tenderDesc,
              state: up.state,
              orgId: up.orgId,
            });
          }
        }
      } else if (body.entityType === "RECEIVABLE") {
        const receivableData = targetEntity;

        const balanceReceivableAmount =
          Number(receivableData.balanceReceivableAmount || 0) - body.amount;

        const receivedAmount =
          Number(receivableData.receivedAmount || 0) + body.amount;

        let receivableStatus = "Pending";

        if (Number(balanceReceivableAmount) <= 0) {
          receivableStatus = "Received";
        } else if (
          Number(balanceReceivableAmount) > 0 &&
          Number(receivedAmount) > 0
        ) {
          receivableStatus = "Partially Received";
        }

        const updatedReceivable = await ReceivableInfo.findOneAndUpdate(
          { _id: body.entityId, orgId: token.orgId },
          {
            $inc: {
              balanceReceivableAmount: -body.amount,
              receivedAmount: +body.amount,
            },
            $set: {
              status: receivableStatus,
              receivedDate: createdTxn.txnDate || new Date(),
            },
          },
          { returnDocument: "after" },
        );

        if (
          updatedReceivable.type === "BG" ||
          updatedReceivable.type === "EMD"
        ) {
          if (
            updatedReceivable.type === "BG" &&
            receivableStatus === "Received"
          ) {
            await TenderInfo.findOneAndUpdate(
              {
                tenderNo: updatedReceivable.tenderNo,
                orgId: token.orgId,
              },
              {
                $set: {
                  bgRefundStatus: "Refunded",
                  bgRefundDate: updatedReceivable.receivedDate,
                },
              },
              { returnDocument: "after" },
            );
            await WorkOrder.findOneAndUpdate(
              { woNo: updatedReceivable.woNo, orgId: token.orgId },
              { bgReceivedStatus: "Refunded" },
              { returnDocument: "after" },
            );
          }
          if (
            updatedReceivable.type === "EMD" &&
            receivableStatus === "Received"
          ) {
            await TenderInfo.findOneAndUpdate(
              { tenderNo: updatedReceivable.tenderNo, orgId: token.orgId },
              {
                $set: {
                  emdRefundStatus: "Refunded",
                  emdRefundDate: updatedReceivable.receivedDate,
                },
              },
              { returnDocument: "after" },
            );
          }
        }
      }
    }
    return NextResponse.json({ message: "Success!" }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const sortField = sanitizeSortField(searchParams.get("sortField") || "createdAt");
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const query = { orgId: token.orgId };
    if (entityId) {
      query.entityId = entityId;
    }
    if (entityType) {
      const escapedType = sanitizeRegex(entityType);
      query.entityType = { $regex: escapedType, $options: "i" };
    }

    const [txns, total] = await Promise.all([
      TransactionInfo.find(query).sort({ [sortField]: sortOrder }),
      TransactionInfo.countDocuments(query),
    ]);
    return NextResponse.json(
      {
        data: txns,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}
