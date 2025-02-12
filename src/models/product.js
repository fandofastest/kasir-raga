// File: models/product.js
import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  nama_produk: String,
  harga: Number,
  jumlah: Number,
  supplier: String,
  image: String,
  satuan: { type: mongoose.Schema.Types.ObjectId, ref: "Satuan" },
  kategori: { type: mongoose.Schema.Types.ObjectId, ref: "Kategori" },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
  sku: String,
});

export default mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);
