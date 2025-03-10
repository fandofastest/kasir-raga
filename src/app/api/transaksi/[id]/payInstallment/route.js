import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Transaksi from "@/models/transaksi";
// Jika Anda menggunakan middleware otentikasi, pastikan adaptasinya untuk app router,
// misalnya dengan memeriksa token secara manual atau membuat fungsi pembungkus khusus.

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

    // Temukan transaksi berdasarkan ID
    const transaction = await Transaksi.findById(id);
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }
    if (transaction.metode_pembayaran !== "cicilan") {
      return NextResponse.json(
        { error: "Transaksi ini bukan transaksi cicilan" },
        { status: 400 },
      );
    }

    // Validasi: pembayaran minimal harus tidak kurang dari cicilanPerBulan
    const minInstallment = transaction.cicilanPerBulan;
    if (amount < minInstallment) {
      return NextResponse.json(
        { error: `Jumlah pembayaran minimal adalah ${minInstallment}` },
        { status: 400 },
      );
    }

    // Proses pembayaran cicilan:
    // Urutkan jadwalPembayaran berdasarkan dueDate secara ascending
    transaction.jadwalPembayaran.sort(
      (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
    );
    let remainingPayment = amount;
    for (const installment of transaction.jadwalPembayaran) {
      if (!installment.paid) {
        if (remainingPayment >= installment.installment) {
          installment.paid = true;
          installment.paymentDate = payDate;
          remainingPayment -= installment.installment;
        } else {
          // Jika pembayaran tidak cukup untuk menutup installment penuh, tolak
          break;
        }
      }
    }

    // Jika seluruh installment sudah dibayar, ubah status menjadi "lunas"
    const allPaid = transaction.jadwalPembayaran.every(
      (inst) => inst.paid === true,
    );
    if (allPaid) {
      // Walaupun status berubah ke "lunas", metode pembayaran tetap "cicilan"
      transaction.status_transaksi = "lunas";
    }

    const updatedTransaction = await transaction.save();
    return NextResponse.json({
      message: "Pembayaran cicilan berhasil diproses",
      data: updatedTransaction,
      status: 200,
    });
  } catch (error) {
    console.error("Gagal memproses pembayaran cicilan:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
