import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/withAuth";
import User from "@/models/user";
import Transaksi from "@/models/transaksi";
import { connectToDatabase } from "@/lib/mongodb";

export const POST = withAuth(async (req, res) => {
  try {
    await connectToDatabase();

    // Contoh create transaksi
    const data = await req.json();

    // Dapatkan kasir berdasarkan ID
    const kasir = await User.findById(data.kasir);

    if (!kasir) {
      return NextResponse.json(
        { error: "Kasir tidak ditemukan" },
        { status: 400 },
      );
    }

    // Setelah itu, lakukan create transaksi seperti contoh di atas
    const newTransaction = new Transaksi(data);
    await newTransaction.save();

    return NextResponse.json({
      message: "Transaksi berhasil dibuat",
      data: newTransaction,
    });
  } catch (error) {
    console.error("Gagal membuat transaksi:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});

export const GET = withAuth(async (req, res) => {
  try {
    await connectToDatabase();

    // Contoh read transaksi
    const transactions = await Transaksi.find();

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Gagal mengambil transaksi:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});

export const PUT = withAuth(async (req, res) => {
  try {
    await connectToDatabase();

    // Dapatkan transaksi berdasarkan ID
    const transaction = await Transaksi.findById(req.params.id);

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    // Update data transaksi
    const updateData = req.json();
    const updatedTransaction = await transaction.updateOne(
      {
        transaksi_id: transaction.id,
      },
      updateData,
    );

    return NextResponse.json({
      message: "Transaksi berhasil diperbarui",
      data: updatedTransaction,
    });
  } catch (error) {
    console.error("Gagal mengupdate transaksi:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});

export const DELETE = withAuth(async (req, res) => {
  try {
    await connectToDatabase();

    // Dapatkan transaksi berdasarkan ID
    const transaction = await Transaksi.findById(req.params.id);

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    // Hapus transaksi
    const deletedTransaction = await transaction.deleteOne({
      transaksi_id: transaction.id,
    });

    return NextResponse.json({
      message: "Transaksi berhasil dihapus",
      data: deletedTransaction,
    });
  } catch (error) {
    console.error("Gagal menghapus transaksi:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
});
