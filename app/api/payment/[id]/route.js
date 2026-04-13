import connectDB from "@/lib/mongoose"
import PaymentInfo from "@/models/PaymentInfo"
import { NextResponse } from "next/server"

export async function GET(req, { params }) {
  await connectDB()
  const data = await PaymentInfo.findById(params.id)
  return NextResponse.json(data)
}

export async function PUT(req, { params }) {
  await connectDB()
  const body = await req.json()

  const updated = await PaymentInfo.findByIdAndUpdate(
    params.id,
    body,
    { new: true }
  )

  return NextResponse.json(updated)
}