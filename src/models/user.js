// File: models/user.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: { type: String },
  role: {
    type: String,
    enum: ["admin", "kasir", "tukangAntar"],
    default: "kasir",
  },
  name: { type: String, required: true },
  nohp: { type: String, required: true },
  alamat: String,
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
