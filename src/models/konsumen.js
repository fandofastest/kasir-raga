import mongoose from "mongoose";

const KonsumenSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true,
  },
  nohp: {
    type: String,
    required: [true, "No HP harus diisi"],
    unique: true,
    index: "unique",
  },
  alamat: {
    type: String,
    required: true,
  },
});

// Export model
export default mongoose.models.Konsumen ||
  mongoose.model("Konsumen", KonsumenSchema);
