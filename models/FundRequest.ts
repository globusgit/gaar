import mongoose from "mongoose";

const FundRequestSchema = new mongoose.Schema(
  {
    frNo: {
      type: String,
      require: true,
    },
    frType: {
      type: String,
      require: true,
    },
    description: {
      type: String,
      require: true,
    },
    amount: {
      type: Number,
      require: true,
    },
    vertical: {
      type: String,
      require: true,
    },
    subVertical: {
      type: String,
      require: true,
    },
    paymentTo: {
      type: String,
      require: true,
    },
    requestedBy: {
      type: String,
      require: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: String,
      require: true,
    },
    isAuthorized: {
      type: Boolean,
      default: false,
    },
    authorizedBy: {
      type: String,
    },
    status: {
      type: String,
      require: true,
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
    tenderName: {
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
      require: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.FundRequest ||
  mongoose.model("FundRequest", FundRequestSchema);
