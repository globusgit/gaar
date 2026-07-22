import { connectDB } from "@/lib/mongoose";
import Employee from "@/models/Employee";
import * as XLSX from "xlsx";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const search = sanitizeRegex(searchParams.get("search") || "");
  const orgId = token.orgId;

  let query = { orgId };

  if (search && search.length >= 3) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { empId: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { designation: { $regex: search, $options: "i" } },
    ];
  }

  const data = await Employee.find(query).lean();

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new Response(buffer, {
    headers: {
      "Content-Disposition": "attachment; filename=employees.xlsx",
    },
  });
}
