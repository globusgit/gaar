import { NextResponse } from "next/server";
import User from "@/models/User";
import Organization from "@/models/Organization";
import connectDB from "@/lib/mongoose";
import { logActivity } from "@/lib/activityLog";
import { notifyOrg } from "@/lib/notification";
import { requireAuth, sanitizeRegex } from "@/lib/apiGuard";
import bcrypt from "bcryptjs";
import { seedSystemLists } from "@/lib/seedSystemLists";

const ALL_MODULES = [
  "dashboard",
  "employees",
  "clients",
  "work-orders",
  "tenders",
  "fund-request",
  "payments",
  "receivables",
  "organizations",
  "users",
  "ai",
  "settings",
  "master-lists",
  "system-settings",
  "audit-logs",
];

export async function POST(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  if (token.role !== "SYS_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    orgName,
    contactName,
    contactDesignation,
    phone,
    email,
    website,
    address,
    city,
    state,
    country,
    pincode,
    pan,
    gstNo,
    industryType,
    modeOfRegistration,
    orgType,
  } = body;

  if (
    !orgName ||
    !phone ||
    !email ||
    !address ||
    !city ||
    !state ||
    !country
  ) {
    return NextResponse.json(
      { message: "Some required fields are missing" },
      { status: 400 },
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { message: "Email is not valid" },
      { status: 400 },
    );
  }

  if (!/^\d{10}$/.test(String(phone))) {
    return NextResponse.json(
      { message: "Phone must contain exactly 10 digits" },
      { status: 400 },
    );
  }

  const defaultPassword = process.env.DEFAULT_ORG_USER_PASSWORD;
  if (!defaultPassword) {
    return NextResponse.json(
      { message: "Server misconfiguration: DEFAULT_ORG_USER_PASSWORD is not set" },
      { status: 500 },
    );
  }

  try {
    await connectDB();
    const existingOrganizationEmail = await Organization.findOne({ email });
    const existingOrganizationPhone = await Organization.findOne({ phone });
    const existingOrganization = await Organization.findOne({ orgName });
    const existingUsername = await User.exists({ username: phone });
    if (
      existingOrganization ||
      existingOrganizationPhone ||
      existingOrganizationEmail ||
      existingUsername
    ) {
      return NextResponse.json(
        {
          message:
            "Organization with given phone or email or Organization Name exists!",
        },
        { status: 400 },
      );
    }

    const orgId = "ORG" + Date.now().toString().slice(-6);
    const status = "Active";
    const regDate = new Date();
    const newOrganization = new Organization({
      orgName,
      orgId,
      contactName: contactName?.trim() || "",
      contactDesignation: contactDesignation?.trim() || "",
      phone,
      email,
      website: website?.trim() || undefined,
      address,
      city,
      state,
      country,
      pincode,
      status,
      pan,
      gstNo,
      industryType,
      modeOfRegistration,
      orgType,
      regDate,
    });

    const createdOrg = await Organization.create(newOrganization);

    if (createdOrg) {
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
       const newOrgUser = new User({
         username: phone,
         password: hashedPassword,
         employeeName: contactName,
         status: "Active",
         role: "ADMIN",
         isFirstLogin: true,
         orgId: createdOrg.orgId,
         modules: ALL_MODULES,
       });
      const newOrgUserCreated = await User.create(newOrgUser);
      if (newOrgUserCreated) {
        await seedSystemLists(createdOrg.orgId);
        await logActivity({
          activity: "Organization Created",
          description: `Organization ${createdOrg.orgName} was created`,
          entity: "Organization",
          entityId: createdOrg._id.toString(),
          orgId: createdOrg.orgId,
          req: req,
        });

        await notifyOrg(
          createdOrg.orgId,
          "Organization registered",
          `Organization ${createdOrg.orgName} was registered.`,
          "success"
        );

        return NextResponse.json(
          { message: "Organization registered successfully!" },
          { status: 201 },
        );
      } else {
        await createdOrg.delete();
        return NextResponse.json(
          { message: "Failed to Register Organization" },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json(
        { message: "Failed to Register Organization" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Organization creation error:", error);
    if (error?.code === 11000) {
      return NextResponse.json(
        { message: "Organization name, phone, email, website, or login already exists" },
        { status: 409 },
      );
    }
    if (error?.name === "ValidationError") {
      return NextResponse.json(
        { message: Object.values(error.errors).map((item) => item.message).join(", ") },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: "Unable to create organization. Please verify the submitted details." },
      { status: 500 },
    );
  }
}

export async function GET(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const globalFilter = searchParams.get("globalFilter") || "";
    const skip = (page - 1) * limit;

    const query = {};
    if (token.role !== "SYS_ADMIN") {
      query.orgId = token.orgId;
    } else if (searchParams.get("orgId")) {
      query.orgId = searchParams.get("orgId");
    }

    if (globalFilter) {
      const safeFilter = sanitizeRegex(globalFilter);
      query.$or = [
        { orgName: { $regex: safeFilter, $options: "i" } },
        { email: { $regex: safeFilter, $options: "i" } },
        { phone: { $regex: safeFilter, $options: "i" } },
      ];
    }

    const [orgs, total] = await Promise.all([
      Organization.find(query).skip(skip).limit(limit),
      Organization.countDocuments(query),
    ]);
    return NextResponse.json(
      {
        data: orgs,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 },
    );
  }
}
