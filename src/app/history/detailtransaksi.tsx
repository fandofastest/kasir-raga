"use client";

import { useState, useEffect } from "react";
import { Staff } from "@/models/modeltsx/staffTypes";
import Transaksi from "@/models/modeltsx/Transaksi";
import InvoicePage from "@/components/invoice";

interface TransactionDetailDialogProps {
  transaction: Transaksi;
  staffOptions: Staff[]; // Daftar staff lengkap untuk memilih pengantar & tukang bongkar
  onClose: () => void;
  onUpdate: (updatedTransaction: Transaksi) => void;
}

const TransactionDetailDialog = ({
  transaction,
  staffOptions,
  onClose,
  onUpdate,
}: TransactionDetailDialogProps) => {
  // Nonaktifkan scroll pada body saat dialog terbuka
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // State untuk mengatur tampilan dialog Invoice
  const [showInvoice, setShowInvoice] = useState(false);

  // Inisialisasi form state untuk update
  const [status, setStatus] = useState(transaction.status_transaksi);
  const [selectedPengantar, setSelectedPengantar] = useState(
    transaction.pengantar
      ? typeof transaction.pengantar === "object"
        ? transaction.pengantar._id
        : transaction.pengantar
      : "",
  );
  const [selectedStaffBongkar, setSelectedStaffBongkar] = useState(
    transaction.staff_bongkar
      ? typeof transaction.staff_bongkar === "object"
        ? transaction.staff_bongkar._id
        : transaction.staff_bongkar
      : "",
  );
  // State untuk metode pembayaran tambahan, jika status berubah dari "belum_lunas" ke "lunas"
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");

  // Filter opsi staff untuk masing-masing role
  const pengantarOptions = staffOptions.filter(
    (staff) => staff.role === "staffAntar",
  );
  const staffBongkarOptions = staffOptions.filter(
    (staff) => staff.role === "staffBongkar",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTransaction: Transaksi = {
      ...transaction,
      status_transaksi: status,
      pengantar: selectedPengantar as string,
      staff_bongkar: selectedStaffBongkar as string,
      // Jika status diubah dari "belum_lunas" ke "lunas", maka update metode pembayaran
      ...(status === "lunas" &&
        transaction.status_transaksi === "belum_lunas" && {
          metode_pembayaran: selectedPaymentMethod as
            | "tunai"
            | "edc"
            | "bank_transfer"
            | "cicilan"
            | "hutang",
        }),
    };
    onUpdate(updatedTransaction);
    onClose();
  };

  return (
    <>
      {/* Modal Detail Transaksi (tidak tampil saat print) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 print:hidden">
        <div className="max-h-screen w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-gray-800">
          <h2 className="mb-6 mt-10 text-2xl font-bold text-gray-800 dark:text-gray-100">
            Detail Transaksi: {transaction.no_transaksi}
          </h2>

          {/* Tampilan detail transaksi */}
          <div className="mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Nomor Transaksi:
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  {transaction.no_transaksi}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Tanggal:
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  {new Date(transaction.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Metode Pembayaran:
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  {transaction.metode_pembayaran.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Status Transaksi:
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  {transaction.status_transaksi.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Tipe Transaksi:
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  {transaction.tipe_transaksi.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Total Harga:
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  Rp {transaction.total_harga.toLocaleString()}
                </p>
              </div>
              {transaction.diskon !== undefined && transaction.diskon > 0 && (
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    Diskon:
                  </p>
                  <p className="text-gray-900 dark:text-gray-100">
                    Rp {transaction.diskon.toLocaleString()}
                  </p>
                </div>
              )}
              <div className="sm:col-span-2">
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Keterangan:
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  {transaction.keterangan}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Supplier / Pembeli:
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  {transaction.tipe_transaksi === "pembelian"
                    ? transaction.supplier?.nama || "N/A"
                    : transaction.pembeli?.nama || "N/A"}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Kasir:
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  {typeof transaction.kasir === "object"
                    ? transaction.kasir.name
                    : transaction.kasir}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Pengantar:
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  {transaction.pengantar
                    ? typeof transaction.pengantar === "object"
                      ? transaction.pengantar.name || ""
                      : transaction.pengantar || ""
                    : ""}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Tukang Bongkar:
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  {transaction.staff_bongkar
                    ? typeof transaction.staff_bongkar === "object"
                      ? transaction.staff_bongkar.name || ""
                      : transaction.staff_bongkar || ""
                    : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Form untuk update detail transaksi */}
          <form onSubmit={handleSubmit} className="border-t pt-4">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">
              Perbarui Detail Transaksi
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status Transaksi
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as
                      | "lunas"
                      | "belum_lunas"
                      | "batal"
                      | "tunda",
                  )
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="lunas">Lunas</option>
                <option value="belum_lunas">Belum Lunas</option>
                <option value="tunda">Tunda</option>
                <option value="batal">Batal</option>
              </select>
            </div>
            {status === "lunas" &&
              transaction.status_transaksi === "belum_lunas" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Metode Pembayaran
                  </label>
                  <select
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Pilih Metode Pembayaran</option>
                    <option value="tunai">Tunai</option>
                    <option value="edc">EDC</option>
                    <option value="bank_transfer">Transfer</option>
                    <option value="cicilan">Cicilan</option>
                  </select>
                </div>
              )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pengantar (Tukang Antar)
              </label>
              <select
                value={selectedPengantar}
                onChange={(e) => setSelectedPengantar(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Pilih Pengantar</option>
                {pengantarOptions.map((staff) => (
                  <option key={staff._id} value={staff._id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tukang Bongkar
              </label>
              <select
                value={selectedStaffBongkar}
                onChange={(e) => setSelectedStaffBongkar(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Pilih Tukang Bongkar</option>
                {staffBongkarOptions.map((staff) => (
                  <option key={staff._id} value={staff._id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="mb-2 rounded bg-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-400 sm:mb-0"
              >
                Batal
              </button>
              <button
                type="submit"
                className="mb-2 rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 sm:mb-0"
              >
                Perbarui
              </button>
              <button
                onClick={() =>
                  window.open(`/invoice/${transaction.no_transaksi}`, "_blank")
                }
                className="rounded bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600"
              >
                Invoice
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Invoice (tetap tampil saat print) */}
      {showInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-screen w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-gray-800 print:!m-0 print:max-w-full print:rounded-none print:p-0">
            {/* Bungkus InvoicePage dengan div khusus untuk print */}
            <div className="print-area">
              <InvoicePage transaksi={transaction} />
            </div>
            <div className="mt-4 flex justify-end print:hidden">
              <button
                onClick={() => setShowInvoice(false)}
                className="rounded bg-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-400"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aturan global khusus print */}
      <style jsx global>{`
        @media print {
          /* Sembunyikan seluruh konten kecuali area cetak */
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
};

export default TransactionDetailDialog;
