import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import FundRequestDocument from "@/models/FundRequestDocument";
import { requireAuth } from "@/lib/apiGuard";
import { FR_DOCUMENT_UPLOAD_DIR } from "@/lib/uploadConfig";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const formData = await req.formData();

    const file = formData.get("file");
    const requestNo = formData.get("requestNo");

    if (!file || !requestNo || typeof requestNo !== "string" || !/^[A-Za-z0-9_-]+$/.test(requestNo)) {
      return NextResponse.json(
        { message: "A valid file and requestNo are required" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const orgId = token.orgId;
    const orgDir = FR_DOCUMENT_UPLOAD_DIR(orgId);

    const requestDir = path.join(/* turbopackIgnore: true */ orgDir, requestNo);

    if (!fs.existsSync(/* turbopackIgnore: true */ requestDir)) {
      fs.mkdirSync(/* turbopackIgnore: true */ requestDir, { recursive: true });
    }

    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedName = `${timestamp}-${originalName}`;
    const filePath = path.join(/* turbopackIgnore: true */ requestDir, storedName);

    fs.writeFileSync(/* turbopackIgnore: true */ filePath, buffer);

    const doc = await FundRequestDocument.create({
      requestNo,
      fileName: file.name,
      filePath: `/api/files/${orgId}/fund-requests/${requestNo}/${storedName}`,
      fileType: file.type || path.extname(file.name).substring(1),
      uploadedBy: token.username,
      orgId,
    });

    return NextResponse.json(
      { message: "Document uploaded successfully", data: doc },
      { status: 201 },
    );
  } catch (err) {
    console.error("Document upload error:", err);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
