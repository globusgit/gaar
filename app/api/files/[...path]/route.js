import fs from "fs";
import path from "path";
import { UPLOAD_DIR } from "@/lib/uploadConfig";
import Employee from "@/models/Employee";
import User from "@/models/User";
import connectDB from "@/lib/mongoose";
import { requireAuth } from "@/lib/apiGuard";

const MIME_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  pdf: "application/pdf",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(req, context) {
  try {
    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const { path: fileParts } = await context.params;

    if (!fileParts || fileParts.length === 0) {
      return new Response("Invalid path", { status: 400 });
    }

    const decodedPath = fileParts.map((p) => decodeURIComponent(p));
    const isSystemAdmin = token.role === "SYS_ADMIN";

    if (decodedPath[0] === "employees") {
      const fileName = decodedPath[1];
      if (!fileName || decodedPath.length !== 2) {
        return new Response("Invalid path", { status: 400 });
      }

      if (fileName === "default-avatar.jpg") {
        return Response.redirect(new URL("/default-avatar.jpg", req.url), 307);
      }

      if (!isSystemAdmin) {
        await connectDB();
        const [employee, user] = await Promise.all([
          Employee.exists({ photo: fileName, orgId: token.orgId }),
          User.exists({ photo: fileName, orgId: token.orgId }),
        ]);
        if (!employee && !user) return new Response("Forbidden", { status: 403 });
      }
    } else if (decodedPath[1] === "fund-requests") {
      if (!isSystemAdmin && decodedPath[0] !== token.orgId) {
        return new Response("Forbidden", { status: 403 });
      }
    } else {
      return new Response("Forbidden", { status: 403 });
    }

    const filePath = path.join(/* turbopackIgnore: true */ UPLOAD_DIR, ...decodedPath);
    const resolvedPath = path.resolve(/* turbopackIgnore: true */ filePath);

    if (!resolvedPath.startsWith(path.resolve(/* turbopackIgnore: true */ UPLOAD_DIR))) {
      return new Response("Forbidden", { status: 403 });
    }

    if (!fs.existsSync(/* turbopackIgnore: true */ resolvedPath)) {
      return new Response("File not found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(/* turbopackIgnore: true */ resolvedPath);

    const fileName = decodedPath[decodedPath.length - 1];

    const ext = fileName.split(".").pop()?.toLowerCase();

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
