import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import TenderInfo from "@/models/TenderInfo";
import { requireAuth } from "@/lib/apiGuard";

export async function GET(req) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    const { searchParams } = new URL(req.url);
    const orgId = token.orgId;

    const tenders = await TenderInfo.find({ orgId }).sort({ createdAt: -1 });

    const headers = [
      "Tender No",
      "Description",
      "Tender Date",
      "Tender Type",
      "Status",
      "Position",
      "Department",
      "Client",
      "Tender Value",
      "EMD Amount",
      "BG Amount",
    ];

    const rows = tenders.map((t) => [
      t.tenderNo || "",
      t.description || "",
      t.tenderDate ? new Date(t.tenderDate).toLocaleDateString("en-IN") : "",
      t.tenderType || "",
      t.status || "",
      t.position || "",
      t.tenderingDepartment || "",
      t.client || "",
      t.tenderValue || 0,
      t.emdAmount || 0,
      t.bgAmount || 0,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="tenders.csv"',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
