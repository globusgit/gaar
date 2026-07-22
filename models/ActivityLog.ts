import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    activity: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    loggedBy: {
      type: String,
    },
    entity: {
      type: String,
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
    },
    orgId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

ActivityLogSchema.index({ orgId: 1, date: -1 });
ActivityLogSchema.index({ entity: 1, entityId: 1 });

export default mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", ActivityLogSchema);