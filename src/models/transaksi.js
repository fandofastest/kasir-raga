import mongoose from "mongoose";
import Konsumen from "@/models/konsumen";
import Product from "@/models/product";
import User from "@/models/user";
import Supplier from "@/models/supplier";
import Satuan from "@/models/satuan";

const ProductDetailSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  quantity: Number,
  harga: Number,
  // Tambahan field jika diperlukan, misalnya satuans
  satuans: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Satuan",
    },
  ],
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
    dp: {
      type: Number,
      default: 0,
    },
    // Field untuk mencatat histori pembayaran cicilan
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
    // Field untuk durasi pelunasan cicilan
    durasiPelunasan: {
      type: Number,
      default: 0,
    },
    // Unit pelunasan: "hari" atau "bulan"
    unitPelunasan: {
      type: String,
      enum: ["hari", "bulan"],
      default: "hari",
    },
    // Tanggal maksimal pelunasan yang dihitung berdasarkan durasi dan unit yang dipilih
    tanggalMaksimalPelunasan: {
      type: Date,
    },
  },
  {
    timestamps: true, // Otomatis menambahkan createdAt dan updatedAt
  },
);

// Pre-validate hook untuk menghasilkan no_transaksi jika belum ada
transactionSchema.pre("validate", function (next) {
  if (!this.no_transaksi) {
    // Contoh membuat nomor unik berdasarkan 6 digit terakhir dari timestamp
    const uniquePart = Date.now().toString().slice(-6);
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
