"use client";

import React, { useState, useEffect, FormEvent, useMemo } from "react";
import Select from "react-select";
import { toast } from "react-hot-toast";
import {
  fetchTransaction,
  payInstallment,
  fetchPelanggan,
  fetchKategoriKonsumen,
} from "@/lib/dataService";
import Transaksi from "@/models/modeltsx/Transaksi";
import PaymentHistoryDialog from "./PaymentHistoryDialog";
import ActionDropdown from "./ActionDropdown";

// Interface untuk transaksi piutang
export interface PiutangTransaction extends Transaksi {
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

// Interface pelanggan (Customer)
interface Customer {
  _id: string;
  nama: string;
  nohp: string;
  alamat: string;
  kategori_konsumen?: { _id: string; nama: string };
}

// Opsi kategori pelanggan
const kategoriOptions = [
  // akan diisi dari fetchKategoriKonsumen
];

export default function PiutangPage() {
  const [transactions, setTransactions] = useState<PiutangTransaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [kategoriPelangganOptions, setKategoriPelangganOptions] = useState<{
    value: string;
    label: string;
  }[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Filter state
  const [selectedKategori, setSelectedKategori] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Modal state
  const [selectedTransaction, setSelectedTransaction] =
    useState<PiutangTransaction | null>(null);
  const [modalType, setModalType] = useState<
    "installment" | "settle" | null
  >(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  function getTimestampWithCurrentTime(dateString: string): string {
    const now = new Date();
    const timePart = now.toTimeString().split(" ")[0];
    return `${dateString}T${timePart}`;
  }

  // Riwayat pembayaran
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState<boolean>(false);
  const [historyTransaction, setHistoryTransaction] =
    useState<PiutangTransaction | null>(null);

  // Mobile expand
  const [expandedTransactions, setExpandedTransactions] =
    useState<string[]>([]);

  // Sorting
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Load kategori pelanggan
  const loadKategori = async () => {
    try {
      const res = await fetchKategoriKonsumen();
      const opts = res.data.map((k: any) => ({ value: k._id, label: k.nama }));
      setKategoriPelangganOptions(opts);
    } catch (e) {
      console.error("Gagal memuat kategori pelanggan", e);
    }
  };

  // Load data piutang
  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        metode_pembayaran: "cicilan",
        tipe_transaksi: "penjualan",
      };
      if (selectedKategori) params.kategori_konsumen = selectedKategori;
      if (selectedCustomerId) params.pelanggan = selectedCustomerId;
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

  // Load pelanggan
  const loadCustomers = async () => {
    try {
      const res = await fetchPelanggan();
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadKategori();
    loadCustomers();
    loadData();
  }, []);

  // Hitung sisa utang
  const sumPaidInstallments = (trx: PiutangTransaction) =>
    trx.jadwalPembayaran
      .filter((i) => i.paid)
      .reduce((sum, i) => sum + i.installment, 0);
  const computeSisaUtang = (trx: PiutangTransaction) => {
    const paid = sumPaidInstallments(trx);
    const sisa = trx.total_harga - trx.dp - paid;
    return sisa > 0 ? sisa : 0;
  };

  const getNextDueDateAsDate = (trx: PiutangTransaction): Date => {
    const next = trx.jadwalPembayaran.find((i) => !i.paid);
    return next ? new Date(next.dueDate) : new Date(trx.tanggalMaksimalPelunasan);
  };
  const nextDueDate = (trx: PiutangTransaction) =>
    getNextDueDateAsDate(trx).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  // Handlers
  const openInstallmentModal = (trx: PiutangTransaction) => {
    setSelectedTransaction(trx);
    setModalType("installment");
    setPaymentAmount("0");
  };
  const openSettleModal = (trx: PiutangTransaction) => {
    setSelectedTransaction(trx);
    setModalType("settle");
    setPaymentAmount(computeSisaUtang(trx).toString());
  };
  const openHistoryModal = (trx: PiutangTransaction) => {
    setHistoryTransaction(trx);
    setIsHistoryDialogOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedTransaction) return;
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
      toast.error("Terjadi kesalahan saat pembayaran");
    }
  };

  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Sorting & Memo
  const sortedTransactions = useMemo(() => {
    const arr = [...transactions];
    arr.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "no_transaksi":
          aVal = a.no_transaksi;
          bVal = b.no_transaksi;
          return aVal.localeCompare(bVal);
        case "tanggal":
          return (
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
          );
        case "sisa_utang":
          return (
            computeSisaUtang(a) - computeSisaUtang(b)
          );
        default:
          return 0;
      }
    });
    if (sortDirection === "desc") arr.reverse();
    return arr;
  }, [transactions, sortField, sortDirection]);

  const toggleTransaction = (id: string) =>
    setExpandedTransactions((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  return (
    <div className="p-4 dark:bg-boxdark dark:text-gray-100">
      <h1 className="mb-4 text-2xl font-bold">Daftar Piutang Cicilan</h1>

      {/* Filter Form */}
      <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Kategori Pelanggan */}
        <div>
          <label className="block text-sm font-medium">Kategori Pelanggan</label>
          <Select
            options={kategoriPelangganOptions}
            isClearable
            placeholder="Pilih Kategori..."
            onChange={(sel) => setSelectedKategori(sel?.value ?? "")}
          />
        </div>
        {/* Pelanggan (searchable) */}
        <div>
          <label className="block text-sm font-medium">Pelanggan</label>
          <Select
            options={customers
              .filter((c) =>
                !selectedKategori || c.kategori_konsumen?._id === selectedKategori
              )
              .map((c) => ({ value: c._id, label: c.nama }))}
            isClearable
            isSearchable
            placeholder="Cari Pelanggan..."
            onChange={(sel) => setSelectedCustomerId(sel?.value ?? "")}
          />
        </div>
        {/* Tanggal Range */}
        <div className="flex space-x-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-1/2 rounded border px-2 py-1"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-1/2 rounded border px-2 py-1"
          />
        </div>
        <button type="submit" className="col-span-full bg-tosca text-white px-4 py-2 rounded">
          Terapkan Filter
        </button>
      </form>

      {/* ...lanjutkan dengan tampilan tabel dan mobile sesuai sebelumnya... */}
    </div>
  );
}