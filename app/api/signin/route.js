import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { rateLimit, rateLimitKey } from "@/lib/rateLimit";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const rl = rateLimit(rateLimitKey(username, "login"), 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { message: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }

    await connectDB();
    const user = await User.findOne({ username }).select("+password");
    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }
    return NextResponse.json(
      {
        message: "Login Successful",
        username: user.username,
        orgId: user.orgId,
        role: user.role,
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
