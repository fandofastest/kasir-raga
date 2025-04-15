// File: app/api/kategori/route.js (dijelaskan dalam pertanyaan sebelumnya)
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Konsumen from "@/models/konsumen"; // Sesuaikan dengan model yang benar
import { withAuth } from "@/middleware/withAuth";

export const POST = withAuth(async (req, res) => {
  try {
    await connectToDatabase();

    const data = await req.json();
    console.log("Received data for new Konsumen:", data);

    // Cek apakah user sudah ada berdasarkan no HP
    const existingUser = await Konsumen.findOne({ nohp: data.nohp });
    console.log("Existing user lookup result:", existingUser);

    if (existingUser) {
      console.log("No HP already registered:", data.nohp);
      return NextResponse.json(
        { error: "No HP Sudah Terdaftar" },
        { status: 400 },
      );
    }

    // Membuat user baru
    const newUser = new Konsumen(data);
    console.log("New Konsumen instance created:", newUser);

    // Simpan ke database
    await newUser.save();
    console.log("New Konsumen saved successfully.");

    return NextResponse.json({ message: "User berhasil dibuat" });
  } catch (error) {
    console.log("Error in POST /api/konsumen:", error);

    return NextResponse.json({ error: "Gagal membuat user" }, { status: 500 });
  }
});

export const GET = withAuth(async (req) => {
  try {
    await connectToDatabase();

    // Check for kategori query param
    const { searchParams } = new URL(req.url);
    const kategori = searchParams.get("kategori");

    let users;
    if (kategori) {
      // Get users by kategori
      users = await Konsumen.find({ kategori }).sort({ nama: "asc" });
    } else {
      // Get all users
      users = await Konsumen.find().sort({ nama: "asc" });
    }

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data" },
      { status: 500 },
    );
  }
});

export const DELETE = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const { id } = await req.json();
    console.log("====================================");
    console.log(id);
    console.log("====================================");
    await Konsumen.findByIdAndDelete(id);
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});

export const PUT = withAuth(async (req, res) => {
  try {
    await connectToDatabase();

    // Ambil ID dari request
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const data = await req.json();

    // Dapatkan user yang akan diperbarui
    console.log("====================================");
    console.log(data);
    console.log("====================================");

    await Konsumen.findByIdAndUpdate(id, data);

    return NextResponse.json({ message: "User berhasil diperbarui" });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memperbarui user" },
      { status: 500 },
    );
  }
});
