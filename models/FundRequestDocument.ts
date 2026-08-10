import mongoose from "mongoose";

const FundRequestDocumentSchema = new mongoose.Schema(
  {
    requestNo: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: String,
    },
    orgId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

FundRequestDocumentSchema.index({ orgId: 1, requestNo: 1 });

export default mongoose.models.FundRequestDocument ||
  mongoose.model("FundRequestDocument", FundRequestDocumentSchema);