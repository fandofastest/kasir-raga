// pages/invoice-dialog.tsx
import React, { useState } from "react";
import Invoice from "@/components/invoice";
import Transaksi from "@/models/modeltsx/Transaksi";

const InvoiceDialogPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const transaksiDummy: Transaksi = {
    _id: "1",
    no_transaksi: "INV-001",
    kasir: "John Doe",
    pembeli: { nama: "Agus" },
    supplier: { nama: "Supplier ABC" },
    total_harga: 1500000,
    createdAt: new Date().toISOString(),
    metode_pembayaran: "tunai",
    status_transaksi: "lunas",
    tipe_transaksi: "penjualan",
    keterangan: "Transaksi penjualan produk X",
    pengantar: "Dewi",
    staff_bongkar: "Budi",
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <button
        className="rounded-md bg-blue-500 px-4 py-2 text-white transition duration-200 hover:bg-blue-600"
        onClick={() => setIsDialogOpen(true)}
      >
        Tampilkan Invoice
      </button>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative max-h-[90vh] w-11/12 max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <button
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
              onClick={() => setIsDialogOpen(false)}
            >
              X
            </button>
            <Invoice transaksi={transaksiDummy} />
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDialogPage;
