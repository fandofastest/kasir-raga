"use client";

import { useState, useEffect, FormEvent } from "react";
import { toast } from "react-hot-toast";
import {
  fetchTransaction,
  fetchSupplier,
  fetchStaff,
  fetchPelanggan,
  updateDataTransaction,
} from "@/lib/dataService";
import { Staff } from "@/models/modeltsx/staffTypes";
import Transaksi from "@/models/modeltsx/Transaksi";
import TransactionDetailDialog from "./detailtransaksi";

interface TransactionResponse {
  transactions: Transaksi[];
  totalTransactions: number;
  sumTotal: number;
  status: number;
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Filter state
  const [searchTerm, setSearchTerm] = useState<string>(""); // no_transaksi
  const [metodePembayaran, setMetodePembayaran] = useState<string>("");
  const [statusTransaksi, setStatusTransaksi] = useState<string>("");
  const [tipeTransaksi, setTipeTransaksi] = useState<string>("");

  // Filtering berdasarkan nama (select)
  const [supplier, setSupplier] = useState<string>("");
  const [pembeli, setPembeli] = useState<string>("");
  const [pengantar, setPengantar] = useState<string>("");
  const [staffBongkar, setStaffBongkar] = useState<string>("");
  const [kasir, setKasir] = useState<string>("");

  const [minTotal, setMinTotal] = useState<string>("");
  const [maxTotal, setMaxTotal] = useState<string>("");

  // Tambahan filter tanggal
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<string>("asc");

  // Options untuk select dropdown
  const [supplierOptions, setSupplierOptions] = useState<any[]>([]);
  const [staffOptions, setStaffOptions] = useState<Staff[]>([]);
  const [pembeliOptions, setPembeliOptions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaksi | null>(null);

  // State untuk mengelola baris yang di-expand pada tampilan mobile
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // Fungsi membuka dialog detail transaksi (digunakan pada kedua tampilan)
  const openDetailDialog = (trx: Transaksi) => {
    setSelectedTransaction(trx);
  };

  const handleUpdateTransaction = (updatedTransaction: Transaksi) => {
    console.log("Updated Transaction:", updatedTransaction);
    updateDataTransaction(updatedTransaction._id, updatedTransaction);
    loadData();
  };

  const loadOptions = async () => {
    try {
      const supplierRes = await fetchSupplier();
      setSupplierOptions(supplierRes.data);
      const staffRes = await fetchStaff();
      const pembeliRes = await fetchPelanggan();
      setStaffOptions(staffRes.data);
      setPembeliOptions(pembeliRes.data);
    } catch (err) {
      console.error("Gagal memuat opsi:", err);
    }
  };

  // Load opsi supplier dan staff saat pertama kali render
  useEffect(() => {
    loadOptions();
  }, []);

  // Buat opsi berdasarkan role untuk select staff
  const kasirOptions = staffOptions.filter((staff) => staff.role === "kasir");
  const pengantarOptions = staffOptions.filter(
    (staff) => staff.role === "staffAntar",
  );
  const staffBongkarOptions = staffOptions.filter(
    (staff) => staff.role === "staffBongkar",
  );

  // Fungsi untuk memuat data transaksi
  const loadData = async (
    overrideSortColumn?: string,
    overrideSortDirection?: string,
  ) => {
    setLoading(true);
    try {
      const params: { [key: string]: string } = {};
      if (searchTerm) params.search = searchTerm;
      if (metodePembayaran) params.metode_pembayaran = metodePembayaran;
      if (statusTransaksi) params.status_transaksi = statusTransaksi;
      if (tipeTransaksi) params.tipe_transaksi = tipeTransaksi;
      if (supplier) params.supplier = supplier;
      if (pembeli) params.pembeli = pembeli;
      if (pengantar) params.pengantar = pengantar;
      if (staffBongkar) params.staff_bongkar = staffBongkar;
      if (kasir) params.kasir = kasir;
      if (minTotal) params.minTotal = minTotal;
      if (maxTotal) params.maxTotal = maxTotal;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const sortCol = overrideSortColumn || sortColumn;
      const sortDir = overrideSortDirection || sortDirection;
      if (sortCol) {
        params.sortBy = sortCol;
        params.sortOrder = sortDir;
      }

      const data = await fetchTransaction(params);
      console.log(data);
      setTransactions(data.data.transactions);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat data");
      toast.error(err.message || "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Sorting saat header diklik
  const handleSort = (column: string) => {
    let newSortDirection = "asc";
    if (sortColumn === column) {
      newSortDirection = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortColumn(column);
    setSortDirection(newSortDirection);
    loadData(column, newSortDirection);
  };

  const renderSortIndicator = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? " ▲" : " ▼";
    }
    return "";
  };

  // Menghitung total keseluruhan harga dari semua transaksi
  const totalHarga = transactions.reduce(
    (sum, trx) => sum + trx.total_harga,
    0,
  );

  // Summary Pemasukan, Pengeluaran, dan Laba Rugi
  const totalPemasukan = transactions
    .filter(
      (trx) =>
        trx.tipe_transaksi === "pemasukan" ||
        trx.tipe_transaksi === "penjualan",
    )
    .reduce((sum, trx) => sum + trx.total_harga, 0);

  const totalPengeluaran = transactions
    .filter(
      (trx) =>
        trx.tipe_transaksi === "pengeluaran" ||
        trx.tipe_transaksi === "pembelian",
    )
    .reduce((sum, trx) => sum + trx.total_harga, 0);

  const labaRugi = totalPemasukan - totalPengeluaran;

  // Fungsi toggle untuk row di tampilan mobile
  const toggleRow = (id: string) => {
    if (expandedRows.includes(id)) {
      setExpandedRows(expandedRows.filter((rowId) => rowId !== id));
    } else {
      setExpandedRows([...expandedRows, id]);
    }
  };

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-100">
        Riwayat Transaksi
      </h1>

      {/* Form Filter */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {/* ... (Form filter tetap sama seperti kode asli Anda) */}
        {/* Contoh: Cari Transaksi, Metode Pembayaran, dll. */}
      </form>

      {/* Ringkasan Data Transaksi */}
      <div className="mb-4 rounded-md bg-gray-100 p-4 dark:bg-gray-700">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Total Transaksi: {transactions.length} <br />
          Total Pemasukan:{" "}
          {totalPemasukan.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 2,
          })}{" "}
          <br />
          Total Pengeluaran:{" "}
          {totalPengeluaran.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 2,
          })}{" "}
          <br />
          Laba Rugi:{" "}
          {labaRugi.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 2,
          })}{" "}
        </p>
      </div>

      {/* Tampilan Desktop (Table) */}
      <div className="hidden md:block">
        {loading && <p className="text-gray-500">Memuat data...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300 dark:border-gray-600">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200">
                    No
                  </th>
                  <th
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                    onClick={() => handleSort("no_transaksi")}
                  >
                    Nomor Transaksi{renderSortIndicator("no_transaksi")}
                  </th>
                  <th
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                    onClick={() => handleSort("supplier")}
                  >
                    Supplier / Pembeli{renderSortIndicator("supplier")}
                  </th>
                  <th
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                    onClick={() => handleSort("kasir")}
                  >
                    Kasir{renderSortIndicator("kasir")}
                  </th>
                  <th
                    className="cursor-pointer border px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-200"
                    onClick={() => handleSort("total_harga")}
                  >
                    Total
                  </th>
                  <th
                    className="w-fit cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                    onClick={() => handleSort("createdAt")}
                  >
                    Tanggal{renderSortIndicator("createdAt")}
                  </th>
                  <th
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                    onClick={() => handleSort("metode_pembayaran")}
                  >
                    Metode Pembayaran
                    {renderSortIndicator("metode_pembayaran")}
                  </th>
                  <th
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                    onClick={() => handleSort("status_transaksi")}
                  >
                    Status Transaksi
                    {renderSortIndicator("status_transaksi")}
                  </th>
                  <th
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                    onClick={() => handleSort("tipe_transaksi")}
                  >
                    Tipe Transaksi
                    {renderSortIndicator("tipe_transaksi")}
                  </th>
                  <th
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                    onClick={() => handleSort("pengantar")}
                  >
                    Pengantar{renderSortIndicator("pengantar")}
                  </th>
                  <th
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                    onClick={() => handleSort("staff_bongkar")}
                  >
                    Tukang Bongkar{renderSortIndicator("staff_bongkar")}
                  </th>
                  <th className="border px-4 py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-200">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((trx, idx) => (
                  <tr
                    key={trx._id}
                    className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-700"
                  >
                    <td className="border px-4 py-2 text-sm text-gray-700 dark:text-white">
                      {idx + 1}
                    </td>
                    <td className="border px-4 py-2 text-sm text-gray-700 dark:text-white">
                      {trx.no_transaksi}
                    </td>
                    <td className="border px-4 py-2 text-sm text-gray-700 dark:text-white">
                      {trx.tipe_transaksi === "pembelian"
                        ? trx.supplier?.nama || "N/A"
                        : trx.pembeli?.nama || "N/A"}
                    </td>
                    <td className="border px-4 py-2 text-sm text-gray-700 dark:text-white">
                      {typeof trx.kasir === "object" && trx.kasir
                        ? trx.kasir.name
                        : trx.kasir}
                    </td>
                    <td className="border px-4 py-2 text-right text-sm text-gray-700 dark:text-white">
                      {trx.total_harga.toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="border px-4 py-2">
                      {new Date(trx.createdAt)
                        .toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                        .replace("pukul ", "")
                        .replace(",", "")}
                    </td>
                    <td className="border px-4 py-2 text-left text-sm text-gray-700 dark:text-white">
                      {trx.metode_pembayaran}
                    </td>
                    <td className="border px-4 py-2 text-left text-sm text-gray-700 dark:text-white">
                      {trx.status_transaksi}
                    </td>
                    <td className="border px-4 py-2 text-left text-sm text-gray-700 dark:text-white">
                      {trx.tipe_transaksi}
                    </td>
                    <td className="border px-4 py-2 text-left text-sm text-gray-700 dark:text-white">
                      {trx.pengantar
                        ? typeof trx.pengantar === "object"
                          ? trx.pengantar.name
                          : trx.pengantar
                        : ""}
                    </td>
                    <td className="border px-4 py-2 text-left text-sm text-gray-700 dark:text-white">
                      {trx.staff_bongkar
                        ? typeof trx.staff_bongkar === "object"
                          ? trx.staff_bongkar.name
                          : trx.staff_bongkar
                        : ""}
                    </td>
                    <td className="border px-4 py-2 text-center text-sm">
                      <button
                        onClick={() => openDetailDialog(trx)}
                        className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !loading && (
            <p className="text-gray-500">Tidak ada data transaksi ditemukan</p>
          )
        )}
      </div>

      {/* Tampilan Mobile (Accordion) */}
      <div className="block md:hidden">
        {loading && <p className="text-gray-500">Memuat data...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && transactions.length > 0
          ? transactions.map((trx) => (
              <div
                key={trx._id}
                className="mb-2 rounded border bg-white p-4 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{trx.no_transaksi}</p>
                    <p>
                      {trx.tipe_transaksi === "pembelian"
                        ? trx.supplier?.nama || "N/A"
                        : trx.pembeli?.nama || "N/A"}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleRow(trx._id)}
                    className="text-2xl font-bold"
                  >
                    {expandedRows.includes(trx._id) ? "−" : "+"}
                  </button>
                </div>
                {expandedRows.includes(trx._id) && (
                  <div className="mt-2">
                    <p>
                      <span className="font-medium">Kasir: </span>
                      {typeof trx.kasir === "object" && trx.kasir
                        ? trx.kasir.name
                        : trx.kasir}
                    </p>
                    <p>
                      <span className="font-medium">Total: </span>
                      {trx.total_harga.toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p>
                      <span className="font-medium">Tanggal: </span>
                      {new Date(trx.createdAt)
                        .toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })
                        .replace("pukul ", "")
                        .replace(",", "")}
                    </p>
                    <p>
                      <span className="font-medium">Metode Pembayaran: </span>
                      {trx.metode_pembayaran}
                    </p>
                    <p>
                      <span className="font-medium">Status: </span>
                      {trx.status_transaksi}
                    </p>
                    <p>
                      <span className="font-medium">Tipe: </span>
                      {trx.tipe_transaksi}
                    </p>
                    <p>
                      <span className="font-medium">Pengantar: </span>
                      {trx.pengantar
                        ? typeof trx.pengantar === "object"
                          ? trx.pengantar.name
                          : trx.pengantar
                        : ""}
                    </p>
                    <p>
                      <span className="font-medium">Tukang Bongkar: </span>
                      {trx.staff_bongkar
                        ? typeof trx.staff_bongkar === "object"
                          ? trx.staff_bongkar.name
                          : trx.staff_bongkar
                        : ""}
                    </p>
                    <button
                      onClick={() => openDetailDialog(trx)}
                      className="mt-2 block w-full rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                    >
                      Detail
                    </button>
                  </div>
                )}
              </div>
            ))
          : !loading && (
              <p className="text-gray-500">
                Tidak ada data transaksi ditemukan
              </p>
            )}
      </div>

      {selectedTransaction && (
        <TransactionDetailDialog
          transaction={selectedTransaction}
          staffOptions={staffOptions}
          onClose={() => setSelectedTransaction(null)}
          onUpdate={handleUpdateTransaction}
        />
      )}
    </div>
  );
}
