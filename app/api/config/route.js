import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Config from '@/models/Config';
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req){
    try{
        await connectDB();
        const {searchParams} = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 20;
        const skip = (page-1) * limit;
        
        const token = await requireAuth(req);
        if (token instanceof Response) return token;

        const orgId = token.orgId;

        const [configs, total] = await Promise.all([
            Config.find({orgId}).skip(skip).limit(limit),
            Config.countDocuments({orgId})
        ]);
        return NextResponse.json({ 
            data: configs,
            page,
            limit,
            total,
            totalPages: Math.ceil(total/limit)},
            {status: 200})
    }catch(err){
        return NextResponse.json({"message": "Something went wrong!"},{status: 500})
    }
}

export async function POST(req){
    try{
        await connectDB();
        const body = await req.json();

        const token = await requireAuth(req);
        if (token instanceof Response) return token;

        if (token.role !== "SYS_ADMIN" && token.role !== "ADMIN") {
          return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const allowedFields = ["name", "value", "orgId"];
        const configData: Record<string, unknown> = {};
        for (const field of allowedFields) {
          if (field in body) {
            configData[field] = body[field];
          }
        }

        if (!configData.name || !configData.orgId) {
          return NextResponse.json(
            { message: "name and orgId are required" },
            { status: 400 }
          );
        }

        const config = await Config.create(configData);
        return NextResponse.json({"message": "Configuration item successfully saved", data: config},{status: 201})
    }catch(err){
        return NextResponse.json({"message": "Something went wrong!"},{status: 500})
    }
}
