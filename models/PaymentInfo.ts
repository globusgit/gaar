import mongoose from "mongoose";

const PaymentInfoSchema = new mongoose.Schema(
  {
    paymentType: {
      type: String,
      required: true,
    },
    frType: {
      type: String,
      required: true,
    },
    woNo: {
      type: String,
    },
    woTitle: {
      type: String,
    },
    tenderNo: {
      type: String,
    },
    tenderDesc: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    requestAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      required: true,
    },
    balanceAmount: {
      type: Number,
      required: true,
    },
    vertical: {
      type: String,
    },
    subVertical: {
      type: String,
      required: true,
    },
    paymentTo: {
      type: String,
      required: true,
    },
    requestedBy: {
      type: String,
      required: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: String,
      required: true,
    },
    approvedDate: {
      type: Date,
    },
    isAuthorized: {
      type: Boolean,
      default: false,
    },
    authorizedBy: {
      type: String,
    },
    authorizationDate: {
      type: Date,
    },
    status: {
      type: String,
      required: true,
    },
    requestedDate: {
      type: Date,
    },
    paymentPriority: {
      type: String,
    },
    dueDate: {
      type: Date,
    },
    paidDate: {
      type: Date,
    },
    requestNo: {
      type: String,
    },
    state: {
      type: String,
    },
    requestedById: {
      type: String,
    },
    approvedById: {
      type: String,
    },
    authorizedById: {
      type: String,
    },
    orgId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

PaymentInfoSchema.index({ orgId: 1, status: 1 });
PaymentInfoSchema.index({ orgId: 1, dueDate: 1 });
PaymentInfoSchema.index({ orgId: 1, createdAt: -1 });

export default mongoose.models.PaymentInfo ||
  mongoose.model("PaymentInfo", PaymentInfoSchema);
