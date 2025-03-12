"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  fetchTransaction,
  fetchSupplier,
  fetchPelanggan,
} from "@/lib/dataService";
import Transaksi from "@/models/modeltsx/Transaksi";

export default function LaporanPenjualanPage() {
  // State untuk data transaksi, loading, dan error
  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // State filter
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [supplier, setSupplier] = useState<string>("");
  const [pembeli, setPembeli] = useState<string>("");
  const [metodePembayaran, setMetodePembayaran] = useState<string>("");

  // Options untuk dropdown supplier dan pembeli
  const [supplierOptions, setSupplierOptions] = useState<any[]>([]);
  const [pembeliOptions, setPembeliOptions] = useState<any[]>([]);

  // State untuk menentukan apakah tampilan mobile atau desktop
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // State untuk melacak transaksi yang terbuka (accordion, khusus mobile)
  const [openTransactions, setOpenTransactions] = useState<Set<string>>(
    new Set(),
  );

  // Cek ukuran layar (threshold 768px)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load opsi supplier dan pembeli dari API
  const loadOptions = async () => {
    try {
      const supplierRes = await fetchSupplier();
      setSupplierOptions(supplierRes.data);
      const pembeliRes = await fetchPelanggan();
      setPembeliOptions(pembeliRes.data);
    } catch (err) {
      console.error("Gagal memuat opsi:", err);
    }
  };

  // Fungsi untuk memuat data transaksi berdasarkan filter yang diterapkan,
  // hanya mengambil transaksi dengan tipe "penjualan"
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params: { [key: string]: string } = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (supplier) params.supplier = supplier;
      if (pembeli) params.pembeli = pembeli;
      if (metodePembayaran) params.metode_pembayaran = metodePembayaran;
      params.tipe_transaksi = "penjualan";

      const result = await fetchTransaction(params);
      setTransactions(result.data.transactions);
    } catch (error: any) {
      setError(error.message || "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  // Load opsi dan data transaksi saat pertama kali render
  useEffect(() => {
    loadOptions();
    loadTransactions();
  }, []);

  // Handler form filter
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadTransactions();
  };

  // Toggle untuk membuka/tutup detail transaksi (hanya untuk mobile)
  const toggleTransaction = (id: string) => {
    setOpenTransactions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Hitung total penjualan dan total laba (perhitungan dummy untuk laba)
  const totalPenjualan = transactions.reduce(
    (sum, trx) => sum + trx.total_harga,
    0,
  );
  const totalLaba = transactions.reduce((sum, _trx) => sum + 2000, 0);

  // Fungsi cetak laporan
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 dark:bg-gray-900 dark:text-gray-100 print:bg-white print:text-black-2">
      {/* Form Filter (tidak tampil saat print) */}
      <div className="print:hidden">
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {/* Filter Tanggal Mulai */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          {/* Filter Tanggal Akhir */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          {/* Filter Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Supplier
            </label>
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Semua</option>
              {supplierOptions.map((opt) => (
                <option key={opt._id} value={opt.nama}>
                  {opt.nama}
                </option>
              ))}
            </select>
          </div>
          {/* Filter Konsumen (Pembeli) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Konsumen
            </label>
            <select
              value={pembeli}
              onChange={(e) => setPembeli(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Semua</option>
              {pembeliOptions.map((opt) => (
                <option key={opt._id} value={opt.nama}>
                  {opt.nama}
                </option>
              ))}
            </select>
          </div>
          {/* Filter Metode Pembayaran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Metode Pembayaran
            </label>
            <select
              value={metodePembayaran}
              onChange={(e) => setMetodePembayaran(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Semua</option>
              <option value="edc">EDC</option>
              <option value="tunai">Tunai</option>
              <option value="bank_transfer">Transfer</option>
              <option value="cicilan">Cicilan</option>
            </select>
          </div>
          {/* Tombol Terapkan Filter */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Terapkan Filter
            </button>
          </div>
        </form>
      </div>

      {/* HEADER untuk cetak */}
      <div className="mb-4 flex flex-col space-y-1 border-b pb-2 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 print:bg-white print:text-black-2">
        <div>
          <h2 className="text-lg font-bold">Nama Minimarket</h2>
          <p>081353935206</p>
          <p>Jln. Alamat Surabaya</p>
        </div>
      </div>

      {/* Judul Laporan */}
      <h1 className="mb-4 text-center text-xl font-bold print:bg-white print:text-black-2">
        Laporan Penjualan
      </h1>

      {/*
        Tampilan Desktop & Saat Print (tabel)
        Jika perangkat mobile, maka div ini disembunyikan di layar, namun tetap tampil saat print.
      */}
      <div className={`${isMobile ? "hidden" : "block"} print:block`}>
        <div className="overflow-x-auto print:bg-white print:text-black-2">
          <table className="w-full border text-xs dark:border-gray-700">
            <thead className="bg-gray-100 text-left dark:bg-gray-800">
              <tr>
                <th className="border px-2 py-1">No</th>
                <th className="border px-2 py-1">No. Transaksi</th>
                <th className="border px-2 py-1">Tanggal</th>
                <th className="border px-2 py-1">Tipe</th>
                <th className="border px-2 py-1">Pelanggan</th>
                <th className="border px-2 py-1">Total</th>
                <th className="border px-2 py-1">Laba</th>
                <th className="border px-2 py-1">Operator</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((trx, index) => {
                const labaBaris = 2000;
                return (
                  <tr
                    key={trx._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="border px-2 py-1 text-center">
                      {index + 1}
                    </td>
                    <td className="border px-2 py-1">{trx.no_transaksi}</td>
                    <td className="border px-2 py-1">
                      {new Date(trx.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="border px-2 py-1">{trx.tipe_transaksi}</td>
                    <td className="border px-2 py-1">
                      {trx.pembeli?.nama || "-"}
                    </td>
                    <td className="border px-2 py-1 text-right">
                      {trx.total_harga.toLocaleString("id-ID")}
                    </td>
                    <td className="border px-2 py-1 text-right">
                      {labaBaris.toLocaleString("id-ID")}
                    </td>
                    <td className="border px-2 py-1">
                      {typeof trx.kasir === "object" && trx.kasir
                        ? trx.kasir.name
                        : trx.kasir}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/*
        Tampilan Mobile (accordion)
        Hanya ditampilkan saat perangkat mobile dan tidak saat print.
        Header tiap item hanya menampilkan: No. Transaksi, Tanggal, dan Total.
      */}
      <div
        className={`${isMobile ? "block" : "hidden"} space-y-4 print:hidden`}
      >
        {transactions.map((trx) => {
          const isOpen = openTransactions.has(trx._id);
          const labaBaris = 2000;
          return (
            <div
              key={trx._id}
              className="rounded-md border p-4 shadow-sm dark:border-gray-700"
            >
              <div
                className="flex cursor-pointer items-center justify-between"
                onClick={() => toggleTransaction(trx._id)}
              >
                <div>
                  <p className="font-semibold">{trx.no_transaksi}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(trx.createdAt).toLocaleDateString("id-ID")}
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    Rp {trx.total_harga.toLocaleString("id-ID")}
                  </p>
                </div>
                <button
                  className="text-sm text-blue-500 focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTransaction(trx._id);
                  }}
                >
                  {isOpen ? "Tutup Detail" : "Lihat Detail"}
                </button>
              </div>
              {isOpen && (
                <div className="mt-3 border-t pt-3 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    <strong>Tipe:</strong> {trx.tipe_transaksi}
                  </p>
                  <p>
                    <strong>Pelanggan:</strong> {trx.pembeli?.nama || "-"}
                  </p>
                  <p>
                    <strong>Laba:</strong> {labaBaris.toLocaleString("id-ID")}
                  </p>
                  <p>
                    <strong>Operator:</strong>{" "}
                    {typeof trx.kasir === "object" && trx.kasir
                      ? trx.kasir.name
                      : trx.kasir}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer: Total dan Tombol Print (tidak tampil saat print) */}
      <div className="mt-4 flex flex-col items-end space-y-2 print:hidden">
        <div className="text-sm">
          <p>Total Penjualan: Rp {totalPenjualan.toLocaleString("id-ID")}</p>
          <p>Total Laba: Rp {totalLaba.toLocaleString("id-ID")}</p>
        </div>
        <button
          onClick={handlePrint}
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          Print Laporan
        </button>
      </div>
    </div>
  );
}
