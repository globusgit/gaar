import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    read: {
      type: Boolean,
      default: false,
    },
    orgId: {
      type: String,
    },
    userId: {
      type: String,
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ orgId: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
