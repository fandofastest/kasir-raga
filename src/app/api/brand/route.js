// File: app/api/brand/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Brand from "@/models/brand";
import { withAuth } from "@/middleware/withAuth";
import { log } from "console";

export const POST = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const data = await req.json();

    const existingBrand = await Brand.findOne({ nama: data.nama });
    if (existingBrand) {
      return NextResponse.json(
        { error: "Brand name must be unique" },
        { status: 400 },
      );
    }

    const newBrand = new Brand(data);
    await newBrand.save();
    return NextResponse.json({
      data: newBrand,
      message: "Brand added successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});

export const GET = withAuth(async () => {
  await connectToDatabase();
  const brands = await Brand.find();
  return NextResponse.json(brands);
});

export const DELETE = withAuth(async (req) => {
  await connectToDatabase();
  const { nama } = await req.json();

  await Brand.findOneAndDelete({ nama });
  return NextResponse.json({ message: "Brand deleted successfully" });
});

// ✅ Handler PUT untuk update brand
export const PUT = withAuth(async (req) => {
  await connectToDatabase();

  const { id, nama, deskripsi } = await req.json();
  console.log("Data diterima untuk update:", { id, nama, deskripsi });

  if (!id || !nama) {
    return NextResponse.json(
      { error: "ID dan Nama wajib diisi" },
      { status: 400 },
    );
  }

  try {
    // Cari data brand berdasarkan ID
    let brand = await Brand.findById(id);

    if (!brand) {
      return NextResponse.json(
        { error: "Brand tidak ditemukan" },
        { status: 404 },
      );
    }

    // Update data brand
    brand.nama = nama;
    if (deskripsi !== undefined) {
      brand.deskripsi = deskripsi;
    }
    await brand.save();

    console.log("Brand berhasil diperbarui:", brand);

    return NextResponse.json(
      { data: brand, message: "Brand updated successfully" },
      {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  } catch (error) {
    console.error("Error saat update brand:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat update brand" },
      { status: 500 },
    );
  }
});
