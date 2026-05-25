import mongoose from "mongoose";
import { unique } from "next/dist/build/utils";

const WorkOrderSchema = new mongoose.Schema(
  {
    woNo: {
      type: String,
      require: true,
      unique: true,
    },
    woTitle: {
      type: String,
    },
    tenderNo: {
      type: String,
    },
    tenderName: {
      type: String,
    },
    woDate: {
      type: Date,
    },
    woType: {
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
    woValue: {
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

export default mongoose.models.WorkOrder ||
  mongoose.model("WorkOrder", WorkOrderSchema);
