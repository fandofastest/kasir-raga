// File: app/api/brand/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Brand from "@/models/brand";
import { withAuth } from "@/middleware/withAuth";

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

export const PUT = withAuth(async (req) => {
  await connectToDatabase();
  const { id, ...updateData } = await req.json();
  await Brand.findByIdAndUpdate(id, updateData);
  return NextResponse.json({ message: "Brand updated successfully" });
});
