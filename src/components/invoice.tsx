// components/Invoice.tsx
"use client";

import React from "react";
import Transaksi from "@/models/modeltsx/Transaksi"; // pastikan path-nya sesuai

interface InvoiceProps {
  transaksi: Transaksi;
}

const InvoicePage: React.FC<InvoiceProps> = ({ transaksi }) => {
  // Helper untuk menampilkan nama jika properti bertipe Staff atau string
  const getNama = (item: any) => {
    return typeof item === "string" ? item : item?.nama || "-";
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-gray-300 bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 border-b-2 border-gray-800 pb-4 dark:border-gray-500">
        <h1 className="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-100">
          Invoice
        </h1>
        <div className="flex flex-wrap justify-between">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>No. Transaksi:</strong> {transaksi.no_transaksi}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Tanggal:</strong>{" "}
            {new Date(transaksi.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="leading-relaxed text-gray-800 dark:text-gray-200">
        <h2 className="mb-3 text-xl font-semibold">Informasi Transaksi</h2>
        <p>
          <strong>Kasir:</strong> {getNama(transaksi.kasir)}
        </p>
        {transaksi.pembeli && (
          <p>
            <strong>Pembeli:</strong> {transaksi.pembeli.nama}
          </p>
        )}
        {transaksi.supplier && (
          <p>
            <strong>Supplier:</strong> {transaksi.supplier.nama}
          </p>
        )}
        <p>
          <strong>Total Harga:</strong>{" "}
          {transaksi.total_harga.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
          })}
        </p>
        <p>
          <strong>Metode Pembayaran:</strong>{" "}
          {transaksi.metode_pembayaran.toUpperCase()}
        </p>
        <p>
          <strong>Status Transaksi:</strong>{" "}
          {transaksi.status_transaksi.toUpperCase()}
        </p>
        <p>
          <strong>Tipe Transaksi:</strong>{" "}
          {transaksi.tipe_transaksi.toUpperCase()}
        </p>
        <p>
          <strong>Keterangan:</strong> {transaksi.keterangan}
        </p>
        <p>
          <strong>Pengantar:</strong> {getNama(transaksi.pengantar)}
        </p>
        <p>
          <strong>Staff Bongkar:</strong> {getNama(transaksi.staff_bongkar)}
        </p>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={handlePrint}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          Print
        </button>
      </div>
    </div>
  );
};

export default InvoicePage;
