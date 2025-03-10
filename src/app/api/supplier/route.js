import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Supplier from "@/models/supplier"; // Menggunakan model Supplier yang benar
import { withAuth } from "@/middleware/withAuth";

export const POST = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const data = await req.json();

    const existingSupplier = await Supplier.findOne({ nama: data.nama });
    if (existingSupplier) {
      return NextResponse.json(
        { error: "Supplier name must be unique" },
        { status: 400 },
      );
    }

    const newSupplier = new Supplier(data);
    await newSupplier.save();
    return NextResponse.json({
      data: newSupplier,
      message: "Supplier added successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});

export const GET = withAuth(async () => {
  try {
    await connectToDatabase();
    const supplierList = await Supplier.find();
    return NextResponse.json(supplierList);
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const data = await req.json();

    const existingSupplier = await Supplier.findOne({
      nama: data.nama,
      _id: { $ne: id },
    });
    if (existingSupplier) {
      return NextResponse.json(
        { error: "Supplier name must be unique" },
        { status: 400 },
      );
    }

    await Supplier.findByIdAndUpdate(id, data);
    return NextResponse.json({ message: "Supplier updated successfully" });
  } catch (error) {
    console.error(error);
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
    await Supplier.findByIdAndDelete(id);
    return NextResponse.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});
