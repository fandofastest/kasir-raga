// File: models/brand.js
import mongoose from "mongoose";

const BrandSchema = new mongoose.Schema(
  {
    nama: String,
    deskripsi: String,
  },
  {
    timestamps: true, // menambahkan createdAt, updatedAt
  },
);

export default mongoose.models.Brand || mongoose.model("Brand", BrandSchema);
