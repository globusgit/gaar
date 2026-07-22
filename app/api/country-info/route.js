import { NextResponse } from "next/server";
import {connectDB} from '@/lib/mongoose';
import CountryInfo from '@/models/CountryInfo';
import { requireAuth, requireOrgScope, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(){
    try{
        await connectDB();
        const countryNames = await CountryInfo.distinct('country');
        const countries = countryNames.map((country, index) =>{
            return{
                id: index + 1,
                country,                
            };
        });
        
        return NextResponse.json(countries);

    }catch(err){
        return NextResponse.json({error: "Server error"},{status: 500});
    }
}

