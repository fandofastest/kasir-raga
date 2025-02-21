// File: app/api/kategori/route.js (dijelaskan dalam pertanyaan sebelumnya)
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Konsumen from "@/models/konsumen"; // Sesuaikan dengan model yang benar
import { withAuth } from "@/middleware/withAuth";

export const POST = withAuth(async (req, res) => {
  try {
    await connectToDatabase();

    const data = await req.json();

    // Cek apakah user sudah ada berdasarkan no HP
    const existingUser = await Konsumen.findOne({ nohp: data.nohp });

    if (existingUser) {
      return NextResponse.json(
        { error: "No HP Sudah Terdaftar" },
        { status: 400 },
      );
    }

    // Membuat user baru
    console.log(data);

    const newUser = new Konsumen(data);

    // Simpan ke database
    await newUser.save();

    return NextResponse.json({ message: "User berhasil dibuat" });
  } catch (error) {
    console.log(error);

    return NextResponse.json({ error: "Gagal membuat user" }, { status: 500 });
  }
});

export const GET = withAuth(async () => {
  try {
    await connectToDatabase();

    // Ambil semua user
    const users = await Konsumen.find().sort({ nama: "asc" });

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
