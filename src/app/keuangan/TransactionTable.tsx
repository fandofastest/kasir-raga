"use client";

import React from "react";
import Transaksi from "@/models/modeltsx/Transaksi";

interface TransactionTableProps {
  transactions: Transaksi[];
  loading: boolean;
  error: string;
  sortColumn: string;
  sortDirection: string;
  handleSort: (column: string) => void;
  renderSortIndicator: (column: string) => string;
  expandedRows: string[];
  toggleRow: (id: string) => void;
  openDetailDialog: (trx: Transaksi) => void;
}

export default function TransactionTable({
  transactions,
  loading,
  error,
  handleSort,
  renderSortIndicator,
  expandedRows,
  toggleRow,
  openDetailDialog,
}: TransactionTableProps) {
  return (
    <>
      {/* Tampilan Desktop */}
      <div className="hidden md:block">
        {loading && <p className="text-gray-500">Memuat data...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300 dark:border-gray-600">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th
                    onClick={() => handleSort("no_transaksi")}
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                  >
                    Nomor Transaksi{renderSortIndicator("no_transaksi")}
                  </th>
                  <th
                    onClick={() => handleSort("pembeli")}
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                  >
                    Pelanggan{renderSortIndicator("pembeli")}
                  </th>
                  <th
                    onClick={() => handleSort("kasir")}
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                  >
                    Kasir{renderSortIndicator("kasir")}
                  </th>
                  <th
                    onClick={() => handleSort("total_harga")}
                    className="cursor-pointer border px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-200"
                  >
                    Total
                  </th>
                  <th
                    onClick={() => handleSort("createdAt")}
                    className="cursor-pointer border px-4 py-2"
                  >
                    Tanggal{renderSortIndicator("createdAt")}
                  </th>
                  <th
                    onClick={() => handleSort("metode_pembayaran")}
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                  >
                    Metode Pembayaran{renderSortIndicator("metode_pembayaran")}
                  </th>
                  <th
                    onClick={() => handleSort("status_transaksi")}
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                  >
                    Status Transaksi{renderSortIndicator("status_transaksi")}
                  </th>
                  <th
                    onClick={() => handleSort("tipe_transaksi")}
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                  >
                    Tipe Transaksi{renderSortIndicator("tipe_transaksi")}
                  </th>
                  <th
                    onClick={() => handleSort("pengantar")}
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                  >
                    Armada{renderSortIndicator("pengantar")}
                  </th>
                  <th
                    onClick={() => handleSort("staff_bongkar")}
                    className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                  >
                    Buruh Bongkar{renderSortIndicator("staff_bongkar")}
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
                        className="hover:bg-toscadark bg-tosca rounded px-2 py-1 text-white"
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

      {/* Tampilan Mobile */}
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
                      <span className="font-medium">Armada: </span>
                      {trx.pengantar
                        ? typeof trx.pengantar === "object"
                          ? trx.pengantar.name
                          : trx.pengantar
                        : ""}
                    </p>
                    <p>
                      <span className="font-medium">Buruh Bongkar: </span>
                      {trx.staff_bongkar
                        ? typeof trx.staff_bongkar === "object"
                          ? trx.staff_bongkar.name
                          : trx.staff_bongkar
                        : ""}
                    </p>
                    <button
                      onClick={() => openDetailDialog(trx)}
                      className="hover:bg-toscadark bg-tosca mt-2 block w-full rounded px-2 py-1 text-white"
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
    </>
  );
}
