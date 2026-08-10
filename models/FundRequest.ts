import mongoose from "mongoose";

const FundRequestSchema = new mongoose.Schema(
  {
    frNo: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    frType: {
      type: String,
      required: true,
    },
    paymentType: {
      type: String,
      required: true,
    },
    woNo: {
      type: String,
    },
    woTitle: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    vertical: {
      type: String,
      required: true,
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
      required: false
    },
    approvalDate: {
      type: Date,
      default: null,
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
      default: null,
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
    state: {
      type: String,
    },
    tenderNo: {
      type: String,
    },
    tenderDesc: {
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
    woDepartment: {
      type: String,
    },
    bgMaturityDate: {
      type: Date,
    },
    orgId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

FundRequestSchema.index({ orgId: 1, frNo: 1 }, { unique: true });
FundRequestSchema.index({ orgId: 1, status: 1 });
FundRequestSchema.index({ orgId: 1, createdAt: -1 });

export default mongoose.models.FundRequest ||
  mongoose.model("FundRequest", FundRequestSchema);
