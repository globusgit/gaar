import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Employee from "@/models/Employee";
import User from '@/models/User';
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activityLog";
import { notifyOrg } from "@/lib/notification";
import { requireAuth, hasModuleAccess, canAssignRole, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";
import { getEffectiveUserModules, normalizeUserModules } from "@/lib/userModules";

const ASSIGNABLE_ROLES = new Set(["ADMIN", "ORG_USER", "USER", "MANAGER", "ACCOUNTANT", "ACCOUNTS"]);

export async function GET(req){
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try{
    await connectDB();
    
    const {searchParams} = new URL(req.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page-1) * limit;
    const orgId = token.orgId;
    const search = sanitizeRegex(searchParams.get('search') || '');
    const sortField = sanitizeSortField(searchParams.get('sortField') || 'createdAt');
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    let query = {orgId};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { employeeName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).select("-password").sort({ [sortField]: sortOrder }).skip(skip).limit(limit),
      User.countDocuments(query)
    ]);

    return NextResponse.json({
      data: users,
      page,
      limit,
      total,
      totalPages: Math.ceil(total/limit)

    },{status:200})

  }catch(err){
    return NextResponse.json({message:"Something went wrong!"},{status:500} )
  }
}

export async function POST(req){
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  if (!hasModuleAccess(token, "users")) {
    return NextResponse.json({ message: "Forbidden: Users module required" }, { status: 403 });
  }

  try{
    await connectDB();
    const body = await req.json();
    const orgId = token.orgId;

    if (!body.role || !ASSIGNABLE_ROLES.has(body.role)) {
      return NextResponse.json(
        { message: "A valid role is required" },
        { status: 400 }
      );
    }

    if (!canAssignRole(token, body.role)) {
      return NextResponse.json(
        { message: "You cannot assign a role above your own authority" },
        { status: 403 },
      );
    }

    const username = body.phone || body.username;
    if (!username) {
      return NextResponse.json(
        { message: "Username or phone is required" },
        { status: 400 }
      );
    }

    const modules = normalizeUserModules(body.modules ?? []);
    if (!modules) {
      return NextResponse.json(
        { message: "One or more selected modules are invalid" },
        { status: 400 },
      );
    }

    const defaultPassword = process.env.DEFAULT_EMP_PASSWORD;
    if (!defaultPassword) {
      return NextResponse.json(
        { message: "Server misconfiguration: DEFAULT_EMP_PASSWORD is not set" },
        { status: 500 },
      );
    }

    const hashedPws = await bcrypt.hash(defaultPassword, 10);
    
    const newUser = new User({
      username: username,
      password: hashedPws,
      employeeName: body.employeeName || body.username || "User",
      status: "Active",
      role: body.role,
      isFirstLogin: true,
      orgId: orgId,
      modules: getEffectiveUserModules(body.role, modules),
    });
    const createdUser = await User.create(newUser);

    await logActivity({
      activity: "User Created",
      description: `User ${createdUser.username} was created`,
      entity: "User",
      entityId: createdUser._id.toString(),
      orgId: orgId,
      req: req,
    });

    await notifyOrg(
      orgId,
      "User created",
      `User ${createdUser.username} was created with role ${createdUser.role}.`,
      "info"
    );

    return NextResponse.json({message: "User created successfully!"}, {status:200})
  }catch(err){
    return NextResponse.json({message: "Something went wrong!"},{status:500})
  } 
}
