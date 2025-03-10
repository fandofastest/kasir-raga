// File: app/api/satuan/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { withAuth } from "@/middleware/withAuth";
import { log } from "console";

export const POST = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const data = await req.json();

    // const existingUser = await User.findOne({ email: data.email });
    // if (existingUser) {
    //   return NextResponse.json(
    //     { error: "Email must be unique" },
    //     { status: 400 },
    //   );
    // }

    const newUser = new User(data);

    await newUser.save();
    console.log(data);

    return NextResponse.json({
      data: newUser,
      message: "Satuan added successfully",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});

export const GET = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      // Jika id disediakan, ambil profile user berdasarkan id
      const userProfile = await User.findById(id);
      if (!userProfile) {
        return NextResponse.json(
          { error: "Profile tidak ditemukan" },
          { status: 404 },
        );
      }
      return NextResponse.json(userProfile);
    }

    // Jika tidak ada id, kembalikan seluruh list user
    const userList = await User.find();
    return NextResponse.json(userList);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});

import bcrypt from "bcryptjs";

export const PUT = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const data = await req.json();

    // Jika ada password, hash password tersebut
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, data, { new: true });
    if (!updatedUser) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "User berhasil diperbarui",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Gagal mengupdate user:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
});

export const DELETE = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const { id } = await req.json();
    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});
