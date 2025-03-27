"use client";

import { useState, useEffect, FormEvent } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  fetchTransaction,
  fetchSupplier,
  fetchStaff,
  fetchPelanggan,
  updateDataTransaction,
} from "@/lib/dataService";
import { Staff } from "@/models/modeltsx/staffTypes";
import Transaksi from "@/models/modeltsx/Transaksi";

export default function TransactionDraftPage() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Filter state, dengan status_transaksi default "tunda"
  const [searchTerm, setSearchTerm] = useState<string>(""); // nomor transaksi
  const [metodePembayaran, setMetodePembayaran] = useState<string>("");
  const [statusTransaksi, setStatusTransaksi] = useState<string>("tunda");
  const [tipeTransaksi, setTipeTransaksi] = useState<string>("");

  // Filter berdasarkan relasi (select)
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

  // Options khusus berdasarkan role
  const kasirOptions = staffOptions.filter((staff) => staff.role === "kasir");
  const pengantarOptions = staffOptions.filter(
    (staff) => staff.role === "staffAntar",
  );
  const staffBongkarOptions = staffOptions.filter(
    (staff) => staff.role === "staffBongkar",
  );

  // State untuk mengelola baris yang di-expand pada tampilan mobile
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // 1) State untuk dialog konfirmasi batal
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);
  const [transactionToCancel, setTransactionToCancel] =
    useState<Transaksi | null>(null);

  // Toggle row di mobile
  const toggleRow = (id: string) => {
    if (expandedRows.includes(id)) {
      setExpandedRows(expandedRows.filter((rowId) => rowId !== id));
    } else {
      setExpandedRows([...expandedRows, id]);
    }
  };

  // Fungsi buka detail (jika ada)
  const openDetailDialog = (trx: Transaksi) => {
    setSelectedTransaction(trx);
  };

  const handleUpdateTransaction = (updatedTransaction: Transaksi) => {
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

  useEffect(() => {
    loadOptions();
  }, []);

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
      // status_transaksi selalu "tunda"
      params.status_transaksi = "tunda";
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

  // Sorting
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

  // Total draft
  const totalDraft = transactions.reduce(
    (sum, trx) => sum + trx.total_harga,
    0,
  );

  // Lanjutkan draft
  const handleContinueDraft = (draft: Transaksi) => {
    if (!draft.no_transaksi) {
      router.push(`/`);
      return;
    }
    if (draft.no_transaksi.startsWith("PJL")) {
      router.push(`/transaksi?draftId=${draft._id}`);
    } else if (draft.no_transaksi.startsWith("BELI")) {
      router.push(`/pembelian?draftId=${draft._id}`);
    } else {
      router.push(`/`);
    }
  };

  // 2) Fungsi panggil PUT "batal"
  const handleCancelTransaction = async () => {
    if (!transactionToCancel) return;
    try {
      // Panggil updateDataTransaction dengan status_transaksi = "batal"
      const payload = { status_transaksi: "batal" };
      const res = await updateDataTransaction(transactionToCancel._id, payload);
      toast.success("Transaksi berhasil dibatalkan");
      // Tutup dialog
      setShowCancelDialog(false);
      setTransactionToCancel(null);
      // Reload data
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Gagal membatalkan transaksi");
      console.error("Cancel transaction error:", err);
    }
  };

  // 3) Tampilkan data
  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-100">
        Transaksi Draft (Tunda)
      </h1>

      {/* Filter Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div>
          <label className="block text-sm font-medium">Nomor Transaksi</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
            placeholder="Cari nomor transaksi"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Metode Pembayaran</label>
          <select
            value={metodePembayaran}
            onChange={(e) => setMetodePembayaran(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">Semua</option>
            <option value="tunai">Tunai</option>
            <option value="edc">EDC</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cicilan">Cicilan</option>
            <option value="hutang">Hutang</option>
          </select>
        </div>
        {/* Filter lainnya dapat ditambahkan sesuai kebutuhan */}
        <button
          type="submit"
          className="bg-tosca col-span-1 rounded px-4 py-2 text-white sm:col-span-3"
        >
          Terapkan Filter
        </button>
      </form>

      {/* Ringkasan Draft Transaksi */}
      <div className="mb-4 rounded-md bg-gray-100 p-4 dark:bg-gray-700">
        <p className="text-sm">
          Total Draft: {transactions.length} <br />
          Total Draft:{" "}
          {totalDraft.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          })}
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
                  <th
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                    onClick={() => handleSort("no_transaksi")}
                  >
                    Nomor Transaksi{renderSortIndicator("no_transaksi")}
                  </th>
                  <th
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                    onClick={() => handleSort("pembeli")}
                  >
                    Pelanggan{renderSortIndicator("pembeli")}
                  </th>
                  <th
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                    onClick={() => handleSort("kasir")}
                  >
                    Kasir{renderSortIndicator("kasir")}
                  </th>
                  <th className="border px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-200">
                    Total
                  </th>
                  <th
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                    onClick={() => handleSort("createdAt")}
                  >
                    Tanggal{renderSortIndicator("createdAt")}
                  </th>
                  <th
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                    onClick={() => handleSort("metode_pembayaran")}
                  >
                    Metode Pembayaran{renderSortIndicator("metode_pembayaran")}
                  </th>
                  <th
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                    onClick={() => handleSort("status_transaksi")}
                  >
                    Status{renderSortIndicator("status_transaksi")}
                  </th>
                  <th className="border px-4 py-2 text-center text-sm font-medium text-gray-600 dark:text-gray-200">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((trx) => (
                  <tr
                    key={trx._id}
                    className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-700"
                  >
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
                        minimumFractionDigits: 0,
                      })}
                    </td>
                    <td className="border px-4 py-2">
                      {new Date(trx.createdAt).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="border px-4 py-2 text-left text-sm text-gray-700 dark:text-white">
                      {trx.metode_pembayaran}
                    </td>
                    <td className="border px-4 py-2 text-left text-sm text-gray-700 dark:text-white">
                      {trx.status_transaksi}
                    </td>
                    <td className="border px-4 py-2 text-center text-sm">
                      <button
                        onClick={() => {
                          // Tampilkan dialog konfirmasi
                          setTransactionToCancel(trx);
                          setShowCancelDialog(true);
                        }}
                        className="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600"
                      >
                        Batalkan
                      </button>
                      <button
                        onClick={() => handleContinueDraft(trx)}
                        className="hover:bg-toscadark bg-tosca ml-3 rounded px-2 py-1 text-white"
                      >
                        Lanjutkan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !loading && (
            <p className="text-gray-500">
              Tidak ada data transaksi draft ditemukan
            </p>
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
                        minimumFractionDigits: 0,
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
                      <span className="font-medium">Metode: </span>
                      {trx.metode_pembayaran}
                    </p>
                    <p>
                      <span className="font-medium">Status: </span>
                      {trx.status_transaksi}
                    </p>

                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => {
                          setTransactionToCancel(trx);
                          setShowCancelDialog(true);
                        }}
                        className="flex-1 rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600"
                      >
                        Batalkan
                      </button>
                      <button
                        onClick={() => handleContinueDraft(trx)}
                        className="hover:bg-toscadark bg-tosca flex-1 rounded px-2 py-1 text-white"
                      >
                        Lanjutkan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          : !loading && (
              <p className="text-gray-500">
                Tidak ada data transaksi draft ditemukan
              </p>
            )}
      </div>

      {/* Dialog Konfirmasi Batalkan */}
      {showCancelDialog && transactionToCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowCancelDialog(false)}
        >
          <div
            className="relative w-full max-w-md rounded-md bg-white p-4 shadow dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
              Konfirmasi Pembatalan
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-200">
              Apakah Anda yakin ingin membatalkan transaksi{" "}
              <span className="font-semibold">
                {transactionToCancel.no_transaksi}
              </span>
              ? Tindakan ini akan mengubah status menjadi{" "}
              <span className="font-semibold">batal</span> dan mengembalikan
              stok.
            </p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="rounded bg-gray-300 px-3 py-1 text-sm text-black hover:bg-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  try {
                    const payload = { status_transaksi: "batal" };
                    await updateDataTransaction(
                      transactionToCancel._id,
                      payload,
                    );
                    toast.success("Transaksi dibatalkan");
                    setShowCancelDialog(false);
                    setTransactionToCancel(null);
                    loadData();
                  } catch (err: any) {
                    toast.error(err.message || "Gagal membatalkan transaksi");
                  }
                }}
                className="rounded bg-red-500 px-3 py-1 text-sm font-semibold text-white hover:bg-red-600"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
