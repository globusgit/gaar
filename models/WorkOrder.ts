import mongoose from "mongoose";

const WorkOrderSchema = new mongoose.Schema(
  {
    woNo: {
      type: String,
      required: true,
      unique: true,
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
    woDate: {
      type: Date,
    },
    woType: {
      type: String,
    },
    vertical: {
      type: String,
    },
    subVertical: {
      type: String,
    },
    projectCompletionDate: {
      type: Date,
    },
    actualStartDate: {
      type: Date,
    },
    actualEndDate: {
      type: Date,
    },
    status: {
      type: String,
    },
    client: {
      type: String,
    },
    bgAmount: {
      type: Number,
    },
    bgMaturityDate: {
      type: Date,
    },
    bgReceivedStatus: {
      type: String,
    },
    woValue: {
      type: Number,
      required: true,
    },
    country: {
      type: String,
    },
    state: {
      type: String,
    },
    clientId: {
      type: String,
    },
    orgId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

WorkOrderSchema.index({ orgId: 1, woNo: 1 });
WorkOrderSchema.index({ orgId: 1, status: 1 });
WorkOrderSchema.index({ orgId: 1, createdAt: -1 });

export default mongoose.models.WorkOrder ||
  mongoose.model("WorkOrder", WorkOrderSchema);
