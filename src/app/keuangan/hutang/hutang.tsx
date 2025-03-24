"use client";

import React, { useState, useEffect, FormEvent, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  fetchTransaction,
  payInstallment,
  fetchSupplier,
} from "@/lib/dataService";
import Transaksi from "@/models/modeltsx/Transaksi";
import PaymentHistoryDialog from "../piutang/PaymentHistoryDialog";
import ActionDropdown from "@/app/keuangan/piutang/ActionDropdown";

// Interface untuk transaksi hutang
export interface HutangTransaction extends Transaksi {
  dp: number;
  durasiPelunasan: number;
  unitPelunasan: "hari" | "bulan";
  tanggalMaksimalPelunasan: Date;
  jadwalPembayaran: {
    dueDate: Date;
    installment: number;
    paid: boolean;
    paymentDate?: Date;
  }[];
}

export default function HutangPage() {
  const [transactions, setTransactions] = useState<HutangTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Filter state (supplier, tanggal)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Modal state
  const [selectedTransaction, setSelectedTransaction] =
    useState<HutangTransaction | null>(null);
  const [modalType, setModalType] = useState<
    "installment" | "settle" | "partial" | null
  >(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  // Riwayat pembayaran
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] =
    useState<boolean>(false);
  const [historyTransaction, setHistoryTransaction] =
    useState<HutangTransaction | null>(null);

  // State untuk tampilan mobile
  const [expandedTransactions, setExpandedTransactions] = useState<string[]>(
    [],
  );

  // State untuk sorting
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  // Tambahan: State untuk tanggal, default ke hari ini
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  function getTimestampWithCurrentTime(dateString: string): string {
    const now = new Date();
    // Ambil bagian jam, menit, detik (format "HH:MM:SS")
    const timePart = now.toTimeString().split(" ")[0];
    return `${dateString}T${timePart}`;
  }

  // Fungsi untuk memuat data transaksi cicilan dengan filter
  const loadData = async () => {
    setLoading(true);
    try {
      const params: { [key: string]: string } = {
        metode_pembayaran: "cicilan",
        tipe_transaksi: "pembelian",
      };
      if (selectedSupplierId) params.supplier = selectedSupplierId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await fetchTransaction(params);
      setTransactions(res.data.transactions);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk memuat data supplier
  const loadSuppliers = async () => {
    try {
      const res = await fetchSupplier();
      setSuppliers(res.data);
    } catch (err: any) {
      console.error("Gagal memuat supplier:", err);
    }
  };

  useEffect(() => {
    loadData();
    loadSuppliers();
  }, []);

  // Fungsi untuk menghitung total pembayaran yang sudah dilakukan
  const sumPaidInstallments = (trx: HutangTransaction) => {
    return trx.jadwalPembayaran
      .filter((inst) => inst.paid)
      .reduce((sum, inst) => sum + inst.installment, 0);
  };

  // Fungsi untuk menghitung sisa hutang
  const computeSisaHutang = (trx: HutangTransaction) => {
    const paidSum = sumPaidInstallments(trx);
    const sisa = trx.total_harga - trx.dp - paidSum;
    return sisa > 0 ? sisa : 0;
  };

  // Mengambil jatuh tempo berikutnya sebagai Date (untuk keperluan sorting)
  const getNextDueDateAsDate = (trx: HutangTransaction): Date => {
    const nextInst = trx.jadwalPembayaran.find((inst) => !inst.paid);
    return nextInst
      ? new Date(nextInst.dueDate)
      : new Date(trx.tanggalMaksimalPelunasan);
  };

  // Format tampilan jatuh tempo
  const nextDueDate = (trx: HutangTransaction) => {
    const dateObj = getNextDueDateAsDate(trx);
    return dateObj.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Modal: Buka untuk bayar cicilan
  const openInstallmentModal = (trx: HutangTransaction) => {
    setSelectedTransaction(trx);
    setModalType("installment");
    setPaymentAmount("0");
  };

  // Modal: Buka untuk pelunasan
  const openSettleModal = (trx: HutangTransaction) => {
    setSelectedTransaction(trx);
    setModalType("settle");
    setPaymentAmount(computeSisaHutang(trx).toString());
  };

  // Modal: Buka riwayat pembayaran
  const openHistoryModal = (trx: HutangTransaction) => {
    setHistoryTransaction(trx);
    setIsHistoryDialogOpen(true);
  };

  // Fungsi submit modal pembayaran
  const handlePaymentSubmit = async () => {
    if (!selectedTransaction) return;
    const sisaHutang = computeSisaHutang(selectedTransaction);

    if (modalType === "installment" && Number(paymentAmount) <= 0) {
      toast.error("Jumlah pembayaran minimal harus lebih dari 0");
      return;
    }
    if (modalType === "settle" && Number(paymentAmount) < sisaHutang) {
      toast.error("Jumlah pembayaran kurang dari sisa hutang.");
      return;
    }
    try {
      const res = await payInstallment(
        selectedTransaction._id,
        paymentAmount,
        getTimestampWithCurrentTime(selectedDate),
      );

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

  // Handler untuk submit form filter
  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Summary: Total Hutang, Sudah Dibayar, dan Sisa Hutang
  const totalHutang = transactions.reduce(
    (sum, trx) => sum + trx.total_harga,
    0,
  );
  const totalPaid = transactions.reduce(
    (sum, trx) => sum + (trx.dp + sumPaidInstallments(trx)),
    0,
  );
  const totalSisaHutang = transactions.reduce(
    (sum, trx) => sum + computeSisaHutang(trx),
    0,
  );
  const totalDp = transactions.reduce((sum, trx) => sum + trx.dp, 0);

  // Handler untuk toggle tampilan detail transaksi (mobile)
  const toggleTransaction = (id: string) => {
    if (expandedTransactions.includes(id)) {
      setExpandedTransactions(expandedTransactions.filter((tid) => tid !== id));
    } else {
      setExpandedTransactions([...expandedTransactions, id]);
    }
  };

  // Handler klik header untuk sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Gunakan useMemo untuk menghindari re-sorting di setiap render
  const sortedTransactions = useMemo(() => {
    // Copy data agar tidak mengubah state asli
    const sorted = [...transactions];
    sorted.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      switch (sortField) {
        case "no_transaksi":
          aVal = a.no_transaksi || "";
          bVal = b.no_transaksi || "";
          return aVal.localeCompare(bVal);
        case "tanggal":
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          return aVal - bVal;
        case "supplier":
          aVal = a.supplier?.nama || "";
          bVal = b.supplier?.nama || "";
          return aVal.localeCompare(bVal);
        case "total_harga":
          aVal = a.total_harga;
          bVal = b.total_harga;
          return aVal - bVal;
        case "dp":
          aVal = a.dp;
          bVal = b.dp;
          return aVal - bVal;
        case "sisa_hutang":
          aVal = computeSisaHutang(a);
          bVal = computeSisaHutang(b);
          return aVal - bVal;
        case "jatuh_tempo":
          aVal = getNextDueDateAsDate(a).getTime();
          bVal = getNextDueDateAsDate(b).getTime();
          return aVal - bVal;
        default:
          return 0;
      }
    });
    if (sortDirection === "desc") sorted.reverse();
    return sorted;
  }, [transactions, sortField, sortDirection]);

  return (
    <div className="p-4 dark:bg-boxdark dark:text-gray-100">
      <h1 className="mb-4 text-2xl font-bold">Daftar Hutang Cicilan</h1>

      {/* Summary Hutang */}
      <div className="mb-4 rounded-md bg-gray-100 p-4 dark:bg-gray-800">
        <p className="text-sm">
          Total Hutang:{" "}
          {totalHutang.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          })}
        </p>
        <p className="text-sm">
          Total DP:{" "}
          {totalDp.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          })}
        </p>
        <p className="text-sm">
          Sudah Dibayar:{" "}
          {totalPaid.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          })}
        </p>
        <p className="text-sm">
          Sisa Hutang:{" "}
          {totalSisaHutang.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          })}
        </p>
      </div>

      {/* Form Filter */}
      <form
        onSubmit={handleFilterSubmit}
        className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div>
          <label className="block text-sm font-medium">Supplier</label>
          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="">Semua Supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier._id} value={supplier._id}>
                {supplier.nama}
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
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Tanggal Akhir</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
        </div>
        <button
          type="submit"
          className="col-span-1 rounded bg-blue-500 px-4 py-2 text-white sm:col-span-3"
        >
          Terapkan Filter
        </button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Tampilan Desktop (Table) */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr className="text-center">
              {/* Kolom No tidak kita beri sorting */}
              <th className="border px-4 py-2">No</th>

              {/* Contoh header dengan sorting */}
              <th
                className="cursor-pointer border px-4 py-2"
                onClick={() => handleSort("no_transaksi")}
              >
                No Transaksi{" "}
                {sortField === "no_transaksi"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>

              <th
                className="cursor-pointer border px-4 py-2"
                onClick={() => handleSort("tanggal")}
              >
                Tanggal{" "}
                {sortField === "tanggal"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>

              <th
                className="cursor-pointer border px-4 py-2"
                onClick={() => handleSort("supplier")}
              >
                Supplier{" "}
                {sortField === "supplier"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>

              <th
                className="cursor-pointer border px-4 py-2"
                onClick={() => handleSort("total_harga")}
              >
                Total Harga{" "}
                {sortField === "total_harga"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>

              <th
                className="cursor-pointer border px-4 py-2"
                onClick={() => handleSort("dp")}
              >
                DP{" "}
                {sortField === "dp"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>

              <th
                className="cursor-pointer border px-4 py-2"
                onClick={() => handleSort("sisa_hutang")}
              >
                Sisa Hutang{" "}
                {sortField === "sisa_hutang"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>

              <th
                className="cursor-pointer border px-4 py-2"
                onClick={() => handleSort("jatuh_tempo")}
              >
                Jatuh Tempo{" "}
                {sortField === "jatuh_tempo"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>

              <th className="border px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((trx, idx) => {
              const sisaHutang = computeSisaHutang(trx);
              return (
                <tr key={trx._id} className="text-center">
                  <td className="border px-4 py-2">{idx + 1}</td>
                  <td className="border px-4 py-2">{trx.no_transaksi}</td>
                  <td className="border px-4 py-2">
                    {new Date(trx.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="border px-4 py-2">
                    {trx.supplier?.nama || "N/A"}
                  </td>
                  <td className="border px-4 py-2">
                    {trx.total_harga.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    })}
                  </td>
                  <td className="border px-4 py-2">
                    {trx.dp ??
                      (0).toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      })}
                  </td>
                  <td className="border px-4 py-2">
                    {sisaHutang.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    })}
                  </td>
                  <td className="border px-4 py-2">{nextDueDate(trx)}</td>
                  <td className="border px-4 py-2">
                    <div className="hidden space-x-2 md:flex">
                      <div className="flex-1">
                        <ActionDropdown
                          trx={trx}
                          outstanding={sisaHutang}
                          openInstallmentModal={openInstallmentModal as any}
                          openSettleModal={openSettleModal as any}
                          openHistoryModal={openHistoryModal as any}
                        />
                      </div>
                      <div className="flex-1">
                        <button
                          onClick={() =>
                            window.open(
                              `/invoice/${trx.no_transaksi}`,
                              "_blank",
                            )
                          }
                          className="w-full rounded bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600"
                        >
                          Invoice
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tampilan Mobile (Accordion) */}
      <div className="block md:hidden">
        {sortedTransactions.length > 0 ? (
          sortedTransactions.map((trx) => {
            const sisaHutang = computeSisaHutang(trx);
            return (
              <div
                key={trx._id}
                className="border-t border-gray-300 px-4 py-4 dark:border-gray-600"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{trx.no_transaksi}</p>
                    <p className="text-sm">
                      {new Date(trx.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleTransaction(trx._id)}
                    className="text-2xl font-bold"
                  >
                    {expandedTransactions.includes(trx._id) ? "−" : "+"}
                  </button>
                </div>
                {expandedTransactions.includes(trx._id) && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Supplier: </span>
                      {trx.supplier?.nama || "N/A"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Total Harga: </span>
                      {trx.total_harga.toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">DP: </span>
                      {trx.dp.toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Sisa Hutang: </span>
                      {sisaHutang.toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Jatuh Tempo: </span>
                      {nextDueDate(trx)}
                    </p>
                    <div className="mt-2 flex flex-col space-y-2">
                      <button
                        onClick={() => openInstallmentModal(trx)}
                        className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
                      >
                        Bayar Cicilan
                      </button>
                      <button
                        onClick={() => openSettleModal(trx)}
                        className="rounded bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600"
                      >
                        Lunasi
                      </button>
                      <button
                        onClick={() => openHistoryModal(trx)}
                        className="rounded bg-gray-500 px-4 py-2 text-sm text-white hover:bg-gray-600"
                      >
                        Riwayat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="py-4 text-center text-gray-500">
            Tidak ada transaksi cicilan ditemukan.
          </p>
        )}
      </div>

      {/* Modal Pembayaran */}
      {modalType && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold">
              {modalType === "installment"
                ? "Bayar Cicilan"
                : "Lunasi Transaksi"}
            </h2>

            {/* Field tambahan untuk tanggal transaksi */}
            <div className="mb-2 mt-4 flex items-center space-x-2">
              <label className=" font-medium text-gray-700 dark:text-gray-200">
                Tanggal Transaksi
              </label>
              <input
                type="date"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <p className="mb-2">
              No. Transaksi: {selectedTransaction.no_transaksi}
            </p>
            <p className="mb-2">
              Sisa Hutang:{" "}
              {computeSisaHutang(selectedTransaction).toLocaleString("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              })}
            </p>
            {modalType === "installment" && (
              <div className="mb-4">
                <label className="mb-1 block">Jumlah Pembayaran</label>
                <input
                  onFocus={(e) => e.target.select()}
                  type="number"
                  min={1}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full rounded border px-3 py-2 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
            {modalType === "settle" && (
              <div className="mb-4">
                <label className="mb-1 block">Jumlah Pelunasan</label>
                <input
                  onFocus={(e) => e.target.select()}
                  type="number"
                  min={computeSisaHutang(selectedTransaction)}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
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
                {modalType === "installment" ? "Bayar Cicilan" : "Lunasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Riwayat Pembayaran */}
      {isHistoryDialogOpen && historyTransaction && (
        <PaymentHistoryDialog
          transaction={historyTransaction}
          onClose={() => setIsHistoryDialogOpen(false)}
        />
      )}
    </div>
  );
}
