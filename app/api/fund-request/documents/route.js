import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import FundRequestDocument from "@/models/FundRequestDocument";
import { requireAuth } from "@/lib/apiGuard";

function secureFilePath(filePath) {
  return filePath.startsWith("/uploads/")
    ? `/api/files/${filePath.slice("/uploads/".length)}`
    : filePath;
}

export async function GET(req) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const { searchParams } = new URL(req.url);
    const requestNo = searchParams.get("requestNo");
    const orgId = token.orgId;

    if (!requestNo) {
      return NextResponse.json(
        { message: "requestNo is required" },
        { status: 400 },
      );
    }

    const docs = await FundRequestDocument.find({
      orgId,
      requestNo,
    }).sort({ createdAt: -1 });

    const data = docs.map((doc) => ({
      ...doc.toObject(),
      filePath: secureFilePath(doc.filePath),
    }));

    return NextResponse.json(
      { data, total: data.length },
      { status: 200 },
    );
  } catch (err) {
    console.error("Get documents error:", err);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
