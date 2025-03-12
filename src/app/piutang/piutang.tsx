"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { toast } from "react-hot-toast";
import { fetchTransaction, payInstallment } from "@/lib/dataService";
import Transaksi from "@/models/modeltsx/Transaksi";
import PaymentHistoryDialog from "./PaymentHistoryDialog";
import ActionDropdown from "./ActionDropdown";

// Perluas tipe Transaksi untuk transaksi cicilan (piutang)
interface PiutangTransaction extends Transaksi {
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

export default function PiutangPage() {
  const [transactions, setTransactions] = useState<PiutangTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Filter state
  const [filterPelanggan, setFilterPelanggan] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Modal state untuk pembayaran cicilan
  const [selectedTransaction, setSelectedTransaction] =
    useState<PiutangTransaction | null>(null);
  const [modalType, setModalType] = useState<
    "installment" | "settle" | "partial" | null
  >(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Modal state untuk riwayat pembayaran
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] =
    useState<boolean>(false);
  const [historyTransaction, setHistoryTransaction] =
    useState<PiutangTransaction | null>(null);

  // State untuk tampilan mobile: transaksi yang di-expand
  const [expandedTransactions, setExpandedTransactions] = useState<string[]>(
    [],
  );

  // Fungsi untuk memuat transaksi cicilan dengan filter tambahan
  const loadData = async () => {
    setLoading(true);
    try {
      const params: { [key: string]: string } = {
        metode_pembayaran: "cicilan",
      };
      if (filterPelanggan) params.pelanggan = filterPelanggan;
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

  useEffect(() => {
    loadData();
  }, []);

  // Fungsi helper untuk menghitung jumlah cicilan yang sudah dibayar
  const countPaidInstallments = (trx: PiutangTransaction) => {
    return trx.jadwalPembayaran.filter((inst) => inst.paid).length;
  };

  // Fungsi untuk menghitung sisa tagihan (outstanding)
  const computeOutstanding = (trx: PiutangTransaction) => {
    const paidCount = countPaidInstallments(trx);
    const outstanding =
      trx.total_harga - trx.dp - paidCount * trx.cicilanPerBulan;
    return outstanding > 0 ? outstanding : 0;
  };

  // Fungsi untuk mendapatkan tanggal jatuh tempo berikutnya
  const nextDueDate = (trx: PiutangTransaction) => {
    const nextInst = trx.jadwalPembayaran.find((inst) => !inst.paid);
    return nextInst
      ? new Date(nextInst.dueDate).toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Lunas";
  };

  // Modal: Buka untuk bayar cicilan
  const openInstallmentModal = (trx: PiutangTransaction) => {
    setSelectedTransaction(trx);
    setModalType("installment");
    setPaymentAmount(trx.cicilanPerBulan);
  };

  // Modal: Buka untuk pelunasan
  const openSettleModal = (trx: PiutangTransaction) => {
    setSelectedTransaction(trx);
    setModalType("settle");
    setPaymentAmount(computeOutstanding(trx));
  };

  // Modal: Buka riwayat pembayaran
  const openHistoryModal = (trx: PiutangTransaction) => {
    setHistoryTransaction(trx);
    setIsHistoryDialogOpen(true);
  };

  // Fungsi submit modal pembayaran
  const handlePaymentSubmit = async () => {
    if (!selectedTransaction) return;
    const outstanding = computeOutstanding(selectedTransaction);

    if (
      modalType === "installment" &&
      paymentAmount < selectedTransaction.cicilanPerBulan
    ) {
      toast.error(
        `Jumlah pembayaran minimal adalah ${selectedTransaction.cicilanPerBulan.toLocaleString(
          "id-ID",
          {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 2,
          },
        )}`,
      );
      return;
    }
    if (modalType === "settle" && paymentAmount < outstanding) {
      toast.error("Jumlah pembayaran kurang dari sisa tagihan.");
      return;
    }
    try {
      const res = await payInstallment(selectedTransaction._id, paymentAmount);
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

  // Summary: Total Utang, Sudah Dibayar, dan Outstanding
  const totalUtang = transactions.reduce(
    (sum, trx) => sum + trx.total_harga,
    0,
  );
  const totalPaid = transactions.reduce(
    (sum, trx) => sum + (trx.sudah_dibayar || 0),
    0,
  );
  const totalOutstanding = transactions.reduce(
    (sum, trx) => sum + computeOutstanding(trx),
    0,
  );

  // Handler untuk toggle tampilan detail transaksi pada mobile
  const toggleTransaction = (id: string) => {
    if (expandedTransactions.includes(id)) {
      setExpandedTransactions(expandedTransactions.filter((tid) => tid !== id));
    } else {
      setExpandedTransactions([...expandedTransactions, id]);
    }
  };

  return (
    <div className="p-4 dark:bg-gray-900 dark:text-gray-100">
      <h1 className="mb-4 text-2xl font-bold">Daftar Piutang Cicilan</h1>

      {/* Summary Hutang */}
      <div className="mb-4 rounded-md bg-gray-100 p-4 dark:bg-gray-800">
        <p className="text-sm">
          Total Utang:{" "}
          {totalUtang.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 2,
          })}
        </p>
        <p className="text-sm">
          Sudah Dibayar:{" "}
          {totalPaid.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 2,
          })}
        </p>
        <p className="text-sm">
          Outstanding:{" "}
          {totalOutstanding.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 2,
          })}
        </p>
      </div>

      {/* Form Filter */}
      <form
        onSubmit={handleFilterSubmit}
        className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div>
          <label className="block text-sm font-medium">Pelanggan</label>
          <input
            type="text"
            placeholder="Cari pelanggan"
            value={filterPelanggan}
            onChange={(e) => setFilterPelanggan(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
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
              <th className="border px-4 py-2">No</th>
              <th className="border px-4 py-2">No Transaksi</th>
              <th className="border px-4 py-2">Tanggal</th>
              <th className="border px-4 py-2">Pelanggan</th>
              <th className="border px-4 py-2">Total Harga</th>
              <th className="border px-4 py-2">DP</th>
              <th className="border px-4 py-2">Outstanding</th>
              <th className="border px-4 py-2">Next Due Date</th>
              <th className="border px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((trx, idx) => {
              const outstanding = computeOutstanding(trx);
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
                    {trx.tipe_transaksi === "penjualan"
                      ? trx.pembeli?.nama || "N/A"
                      : trx.supplier?.nama || "N/A"}
                  </td>
                  <td className="border px-4 py-2">
                    {trx.total_harga.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="border px-4 py-2">
                    {trx.dp.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="border px-4 py-2">
                    {outstanding.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="border px-4 py-2">{nextDueDate(trx)}</td>
                  <td className="border px-4 py-2">
                    {/* Desktop: gunakan dropdown */}
                    <div className="hidden md:block">
                      <ActionDropdown
                        trx={trx}
                        outstanding={outstanding}
                        openInstallmentModal={openInstallmentModal as any}
                        openSettleModal={openSettleModal as any}
                        openHistoryModal={openHistoryModal as any}
                      />
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
        {transactions.length > 0 ? (
          transactions.map((trx) => {
            const outstanding = computeOutstanding(trx);
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
                      <span className="font-medium">Pelanggan: </span>
                      {trx.tipe_transaksi === "penjualan"
                        ? trx.pembeli?.nama || "N/A"
                        : trx.supplier?.nama || "N/A"}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Total Harga: </span>
                      {trx.total_harga.toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">DP: </span>
                      {trx.dp.toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Outstanding: </span>
                      {outstanding.toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Next Due Date: </span>
                      {nextDueDate(trx)}
                    </p>
                    {/* Mobile: tampilkan menu aksi secara langsung */}
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

      {/* Modal Pembayaran Cicilan/Hutang */}
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
                minimumFractionDigits: 2,
              })}
            </p>
            {modalType === "installment" && (
              <>
                <p className="mb-2">
                  Cicilan per bulan:{" "}
                  {selectedTransaction.cicilanPerBulan.toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 2,
                  })}
                </p>
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
              </>
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
