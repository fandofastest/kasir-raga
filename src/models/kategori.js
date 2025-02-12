// File: models/kategori.js
import mongoose from "mongoose";

const KategoriSchema = new mongoose.Schema({
  nama: String,
  deskripsi: String,
});

export default mongoose.models.Kategori ||
  mongoose.model("Kategori", KategoriSchema);
