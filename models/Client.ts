import mongoose from "mongoose"

const ClientSchema = new mongoose.Schema(
    {
        client:{
            type: String,
            required: true
        },
        clientId:{
            type:String,
            required: true
        },
        website:{
            type: String
        },
        emailId:{
            type: String
        },
        phone:{
            type: String
        },
        gstNo:{
            type: String
        },
        state:{
            type: String,
            required: true
        },
        orgId:{
            type: String,
            required: true
        }
    },
    {timestamps: true}
)

ClientSchema.index({ orgId: 1, clientId: 1 }, { unique: true });
ClientSchema.index({ orgId: 1, client: 1 });

export default mongoose.models.Client || mongoose.model("Client", ClientSchema)
