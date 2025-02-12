// File: app/api/kategori/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Kategori from "@/models/kategori";
import { withAuth } from "@/middleware/withAuth";

export const POST = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const data = await req.json();

    const existingKategori = await Kategori.findOne({ nama: data.nama });
    if (existingKategori) {
      return NextResponse.json(
        { error: "Kategori name must be unique" },
        { status: 400 },
      );
    }

    const newKategori = new Kategori(data);
    await newKategori.save();
    return NextResponse.json({
      data: newKategori,
      message: "Kategori added successfully",
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
  const kategori = await Kategori.find();
  return NextResponse.json(kategori);
});

export const DELETE = withAuth(async (req) => {
  await connectToDatabase();
  const { nama } = await req.json();
  await Kategori.findOneAndDelete({ nama });
  return NextResponse.json({ message: "Kategori deleted successfully" });
});

export const PUT = withAuth(async (req) => {
  await connectToDatabase();
  const { id, ...updateData } = await req.json();
  await Kategori.findByIdAndUpdate(id, updateData);
  return NextResponse.json({ message: "Kategori updated successfully" });
});
