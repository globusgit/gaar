import mongoose from "mongoose";

const TransactionInfoSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    txnDate: {
      type: Date,
      required: true,
    },
    txnType: {
      type: String,
    },
    paidTo: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
    },
    entityId: {
      type: String,
    },
    txnNote: {
      type: String,
    },
    orgId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

TransactionInfoSchema.index({ orgId: 1, createdAt: -1 });
TransactionInfoSchema.index({ orgId: 1, type: 1 });

export default mongoose.models.TransactionInfo ||
  mongoose.model("TransactionInfo", TransactionInfoSchema);
