// File: models/brand.js
import mongoose from "mongoose";

const BrandSchema = new mongoose.Schema({
  nama: String,
  deskripsi: String,
});

export default mongoose.models.Brand || mongoose.model("Brand", BrandSchema);
