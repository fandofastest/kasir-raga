import mongoose from "mongoose";

const KategoriKonsumenSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: true,
      unique: true,
    },
    deskripsi: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

export default mongoose.models.KategoriKonsumen ||
  mongoose.model("KategoriKonsumen", KategoriKonsumenSchema);