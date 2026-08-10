import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import CountryInfo from "@/models/CountryInfo";
import { requireAuth, sanitizeRegex, sanitizeSortField } from "@/lib/apiGuard";

export async function GET(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const masterList = searchParams.get("masterList");
    const search = searchParams.get("search") || "";
    const sortField = sanitizeSortField(searchParams.get("sortField") || "country");
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    if (masterList === "true") {
      let query = {};
      if (search) {
        const escapedSearch = sanitizeRegex(search);
        query.country = { $regex: escapedSearch, $options: "i" };
      }
      const countries = await CountryInfo.aggregate([
        { $match: query },
        { $group: { _id: "$country", docId: { $first: "$_id" } } },
        { $sort: { _id: sortOrder === 1 ? 1 : -1 } },
      ]);
      const result = countries.map((c) => ({
        _id: c.docId.toString(),
        listItem: c._id,
      }));
      return NextResponse.json({ data: result }, { status: 200 });
    }

    let countryQuery = {};
    if (search) {
      const escapedSearch = sanitizeRegex(search);
      countryQuery.country = { $regex: escapedSearch, $options: "i" };
    }
    const countryNames = await CountryInfo.distinct("country", countryQuery);
    const countries = countryNames.map((country, index) => {
      return {
        id: index + 1,
        country,
      };
    });

    return NextResponse.json(countries);
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;
  if (token.role !== "SYS_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { listItem } = body;

    if (!listItem || !listItem.trim()) {
      return NextResponse.json(
        { message: "Country is required" },
        { status: 400 },
      );
    }

    const entry = await CountryInfo.create({
      country: listItem.trim(),
      state: "",
      district: "",
      mandal: "",
      shortName: "",
    });

    return NextResponse.json(
      { message: "Country added successfully", data: entry },
      { status: 201 },
    );
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json(
        { message: "Country already exists!" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;
  if (token.role !== "SYS_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const { id, listItem } = body;

    if (!id) {
      return NextResponse.json(
        { message: "ID is required" },
        { status: 400 },
      );
    }

    if (!listItem || !listItem.trim()) {
      return NextResponse.json(
        { message: "Country is required" },
        { status: 400 },
      );
    }

    const entry = await CountryInfo.findById(id);
    if (!entry) {
      return NextResponse.json(
        { message: "Country not found" },
        { status: 404 },
      );
    }

    const updated = await CountryInfo.findByIdAndUpdate(
      id,
      { country: listItem.trim() },
      { returnDocument: "after" },
    );

    return NextResponse.json(
      { message: "Country updated successfully", data: updated },
      { status: 200 },
    );
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json(
        { message: "Country already exists!" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  const token = await requireAuth(req);
  if (token instanceof Response) return token;
  if (token.role !== "SYS_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "ID is required" },
        { status: 400 },
      );
    }

    const entry = await CountryInfo.findById(id);
    if (!entry) {
      return NextResponse.json(
        { message: "Country not found" },
        { status: 404 },
      );
    }

    await CountryInfo.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Country deleted successfully" },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
