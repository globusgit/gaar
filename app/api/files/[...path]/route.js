import fs from "fs";
import path from "path";
import { UPLOAD_DIR } from "@/lib/uploadConfig";
import { requireAuth } from "@/lib/apiGuard";

export async function GET(req, context) {
  try {
    const token = await requireAuth(req);
    if (token instanceof Response) return token;

    const { path: fileParts } = await context.params;

    if (!fileParts || fileParts.length === 0) {
      return new Response("Invalid path", { status: 400 });
    }

    const decodedPath = fileParts.map((p) => decodeURIComponent(p));
    const filePath = path.join(UPLOAD_DIR, ...decodedPath);
    const resolvedPath = path.resolve(filePath);

    if (!resolvedPath.startsWith(path.resolve(UPLOAD_DIR))) {
      return new Response("Forbidden", { status: 403 });
    }

    if (!fs.existsSync(resolvedPath)) {
      return new Response("File not found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(resolvedPath);

    const fileName = decodedPath[decodedPath.length - 1];

    const ext = fileName.split(".").pop().toLowerCase();

    const mimeTypes = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      pdf: "application/pdf",
    };

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=3153603600",
      },
    });
  } catch (err) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
