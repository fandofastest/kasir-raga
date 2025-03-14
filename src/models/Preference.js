// models/Preference.js
const mongoose = require("mongoose");

const PreferenceSchema = new mongoose.Schema({
  darkMode: { type: Boolean, required: true },
  language: { type: String, required: true },
  dateFormat: { type: String, required: true },
  companyName: { type: String, required: true },
  companyLogo: { type: String },
  companyAddress: { type: String },
  companyPhone: { type: String },
  maxPelunasanHari: { type: Number, required: true, default: 30 },
});

// Gunakan model global jika sudah ada (agar tidak mendefinisikan ulang saat hot-reloading)
module.exports =
  mongoose.models.Preference || mongoose.model("Preference", PreferenceSchema);
