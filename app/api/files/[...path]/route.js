import fs from "fs"
import path from "path"
import { UPLOAD_DIR } from "@/lib/uploadConfig"

export async function GET(
  req,
  context
) {
  try {
    // ✅ unwrap params
    const { path: fileParts } = await context.params

    //console.log("PARAMS:", fileParts)

    const decodedPath = fileParts.map((p) =>
      decodeURIComponent(p)
    )

    const filePath = path.join(UPLOAD_DIR, ...decodedPath)

    //console.log("FINAL FILE PATH:", filePath)
    //console.log("EXISTS:", fs.existsSync(filePath))

    if (!fs.existsSync(filePath)) {
      return new Response("File not found", { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)

    const ext = path.extname(filePath).toLowerCase()

    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        :ext === ".pdf"
        ? "application/pdf"
        : "application/octet-stream"

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType
      }
    })
  } catch (err) {
    console.error("ERROR:", err)
    return new Response("Internal Server Error", { status: 500 })
  }
}