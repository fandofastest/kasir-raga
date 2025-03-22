import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Transaksi from "@/models/transaksi";
import Preference from "@/models/Preference";

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

    console.log("====================================");
    console.log(amount, paymentDate);
    console.log("====================================");

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

    // Tambahkan entry pembayaran ke jadwalPembayaran
    transaction.jadwalPembayaran.push({
      dueDate: payDate,
      installment: amount,
      paid: true,
      paymentDate: payDate,
    });

    // Hitung total pembayaran: DP + seluruh installment yang telah dibayar
    const paidInstallments = transaction.jadwalPembayaran.reduce(
      (sum, record) => sum + record.installment,
      0,
    );
    const totalPaid = transaction.dp + paidInstallments;

    // Jika total pembayaran sudah mencapai atau melebihi total_harga,
    // ubah status transaksi menjadi "lunas" dan lakukan pengecekan terhadap preferensi
    if (totalPaid >= transaction.total_harga) {
      transaction.status_transaksi = "lunas";

      // Ambil data preference
      const pref = await Preference.findOne();
      if (pref) {
        // Hitung selisih hari antara tanggal pembelian (createdAt) dan tanggal pembayaran terakhir
        const purchaseDate = new Date(transaction.createdAt);
        const diffTime = payDate - purchaseDate; // selisih dalam milidetik
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        // Jika jarak hari kurang atau sama dengan maxPelunasanHari, ubah metode pembayaran menjadi "tunai"
        if (diffDays <= pref.maxPelunasanHari) {
          transaction.status_transaksi = "lunas_cepat";
        }
      }
    }

    const updatedTransaction = await transaction.save();
    return NextResponse.json(
      {
        message: "Pembayaran cicilan berhasil diproses",
        data: updatedTransaction,
        status: 200,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Gagal memproses pembayaran cicilan:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
