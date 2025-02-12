// File: models/satuan.js
import mongoose from "mongoose";

const SatuanSchema = new mongoose.Schema({
  nama: String,
  deskripsi: String,
});

export default mongoose.models.Satuan || mongoose.model("Satuan", SatuanSchema);
