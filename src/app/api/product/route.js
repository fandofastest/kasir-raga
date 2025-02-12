import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/product";
import Satuan from "@/models/satuan";
import Kategori from "@/models/kategori";
import Brand from "@/models/brand";
import { withAuth } from "@/middleware/withAuth";

export const POST = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const data = await req.json();

    if (!data.image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // Validasi satuan, kategori, brand
    const satuan = await Satuan.findById(data.satuan._id);
    const kategori = await Kategori.findById(data.kategori._id);
    const brand = await Brand.findById(data.brand._id);

    // console.log("====================================");
    // console.log(satuan);
    // console.log("====================================");

    if (!satuan || !kategori || !brand) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Simpan produk dengan URL gambar
    const newProduct = new Product({
      nama_produk: data.nama_produk,
      harga: data.harga,
      jumlah: data.jumlah,
      supplier: data.supplier,
      satuan: satuan._id,
      kategori: kategori._id,
      brand: brand._id,
      sku: data.sku,
      image: data.image, // URL gambar yang diunggah
    });

    await newProduct.save();
    return NextResponse.json({ message: "Product added successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
});

export const GET = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const products = await Product.find().populate("satuan kategori brand");
    return NextResponse.json(products);
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

    // Cari ObjectId untuk satuan jika ada perubahan
    console.log("====================================");
    console.log(data.satuan.nama);
    console.log("====================================");
    if (data.satuan) {
      const satuanObj = await Satuan.findOne({ nama: data.satuan.nama });
      if (!satuanObj) {
        return NextResponse.json(
          { error: "Satuan not found" },
          { status: 400 },
        );
      }
      data.satuan = satuanObj._id;
    }

    // Cari ObjectId untuk kategori jika ada perubahan
    if (data.kategori) {
      const kategoriObj = await Kategori.findOne({ nama: data.kategori.nama });
      if (!kategoriObj) {
        return NextResponse.json(
          { error: "Kategori not found" },
          { status: 400 },
        );
      }
      data.kategori = kategoriObj._id;
    }

    // Cari ObjectId untuk brand jika ada perubahan
    if (data.brand) {
      const brandObj = await Brand.findOne({ nama: data.brand.nama });
      if (!brandObj) {
        return NextResponse.json({ error: "Brand not found" }, { status: 400 });
      }
      data.brand = brandObj._id;
    }

    await Product.findByIdAndUpdate(id, data);
    return NextResponse.json({ message: "Product updated successfully" });
  } catch (error) {
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
    console.log("====================================");
    console.log(id);
    console.log("====================================");
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});
