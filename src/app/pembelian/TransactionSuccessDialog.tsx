// TransactionSuccessDialog.tsx
"use client";

import React from "react";
import { XCircleIcon } from "lucide-react";
import Transaksi from "@/models/modeltsx/Transaksi";
import { useRouter } from "next/navigation"; // jika menggunakan App Router (Next.js 13+)

interface TransactionSuccessDialogProps {
  isOpen: boolean;
  transactionData: Transaksi;
  onClose: () => void;
}

const TransactionSuccessDialog: React.FC<TransactionSuccessDialogProps> = ({
  isOpen,
  transactionData,
  onClose,
}) => {
  const router = useRouter();

  if (!isOpen || !transactionData) return null;

  // Fungsi untuk mencetak invoice
  const handlePrint = () => {
    window.open(`/invoice/${transactionData.no_transaksi}`, "_blank");
  };

  // Hitung subtotal dari produk (sebelum diskon)
  const subtotal =
    transactionData.produk?.reduce(
      (sum, p) => sum + (p.harga || 0) * p.quantity,
      0,
    ) || 0;

  // Diskon (jika ada)
  const diskon = transactionData.diskon || 0;
  // Total akhir seharusnya adalah subtotal - diskon
  const finalTotal = subtotal - diskon;

  return (
    <>
      {/* Global CSS untuk print: semua teks di dalam #invoice-content akan berwarna hitam */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #invoice-content,
          #invoice-content * {
            visibility: visible;
            color: #000 !important;
          }
          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-size: 14px;
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2"
        onClick={onClose}
      >
        <div
          id="invoice-content"
          className="relative mx-auto w-full max-w-3xl rounded-lg bg-white shadow-xl dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-blue-600 px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Invoice</h1>
              <p className="text-sm text-blue-200">Transaksi Berhasil</p>
            </div>
            {/* Tombol close hanya muncul saat tidak print */}
            <button
              onClick={onClose}
              className="no-print text-blue-200 hover:text-white"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Invoice Info */}
          <div className="px-6 py-4">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  No. Transaksi
                </p>
                <p className="text-gray-800 dark:text-white">
                  {transactionData.no_transaksi}
                </p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {transactionData.tipe_transaksi === "pembelian"
                    ? "Supplier"
                    : "Pelanggan"}
                </p>
                <p className="text-gray-800 dark:text-white">
                  {transactionData.tipe_transaksi === "pembelian"
                    ? transactionData.supplier?.nama
                    : transactionData.pembeli?.nama}
                </p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Tanggal
                </p>
                <p className="text-gray-800 dark:text-white">
                  {new Date(
                    transactionData.tanggal_transaksi,
                  ).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <hr className="border-gray-300 dark:border-gray-600" />
          </div>

          {/* Invoice Details */}
          <div className="px-6 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300 dark:border-gray-600">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="border px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      No
                    </th>
                    <th className="border px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Produk
                    </th>
                    <th className="border px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                      Qty
                    </th>
                    <th className="border px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                      Harga Satuan
                    </th>
                    <th className="border px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactionData.produk?.map((p, idx) => {
                    const unitPrice = p.harga || 0;
                    const itemTotal = unitPrice * p.quantity;
                    return (
                      <tr
                        key={idx}
                        className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-700"
                      >
                        <td className="border px-4 py-2 text-sm text-gray-800 dark:text-white">
                          {idx + 1}
                        </td>
                        <td className="border px-4 py-2 text-sm text-gray-800 dark:text-white">
                          {typeof p.productId === "object"
                            ? p.productId.nama_produk
                            : p.productId}
                        </td>
                        <td className="border px-4 py-2 text-right text-sm text-gray-800 dark:text-white">
                          {p.quantity}
                        </td>
                        <td className="border px-4 py-2 text-right text-sm text-gray-800 dark:text-white">
                          Rp{unitPrice.toLocaleString()}
                        </td>
                        <td className="border px-4 py-2 text-right text-sm text-gray-800 dark:text-white">
                          Rp{itemTotal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Invoice Summary */}
            <div className="mt-6 flex flex-col items-end space-y-1">
              <p className="text-base text-gray-800 dark:text-white">
                <span className="font-semibold">Subtotal:</span> Rp
                {subtotal.toLocaleString()}
              </p>
              <p className="text-base text-gray-800 dark:text-white">
                <span className="font-semibold">Diskon:</span> Rp
                {diskon.toLocaleString()}
              </p>

              <p className="text-lg font-bold text-gray-800 dark:text-white">
                Total Harga: Rp{finalTotal.toLocaleString()}
              </p>

              {transactionData.metode_pembayaran === "cicilan" && (
                <p className="text-base text-gray-800 dark:text-white">
                  <span className="font-semibold">DP:</span> Rp
                  {transactionData.dp?.toLocaleString()}
                </p>
              )}

              {transactionData.metode_pembayaran === "cicilan" && (
                <p className="text-base text-gray-800 dark:text-white">
                  <span className="font-bold">Sisa Hutang:</span> Rp
                  {(finalTotal - (transactionData.dp ?? 0)).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Footer (tidak tercetak) */}
          <div className="no-print flex items-center justify-end bg-blue-600 px-6 py-4">
            <button
              onClick={() =>
                router.push(
                  `/keuangan/${transactionData.tipe_transaksi}?no_transaksi=${transactionData.no_transaksi}`,
                )
              }
              className="mr-4 rounded bg-blue-400 px-4 py-2 text-sm text-white hover:bg-blue-500"
            >
              Detail
            </button>
            <button
              onClick={onClose}
              className="mr-4 rounded bg-blue-400 px-4 py-2 text-sm text-white hover:bg-blue-500"
            >
              OK
            </button>
            <button
              onClick={handlePrint}
              className="rounded bg-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900"
            >
              Print
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TransactionSuccessDialog;
