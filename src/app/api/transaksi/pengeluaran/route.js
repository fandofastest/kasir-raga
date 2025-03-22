import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/withAuth";
import User from "@/models/user";
import Transaksi from "@/models/transaksi";
import Supplier from "@/models/supplier";
import Product from "@/models/product"; // Pastikan path dan nama model sesuai
import { connectToDatabase } from "@/lib/mongodb";

export const POST = withAuth(async (req) => {
  try {
    await connectToDatabase();
    const data = await req.json();
    const userid = req.user?.id;

    // Validasi: pastikan field total_harga (nominal) dan keterangan ada
    if (!data.total_harga || data.total_harga <= 0) {
      return NextResponse.json(
        { error: "Nominal harus diisi dan lebih dari 0" },
        { status: 400 },
      );
    }
    if (!data.keterangan || data.keterangan.trim() === "") {
      return NextResponse.json(
        { error: "Keterangan harus diisi" },
        { status: 400 },
      );
    }

    // Validasi: pastikan kasir ada
    const kasir = await User.findById(userid);
    if (!kasir) {
      return NextResponse.json(
        { error: "Kasir tidak ditemukan" },
        { status: 400 },
      );
    }
    data.kasir = userid;

    // Set field tambahan secara default untuk transaksi pengeluaran
    data.metode_pembayaran = "tunai"; // default, bisa disesuaikan jika perlu
    data.status_transaksi = "lunas"; // anggap pengeluaran langsung lunas
    data.tipe_transaksi = "pengeluaran";
    // Pastikan field produk kosong
    data.produk = [];

    // Buat transaksi baru
    const newTransaction = new Transaksi(data);
    await newTransaction.save();

    const populatedTransaction = await Transaksi.findById(newTransaction._id)
      .populate("kasir")
      .exec();

    return NextResponse.json({
      message: "Transaksi pengeluaran berhasil dibuat",
      data: populatedTransaction,
      status: 201,
    });
  } catch (error) {
    console.error("Gagal membuat transaksi pengeluaran:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error.message,
        status: 500,
      },
      { status: 500 },
    );
  }
});
