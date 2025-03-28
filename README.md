# KasirApp

KasirApp adalah aplikasi kasir berbasis web yang dibangun menggunakan **Next.js (App Router) + Firebase + MongoDB**. Aplikasi ini dirancang untuk manajemen transaksi, pelanggan, dan staf dalam sistem kasir.

## 🚀 Fitur Utama

- **Autentikasi Staff** (Kasir, Admin, Tukang Antar) menggunakan NextAuth dengan API token JWT.
- **Manajemen Produk, Pelanggan, dan Transaksi**.
- **Pencarian dan Filter Data** untuk kemudahan akses informasi.
- **Dark Mode** untuk pengalaman pengguna yang lebih nyaman.
- **Notifikasi & Toast Messages** untuk feedback interaksi pengguna.

---

## 🛠️ Teknologi yang Digunakan

- **Next.js** (App Router)
- **React & Context API** untuk state management
- **MongoDB** sebagai database utama
- **Firebase** untuk penyimpanan gambar (jika ada)
- **Tailwind CSS** untuk styling
- **NextAuth** untuk autentikasi berbasis JWT

---

## 📦 Instalasi & Menjalankan Aplikasi

### 1. Clone Repository

```sh
git clone https://github.com/fandofastest/kasirapp.git
cd kasirapp
```

### 2. Install Dependencies

```sh
npm install
# atau
yarn install
```

### 3. Konfigurasi Environment Variables

Buat file `.env.local` di root project dan tambahkan:

```env
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname
NEXTAUTH_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret
FIREBASE_API_KEY=your-firebase-api-key
```

_(Sesuaikan dengan konfigurasi aplikasi kamu)_

### 4. Jalankan Aplikasi

```sh
npm run dev
# atau
yarn dev
```

Buka `http://localhost:3000` di browser untuk mengakses aplikasi.

---

## 📝 API Endpoint

Aplikasi ini memiliki beberapa API endpoint untuk CRUD data. Contoh:

- `POST /api/auth/login` → Login Staff
- `GET /api/staff` → Mendapatkan daftar staf
- `POST /api/staff` → Menambah staf baru
- `PUT /api/staff?id=ID_STAFF` → Mengedit staf
- `DELETE /api/staff?id=ID_STAFF` → Menghapus staf

_(Dokumentasi lengkap API tersedia di `/docs` jika ada)_

---

## 📷 Screenshots

Tangkapan layar aplikasi:
_(Tambahkan screenshot di sini jika ada)_

---

## 🤝 Kontribusi

Jika ingin berkontribusi:

1. Fork repository ini
2. Buat branch baru (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -m "Menambahkan fitur baru"`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

---

## 🔒 Lisensi

Aplikasi ini menggunakan lisensi MIT. Silakan gunakan dan modifikasi sesuai kebutuhan.

---

**Dibuat dengan ❤️ oleh [Nama Kamu](https://github.com/fandofastest)**
