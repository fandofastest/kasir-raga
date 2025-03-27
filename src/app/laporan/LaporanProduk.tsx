"use client";

import { useEffect, useState, FormEvent, MouseEvent } from "react";
import * as XLSX from "xlsx";
import Image from "next/image";
import { fetchTransaction } from "@/lib/dataService";
import { formatRupiah } from "@/components/tools";

interface AggregatedProductData {
  productName: string;
  transactionCount: number;
  totalSales: number;
}

export default function LaporanProdukPage() {
  // State untuk transaksi dan data aggregate produk
  const [transactions, setTransactions] = useState<any[]>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedProductData[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Filter tanggal
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Informasi toko (header cetak)
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

  // Cek ukuran layar (untuk responsivitas)
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
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

  // Fungsi untuk memuat transaksi (misalnya transaksi penjualan)
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params: { [key: string]: string } = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      // Ambil transaksi dengan tipe penjualan
      params.tipe_transaksi = "penjualan";
      const result = await fetchTransaction(params);
      setTransactions(result.data.transactions);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  // Setiap kali data transaksi berubah, lakukan agregasi per produk
  useEffect(() => {
    const aggregation: { [key: string]: AggregatedProductData } = {};
    transactions.forEach((trx) => {
      if (trx.produk && Array.isArray(trx.produk)) {
        trx.produk.forEach((pd: any) => {
          // Dapatkan nama produk dari properti productId (jika ter-populate)
          const productName =
            pd.productId?.nama_produk ||
            pd.productId ||
            "Produk Tidak Diketahui";
          if (!aggregation[productName]) {
            aggregation[productName] = {
              productName,
              transactionCount: 0,
              totalSales: 0,
            };
          }
          // Hitung jumlah transaksi (setiap kemunculan di detail transaksi dihitung)
          aggregation[productName].transactionCount += 1;
          // Total penjualan dihitung dari harga * jumlah
          aggregation[productName].totalSales += pd.harga * pd.quantity;
        });
      }
    });
    setAggregatedData(Object.values(aggregation));
    setCurrentPage(1); // Reset pagination
  }, [transactions]);

  // Load transaksi saat pertama kali render (dan setelah filter diubah)
  useEffect(() => {
    loadTransactions();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadTransactions();
  };

  // Sorting untuk data aggregated
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortedData = () => {
    const sorted = [...aggregatedData];
    if (sortColumn) {
      sorted.sort((a, b) => {
        let valA = a[sortColumn as keyof AggregatedProductData];
        let valB = b[sortColumn as keyof AggregatedProductData];
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
    return sorted;
  };

  const sortedData = getSortedData();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedData = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Export ke Excel
  const handleExportToExcel = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const dataToExport = sortedData.map((item, index) => ({
      No: index + 1,
      "Nama Produk": item.productName,
      "Jumlah Transaksi": item.transactionCount,
      "Total Penjualan": item.totalSales,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const summaryRows = [
      [],
      ["Jumlah Produk", sortedData.length],
      [
        "Total Penjualan",
        "Rp " +
          sortedData
            .reduce((sum, item) => sum + item.totalSales, 0)
            .toLocaleString("id-ID"),
      ],
    ];
    XLSX.utils.sheet_add_aoa(worksheet, summaryRows, { origin: -1 });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LaporanProduk");
    XLSX.writeFile(workbook, "LaporanProduk.xlsx");
  };

  const handlePrint = () => {
    window.print();
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
          .desktopTable {
            display: block !important;
          }
          .mobileAccordion {
            display: none !important;
          }
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
        {/* Form Filter (tidak tampil saat print) */}
        <div className="print:hidden">
          <form
            onSubmit={handleSubmit}
            className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
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

        <div className="mb-10 mt-8 text-center sm:mt-0">
          <h1 className="text-xl font-bold">LAPORAN PENJUALAN PER PRODUK</h1>
        </div>

        {/* HEADER untuk cetak */}
        <div className="mb-4 flex flex-col items-center border-b pb-2 dark:border-gray-700 sm:flex-row sm:justify-between sm:space-y-0 print:bg-white print:text-black">
          <div className="flex items-center space-x-4">
            <Image
              src={`/api/image-proxy?url=${encodeURIComponent(logo)}`}
              alt="Logo Toko"
              width={100}
              height={100}
              className="h-16 w-16 object-cover"
            />
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
            <p>Jumlah Produk: {sortedData.length}</p>
            <p>
              Total Penjualan:{" "}
              {formatRupiah(
                sortedData.reduce((sum, item) => sum + item.totalSales, 0),
              )}
            </p>
          </div>
        </div>

        {/* Tabel untuk desktop */}
        <div className={`${isMobile ? "hidden" : "block"}`}>
          <div className="overflow-x-auto text-black-2 dark:text-white print:bg-white">
            <table className="w-full border text-xs dark:border-gray-700">
              <thead className="bg-gray-100 text-left dark:bg-gray-800">
                <tr>
                  <th
                    className="cursor-pointer border px-2 py-1"
                    onClick={() => handleSort("productName")}
                  >
                    Nama Produk{" "}
                    {sortColumn === "productName" &&
                      (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th
                    className="cursor-pointer border px-2 py-1"
                    onClick={() => handleSort("transactionCount")}
                  >
                    Jumlah Transaksi{" "}
                    {sortColumn === "transactionCount" &&
                      (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th
                    className="cursor-pointer border px-2 py-1"
                    onClick={() => handleSort("totalSales")}
                  >
                    Total Penjualan{" "}
                    {sortColumn === "totalSales" &&
                      (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="border px-2 py-1">{item.productName}</td>
                    <td className="border px-2 py-1">
                      {item.transactionCount}
                    </td>
                    <td className="border px-2 py-1 text-right">
                      {formatRupiah(item.totalSales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end space-x-2 text-sm print:hidden">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded border px-2 py-1 disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded border px-2 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Accordion untuk mobile */}
        <div className={`${isMobile ? "block" : "hidden"} print:hidden`}>
          {paginatedData.map((item, index) => (
            <div key={index} className="mb-2 rounded border">
              <div className="flex cursor-pointer items-center justify-between p-2">
                <div>
                  <p className="font-bold">{item.productName}</p>
                </div>
                <div className="font-bold">+</div>
              </div>
              <div className="border-t p-2">
                <p>
                  <span className="font-semibold">Jumlah Transaksi:</span>{" "}
                  {item.transactionCount}
                </p>
                <p>
                  <span className="font-semibold">Total Penjualan:</span>{" "}
                  {formatRupiah(item.totalSales)}
                </p>
              </div>
            </div>
          ))}
          <div className="mt-4 flex justify-end space-x-2 text-sm print:hidden">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded border px-2 py-1 disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded border px-2 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* Tabel untuk tampilan print */}
        <div className="hidden print:block">
          <div className="overflow-x-auto">
            <table className="w-full border text-xs">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="border px-2 py-1">Nama Produk</th>
                  <th className="border px-2 py-1">Jumlah Transaksi</th>
                  <th className="border px-2 py-1">Total Penjualan</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item, index) => (
                  <tr key={index}>
                    <td className="border px-2 py-1">{item.productName}</td>
                    <td className="border px-2 py-1">
                      {item.transactionCount}
                    </td>
                    <td className="border px-2 py-1 text-right">
                      {formatRupiah(item.totalSales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
