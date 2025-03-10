import mongoose from "mongoose";
import HargaJualSchema from "./hargajual";

const ProductSchema = new mongoose.Schema(
  {
    nama_produk: String,
    harga_modal: Number,
    supplier: String,
    sku: String,
    image: String,
    jumlah: Number || { type: Number, default: 0 },

    // Array subdokumen "HargaJualSchema"
    satuans: [HargaJualSchema],

    kategori: { type: mongoose.Schema.Types.ObjectId, ref: "Kategori" },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
  },
  {
    timestamps: true, // menambahkan createdAt, updatedAt
  },
);

// Sekarang kita jadikan Product sebagai model
export default mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);
