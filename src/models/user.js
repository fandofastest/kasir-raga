// File: models/user.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String },
    password: { type: String },
    role: {
      type: String,
      enum: ["admin", "kasir", "staffAntar", "staffBongkar"],
      default: "kasir",
    },
    name: { type: String, required: true },
    nohp: { type: String, required: true },
    alamat: String,
    permissions: {
      type: [String],
      default: [], // Contoh: ['viewReports', 'manageUsers', ...]
    },
  },
  {
    timestamps: true, // menambahkan createdAt, updatedAt
  },
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
