import { NextResponse } from "next/server";
import Transaksi from "@/models/transaksi";
import Product from "@/models/product";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
    try {
        await connectToDatabase();

        // Ambil semua transaksi
        const transaksi = await Transaksi.find({});
        let updatedCount = 0;
        let errorCount = 0;

        // Loop melalui setiap transaksi
        for (const trx of transaksi) {
            try {
                // Loop melalui setiap produk dalam transaksi
                for (const produk of trx.produk) {
                    if (!produk.harga_modal && produk.productId) {
                        // Cari produk untuk mendapatkan harga modal saat ini
                        const product = await Product.findById(produk.productId);
                        if (product) {
                            // Update harga modal dengan harga modal produk saat ini
                            produk.harga_modal = product.harga_modal || 0;

                        }
                    }
                }
                // Simpan perubahan
                await trx.save();
                updatedCount++;
            } catch (error) {
                console.error(`Error updating transaction ${trx._id}:`, error);
                errorCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Berhasil mengupdate ${updatedCount} transaksi. ${errorCount} transaksi gagal diupdate.`,
        });
    } catch (error) {
        console.error("Error in update-harga-modal:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Terjadi kesalahan saat mengupdate transaksi",
            },
            { status: 500 },
        );
    }
} 