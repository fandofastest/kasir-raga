"use client";

import React from "react";
import { XCircleIcon } from "lucide-react";

interface PaymentHistoryDialogProps {
  transaction: {
    total_harga: number;
    dp: number;
    jadwalPembayaran: {
      dueDate: Date;
      installment: number;
      paid: boolean;
      paymentDate?: Date;
    }[];
  };
  onClose: () => void;
}

const handleInvoiceClick = (transaction: any) => {
  window.open(`/invoice/${transaction.no_transaksi}/cicilan`, "_blank");
};

const PaymentHistoryDialog: React.FC<PaymentHistoryDialogProps> = ({
  transaction,
  onClose,
}) => {
  // Hitung summary:
  const totalHutang = transaction.total_harga - (transaction.dp || 0);
  const totalDp = transaction.dp || 0;
  const paidAmount = transaction.jadwalPembayaran.reduce(
    (sum, inst) => (inst.paid ? sum + inst.installment : sum),
    0,
  );
  const outstanding = totalHutang - paidAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-fit  rounded-lg bg-white p-6 dark:bg-gray-800">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Riwayat Pembayaran
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Summary Section */}
        <div className="mb-4 rounded bg-gray-100 p-4 dark:bg-gray-700">
          <p className="text-sm text-gray-800 dark:text-gray-100">
            Total Hutang:{" "}
            {totalHutang.toLocaleString("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-sm text-gray-800 dark:text-gray-100">
            DP:{" "}
            {totalDp.toLocaleString("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-sm text-gray-800 dark:text-gray-100">
            Sudah Dibayar:{" "}
            {paidAmount.toLocaleString("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
            Sisa Tagihan:{" "}
            {outstanding.toLocaleString("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        {/* Tabel Riwayat Pembayaran dengan scroll */}
        <div className="max-h-64 overflow-y-auto">
          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  No
                </th>
                <th className="border px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  Jatuh Tempo
                </th>
                <th className="border px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cicilan
                </th>
                <th className="border px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th className="border px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tanggal Bayar
                </th>
              </tr>
            </thead>
            <tbody>
              {transaction.jadwalPembayaran.map((inst, idx) => (
                <tr key={idx} className="text-center">
                  <td className="border px-4 py-2 text-sm text-gray-800 dark:text-white">
                    {idx + 1}
                  </td>
                  <td className="border px-4 py-2 text-sm text-gray-800 dark:text-white">
                    {new Date(inst.dueDate).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="border px-4 py-2 text-sm text-gray-800 dark:text-white">
                    {inst.installment.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="border px-4 py-2 text-sm text-gray-800 dark:text-white">
                    {inst.paid ? "Dibayar" : "Belum Dibayar"}
                  </td>
                  <td className="border px-4 py-2 text-sm text-gray-800 dark:text-white">
                    {inst.paymentDate
                      ? new Date(inst.paymentDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Tutup
          </button>
          <div className="px-2"></div>
          <button
            onClick={() => handleInvoiceClick(transaction)}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryDialog;
