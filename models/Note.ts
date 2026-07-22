import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      required: true,
    },
    loggedBy: {
      type: String,
    },
    username: {
      type: String,
    },
    entityType: {
      type: String,
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    orgId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Note || mongoose.model("Note", NoteSchema);
