import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Transaksi from "@/models/transaksi";

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

    const transaction = await Transaksi.findById(id);
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    if (transaction.metode_pembayaran !== "hutang") {
      return NextResponse.json(
        { error: "Transaksi ini bukan transaksi hutang" },
        { status: 400 },
      );
    }

    // Tambahkan pembayaran baru ke jadwalPembayaran
    transaction.jadwalPembayaran.push({
      dueDate: payDate,
      installment: amount,
      paid: true,
      paymentDate: payDate,
    });

    // Hitung total yang sudah dibayar
    const paidInstallments = transaction.jadwalPembayaran.reduce(
      (sum, record) => sum + record.installment,
      0,
    );

    const totalPaid = transaction.dp + paidInstallments;

    // Ubah status transaksi jika pembayaran sudah lunas
    if (totalPaid >= transaction.total_harga) {
      transaction.status_transaksi = "lunas";
      transaction.metode_pembayaran = "tunai";
    }

    const updatedTransaction = await transaction.save();

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
