import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, unique: true },
    alamat: { type: String, required: true },
    kontak: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.models.Supplier ||
  mongoose.model("Supplier", SupplierSchema);
