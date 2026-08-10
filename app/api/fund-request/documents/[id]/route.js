import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import FundRequestDocument from "@/models/FundRequestDocument";
import { requireAuth } from "@/lib/apiGuard";
import fs from "fs";
import path from "path";
import { UPLOAD_DIR } from "@/lib/uploadConfig";

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const { id } = await params;

    const doc = await FundRequestDocument.findById(id);

    if (!doc) {
      return NextResponse.json(
        { message: "Document not found" },
        { status: 404 },
      );
    }

    if (doc.orgId !== token.orgId) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 },
      );
    }

    const relativeFilePath = doc.filePath.replace(/^\/(api\/files|uploads)\//, "");
    const resolvedFilePath = path.resolve(/* turbopackIgnore: true */ UPLOAD_DIR, relativeFilePath);
    if (resolvedFilePath.startsWith(path.resolve(/* turbopackIgnore: true */ UPLOAD_DIR)) && fs.existsSync(/* turbopackIgnore: true */ resolvedFilePath)) {
      fs.unlinkSync(/* turbopackIgnore: true */ resolvedFilePath);
    }

    await FundRequestDocument.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Document deleted successfully" },
      { status: 200 },
    );
  } catch (err) {
    console.error("Document delete error:", err);
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
