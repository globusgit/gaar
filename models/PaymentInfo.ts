import mongoose from "mongoose"

const PaymentInfoSchema = new mongoose.Schema(
    {
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
        paymentTo:{
            type: String,
            require: true
        },
        requestedBy:{
            type: String,
            require: true
        },
        approvedBy:{
            type: String,
            require: true
        },
        authorizedBy:{
            type: String
        },
        status:{
            type: String,
            require: true
        },
        requestedDate:{
           type: Date
        },
        paymentPriority:{
            type: String
        },
        dueDate:{
            type: Date
        },
        paidDate:{
            type: Date
        },
        requestNo:{
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

export default mongoose.models.PaymentInfo || mongoose.model("PaymentInfo", PaymentInfoSchema)