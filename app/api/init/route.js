import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import SystemList from "@/models/SystemList";
import User from "@/models/User";
import Organization from "@/models/Organization";
import bcrypt from "bcryptjs";
import { seedSystemLists } from "@/lib/seedSystemLists";
import { requireAuth } from "@/lib/apiGuard";

const REQUIRED_ENV_VARS = [
  "MONGODB_URI",
  "AUTH_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "DEFAULT_SYSADMIN_PASSWORD",
  "DEFAULT_EMP_PASSWORD",
  "DEFAULT_ORG_USER_PASSWORD",
];

export async function POST(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  if (token.role !== "SYS_ADMIN") {
    return NextResponse.json(
      { message: "Forbidden: SYS_ADMIN only" },
      { status: 403 }
    );
  }

  try {
    await connectDB();

    for (const envVar of REQUIRED_ENV_VARS) {
      if (!process.env[envVar]) {
        return NextResponse.json(
          { message: `Server misconfiguration: ${envVar} is not set` },
          { status: 500 },
        );
      }
    }

    const existingOrg = await Organization.findOne({ orgId: "INTR" });
    if (existingOrg) {
      return NextResponse.json(
        { message: "System already initialized!" },
        { status: 403 },
      );
    }

    const intOrg = new Organization({
      orgName: "INTR",
      orgId: "INTR",
      contactName: "Internal",
      contactDesignation: null,
      phone: null,
      email: null,
      website: null,
      address: null,
      city: null,
      mandal: null,
      district: null,
      state: null,
      country: null,
      pincode: null,
      pan: null,
      gstNo: null,
      industryType: "INTR",
      modeOfRegistration: null,
      orgType: "INTR",
    });
    const createdIntOrg = await Organization.create(intOrg);
    await seedSystemLists("INTR");

    const hashedPws = await bcrypt.hash(
      process.env.DEFAULT_SYSADMIN_PASSWORD,
      10,
    );

    const initUser = new User({
      username: "sysadmin",
      password: hashedPws,
      employeeName: "System Admin",
      status: "Active",
      role: "SYS_ADMIN",
      isFirstLogin: true,
      orgId: "INTR",
    });
    const createdInitUser = await User.create(initUser);

    return NextResponse.json(
      { message: "System initialized successfully!" },
      { status: 200 },
    );
  } catch (err) {
    console.error("Init error:", err);
    return NextResponse.json(
      { message: "Something went wrong during initialization!" },
      { status: 500 },
    );
  }
}
