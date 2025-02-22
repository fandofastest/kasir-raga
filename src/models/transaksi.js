import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  kasir: {
    type: "ObjectId",
    ref: "User", // Specify the referenced collection and model
    required: true,
  },
  produk: {
    type: [Object],
  },
  pembeli: {
    type: "ObjectId",
    ref: "Konsumen", // Specify the referenced collection and model
    required: true,
  },
  pengantar: {
    type: "ObjectId",
    ref: "User", // Specify the referenced collection and model
    required: true,
  },
  total_harga: {
    type: Number,
    required: true,
  },
  metode_pembayaran: {
    type: String,
    enum: ["tunai", "EDC", "bank transfer"],
    required: true,
  },
  status_transaksi: {
    type: String,
    enum: ["lunas", "Pay Later", "pending", "canceled"],
    required: true,
  },
  keterangan: {
    type: String,
  },
  created_at: {
    type: Date,
    required: false,
  },
});

export default mongoose.models.Transaksi ||
  mongoose.model("Transaksi", transactionSchema);
