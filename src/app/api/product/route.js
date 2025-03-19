import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/product";
import Satuan from "@/models/satuan";
import Kategori from "@/models/kategori";
import Brand from "@/models/brand";
import Supplier from "@/models/supplier";
import { withAuth } from "@/middleware/withAuth";
import mongoose from "mongoose";

export const POST = withAuth(async (req) => {
  try {
    // Koneksikan ke DB Mongo
    await connectToDatabase();
    const data = await req.json();

    // Contoh validasi minimal
    if (!data.nama_produk || !data.harga_modal) {
      return NextResponse.json(
        { error: "nama_produk dan harga_modal wajib diisi." },
        { status: 400 },
      );
    }

    // (Opsional) validasi image
    if (!data.image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // Validasi Kategori & Brand by _id
    const kategoriDoc = data.kategori?._id
      ? await Kategori.findById(data.kategori._id)
      : null;
    const brandDoc = data.brand?._id
      ? await Brand.findById(data.brand._id)
      : null;

    if (!kategoriDoc || !brandDoc) {
      return NextResponse.json(
        { error: "Kategori atau Brand tidak valid." },
        { status: 400 },
      );
    }

    // Jika ada array satuans, validasi & mapping
    let mappedSatuans = [];
    if (Array.isArray(data.satuans)) {
      mappedSatuans = await Promise.all(
        data.satuans.map(async (s) => {
          if (!s?.satuan?._id) {
            throw new Error(
              "Field satuan._id pada salah satu item satuans tidak ditemukan.",
            );
          }
          // Cari di model Satuan
          const foundSatuan = await Satuan.findById(s.satuan._id);
          if (!foundSatuan) {
            throw new Error(
              `Satuan dengan _id=${s.satuan._id} tidak ada di DB`,
            );
          }
          return {
            satuan: foundSatuan._id, // Mengacu ke koleksi Satuan
            harga: s.harga,
            konversi: s.konversi,
          };
        }),
      );
    }

    // Buat dokumen Product baru
    const newProduct = new Product({
      nama_produk: data.nama_produk,
      harga_modal: data.harga_modal,
      supplier: data.supplier || "",
      sku: data.sku || "",
      image: data.image,
      kategori: kategoriDoc._id,
      brand: brandDoc._id,
      satuans: mappedSatuans,
      jumlah: data.jumlah || 0,
    });

    // Simpan ke DB
    await newProduct.save();

    // Kembalikan respons sukses
    return NextResponse.json(
      { message: "Product added successfully", data: newProduct, status: 201 },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    // Tangani error apapun
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
});
export const GET = withAuth(async () => {
  try {
    await connectToDatabase();

    // Ambil produk beserta populate untuk satuans.satuan, kategori, dan brand
    const products = await Product.find()
      .populate("satuans.satuan kategori brand")
      .lean();

    // Ambil semua supplierId dari produk (yang tersimpan sebagai string atau ObjectId)
    const supplierIds = products.map((p) => p.supplier).filter((id) => !!id);

    // Buat array supplierId unik
    const uniqueSupplierIds = [...new Set(supplierIds)];

    // Pisahkan antara id yang valid dan tidak valid
    const validSupplierIds = uniqueSupplierIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );

    // Cari dokumen supplier hanya untuk id yang valid
    const suppliers = await Supplier.find({
      _id: { $in: validSupplierIds },
    }).lean();

    // Buat mapping: id (string) => dokumen supplier
    const supplierMap = {};
    suppliers.forEach((s) => {
      supplierMap[s._id.toString()] = s;
    });

    // Ganti field supplier di setiap produk jika id valid dan dokumen ditemukan
    products.forEach((p) => {
      if (p.supplier && mongoose.Types.ObjectId.isValid(p.supplier)) {
        const supDoc = supplierMap[p.supplier];
        if (supDoc) {
          p.supplier = supDoc;
        }
      }
      // Jika id supplier tidak valid, biarkan sebagai string
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
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

    // Validasi kategori & brand jika ada perubahan
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

    if (data.brand) {
      const brandObj = await Brand.findOne({ nama: data.brand.nama });
      if (!brandObj) {
        return NextResponse.json({ error: "Brand not found" }, { status: 400 });
      }
      data.brand = brandObj._id;
    }

    // Update satuans jika ada perubahan
    if (data.satuans) {
      const satuans = await Promise.all(
        data.satuans.map(async (satuan) => {
          const foundSatuan = await Satuan.findById(satuan.satuan._id);
          if (!foundSatuan) {
            throw new Error(`Satuan ${satuan.satuan.nama} not found`);
          }
          return {
            satuan: foundSatuan._id,
            harga: satuan.harga,
            konversi: satuan.konversi,
          };
        }),
      );
      data.satuans = satuans;
    }

    await Product.findByIdAndUpdate(id, data);
    return NextResponse.json({
      message: "Product updated successfully",
      data,
      status: 200,
    });
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
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});
