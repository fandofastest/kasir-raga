// File: app/api/auth/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/user";
import { connectToDatabase } from "@/lib/mongodb";

export const POST = async (req) => {
  try {
    await connectToDatabase();
    const { email, password, name, nohp, role } = await req.json();
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      nohp,
      role,
    });
    await newUser.save();
    return NextResponse.json({ message: "User registered successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
};
