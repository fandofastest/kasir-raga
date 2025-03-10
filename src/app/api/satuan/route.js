// File: app/api/satuan/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Satuan from "@/models/satuan";
import { withAuth } from "@/middleware/withAuth";

export const POST = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const data = await req.json();

    const existingSatuan = await Satuan.findOne({ nama: data.nama });
    if (existingSatuan) {
      return NextResponse.json(
        { error: "Satuan name must be unique" },
        { status: 400 },
      );
    }

    const newSatuan = new Satuan(data);
    await newSatuan.save();
    return NextResponse.json({
      data: newSatuan,
      message: "Satuan added successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});

export const GET = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const satuanList = await Satuan.find();
    return NextResponse.json(satuanList);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});

export const PUT = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const { id, ...data } = await req.json();

    const existingSatuan = await Satuan.findOne({
      nama: data.nama,
      _id: { $ne: id },
    });
    if (existingSatuan) {
      return NextResponse.json(
        { error: "Satuan name must be unique" },
        { status: 400 },
      );
    }

    await Satuan.findByIdAndUpdate(id, data);
    return NextResponse.json({ message: "Satuan updated successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});

export const DELETE = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const { id } = await req.json();
    await Satuan.findByIdAndDelete(id);
    return NextResponse.json({ message: "Satuan deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});
