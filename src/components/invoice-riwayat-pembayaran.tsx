"use client";

import React, { useState, useEffect } from "react";
import Transaksi from "@/models/modeltsx/Transaksi";
import QRCode from "react-qr-code";
import { useSession } from "next-auth/react";
import { getPreferences } from "@/lib/dataService"; // Pastikan fungsi ini sudah diimplementasikan
import Image from "next/image";

interface PaymentSchedule {
  dueDate: Date;
  installment: number;
  paid: boolean;
  paymentDate?: Date;
}

interface InvoiceProps {
  transaksi: Transaksi & {
    jadwalPembayaran?: PaymentSchedule[];
  };
}

const InvoicePaymentHistoryPage: React.FC<InvoiceProps> = ({ transaksi }) => {
  // Ambil session dari NextAuth
  const { data: session } = useSession();

  // State data perusahaan
  const [companyName, setCompanyName] = useState("Perusahaan Default");
  const [companyAddress, setCompanyAddress] = useState("Alamat Default");
  const [companyPhone, setCompanyPhone] = useState("Telepon Default");
  const [companyLogo, setCompanyLogo] = useState("");

  // Fungsi untuk menyimpan data ke localStorage
  const saveCompanyDataToLocal = (data: any) => {
    localStorage.setItem("companyName", data.companyName);
    localStorage.setItem("companyAddress", data.companyAddress);
    localStorage.setItem("companyPhone", data.companyPhone);
    localStorage.setItem("companyLogo", data.companyLogo);
  };

  useEffect(() => {
    const localCompanyName = localStorage.getItem("companyName");
    const localCompanyAddress = localStorage.getItem("companyAddress");
    const localCompanyPhone = localStorage.getItem("companyPhone");
    const localCompanyLogo = localStorage.getItem("companyLogo");

    if (localCompanyName && localCompanyAddress && localCompanyPhone) {
      setCompanyName(localCompanyName);
      setCompanyAddress(localCompanyAddress);
      setCompanyPhone(localCompanyPhone);
      setCompanyLogo(localCompanyLogo || "");
    } else {
      const fetchPreferences = async () => {
        try {
          const { data } = await getPreferences();
          setCompanyName(data.companyName);
          setCompanyAddress(data.companyAddress);
          setCompanyPhone(data.companyPhone);
          setCompanyLogo(data.companyLogo);
          saveCompanyDataToLocal(data);
        } catch (error) {
          console.error("Error fetching preferences:", error);
        }
      };
      fetchPreferences();
    }
  }, []);

  // State untuk mode cetak (pelanggan/armada)
  const [printMode, setPrintMode] = useState<"pelanggan" | "armada" | null>(
    null,
  );

  // Trigger printing ketika printMode berubah
  useEffect(() => {
    if (printMode !== null) {
      setTimeout(() => {
        window.print();
      }, 100);
    }
  }, [printMode]);

  // Reset printMode setelah pencetakan selesai
  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintMode(null);
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  // Helper: menampilkan nama staff (bisa berupa string atau object)
  const getNamaStaff = (staffOrString: any) => {
    return typeof staffOrString === "object"
      ? staffOrString?.name || "-"
      : staffOrString || "-";
  };

  // Helper: menampilkan nama pembeli/supplier
  const getNamaPS = () => {
    if (transaksi.tipe_transaksi === "penjualan") {
      return transaksi.pembeli?.nama || "-";
    } else if (transaksi.tipe_transaksi === "pembelian") {
      return transaksi.supplier?.nama || "-";
    }
    return "-";
  };

  // Daftar produk dari transaksi
  const produk = transaksi.produk || [];

  // Hitung subtotal (quantity * harga)
  const subTotal = produk.reduce((acc, item) => {
    const rowTotal = item.quantity * item.harga;
    return acc + rowTotal;
  }, 0);

  // Diskon transaksi dan contoh PPN
  const diskon = transaksi.diskon || 0;
  const ppn = 0;
  const grandTotal = subTotal - diskon + ppn;

  // Judul faktur
  const judulFaktur =
    transaksi.tipe_transaksi === "penjualan"
      ? "FAKTUR PENJUALAN"
      : transaksi.tipe_transaksi === "pembelian"
        ? "FAKTUR PEMBELIAN"
        : "FAKTUR";

  // Jika ada riwayat pembayaran, hitung summary-nya.
  let totalHutang = 0;
  let totalDp = transaksi.dp || 0;
  let paidAmount = 0;
  let outstanding = 0;
  if (transaksi.jadwalPembayaran && transaksi.jadwalPembayaran.length > 0) {
    // Misal total hutang adalah grandTotal dikurangi DP.
    totalHutang = grandTotal - totalDp;
    paidAmount = transaksi.jadwalPembayaran.reduce(
      (sum, inst) => (inst.paid ? sum + inst.installment : sum),
      0,
    );
    outstanding = totalHutang - paidAmount;
  }

  return (
    <div className="relative mx-auto w-full max-w-[8.3in] bg-white p-8 text-sm text-black shadow dark:bg-gray-900 dark:text-white print:!bg-white print:!text-black print:shadow-none">
      {/* Stempel Lunas: tampilkan jika outstanding kurang dari atau sama dengan 0 */}
      {outstanding <= 0 && (
        <div className="absolute bottom-40 right-4 rotate-12 transform">
          <Image
            src={`/images/lunas.png`}
            alt="Lunas"
            width={200}
            height={200}
            className="h-60 w-60 opacity-75"
          />
        </div>
      )}

      {/* Header Invoice */}
      <div className="flex border-b pb-4">
        {/* Kiri: Info Perusahaan */}
        <div className="flex-1">
          {companyLogo && (
            <div className="relative h-[100px] w-[100px] rounded-md border border-gray-300">
              <Image
                src={`/api/image-proxy?url=${encodeURIComponent(companyLogo)}`}
                alt="Company Logo"
                fill
                className="rounded-md object-cover"
              />
            </div>
          )}
          <h2 className="text-base font-bold">{companyName}</h2>
          <p>{companyAddress}</p>
          <p>{companyPhone}</p>
        </div>
        {/* Tengah: Judul Faktur */}
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold uppercase">{judulFaktur}</h1>
        </div>
        {/* Kanan: Detail Transaksi */}
        <div className="flex-1 text-right">
          <p>
            <strong>Tanggal:</strong>{" "}
            {new Date(transaksi.createdAt).toLocaleDateString("id-ID")}
          </p>
          <p>
            <strong>Faktur:</strong> {transaksi.no_transaksi}
          </p>
          <p>
            <strong>Sales:</strong> {getNamaStaff(transaksi.kasir)}
          </p>
          <p>
            <strong>
              {transaksi.tipe_transaksi === "penjualan"
                ? "Pelanggan"
                : transaksi.tipe_transaksi === "pembelian"
                  ? "Supplier"
                  : "Pihak"}
              :
            </strong>{" "}
            {getNamaPS()}
          </p>
          <p>
            <strong>Pembayaran:</strong> {transaksi.metode_pembayaran || "-"}
          </p>
          {/* Tambahan untuk mode armada */}
          {printMode === "armada" && (
            <>
              <p>
                <strong>Armada:</strong>{" "}
                {typeof transaksi.pengantar === "object"
                  ? transaksi.pengantar?.name || "-"
                  : transaksi.pengantar || "-"}
              </p>
              <p>
                <strong>Buruh Bongkar:</strong>{" "}
                {typeof transaksi.staff_bongkar === "object"
                  ? transaksi.staff_bongkar?.name || "-"
                  : transaksi.staff_bongkar || "-"}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Tabel Produk */}
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">No</th>
            <th className="py-2">Nama</th>
            <th className="py-2 text-right">Jumlah</th>
            <th className="py-2">Satuan</th>
            <th className="py-2 text-right">Harga</th>
            <th className="py-2 text-right">Diskon</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {produk.length > 0 ? (
            produk.map((item, index) => {
              const rowTotal = item.quantity * item.harga;
              return (
                <tr key={index} className="border-b last:border-none">
                  <td className="py-2">{index + 1}</td>
                  <td className="py-2">{item.productId?.nama_produk || "-"}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2">
                    {item.satuans && item.satuans.length > 0
                      ? item.satuans
                          .map((satuan: any) => satuan.nama)
                          .join(", ")
                      : "-"}
                  </td>
                  <td className="py-2 text-right">
                    Rp{" "}
                    {printMode === "armada"
                      ? "****"
                      : item.harga.toLocaleString("id-ID")}
                  </td>
                  <td className="py-2 text-right">
                    Rp{printMode === "armada" ? "****" : "0"}
                  </td>
                  <td className="py-2 text-right">
                    Rp{" "}
                    {printMode === "armada"
                      ? "****"
                      : rowTotal.toLocaleString("id-ID")}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td className="py-2" colSpan={7}>
                Tidak ada produk.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Ringkasan Invoice */}
      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-xs">
          <div className="flex justify-between">
            <span>Diskon</span>
            <span>
              Rp
              {printMode === "armada" ? "****" : diskon.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>PPN</span>
            <span>
              Rp{printMode === "armada" ? "****" : ppn.toLocaleString("id-ID")}
            </span>
          </div>
          {transaksi.metode_pembayaran === "cicilan" && (
            <div className="mt-2 flex justify-between border-t pt-2 font-bold">
              <span>DP</span>
              <span>
                Rp
                {printMode === "armada"
                  ? "****"
                  : transaksi.dp?.toLocaleString("id-ID")}
              </span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t pt-2 font-bold">
            <span>Grand Total</span>
            <span>
              Rp
              {printMode === "armada"
                ? "****"
                : grandTotal.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      {/* Section Riwayat Pembayaran */}
      {transaksi.jadwalPembayaran && transaksi.jadwalPembayaran.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold">Riwayat Pembayaran</h2>

          {/* Summary Riwayat Pembayaran */}
          <div className="mb-4 rounded">
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

          {/* Tabel Riwayat Pembayaran */}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-center">No</th>
                <th className="py-2 text-center">Jatuh Tempo</th>
                <th className="py-2 text-center">Cicilan</th>
                <th className="py-2 text-center">Status</th>
                <th className="py-2 text-center">Tanggal Bayar</th>
              </tr>
            </thead>
            <tbody>
              {transaksi.jadwalPembayaran.map((inst, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 text-center">{index + 1}</td>
                  <td className="py-2 text-center">
                    {new Date(inst.dueDate).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-2 text-center">
                    {inst.installment.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-2 text-center">
                    {inst.paid ? "Dibayar" : "Belum Dibayar"}
                  </td>
                  <td className="py-2 text-center">
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
      )}

      {/* Tombol Cetak (hanya tampil jika user sudah login) */}
      {session && (
        <div className="mt-6 flex justify-end space-x-2 print:hidden">
          <button
            onClick={() => setPrintMode("pelanggan")}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Cetak untuk Pelanggan
          </button>
          <button
            onClick={() => setPrintMode("armada")}
            className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
          >
            Cetak untuk Armada
          </button>
        </div>
      )}

      {/* QR Code di pojok kanan bawah */}
      <div style={{ position: "fixed", bottom: "20px", right: "20px" }}>
        <QRCode
          value={typeof window !== "undefined" ? window.location.href : ""}
          size={80}
        />
      </div>
    </div>
  );
};

export default InvoicePaymentHistoryPage;
