import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import KategoriKonsumen from "@/models/kategorikonsumen";
import { withAuth } from "@/middleware/withAuth";

// CREATE (POST)
export const POST = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const data = await req.json();
    const kategori = new KategoriKonsumen(data);
    await kategori.save();
    return NextResponse.json(kategori, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Gagal membuat kategori" },
      { status: 500 }
    );
  }
});

// READ (GET)
export const GET = withAuth(async () => {
  try {
    await connectToDatabase();
    const kategoriList = await KategoriKonsumen.find().sort({ nama: "asc" });
    return NextResponse.json(kategoriList);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data kategori" },
      { status: 500 }
    );
  }
});

// UPDATE (PUT)
export const PUT = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const data = await req.json();
    const updated = await KategoriKonsumen.findByIdAndUpdate(id, data, { new: true });
    if (!updated) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memperbarui kategori" },
      { status: 500 }
    );
  }
});

// DELETE (DELETE)
export const DELETE = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const { id } = await req.json();
    const deleted = await KategoriKonsumen.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ message: "Kategori berhasil dihapus" });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menghapus kategori" },
      { status: 500 }
    );
  }
});