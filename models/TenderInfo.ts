import mongoose from "mongoose";
import { unique } from "next/dist/build/utils";

const TenderInfoSchema = new mongoose.Schema(
  {
    tenderNo: {
      type: String,
      require: true,
      unique: true,
    },
    tenderName: {
      type: String,
    },
    tenderDate: {
      type: Date,
    },
    tenderType: {
      type: String,
    },
    status: {
      type: String,
    },
    emdAmount: {
      type: Number,
    },
    documentFee: {
      type: Number,
    },
    transactionFee: {
      type: Number,
    },
    emdPaymentDate: {
      type: Date,
    },
    documentFeePaymentDate: {
      type: Date,
    },
    transactionFeePaymentDate: {
      type: Date,
    },
    emdPaymentStatus: {
      type: String,
    },
    documentFeePaymentStatus: {
      type: String,
    },
    transactionFeePaymentStatus: {
      type: String,
    },
    emdRefundDate: {
      type: Date,
    },
    emdRefundStatus: {
      type: String,
    },
    tenderingDepartment: {
      type: String,
    },
    client: {
      type: String,
    },
    tenderValue: {
      type: Number,
      require: true,
    },
    clientId: {
      type: String,
    },
    orgId: {
      type: String,
      require: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.TenderInfo ||
  mongoose.model("TenderInfo", TenderInfoSchema);
