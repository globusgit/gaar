import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import * as XLSX from "xlsx";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const orgId = token.orgId;

  let query = { orgId };

  if (search && search.length >= 3) {
    query.$or = [
      { username: { $regex: search, $options: "i" } },
      { employeeName: { $regex: search, $options: "i" } },
      { role: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
    ];
  }

  const data = await User.find(query).select("-password").lean();

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new Response(buffer, {
    headers: {
      "Content-Disposition": "attachment; filename=users.xlsx",
    },
  });
}
