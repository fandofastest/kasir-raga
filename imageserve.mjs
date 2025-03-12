import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
// Mengimpor dotenv dan memuat variabel dari file .env
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
// Menggunakan import.meta.url untuk mendapatkan path direktori
const app = express();
app.use(cors());

// Tentukan folder penyimpanan upload
const uploadDir = path.join(dirname(fileURLToPath(import.meta.url)), "uploads");

// Membuat folder jika belum ada
import fs from "fs";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup Multer dengan filter ekstensi file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

// Filter untuk memeriksa ekstensi file
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif/; // Daftar ekstensi yang diizinkan
  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedExtensions.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true); // File diterima
  } else {
    cb(new Error("Only image files (jpeg, jpg, png, gif) are allowed!"), false); // Menolak file dengan ekstensi yang tidak diizinkan
  }
};

// Setup multer dengan storage dan filter
const upload = multer({ storage: storage, fileFilter: fileFilter });

// Menyajikan file di folder uploads
app.use("/uploads", express.static(uploadDir)); // Menyajikan file yang di-upload

// API route untuk upload file
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    const filePath =
      process.env.NEXT_PUBLIC_PHOTOURL + "/uploads/" + req.file.filename;
    res.json({ message: "Upload successful", url: filePath });
  } catch (error) {
    console.log("====================================");
    console.log(error);
    console.log("====================================");
  }
});

// Menangani error jika file tidak sesuai dengan filter
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: "Multer error: " + err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

app.listen(3333, () => {
  console.log("Server running on http://localhost:3333");
});
