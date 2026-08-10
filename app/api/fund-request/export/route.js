import { connectDB } from "@/lib/mongoose";
import FundRequest from "@/models/FundRequest";
import Employee from "@/models/Employee";
import * as XLSX from "xlsx";
import { requireAuth, sanitizeRegex } from "@/lib/apiGuard";

export async function GET(req) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") || "";

  let filter = { orgId: token.orgId };

  if (!["ADMIN", "SYS_ADMIN", "MANAGER"].includes(token.role)) {
    const employee = await Employee.findOne({
      $or: [
        { empId: token.username },
        { phone: token.username },
      ],
      orgId: token.orgId,
    }).lean();

    if (employee) {
      filter.requestedById = employee._id;
    } else {
      filter.requestedById = null;
    }
  }

  if (search) {
    const escapedSearch = sanitizeRegex(search);
    filter.$or = [
      { frNo: { $regex: escapedSearch, $options: "i" } },
      { description: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const data = await FundRequest.find(filter);

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "FR");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Disposition": "attachment; filename=FundRequests.xlsx",
    },
  });
}
