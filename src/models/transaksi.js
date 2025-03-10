import mongoose from "mongoose";
import Konsumen from "@/models/konsumen";
import Product from "@/models/product";

const ProductDetailSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  quantity: Number,
  harga: Number,
  // Anda dapat menambahkan field lain, misalnya satuan, dsb.
});

const transactionSchema = new mongoose.Schema(
  {
    no_transaksi: {
      type: String,
      required: true,
      unique: true,
    },
    kasir: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    produk: {
      type: [ProductDetailSchema],
      default: [],
    },
    pembeli: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Konsumen",
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    pengantar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    staff_bongkar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    total_harga: {
      type: Number,
      required: true,
    },
    metode_pembayaran: {
      type: String,
      enum: ["tunai", "edc", "bank_transfer", "cicilan", "hutang"],
      required: true,
    },
    status_transaksi: {
      type: String,
      enum: ["lunas", "belum_lunas", "tunda", "batal", "cicilan"],
      required: true,
    },
    tipe_transaksi: {
      type: String,
      enum: ["pembelian", "penjualan", "pengeluaran", "pemasukan"],
      required: true,
    },
    diskon: {
      type: Number,
      default: 0,
    },
    keterangan: {
      type: String,
      default: "",
    },
    // Field tambahan untuk transaksi cicilan
    dp: {
      type: Number,
      default: 0,
    },
    tenor: {
      type: Number,
      default: 0,
    },
    cicilanPerBulan: {
      type: Number,
      default: 0,
    },
    jadwalPembayaran: [
      {
        dueDate: {
          type: Date,
          required: true,
        },
        installment: {
          type: Number,
          required: true,
        },
        paid: {
          type: Boolean,
          default: false,
        },
        paymentDate: {
          type: Date,
          default: null,
        },
      },
    ],
    // Field tambahan untuk transaksi hutang (pembelian yang belum lunas)
    sudah_dibayar: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Otomatis menambahkan createdAt dan updatedAt
  },
);

// Pre-validate hook untuk menghasilkan no_transaksi sebelum validasi
transactionSchema.pre("validate", function (next) {
  if (!this.no_transaksi) {
    // Buat bagian unik, misalnya 6 digit terakhir dari timestamp
    const uniquePart = Date.now().toString().slice(-6);
    // Tentukan prefix berdasarkan tipe transaksi, misalnya:
    let prefix = "INV-"; // default prefix
    if (this.tipe_transaksi === "penjualan") {
      prefix = "PJL-";
    } else if (this.tipe_transaksi === "pembelian") {
      prefix = "BELI-";
    }
    this.no_transaksi = `${prefix}${uniquePart}`;
  }
  next();
});

export default mongoose.models.Transaksi ||
  mongoose.model("Transaksi", transactionSchema);
