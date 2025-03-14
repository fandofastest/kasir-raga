"use client";

import { useState, useEffect, FormEvent } from "react";
import { toast } from "react-hot-toast";
import {
  fetchTransaction,
  payHutang,
  fetchSupplier, // Untuk memuat data supplier
} from "@/lib/dataService";
import Transaksi from "@/models/modeltsx/Transaksi";

interface HutangTransaction extends Transaksi {
  sudah_dibayar?: number; // nominal yang sudah dibayar
  dp: number;
  tenor: number;
  cicilanPerBulan: number;
  jadwalPembayaran: {
    dueDate: Date;
    installment: number;
    paid: boolean;
    paymentDate?: Date;
  }[];
}

export default function HutangPage() {
  // State transaksi hutang
  const [transactions, setTransactions] = useState<HutangTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Filter: supplier, startDate, endDate
  const [supplier, setSupplier] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Data Supplier untuk select
  const [supplierOptions, setSupplierOptions] = useState<any[]>([]);

  // Modal state untuk pembayaran
  const [selectedTransaction, setSelectedTransaction] =
    useState<HutangTransaction | null>(null);
  const [modalType, setModalType] = useState<"partial" | "settle" | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Expanded rows (mobile)
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // 1. Load data supplier
  const loadSupplier = async () => {
    try {
      const res = await fetchSupplier();
      setSupplierOptions(res.data); // res.data diharapkan berisi array supplier
    } catch (err) {
      console.error("Gagal memuat supplier:", err);
    }
  };

  // 2. Load data hutang
  const loadData = async (
    overrideSortColumn?: string,
    overrideSortDirection?: "asc" | "desc",
  ) => {
    setLoading(true);
    try {
      const params: { [key: string]: string } = {
        tipe_transaksi: "pembelian",
        metode_pembayaran: "hutang",
      };
      if (supplier) params.supplier = supplier;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      // Sorting
      const col = overrideSortColumn || sortColumn;
      const dir = overrideSortDirection || sortDirection;
      if (col) {
        params.sortBy = col;
        params.sortOrder = dir;
      }

      const res = await fetchTransaction(params);
      setTransactions(res.data.transactions);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplier();
    loadData();
  }, []);

  // Hitung sisa hutang (outstanding)
  const computeOutstanding = (trx: HutangTransaction) => {
    const paid = trx.sudah_dibayar || 0;
    const outstanding = trx.total_harga - trx.dp - paid;
    return outstanding > 0 ? outstanding : 0;
  };

  // Dapatkan tanggal jatuh tempo berikutnya
  const nextDueDate = (trx: HutangTransaction) => {
    if (trx.jadwalPembayaran && trx.jadwalPembayaran.length > 0) {
      const nextInst = trx.jadwalPembayaran.find((inst) => !inst.paid);
      return nextInst
        ? new Date(nextInst.dueDate).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "Lunas";
    }
    return "N/A";
  };

  // Summary
  const totalUtang = transactions.reduce(
    (sum, trx) => sum + trx.total_harga,
    0,
  );
  const totalPaid = transactions.reduce(
    (sum, trx) => sum + (trx.sudah_dibayar || 0) + trx.dp,
    0,
  );
  const totalOutstanding = transactions.reduce(
    (sum, trx) => sum + computeOutstanding(trx),
    0,
  );

  // Sorting
  const handleSort = (column: string) => {
    let newDirection: "asc" | "desc" = "asc";
    if (sortColumn === column) {
      newDirection = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortColumn(column);
    setSortDirection(newDirection);
    loadData(column, newDirection);
  };

  const renderSortIndicator = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? " ▲" : " ▼";
    }
    return "";
  };

  // Modal Payment
  const openPartialModal = (trx: HutangTransaction) => {
    setSelectedTransaction(trx);
    setModalType("partial");
    setPaymentAmount(0);
  };

  const openSettleModal = (trx: HutangTransaction) => {
    setSelectedTransaction(trx);
    setModalType("settle");
    setPaymentAmount(computeOutstanding(trx));
  };

  const handlePaymentSubmit = async () => {
    if (!selectedTransaction) return;
    const outstanding = computeOutstanding(selectedTransaction);

    if (modalType === "partial") {
      if (paymentAmount <= 0 || paymentAmount > outstanding) {
        toast.error("Jumlah pembayaran tidak valid untuk pembayaran sebagian");
        return;
      }
    } else if (modalType === "settle") {
      if (paymentAmount < outstanding) {
        toast.error("Jumlah pembayaran kurang dari sisa hutang");
        return;
      }
    }

    try {
      const res = await payHutang(selectedTransaction._id, paymentAmount);
      if (res.data.status === 200) {
        toast.success("Pembayaran berhasil");
        setModalType(null);
        setSelectedTransaction(null);
        loadData();
      } else {
        toast.error(res.data.error || "Pembayaran gagal");
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan saat pembayaran");
    }
  };

  // Toggle row (mobile)
  const toggleRow = (id: string) => {
    if (expandedRows.includes(id)) {
      setExpandedRows(expandedRows.filter((rowId) => rowId !== id));
    } else {
      setExpandedRows([...expandedRows, id]);
    }
  };

  // Filter submit
  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="p-4 dark:bg-gray-900 dark:text-gray-100">
      <h1 className="mb-4 text-2xl font-bold">Daftar Hutang</h1>
      {/* Summary */}
      <div className="mb-4 rounded-md bg-gray-100 p-4 dark:bg-gray-700">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Total Hutang:{" "}
          {totalUtang.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          })}{" "}
          | Sudah Dibayar:{" "}
          {totalPaid.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          })}{" "}
          | Sisa Hutang:{" "}
          {totalOutstanding.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          })}
        </p>
      </div>

      {/* Filter Form */}
      <form
        onSubmit={handleFilterSubmit}
        className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div>
          <label className="block text-sm font-medium">Supplier</label>
          <select
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">Semua Supplier</option>
            {supplierOptions.map((sup) => (
              <option key={sup._id} value={sup._id}>
                {sup.nama}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Tanggal Mulai</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Tanggal Akhir</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        <button
          type="submit"
          className="col-span-1 rounded bg-blue-500 px-4 py-2 text-white sm:col-span-3"
        >
          Terapkan Filter
        </button>
      </form>

      {loading && <p className="text-gray-500">Memuat data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Table Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full table-auto border-collapse border border-gray-300 dark:border-gray-600">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr className="text-center">
              <th
                className="cursor-pointer border px-4 py-2 text-sm font-medium"
                onClick={() => handleSort("no_transaksi")}
              >
                No Transaksi{renderSortIndicator("no_transaksi")}
              </th>
              <th
                className="cursor-pointer border px-4 py-2 text-sm font-medium"
                onClick={() => handleSort("supplier")}
              >
                Supplier{renderSortIndicator("supplier")}
              </th>
              <th
                className="cursor-pointer border px-4 py-2 text-sm font-medium"
                onClick={() => handleSort("createdAt")}
              >
                Tanggal{renderSortIndicator("createdAt")}
              </th>
              <th
                className="cursor-pointer border px-4 py-2 text-right text-sm font-medium"
                onClick={() => handleSort("total_harga")}
              >
                Total Harga{renderSortIndicator("total_harga")}
              </th>
              <th className="border px-4 py-2 text-sm font-medium">
                Sudah Dibayar
              </th>
              <th className="border px-4 py-2 text-sm font-medium">
                Sisa Hutang
              </th>
              <th
                className="cursor-pointer border px-4 py-2 text-sm font-medium"
                onClick={() => handleSort("jadwalPembayaran")}
              >
                Jatuh Tempo{renderSortIndicator("jadwalPembayaran")}
              </th>
              <th className="border px-4 py-2 text-sm font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((trx) => {
              const outstanding = computeOutstanding(trx);
              return (
                <tr
                  key={trx._id}
                  className="text-center odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-700"
                >
                  <td className="border px-4 py-2 text-sm dark:text-white">
                    {trx.no_transaksi}
                  </td>
                  <td className="border px-4 py-2 text-sm dark:text-white">
                    {trx.supplier?.nama || "N/A"}
                  </td>
                  <td className="border px-4 py-2 text-sm dark:text-white">
                    {new Date(trx.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="border px-4 py-2 text-right text-sm dark:text-white">
                    {trx.total_harga.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    })}
                  </td>
                  <td className="border px-4 py-2 text-sm dark:text-white">
                    {trx.sudah_dibayar
                      ? trx.sudah_dibayar.toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        })
                      : "0"}
                  </td>
                  <td className="border px-4 py-2 text-sm dark:text-white">
                    {outstanding.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    })}
                  </td>
                  <td className="border px-4 py-2 text-sm dark:text-white">
                    {nextDueDate(trx)}
                  </td>
                  <td className="border px-4 py-2 text-sm">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => openPartialModal(trx)}
                        className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                        disabled={outstanding <= 0}
                      >
                        Bayar Cicilan
                      </button>
                      <button
                        onClick={() => openSettleModal(trx)}
                        className="rounded bg-green-500 px-2 py-1 text-white hover:bg-green-600"
                        disabled={outstanding <= 0}
                      >
                        Lunasi
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile (Accordion) */}
      <div className="block md:hidden">
        {transactions.length > 0 ? (
          transactions.map((trx) => {
            const outstanding = computeOutstanding(trx);
            return (
              <div
                key={trx._id}
                className="mb-2 rounded border bg-white p-4 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{trx.no_transaksi}</p>
                    <p className="text-sm">{trx.supplier?.nama || "N/A"}</p>
                  </div>
                  <button
                    onClick={() => toggleRow(trx._id)}
                    className="text-2xl font-bold"
                  >
                    {expandedRows.includes(trx._id) ? "−" : "+"}
                  </button>
                </div>
                {expandedRows.includes(trx._id) && (
                  <div className="mt-2 space-y-2">
                    <p>
                      <span className="font-medium">Tanggal: </span>
                      {new Date(trx.createdAt)
                        .toLocaleDateString("id-ID", {
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
                      <span className="font-medium">Total Harga: </span>
                      {trx.total_harga.toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      })}
                    </p>
                    <p>
                      <span className="font-medium">Sudah Dibayar: </span>
                      {trx.sudah_dibayar
                        ? trx.sudah_dibayar.toLocaleString("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          })
                        : "0"}
                    </p>
                    <p>
                      <span className="font-medium">Sisa Hutang: </span>
                      {outstanding.toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      })}
                    </p>
                    <p>
                      <span className="font-medium">Jatuh Tempo: </span>
                      {nextDueDate(trx)}
                    </p>
                    <div className="mt-2 flex flex-col space-y-2">
                      <button
                        onClick={() => openPartialModal(trx)}
                        className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
                        disabled={outstanding <= 0}
                      >
                        Bayar Cicilan
                      </button>
                      <button
                        onClick={() => openSettleModal(trx)}
                        className="rounded bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600"
                        disabled={outstanding <= 0}
                      >
                        Lunasi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="py-4 text-center text-gray-500">
            Tidak ada transaksi hutang ditemukan.
          </p>
        )}
      </div>

      {/* Modal Pembayaran Hutang */}
      {modalType && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold">
              {modalType === "partial" ? "Bayar Cicilan" : "Lunasi Transaksi"}
            </h2>
            <p className="mb-2">
              No. Transaksi: {selectedTransaction.no_transaksi}
            </p>
            <p className="mb-2">
              Outstanding:{" "}
              {computeOutstanding(selectedTransaction).toLocaleString("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              })}
            </p>
            {modalType === "partial" && (
              <div className="mb-4">
                <label className="mb-1 block">Jumlah Pembayaran</label>
                <input
                  type="number"
                  min={selectedTransaction.cicilanPerBulan}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full rounded border px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
            {modalType === "settle" && (
              <div className="mb-4">
                <label className="mb-1 block">Jumlah Pelunasan</label>
                <input
                  type="number"
                  min={computeOutstanding(selectedTransaction)}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full rounded border px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setModalType(null);
                  setSelectedTransaction(null);
                }}
                className="rounded bg-gray-300 px-4 py-2 text-sm text-gray-800"
              >
                Batal
              </button>
              <button
                onClick={handlePaymentSubmit}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
              >
                {modalType === "partial" ? "Bayar Cicilan" : "Lunasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
