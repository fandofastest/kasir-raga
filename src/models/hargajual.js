import mongoose from "mongoose";

// Opsi 1: Jika 'satuan' adalah ref ke model Satuan
const HargaJualSchema = new mongoose.Schema(
  {
    // satuan mengacu ke _id di model "Satuan"
    satuan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Satuan",
    },
    harga: Number, // Harga jual per satuan
    konversi: Number, // contoh: 1 box = 12 pcs
  },
  {
    timestamps: true, // menambahkan createdAt, updatedAt
  },
);

// ---- Perhatikan: Kita TIDAK membuat model di sini ----
// export default mongoose.models.HargaJual || mongoose.model("HargaJual", HargaJualSchema);
export default HargaJualSchema;
