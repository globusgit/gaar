import mongoose from "mongoose"

const ReceivableInfoSchema = new mongoose.Schema(
    {
        type:{
            type: String,
            require: true
        },
        description:{
            type: String,
            require: true
        },
        amount:{
            type: Number,
            require: true
        },
        vertical:{
            type: String,
        },
        subVertical:{
            type: String,
            require: true
        },
        paymentFrom:{
            type: String,
            require: true
        },
        owner:{
            type: String,
            require: true
        },
        status:{
            type: String,
            require: true
        },
        receivedDate:{
           type: Date
        },
        invoiceNo:{
            type: String
        },
        dueDate:{
            type: Date
        },
        tenderNo:{
            type: String
        },
        tenderName:{
            type: String
        },
        state:{
            type: String
        },
        orgId:{
            type: String,
            require: true
        },        

    },
    {timestamps: true}
)

export default mongoose.models.ReceivableInfo || mongoose.model("ReceivableInfo", ReceivableInfoSchema)