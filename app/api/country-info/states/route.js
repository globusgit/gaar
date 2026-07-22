import { NextResponse } from "next/server";
import {connectDB} from '@/lib/mongoose';
import CountryInfo from '@/models/CountryInfo';
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req){
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

    try{
        await connectDB();

        const {searchParams} = new URL(req.url);
        const country = searchParams.get('country')?.trim() || "";

        const countryStates = await CountryInfo.distinct("state",{country});

        const states = countryStates.map((state,index)=>{
            return {
                id: index+1,
                state
            };
        })

 /*       const states = countryStates.map((state)=>{
            return {
                state
            };
        })
*/
        return NextResponse.json(states);

    }catch(err){
        console.log("API Pagination error: ", err);
        return NextResponse.json({error: "Server error"},{status: 500});
    }
}