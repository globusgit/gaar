import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Employee from "@/models/Employee";
import User from '@/models/User';
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activityLog";
import { notifyOrg } from "@/lib/notification";
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

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
                 
    const [users, total] = await Promise.all([
      User.find({orgId}).select("-password").skip(skip).limit(limit),
      User.countDocuments({orgId})
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

  try{
    await connectDB();
    const body = await req.json();
    const orgId = token.orgId;
    const hashedPws = await bcrypt.hash(process.env.DEFAULT_EMP_PASSWORD || "emp@1", 10);
    
    const newUser = new User({
      username: body.phone || body.username,
      password: hashedPws,
      status: "Active",
      role: body.role,
      isFirstLogin: true,
      orgId: orgId,
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
