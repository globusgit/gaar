import mongoose from "mongoose"

const ConfigSchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: true,
            unique: true
        },
        value:{
            type: String,
            required: true,
        },
        orgId:{
            type: String,
            required: true
        }
    },
    {timestamps: true}
)

export default mongoose.models.Config || mongoose.model("Config", ConfigSchema)
