import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Transaksi from "@/models/transaksi";

// Jika menggunakan otentikasi, pastikan untuk memprosesnya sesuai kebutuhan

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "ID transaksi tidak ditemukan" },
        { status: 400 },
      );
    }

    const { amount, paymentDate } = await request.json();
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Jumlah pembayaran tidak valid" },
        { status: 400 },
      );
    }
    const payDate = paymentDate ? new Date(paymentDate) : new Date();

    // Cari transaksi berdasarkan ID
    const transaction = await Transaksi.findById(id);
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    // Pastikan transaksi adalah hutang (transaksi pembelian dengan metode pembayaran "hutang")
    if (transaction.metode_pembayaran !== "hutang") {
      return NextResponse.json(
        { error: "Transaksi ini bukan transaksi hutang" },
        { status: 400 },
      );
    }

    // Update jumlah yang sudah dibayar
    const prevPaid = transaction.sudah_dibayar || 0;
    const newPaid = prevPaid + amount;
    transaction.sudah_dibayar = newPaid;

    // Jika sudah membayar penuh (atau lebih), update status transaksi menjadi "lunas"
    if (newPaid >= transaction.total_harga) {
      transaction.status_transaksi = "lunas";
    }

    // Simpan perubahan transaksi
    const updatedTransaction = await transaction.save();
    console.log(updatedTransaction);

    return NextResponse.json({
      message: "Pembayaran hutang berhasil diproses",
      data: updatedTransaction,
      status: 200,
    });
  } catch (error) {
    console.error("Error processing hutang payment:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
