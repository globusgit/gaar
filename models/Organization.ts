import mongoose from "mongoose";

const OrganizationSchema = new mongoose.Schema(
  {
    orgName: {
      type: String,
      required: true,
      unique: true,
    },
    orgId: {
      type: String,
      required: true,
      unique: true,
    },
    contactName: {
      type: String,
      required: true,
    },
    contactDesignation: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    website: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },
    pincode: {
      type: String,
    },
    status: {
      type: String,
    },
    pan: {
      type: String,
    },
    gstNo: {
      type: String,
    },
    industryType: {
      type: String,
    },
    modeOfRegistration: {
      type: String,
    },
    orgType: {
      type: String,
    },
    regDate: {
      type: Date,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Organization ||
  mongoose.model("Organization", OrganizationSchema);
