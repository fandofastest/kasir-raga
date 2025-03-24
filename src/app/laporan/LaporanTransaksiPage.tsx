"use client";

import { useEffect, useState, FormEvent, MouseEvent } from "react";
import * as XLSX from "xlsx";
import Select from "react-select";
import {
  fetchTransaction,
  fetchSupplier,
  fetchPelanggan,
  fetchKategori, // API untuk mendapatkan data kategori
  fetchProducts, // API untuk mendapatkan data produk
} from "@/lib/dataService";
import Transaksi from "@/models/modeltsx/Transaksi";
import Image from "next/image";
import { formatRupiah } from "@/components/tools";

interface LaporanTransaksiPageProps {
  transactionType: "penjualan" | "pembelian";
}

export default function LaporanTransaksiPage({
  transactionType,
}: LaporanTransaksiPageProps) {
  const isPenjualan = transactionType === "penjualan";

  // State untuk data transaksi, loading, dan error
  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // State filter
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [supplier, setSupplier] = useState<string>("");
  const [pembeli, setPembeli] = useState<string>("");
  const [metodePembayaran, setMetodePembayaran] = useState<string>("");
  const [kategori, setKategori] = useState<string>("");
  const [produk, setProduk] = useState<string>("");

  // Options untuk dropdown
  const [supplierOptions, setSupplierOptions] = useState<any[]>([]);
  const [pembeliOptions, setPembeliOptions] = useState<any[]>([]);
  const [kategoriOptions, setKategoriOptions] = useState<any[]>([]);
  const [produkOptions, setProdukOptions] = useState<any[]>([]);

  // State untuk menentukan apakah tampilan mobile atau desktop
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // State untuk melacak transaksi yang terbuka (accordion, khusus mobile)
  const [openTransactions, setOpenTransactions] = useState<Set<string>>(
    new Set(),
  );

  // State untuk informasi toko (di header cetak)
  const [storeName, setStoreName] = useState<string>("Nama Minimarket");
  const [storeAddress, setStoreAddress] = useState<string>(
    "Jln. Alamat Surabaya",
  );
  const [storePhone, setStorePhone] = useState<string>("081353935206");
  const [logo, setLogo] = useState<string>("");

  // --- Pagination & Sorting ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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
  // Cek ukuran layar (threshold 768px)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Muat data toko dari localStorage
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

  // Load opsi dari API
  const loadOptions = async () => {
    try {
      const supplierRes = await fetchSupplier();
      setSupplierOptions(supplierRes.data);
      const pembeliRes = await fetchPelanggan();
      setPembeliOptions(pembeliRes.data);
      const kategoriRes = await fetchKategori();
      setKategoriOptions(kategoriRes.data);
      const produkRes = await fetchProducts();
      setProdukOptions(produkRes.data);
    } catch (err) {
      console.error("Gagal memuat opsi:", err);
    }
  };

  // Fungsi untuk memuat data transaksi berdasarkan filter
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params: { [key: string]: string } = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (supplier) params.supplier = supplier;
      if (pembeli) params.pelanggan = pembeli;
      if (metodePembayaran) params.metode_pembayaran = metodePembayaran;
      if (kategori) params.kategori = kategori;
      if (produk) params.produk = produk;
      params.tipe_transaksi = transactionType;

      const result = await fetchTransaction(params);
      setTransactions(result.data.transactions);
      setCurrentPage(1); // reset pagination
    } catch (error: any) {
      setError(error.message || "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  // Load opsi dan transaksi saat pertama kali render
  useEffect(() => {
    loadOptions();
    loadTransactions();
  }, []);

  // Handler form filter
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadTransactions();
  };

  // Toggle detail transaksi (mobile)
  const toggleTransaction = (id: string) => {
    setOpenTransactions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Helper: hitung modal transaksi
  const getTransactionModal = (trx: Transaksi): number => {
    return trx.produk.reduce((acc, pd) => {
      const hargaModal = pd.productId?.harga_modal || 0;
      return acc + hargaModal * (pd.quantity || 0);
    }, 0);
  };

  // Helper: hitung laba (total_harga - modal)
  const getTransactionLaba = (trx: Transaksi): number => {
    return trx.total_harga - getTransactionModal(trx);
  };

  // Sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortedTransactions = () => {
    const sorted = [...transactions];
    if (sortColumn) {
      if (sortColumn === "modal") {
        sorted.sort((a, b) => {
          const modalA = getTransactionModal(a);
          const modalB = getTransactionModal(b);
          return sortDirection === "asc" ? modalA - modalB : modalB - modalA;
        });
        return sorted;
      }
      if (sortColumn === "laba") {
        sorted.sort((a, b) => {
          const labaA = getTransactionLaba(a);
          const labaB = getTransactionLaba(b);
          return sortDirection === "asc" ? labaA - labaB : labaB - labaA;
        });
        return sorted;
      }
      sorted.sort((a, b) => {
        let valA = a[sortColumn as keyof Transaksi];
        let valB = b[sortColumn as keyof Transaksi];
        if (typeof valA === "string" && typeof valB === "string") {
          return sortDirection === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }
        if (sortColumn === "createdAt") {
          const dateA = new Date(valA as string).getTime();
          const dateB = new Date(valB as string).getTime();
          return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
        }
        return 0;
      });
    }
    return sorted;
  };

  const sortedTransactions = getSortedTransactions();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedTransactions = sortedTransactions.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);

  // Summary
  const totalValue = sortedTransactions.reduce(
    (sum, trx) => sum + trx.total_harga,
    0,
  );
  const totalModal = sortedTransactions.reduce(
    (sum, trx) => sum + getTransactionModal(trx),
    0,
  );
  const totalLaba = sortedTransactions.reduce(
    (sum, trx) => sum + getTransactionLaba(trx),
    0,
  );

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
      if (isPenjualan) {
        return {
          ...baseData,
          Pelanggan: trx.pembeli?.nama || "-",
          Modal: getTransactionModal(trx),
          Total: trx.total_harga,
          Laba: getTransactionLaba(trx),
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
          Operator:
            typeof trx.kasir === "object" && trx.kasir
              ? trx.kasir.name
              : trx.kasir,
        };
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const summaryRows = isPenjualan
      ? [
          [],
          ["Jumlah Transaksi", sortedTransactions.length],
          ["Total Penjualan", "Rp " + totalValue.toLocaleString("id-ID")],
          ["Total Modal", "Rp " + totalModal.toLocaleString("id-ID")],
          ["Total Laba", "Rp " + totalLaba.toLocaleString("id-ID")],
        ]
      : [
          [],
          ["Jumlah Transaksi", sortedTransactions.length],
          ["Total Pembelian", "Rp " + totalValue.toLocaleString("id-ID")],
        ];
    XLSX.utils.sheet_add_aoa(worksheet, summaryRows, { origin: -1 });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      isPenjualan ? "LaporanPenjualan" : "LaporanPembelian",
    );
    XLSX.writeFile(
      workbook,
      isPenjualan ? "LaporanPenjualan.xlsx" : "LaporanPembelian.xlsx",
    );
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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
        {/* Form Filter (tidak tampil saat print) */}
        <div className="print:hidden">
          <form
            onSubmit={handleSubmit}
            className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {/* Tanggal Mulai */}
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
            {/* Tanggal Akhir */}
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
            {/* Supplier / Konsumen */}
            <div>
              <label className="block text-sm font-medium text-gray-700  dark:text-gray-300">
                {isPenjualan ? "Konsumen" : "Supplier"}
              </label>
              <Select
                styles={customStyles}
                options={
                  isPenjualan
                    ? pembeliOptions.map((opt) => ({
                        value: opt._id,
                        label: opt.nama,
                      }))
                    : supplierOptions.map((opt) => ({
                        value: opt.nama,
                        label: opt.nama,
                      }))
                }
                onChange={(selected) =>
                  isPenjualan
                    ? setPembeli(selected ? selected.value : "")
                    : setSupplier(selected ? selected.value : "")
                }
                isClearable
                placeholder={
                  isPenjualan ? "Pilih Konsumen..." : "Pilih Supplier..."
                }
              />
            </div>
            {/* Metode Pembayaran */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Metode Pembayaran
              </label>
              <Select
                styles={customStyles}
                options={[
                  { value: "edc", label: "EDC" },
                  { value: "tunai", label: "Tunai" },
                  { value: "bank_transfer", label: "Transfer" },
                  { value: "cicilan", label: "Cicilan" },
                ]}
                onChange={(selected) =>
                  setMetodePembayaran(selected ? selected.value : "")
                }
                isClearable
                placeholder="Pilih Metode..."
              />
            </div>
            {/* Kategori */}
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
            {/* Produk */}
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
            {/* Tombol Filter */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Terapkan Filter
              </button>
            </div>
          </form>
        </div>

        <div className="mb-10 mt-8 text-center sm:mt-0">
          <h1 className="text-xl font-bold">
            LAPORAN {isPenjualan ? "PENJUALAN" : "PEMBELIAN"}
          </h1>
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
            {isPenjualan ? (
              <>
                <p>Total Penjualan: {formatRupiah(totalValue)}</p>
                <p>Total Modal: {formatRupiah(totalModal)}</p>
                <p>Total Laba: {formatRupiah(totalLaba)}</p>
              </>
            ) : (
              <>
                <p>Total Pembelian: {formatRupiah(totalValue)}</p>
                <p>Total Transaksi: {transactions.length}</p>
              </>
            )}
          </div>
        </div>

        {/* Tabel untuk desktop */}
        <div className={`${isMobile ? "hidden" : "block"} `}>
          <div className="overflow-x-auto text-black-2 dark:text-white print:bg-white">
            <table className="w-full border text-xs dark:border-gray-700">
              <thead className="bg-gray-100 text-left dark:bg-gray-800">
                <tr>
                  <th
                    className="cursor-pointer border px-2 py-1"
                    onClick={() => handleSort("no_transaksi")}
                  >
                    No. Transaksi{" "}
                    {sortColumn === "no_transaksi" &&
                      (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th
                    className="cursor-pointer border px-2 py-1"
                    onClick={() => handleSort("createdAt")}
                  >
                    Tanggal{" "}
                    {sortColumn === "createdAt" &&
                      (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th
                    className="cursor-pointer border px-2 py-1"
                    onClick={() => handleSort("tipe_transaksi")}
                  >
                    Tipe{" "}
                    {sortColumn === "tipe_transaksi" &&
                      (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="border px-2 py-1">
                    {isPenjualan ? "Pelanggan" : "Supplier"}
                  </th>
                  {isPenjualan && (
                    <th
                      className="cursor-pointer border px-2 py-1"
                      onClick={() => handleSort("modal")}
                    >
                      Modal{" "}
                      {sortColumn === "modal" &&
                        (sortDirection === "asc" ? "▲" : "▼")}
                    </th>
                  )}
                  <th
                    className="cursor-pointer border px-2 py-1"
                    onClick={() => handleSort("total_harga")}
                  >
                    Total{" "}
                    {sortColumn === "total_harga" &&
                      (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  {isPenjualan && (
                    <th
                      className="cursor-pointer border px-2 py-1"
                      onClick={() => handleSort("laba")}
                    >
                      Laba{" "}
                      {sortColumn === "laba" &&
                        (sortDirection === "asc" ? "▲" : "▼")}
                    </th>
                  )}
                  <th className="border px-2 py-1">Operator</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((trx) => (
                  <tr
                    key={trx._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="border px-2 py-1">{trx.no_transaksi}</td>
                    <td className="border px-2 py-1">
                      {new Date(trx.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="border px-2 py-1">{trx.tipe_transaksi}</td>
                    <td className="border px-2 py-1">
                      {isPenjualan
                        ? trx.pembeli?.nama || "-"
                        : trx.supplier?.nama || "-"}
                    </td>
                    {isPenjualan && (
                      <td className="border px-2 py-1 text-right">
                        {formatRupiah(getTransactionModal(trx))}
                      </td>
                    )}
                    <td className="border px-2 py-1 text-right">
                      {formatRupiah(trx.total_harga)}
                    </td>
                    {isPenjualan && (
                      <td className="border px-2 py-1 text-right">
                        {formatRupiah(getTransactionLaba(trx))}
                      </td>
                    )}
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
          {paginatedTransactions.map((trx) => (
            <div key={trx._id} className="mb-2 rounded border">
              <div
                className="flex cursor-pointer items-center justify-between p-2"
                onClick={() => toggleTransaction(trx._id)}
              >
                <div>
                  <p className="font-bold">{trx.no_transaksi}</p>
                  <p className="text-sm">
                    {new Date(trx.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div className="font-bold">
                  {openTransactions.has(trx._id) ? "-" : "+"}
                </div>
              </div>
              {openTransactions.has(trx._id) && (
                <div className="border-t p-2">
                  {isPenjualan ? (
                    <>
                      <p>
                        <span className="font-semibold">Pelanggan:</span>{" "}
                        {trx.pembeli?.nama || "-"}
                      </p>
                      <p>
                        <span className="font-semibold">Modal:</span>{" "}
                        {formatRupiah(getTransactionModal(trx))}
                      </p>
                      <p>
                        <span className="font-semibold">Total:</span>{" "}
                        {formatRupiah(trx.total_harga)}
                      </p>
                      <p>
                        <span className="font-semibold">Laba:</span>{" "}
                        {formatRupiah(getTransactionLaba(trx))}
                      </p>
                      <p>
                        <span className="font-semibold">Operator:</span>{" "}
                        {typeof trx.kasir === "object" && trx.kasir
                          ? trx.kasir.name
                          : trx.kasir}
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <span className="font-semibold">Supplier:</span>{" "}
                        {trx.supplier?.nama || "-"}
                      </p>
                      <p>
                        <span className="font-semibold">Total:</span>{" "}
                        {formatRupiah(trx.total_harga)}
                      </p>
                      <p>
                        <span className="font-semibold">Operator:</span>{" "}
                        {typeof trx.kasir === "object" && trx.kasir
                          ? trx.kasir.name
                          : trx.kasir}
                      </p>
                    </>
                  )}
                </div>
              )}
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
                  <th className="border px-2 py-1">No. Transaksi</th>
                  <th className="border px-2 py-1">Tanggal</th>
                  <th className="border px-2 py-1">Tipe</th>
                  <th className="border px-2 py-1">
                    {isPenjualan ? "Pelanggan" : "Supplier"}
                  </th>
                  {isPenjualan && <th className="border px-2 py-1">Modal</th>}
                  <th className="border px-2 py-1">Total</th>
                  {isPenjualan && <th className="border px-2 py-1">Laba</th>}
                  <th className="border px-2 py-1">Operator</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((trx) => (
                  <tr key={trx._id}>
                    <td className="border px-2 py-1">{trx.no_transaksi}</td>
                    <td className="border px-2 py-1">
                      {new Date(trx.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="border px-2 py-1">{trx.tipe_transaksi}</td>
                    <td className="border px-2 py-1">
                      {isPenjualan
                        ? trx.pembeli?.nama || "-"
                        : trx.supplier?.nama || "-"}
                    </td>
                    {isPenjualan && (
                      <td className="border px-2 py-1 text-right">
                        {formatRupiah(getTransactionModal(trx))}
                      </td>
                    )}
                    <td className="border px-2 py-1 text-right">
                      {formatRupiah(trx.total_harga)}
                    </td>
                    {isPenjualan && (
                      <td className="border px-2 py-1 text-right">
                        {formatRupiah(getTransactionLaba(trx))}
                      </td>
                    )}
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
            className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            Print Laporan
          </button>
        </div>
      </div>
    </>
  );
}
