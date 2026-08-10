import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Organization from "@/models/Organization";
import { requireAuth } from "@/lib/apiGuard";

export async function GET(req) {
  await connectDB();

  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    const { searchParams } = new URL(req.url);
    const orgId = token.orgId;

    const query = orgId ? { orgId } : {};
    const search = searchParams.get("search") || "";

    if (search) {
      query.$or = [
        { orgName: { $regex: search, $options: "i" } },
        { contactName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const organizations = await Organization.find(query).sort({ createdAt: -1 });

    const headers = [
      "Org Name",
      "Org ID",
      "Contact Name",
      "Contact Designation",
      "Phone",
      "Email",
      "Website",
      "Address",
      "City",
      "District",
      "State",
      "Country",
      "Pincode",
      "Status",
      "PAN",
      "GST No",
      "Industry Type",
      "Mode of Registration",
      "Org Type",
      "Reg Date",
    ];

    const rows = organizations.map((org) => [
      org.orgName || "",
      org.orgId || "",
      org.contactName || "",
      org.contactDesignation || "",
      org.phone || "",
      org.email || "",
      org.website || "",
      org.address || "",
      org.city || "",
      org.district || "",
      org.state || "",
      org.country || "",
      org.pincode || "",
      org.status || "",
      org.pan || "",
      org.gstNo || "",
      org.industryType || "",
      org.modeOfRegistration || "",
      org.orgType || "",
      org.regDate ? new Date(org.regDate).toLocaleDateString("en-IN") : "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="organizations.csv"',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
