import mongoose from "mongoose";

const CountryInfoSchema = new mongoose.Schema(
    {
        mandal: {
            type: String
        },
        district: {
            type: String
        },
        state: {
            type: String
        },
        shortName:{
            type: String
        },
        country: {
            type: String
        },
    },
    { timestamps: true }

);

CountryInfoSchema.index({ country: 1, state: 1, district: 1, mandal: 1 }, { unique: true });

export default mongoose.models.CountryInfo || mongoose.model("CountryInfo", CountryInfoSchema);