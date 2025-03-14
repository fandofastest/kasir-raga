import { NextResponse } from "next/server";
import { withAuth } from "@/middleware/withAuth";
import Transaksi from "@/models/transaksi";
import { connectToDatabase } from "@/lib/mongodb";

// GET /transaksi/[id]/draft
// Mengambil transaksi berstatus "tunda" dengan ID = params.id
export const GET = withAuth(async (req, { params }) => {
  try {
    console.log(params.id);

    await connectToDatabase();

    // Ambil :id dari URL
    const { id } = params;

    // Cari transaksi yang _id = id dan status_transaksi = "tunda"
    const transaction = await Transaksi.findOne({
      _id: id,
      status_transaksi: "tunda",
    })
      .populate("kasir supplier pembeli pengantar staff_bongkar")
      .populate("produk.productId")
      .populate("produk.satuans", "nama");

    // Jika tidak ditemukan, return 404
    if (!transaction) {
      return NextResponse.json(
        { error: "Draft transaction not found" },
        { status: 404 },
      );
    }

    // Kembalikan data
    return NextResponse.json({ data: transaction }, { status: 200 });
  } catch (error) {
    console.error("Gagal mengambil transaksi draft:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
});
