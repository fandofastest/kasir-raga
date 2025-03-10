import mongoose from "mongoose";

const SatuanSchema = new mongoose.Schema(
  {
    nama: String,
    deskripsi: String,
  },
  {
    timestamps: true, // menambahkan createdAt, updatedAt
  },
);

// Ini model Satuan, kalau Anda memang pakai di endpoint /api/satuan
export default mongoose.models.Satuan || mongoose.model("Satuan", SatuanSchema);
