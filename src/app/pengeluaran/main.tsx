"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { createPengeluaran, createTransaction } from "@/lib/dataService";

export default function TransaksiLainLainPage() {
  // Local state for the form
  const [nominal, setNominal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate that nominal is a valid number greater than zero
    const totalHarga = Number(nominal);
    if (!nominal || isNaN(totalHarga) || totalHarga <= 0) {
      toast.error(
        "Nominal harus diisi dengan angka yang valid dan lebih besar dari nol",
      );
      return;
    }

    // Build transaction payload. Adjust tipe_transaksi as needed (here set as "pengeluaran")
    const transactionPayload = {
      total_harga: totalHarga,
      keterangan,
      metode_pembayaran: "tunai", // default payment method
      status_transaksi: "lunas", // we mark it as paid immediately
      tipe_transaksi: "pengeluaran", // set to "pengeluaran" (or "pemasukan") for 'transaksi lain-lain'
      // Other fields will use their default values
    };

    try {
      setLoading(true);
      const res = await createPengeluaran(transactionPayload);
      if (res.data.status === 201) {
        toast.success("Transaksi berhasil dibuat");
        // Optionally, clear the form fields
        setNominal("");
        setKeterangan("");
      } else {
        toast.error(res.data.error || "Gagal membuat transaksi");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Terjadi kesalahan saat membuat transaksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Transaksi Lain-lain</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nominal
          </label>
          <input
            type="number"
            value={nominal}
            onChange={(e) => setNominal(e.target.value)}
            placeholder="Masukkan nominal"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Keterangan
          </label>
          <textarea
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Masukkan keterangan transaksi"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            rows={3}
          ></textarea>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="hover:bg-toscadark bg-tosca w-full rounded px-4 py-2 text-white"
        >
          {loading ? "Sedang diproses..." : "Buat Transaksi"}
        </button>
      </form>
    </div>
  );
}
