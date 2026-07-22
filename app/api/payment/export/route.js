import { connectDB } from "@/lib/mongoose";
import PaymentInfo from "@/models/PaymentInfo";
import * as XLSX from "xlsx";
import { requireAuth, sanitizeRegex } from "@/lib/apiGuard";

export async function GET(req) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  let query = { orgId: token.orgId };

  if (search && search.length >= 3) {
    const escapedSearch = sanitizeRegex(search);
    query.$or = [
      { description: { $regex: escapedSearch, $options: "i" } },
      { status: { $regex: escapedSearch, $options: "i" } },
      { requestedBy: { $regex: escapedSearch, $options: "i" } },
      { priority: { $regex: escapedSearch, $options: "i" } },
      { vertical: { $regex: escapedSearch, $options: "i" } },
      { state: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const data = await PaymentInfo.find(query).lean();

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new Response(buffer, {
    headers: {
      "Content-Disposition": "attachment; filename=payments.xlsx",
    },
  });
}
