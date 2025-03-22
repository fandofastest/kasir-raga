// app/invoice/[invoice]/page.tsx
import React from "react";
import InvoicePage from "@/components/invoice";
import { connectToDatabase } from "@/lib/mongodb";
import { notFound } from "next/navigation";
import Transaksi from "@/models/transaksi";
import InvoicePaymentHistoryPage from "@/components/invoice-riwayat-pembayaran";

interface InvoicePageRouteProps {
  params: {
    invoice: string;
  };
}

export default async function InvoicePageRoute({
  params,
}: InvoicePageRouteProps) {
  const invoiceNo = params.invoice;
  await connectToDatabase();

  const transaction = await Transaksi.findOne({ no_transaksi: invoiceNo })
    .populate("kasir supplier pembeli pengantar staff_bongkar")
    .populate("produk.productId")
    .populate("produk.satuans", "nama")
    .lean();

  if (!transaction) {
    notFound();
  }

  // Pastikan field yang tidak serializable diubah ke string

  return <InvoicePaymentHistoryPage transaksi={transaction as any} />;
}
