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
        const state = searchParams.get('state')?.trim() || "";
        
        const countryStateDistrict = await CountryInfo.distinct("district",{country,state});

        const districts = countryStateDistrict.map((district,index)=>{
            return {
                id: index+1,
                district
            };
        })

 /*       const districts = countryStateDistrict.map((district)=>{
            return {
               district
            };
        })
*/
        return NextResponse.json(districts);

    }catch(err){
        console.log("API Pagination error: ", err);
        return NextResponse.json({error: "Server error"},{status: 500});
    }
}