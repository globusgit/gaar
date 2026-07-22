import mongoose from "mongoose";

const ReceivableInfoSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    receivableAmount: {
      type: Number,
      required: true,
    },
    balanceReceivableAmount: {
      type: Number,
      required: true,
    },
    receivedAmount: {
      type: Number,
      required: true,
    },
    woNo: {
      type: String,
    },
    woTitle: {
      type: String,
    },
    vertical: {
      type: String,
    },
    subVertical: {
      type: String,
      required: true,
    },
    paymentFrom: {
      type: String,
      required: true,
    },
    owner: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    receivedDate: {
      type: Date,
    },
    invoiceNo: {
      type: String,
    },
    dueDate: {
      type: Date,
    },
    tenderNo: {
      type: String,
    },
    tenderDesc: {
      type: String,
    },
    state: {
      type: String,
    },
    orgId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

ReceivableInfoSchema.index({ orgId: 1, createdAt: -1 });
ReceivableInfoSchema.index({ orgId: 1, paymentFrom: 1 });

export default mongoose.models.ReceivableInfo ||
  mongoose.model("ReceivableInfo", ReceivableInfoSchema);
