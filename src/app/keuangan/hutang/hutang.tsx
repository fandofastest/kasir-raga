"use client";

import React, { useState, useEffect, FormEvent, useMemo } from "react";
import Select from "react-select";
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
  const [suppliers, setSuppliers] = useState<{ _id: string; nama: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Filter state: supplier & tanggal
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Modal state
  const [selectedTransaction, setSelectedTransaction] = useState<HutangTransaction | null>(null);
  const [modalType, setModalType] = useState<"installment" | "settle" | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Dialog history
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState<boolean>(false);
  const [historyTransaction, setHistoryTransaction] = useState<HutangTransaction | null>(null);

  // Mobile expand
  const [expandedTransactions, setExpandedTransactions] = useState<string[]>([]);

  // Sorting
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  function getTimestampWithCurrentTime(dateString: string): string {
    const now = new Date();
    const timePart = now.toTimeString().split(" ")[0];
    return `${dateString}T${timePart}`;
  }

  // Load data dan supplier
  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
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

  const loadSuppliers = async () => {
    try {
      const res = await fetchSupplier();
      setSuppliers(res.data);
    } catch (err: any) {
      console.error("Gagal memuat supplier:", err);
    }
  };

  useEffect(() => {
    loadSuppliers();
    loadData();
  }, []);

  // Kalkulasi sisa hutang
  const sumPaidInstallments = (trx: HutangTransaction) =>
    trx.jadwalPembayaran.filter(i => i.paid).reduce((sum, i) => sum + i.installment, 0);
  const computeSisaHutang = (trx: HutangTransaction) => {
    const paid = sumPaidInstallments(trx);
    const sisa = trx.total_harga - trx.dp - paid;
    return sisa > 0 ? sisa : 0;
  };

  // Jatuh tempo
  const getNextDueDateAsDate = (trx: HutangTransaction) => {
    const next = trx.jadwalPembayaran.find(i => !i.paid);
    return next ? new Date(next.dueDate) : new Date(trx.tanggalMaksimalPelunasan);
  };
  const nextDueDate = (trx: HutangTransaction) =>
    getNextDueDateAsDate(trx).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  // Modal handlers
  const openInstallmentModal = (trx: HutangTransaction) => {
    setSelectedTransaction(trx);
    setModalType("installment");
    setPaymentAmount("0");
  };
  const openSettleModal = (trx: HutangTransaction) => {
    setSelectedTransaction(trx);
    setModalType("settle");
    setPaymentAmount(computeSisaHutang(trx).toString());
  };
  const openHistoryModal = (trx: HutangTransaction) => {
    setHistoryTransaction(trx);
    setIsHistoryDialogOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedTransaction) return;
    const sisa = computeSisaHutang(selectedTransaction);
    if (modalType === "installment" && Number(paymentAmount) <= 0) {
      toast.error("Jumlah pembayaran minimal > 0");
      return;
    }
    if (modalType === "settle" && Number(paymentAmount) < sisa) {
      toast.error("Jumlah < sisa hutang");
      return;
    }
    try {
      const res = await payInstallment(
        selectedTransaction._id,
        paymentAmount,
        getTimestampWithCurrentTime(selectedDate)
      );
      if (res.data.status === 200) {
        toast.success("Pembayaran berhasil");
        setModalType(null);
        loadData();
      } else {
        toast.error(res.data.error || "Pembayaran gagal");
      }
    } catch {
      toast.error("Kesalahan saat pembayaran");
    }
  };

  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Sorting
  const sortedTransactions = useMemo(() => {
    const arr = [...transactions];
    arr.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "no_transaksi": return a.no_transaksi.localeCompare(b.no_transaksi);
        case "tanggal": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "supplier": return (a.supplier?.nama || "").localeCompare(b.supplier?.nama || "");
        case "total_harga": return a.total_harga - b.total_harga;
        case "dp": return a.dp - b.dp;
        case "sisa_hutang": return computeSisaHutang(a) - computeSisaHutang(b);
        case "jatuh_tempo": return getNextDueDateAsDate(a).getTime() - getNextDueDateAsDate(b).getTime();
        default: return 0;
      }
    });
    if (sortDirection === "desc") arr.reverse();
    return arr;
  }, [transactions, sortField, sortDirection]);

  const toggleTransaction = (id: string) =>
    setExpandedTransactions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Summary
  const totalHutang = transactions.reduce((sum, t) => sum + t.total_harga, 0);
  const totalDp = transactions.reduce((sum, t) => sum + t.dp, 0);
  const totalPaid = transactions.reduce((sum, t) => sum + (t.dp + sumPaidInstallments(t)), 0);
  const totalSisa = transactions.reduce((sum, t) => sum + computeSisaHutang(t), 0);

  return (
    <div className="p-4 dark:bg-boxdark dark:text-gray-100">
      <h1 className="mb-4 text-2xl font-bold">Daftar Hutang Cicilan</h1>

      {/* Summary */}
      <div className="mb-4 rounded-md bg-gray-100 p-4 dark:bg-gray-800">
        <p>Total Hutang: Rp {totalHutang.toLocaleString("id-ID")}</p>
        <p>Total DP: Rp {totalDp.toLocaleString("id-ID")}</p>
        <p>Sudah Dibayar: Rp {totalPaid.toLocaleString("id-ID")}</p>
        <p>Sisa Hutang: Rp {totalSisa.toLocaleString("id-ID")}</p>
      </div>

      {/* Form Filter */}
      <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Supplier */}
        <div>
          <label className="block text-sm font-medium">Supplier</label>
          <Select
            options={suppliers.map(s => ({ value: s._id, label: s.nama }))}
            isClearable
            isSearchable
            placeholder="Cari Supplier..."
            onChange={sel => setSelectedSupplierId(sel?.value || "")}        
          />
        </div>
        {/* Tanggal */}
        <div>
          <label className="block text-sm font-medium">Tanggal Mulai</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
        </div>
        <div>
          <label className="block text-sm font-medium">Tanggal Akhir</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
        </div>
        <button type="submit" className="col-span-full bg-tosca text-white px-4 py-2 rounded">Terapkan Filter</button>
      </form>

      {/* ... tabel dan mobile view serta modal seperti sebelumnya ... */}
    </div>
  );
}
