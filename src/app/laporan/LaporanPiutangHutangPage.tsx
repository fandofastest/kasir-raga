"use client";

import { useEffect, useState, FormEvent, MouseEvent } from "react";
import * as XLSX from "xlsx";
import Select from "react-select";
import Image from "next/image";
import {
  fetchTransaction,
  fetchSupplier,
  fetchPelanggan,
  fetchKategori,
  fetchProducts,
} from "@/lib/dataService";
import Transaksi from "@/models/modeltsx/Transaksi";
import { formatRupiah } from "@/components/tools";

interface LaporanHutangPiutangPageProps {
  reportType: "piutang" | "hutang";
}

export default function LaporanHutangPiutangPage({
  reportType,
}: LaporanHutangPiutangPageProps) {
  const isPiutang = reportType === "piutang";

  // Filter state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Untuk piutang, gunakan konsumen; untuk hutang, gunakan supplier
  const [konsumen, setKonsumen] = useState<string>("");
  const [supplier, setSupplier] = useState<string>("");

  const [kategori, setKategori] = useState<string>("");
  const [produk, setProduk] = useState<string>("");

  // Options dropdown
  const [supplierOptions, setSupplierOptions] = useState<any[]>([]);
  const [konsumenOptions, setKonsumenOptions] = useState<any[]>([]);
  const [kategoriOptions, setKategoriOptions] = useState<any[]>([]);
  const [produkOptions, setProdukOptions] = useState<any[]>([]);

  // Transaksi yang ditampilkan
  const [transactions, setTransactions] = useState<Transaksi[]>([]);

  // Loading & error
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Informasi toko untuk header cetak
  const [storeName, setStoreName] = useState<string>("Nama Minimarket");
  const [storeAddress, setStoreAddress] = useState<string>(
    "Jln. Alamat Surabaya",
  );
  const [storePhone, setStorePhone] = useState<string>("081353935206");
  const [logo, setLogo] = useState<string>("");

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Mobile detection
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Muat informasi toko dari localStorage
  useEffect(() => {
    const localCompanyName = localStorage.getItem("companyName");
    const localCompanyAddress = localStorage.getItem("companyAddress");
    const localCompanyPhone = localStorage.getItem("companyPhone");
    const localCompanyLogo = localStorage.getItem("companyLogo");
    if (localCompanyName) setStoreName(localCompanyName);
    if (localCompanyAddress) setStoreAddress(localCompanyAddress);
    if (localCompanyPhone) setStorePhone(localCompanyPhone);
    if (localCompanyLogo) setLogo(localCompanyLogo);
  }, []);

  // Load opsi dropdown dari API
  const loadOptions = async () => {
    try {
      const supplierRes = await fetchSupplier();
      setSupplierOptions(supplierRes.data);
      const konsumenRes = await fetchPelanggan();
      setKonsumenOptions(konsumenRes.data);
      const kategoriRes = await fetchKategori();
      setKategoriOptions(kategoriRes.data);
      const produkRes = await fetchProducts();
      setProdukOptions(produkRes.data);
    } catch (err) {
      console.error("Gagal memuat opsi:", err);
    }
  };

  // Load transaksi berdasarkan filter dan reportType
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params: { [key: string]: string } = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (kategori) params.kategori = kategori;
      if (produk) params.produk = produk;
      // Berdasarkan reportType, tetapkan tipe_transaksi dan filter berdasarkan konsumen atau supplier
      if (isPiutang) {
        if (konsumen) params.pelanggan = konsumen;
        params.tipe_transaksi = "penjualan";
      } else {
        if (supplier) params.supplier = supplier;
        params.tipe_transaksi = "pembelian";
      }
      // Kedua kasus: metode_pembayaran = "cicilan"
      params.metode_pembayaran = "cicilan";
      if (sortColumn) {
        params.sortBy = sortColumn;
        params.sortOrder = sortDirection;
      }
      const result = await fetchTransaction(params);
      setTransactions(result.data.transactions);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
    loadTransactions();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadTransactions();
  };

  // Sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    loadTransactions();
  };

  const renderSortIndicator = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? " ▲" : " ▼";
    }
    return "";
  };

  // Sorting dan pagination
  const sortedTransactions = [...transactions];
  if (sortColumn) {
    sortedTransactions.sort((a, b) => {
      let valA = a[sortColumn as keyof Transaksi];
      let valB = b[sortColumn as keyof Transaksi];
      if (sortColumn === "createdAt") {
        const dateA = new Date(valA as string).getTime();
        const dateB = new Date(valB as string).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return 0;
    });
  }
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedTransactions = sortedTransactions.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Summary
  const summary = {
    count: sortedTransactions.length,
    total: sortedTransactions.reduce((sum, trx) => sum + trx.total_harga, 0),
  };

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: "var(--rs-bg)",
      borderColor: "var(--rs-border)",
      color: "var(--rs-text)",
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: "var(--rs-text)",
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: "var(--rs-bg)",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? "var(--rs-option-hover)"
        : "var(--rs-option-bg)",
      color: "var(--rs-text)",
    }),
  };

  // Export & Print
  const handlePrint = () => {
    window.print();
  };

  const handleExportToExcel = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const dataToExport = sortedTransactions.map((trx, index) => {
      const baseData = {
        No: index + 1,
        "No Transaksi": trx.no_transaksi,
        Tanggal: new Date(trx.createdAt).toLocaleDateString("id-ID"),
        Tipe: trx.tipe_transaksi,
      };
      if (isPiutang) {
        return {
          ...baseData,
          Pelanggan: trx.pembeli?.nama || "-",
          Total: trx.total_harga,
          "Metode Pembayaran": trx.metode_pembayaran,
          Operator:
            typeof trx.kasir === "object" && trx.kasir
              ? trx.kasir.name
              : trx.kasir,
        };
      } else {
        return {
          ...baseData,
          Supplier: trx.supplier?.nama || "-",
          Total: trx.total_harga,
          "Metode Pembayaran": trx.metode_pembayaran,
          Operator:
            typeof trx.kasir === "object" && trx.kasir
              ? trx.kasir.name
              : trx.kasir,
        };
      }
    });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const summaryRows = isPiutang
      ? [
          [],
          ["Jumlah Transaksi", summary.count],
          ["Total Piutang", "Rp " + summary.total.toLocaleString("id-ID")],
        ]
      : [
          [],
          ["Jumlah Transaksi", summary.count],
          ["Total Hutang", "Rp " + summary.total.toLocaleString("id-ID")],
        ];
    XLSX.utils.sheet_add_aoa(worksheet, summaryRows, { origin: -1 });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      isPiutang ? "LaporanPiutang" : "LaporanHutang",
    );
    XLSX.writeFile(
      workbook,
      isPiutang ? "LaporanPiutang.xlsx" : "LaporanHutang.xlsx",
    );
  };

  return (
    <>
      <style jsx global>{`
        :root {
          --rs-bg: white;
          --rs-text: black;
          --rs-border: #e2e8f0;
          --rs-option-bg: white;
          --rs-option-hover: #e2e8f0;
        }
        .dark {
          --rs-bg: #1f2937;
          --rs-text: white;
          --rs-border: #374151;
          --rs-option-bg: #1f2937;
          --rs-option-hover: #374151;
        }
        @media print {
          /* Pastikan konten desktop tampil saat print */
          .desktopTable {
            display: block !important;
          }
          /* Sembunyikan accordion mobile */
          .mobileAccordion {
            display: none !important;
          }
          /* Override warna teks dan background untuk print */
          body,
          table,
          th,
          td,
          p,
          h2,
          h3 {
            color: black !important;
            background: white !important;
          }
        }
      `}</style>
      <div className="p-4 dark:bg-boxdark dark:text-gray-100 print:bg-white print:text-black">
        {/* Filter Form (tidak tampil saat print) */}
        <div className="mb-6 print:hidden">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            {isPiutang ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Konsumen
                </label>
                <Select
                  styles={customStyles}
                  options={konsumenOptions.map((opt) => ({
                    value: opt._id,
                    label: opt.nama,
                  }))}
                  onChange={(selected) =>
                    setKonsumen(selected ? selected.value : "")
                  }
                  isClearable
                  placeholder="Pilih Konsumen..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Supplier
                </label>
                <Select
                  styles={customStyles}
                  options={supplierOptions.map((opt) => ({
                    value: opt._id,
                    label: opt.nama,
                  }))}
                  onChange={(selected) =>
                    setSupplier(selected ? selected.value : "")
                  }
                  isClearable
                  placeholder="Pilih Supplier..."
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kategori
              </label>
              <Select
                styles={customStyles}
                options={kategoriOptions.map((opt) => ({
                  value: opt._id,
                  label: opt.nama,
                }))}
                onChange={(selected) =>
                  setKategori(selected ? selected.value : "")
                }
                isClearable
                placeholder="Pilih Kategori..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Produk
              </label>
              <Select
                styles={customStyles}
                options={produkOptions.map((opt) => ({
                  value: opt.nama_produk,
                  label: opt.nama_produk,
                }))}
                onChange={(selected) =>
                  setProduk(selected ? selected.value : "")
                }
                isClearable
                placeholder="Pilih Produk..."
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded bg-tosca px-4 py-2 text-white hover:bg-toscadark"
              >
                Terapkan Filter
              </button>
            </div>
          </form>
        </div>

        {/* Header Cetak */}
        <div className="mb-4 flex flex-col items-center border-b pb-2 dark:border-gray-700 sm:flex-row sm:justify-between">
          <div className="flex items-center space-x-4">
            {logo && (
              <Image
                src={`/api/image-proxy?url=${encodeURIComponent(logo)}`}
                alt="Logo Toko"
                width={100}
                height={100}
                className="h-16 w-16 object-cover"
              />
            )}
            <div>
              <h2 className="text-lg font-bold">{storeName}</h2>
              <p>{storeAddress}</p>
              <p>{storePhone}</p>
            </div>
          </div>
          <div className="mt-4 text-right text-sm font-bold sm:mt-0">
            <p>
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Ringkasan */}
        <div className="mb-6">
          {isPiutang ? (
            <div className="flex flex-col justify-end gap-4 sm:flex-row">
              <div className="rounded bg-gray-100 p-2 dark:bg-gray-700">
                <p className="text-right text-sm font-medium">
                  Jumlah Transaksi Piutang
                </p>
                <p className="text-right text-lg font-bold">
                  {transactions.length}
                </p>
              </div>
              <div className="rounded bg-gray-100 p-2 dark:bg-gray-700">
                <p className="text-right text-sm font-medium">Total Piutang</p>
                <p className="text-right text-lg font-bold">
                  {formatRupiah(summary.total)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-end gap-4 sm:flex-row">
              <div className="rounded bg-gray-100 p-2 dark:bg-gray-700">
                <p className="text-right text-sm font-medium">
                  Jumlah Transaksi Hutang
                </p>
                <p className="text-right text-lg font-bold">
                  {transactions.length}
                </p>
              </div>
              <div className="rounded bg-gray-100 p-2 dark:bg-gray-700">
                <p className="text-right text-sm font-medium">Total Hutang</p>
                <p className="text-right text-lg font-bold">
                  {formatRupiah(summary.total)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tabel untuk Desktop */}
        <div
          className={`desktopTable ${isMobile ? "hidden" : "block"} print:block`}
        >
          <div className="overflow-x-auto">
            <table className="w-full border text-xs">
              <thead className="bg-gray-100 text-left dark:bg-gray-800">
                <tr>
                  <th className="border px-2 py-1">No. Transaksi</th>
                  <th className="border px-2 py-1">Tanggal</th>
                  {isPiutang ? (
                    <th className="border px-2 py-1">Pelanggan</th>
                  ) : (
                    <th className="border px-2 py-1">Supplier</th>
                  )}
                  <th className="border px-2 py-1">
                    Total {isPiutang ? "Piutang" : "Hutang"}
                  </th>
                  <th className="border px-2 py-1">Metode</th>
                  <th className="border px-2 py-1">Operator</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, itemsPerPage).map((trx) => (
                  <tr key={trx._id} className="hover:bg-gray-50">
                    <td className="border px-2 py-1">{trx.no_transaksi}</td>
                    <td className="border px-2 py-1">
                      {new Date(trx.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    {isPiutang ? (
                      <td className="border px-2 py-1">
                        {trx.pembeli?.nama || "-"}
                      </td>
                    ) : (
                      <td className="border px-2 py-1">
                        {trx.supplier?.nama || "-"}
                      </td>
                    )}
                    <td className="border px-2 py-1 text-right">
                      {formatRupiah(trx.total_harga)}
                    </td>
                    <td className="border px-2 py-1">
                      {trx.metode_pembayaran}
                    </td>
                    <td className="border px-2 py-1">
                      {typeof trx.kasir === "object" && trx.kasir
                        ? trx.kasir.name
                        : trx.kasir}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end space-x-2 text-sm print:hidden">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded border px-2 py-1 disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="rounded border px-2 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Accordion untuk Mobile */}
        <div
          className={`mobileAccordion ${isMobile ? "block" : "hidden"} print:hidden`}
        >
          {transactions.slice(0, itemsPerPage).map((trx) => (
            <div key={trx._id} className="mb-2 rounded border">
              <div
                className="flex cursor-pointer items-center justify-between p-2"
                onClick={() => {}}
              >
                <div>
                  <p className="font-bold">{trx.no_transaksi}</p>
                  <p>{new Date(trx.createdAt).toLocaleDateString("id-ID")}</p>
                </div>
                <div className="font-bold">+</div>
              </div>
              {/* Detail accordion bisa ditambahkan jika diperlukan */}
            </div>
          ))}
          <div className="mt-4 flex justify-end space-x-2 text-sm print:hidden">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded border px-2 py-1 disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="rounded border px-2 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Tombol Export & Print */}
        <div className="mt-4 flex gap-2 print:hidden">
          <button
            onClick={handleExportToExcel}
            className="rounded bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600"
          >
            Export to Excel
          </button>
          <button
            onClick={handlePrint}
            className="hover:bg-toscadark-600 rounded bg-tosca px-4 py-2 text-white"
          >
            Print Laporan
          </button>
        </div>
      </div>
    </>
  );
}
