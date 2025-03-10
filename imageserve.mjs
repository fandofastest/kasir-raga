import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Menggunakan import.meta.url untuk mendapatkan path direktori

const app = express();
const upload = multer({ dest: "uploads/" }); // Simpan file di luar public
const __filename = fileURLToPath(import.meta.url); // Mendapatkan nama file
const __dirname = dirname(__filename); // Mendapatkan direktori dari nama file

console.log(__dirname); // Menampilkan path direktori

app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Menyajikan file di folder uploads

// API route untuk upload file
app.post("/upload", upload.single("file"), (req, res) => {
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ message: "Upload successful", url: filePath });
});

// Handle semua route lainnya dengan Next.js
// app.all("*", (req, res) => {
//   return handle(req, res);
// });

app.listen(3333, () => {
  console.log("Server running on http://localhost:3333");
});
