import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import PaymentInfo from '@/models/PaymentInfo';
import ReceivableIno from "@/models/ReceivableInfo";

/**
 * Get all Payments Info of an organization
 */
export async function GET(req){
    try{
        await connectDB();
        
        const {searchParams} = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 20;
        const skip = (page-1) * limit;
        const orgId = searchParams.get('orgId');
                
        const [payments, total] = await Promise.all([
            PaymentInfo.find({orgId: orgId}).skip(skip).limit(limit),
            PaymentInfo.countDocuments()
        ]);

        return NextResponse.json({
            data: payments,
            page,
            limit,
            total,
            totalPages: Math.ceil(total/limit)

        },{status:200})

    }catch(err){
        return NextResponse.json({message:"Something went wrong!"},{status:500} )
    }

}

export async function POST(req){
    try{
        await connectDB();
        const {
            paymentType,
            description,
            amount,
            vertical,
            subVertical,
            paymentTo,
            requestedBy,
            approvedBy,
            authorizedBy,
            status,
            requestedDate,
            paymentPriority,
            dueDate,
            paidDate,
            requestNo,
            state,
            orgId,
            tenderNo,
            tenderName,
            maturityDate,
        } = await req.json();
           
        console.log("Payment Info: ", { paymentType, description, amount, orgId });
        const paymentRecordToCreate = new PaymentInfo({
            paymentType,
            description,
            amount,
            vertical,
            subVertical,
            paymentTo,
            requestedBy,
            approvedBy,
            authorizedBy,
            status,
            requestedDate,
            paymentPriority,
            dueDate,    
            paidDate,
            requestNo,
            state,  
            orgId
        });
        const payment = await PaymentInfo.create(paymentRecordToCreate);
        console.log("Created Payment Info: " + payment);
        if(payment){
            if(payment.paymentType === "BG" || payment.paymentType === "EMD"){
                const receivableRecordToCreate = new ReceivableIno({
                    type: paymentType,
                    description,
                    amount,
                    vertical,
                    subVertical,
                    paymentFrom: paymentTo,
                    owner: "System",
                    status: "Pending",
                    receivedDate: null,
                    invoiceNo: null,
                    dueDate: maturityDate,
                    tenderNo,
                    tenderName,
                    state,
                    orgId
                });
                const receivable = await ReceivableIno.create(receivableRecordToCreate);
            }
        }
        return NextResponse.json({message: "Payment Info created successfully!"}, {status:200})
    }catch(err){
        return NextResponse.json({message: "Something went wrong!"},{status:500})
    } 
}