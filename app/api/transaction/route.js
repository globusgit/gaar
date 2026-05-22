import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import TransactionInfo from "@/models/TransactionInfo";
import PaymentInfo from "@/models/PaymentInfo";
import ReceivableInfo from "@/models/ReceivableInfo";

export async function POST(req) {
  const body = await req.json();
  console.log("After passing data to constants");

  try {
    await connectDB();
    //console.log("After connecting to db");
    //const clientNameWithNoSpaces = client.replace(/\s/g,'');

    const createdTxn = await TransactionInfo.create(body);
    console.log(createdTxn);
    if (createdTxn) {
      if (body.entityType === "PAYMENT") {
        console.log("Body Amount: ", body.amount);
        const paymentData = await PaymentInfo.findById(body.entityId);
        const balanceAmount = Number(paymentData.balanceAmount) - body.amount;
        // const paidAmount = Number(paymentData.paidAmount || 0) + body.amount;
        let paymentStatus = "Partially Paid";
        if (balanceAmount <= 0) {
          paymentStatus = "Paid";
        }

        const up = await PaymentInfo.findByIdAndUpdate(
          body.entityId,
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
        console.log("Updated Payment: ", up);
        if (up.paymentType === "BG" || up.paymentType === "EMD") {
          console.log("Balance Amount: ", up.balanceAmount);
          console.log("Payment Type: ", up.paymentType);
          if (up.balanceAmount === 0) {
            console.log("Creating receivable entry for BG/EMD payment...");

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
              tenderName: up.tenderName,
              state: up.state,
              orgId: up.orgId,
            });
            console.log("Receivable entry created successfully!");
          }
        }
      } else if (body.entityType === "RECEIVABLE") {
        const receivableData = await ReceivableInfo.findById(body.entityId);

        const balanceReceivableAmount =
          Number(receivableData.balanceReceivableAmount || 0) - body.amount;

        const receivedAmount =
          Number(receivableData.receivedAmount || 0) + body.amount;

        let receivableStatus = "Pending";

        // Fully received
        if (balanceReceivableAmount <= 0) {
          receivableStatus = "Received";
        }

        // Partially received
        else if (balanceReceivableAmount > 0 && receivedAmount > 0) {
          receivableStatus = "Partially Received";
        }

        const updatedReceivable = await ReceivableInfo.findByIdAndUpdate(
          body.entityId,
          {
            $inc: {
              balanceReceivableAmount: -body.amount,
              receivedAmount: +body.amount,
            },
            $set: {
              status: receivableStatus,
            },
          },
          { returnDocument: "after" },
        );

        console.log(
          "Receivable transaction created successfully!",
          updatedReceivable,
        );
      }
    }
    return NextResponse.json({ message: "Success!" }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    console.log("Org Id: " + orgId);

    const [txns, total] = await Promise.all([
      TransactionInfo.find({ entityId }),
    ]);
    console.log("Transactions: ", txns);
    return NextResponse.json(
      {
        data: txns,
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

/**
 * Method to Update a client
 * @returns M
 */
export async function PATCH(req) {
  const { client, website, emailId, phone, gstNo, orgId } = await req.json();
  try {
    return NextResponse.json(
      { message: "Successfully saved Client!" },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
