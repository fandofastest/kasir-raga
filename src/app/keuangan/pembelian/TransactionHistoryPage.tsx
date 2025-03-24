"use client";
import { useSearchParams } from "next/navigation";

import { useState, useEffect, FormEvent } from "react";
import Select from "react-select";
import { toast } from "react-hot-toast";
import {
  fetchTransaction,
  fetchSupplier,
  fetchStaff,
  fetchPelanggan,
  updateDataTransaction,
} from "@/lib/dataService";
import { Staff } from "@/models/modeltsx/staffTypes";
import Transaksi from "@/models/modeltsx/Transaksi";
import TransactionDetailDialog from "../detailtransaksi";

interface TransactionHistoryPageProps {
  tipeTransaksi?: string;
}

export default function TransactionHistoryPage({
  tipeTransaksi,
}: TransactionHistoryPageProps) {
  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Filter state
  const [searchTerm, setSearchTerm] = useState<string>(""); // Nomor Transaksi
  const [metodePembayaran, setMetodePembayaran] = useState<string>("");
  const [statusTransaksi, setStatusTransaksi] = useState<string[]>([]);

  // Filter berdasarkan relasi (select)
  const [supplier, setSupplier] = useState<string>("");
  const [pembeli, setPembeli] = useState<string>("");
  const [pengantar, setPengantar] = useState<string>(""); // Armada
  const [staffBongkar, setStaffBongkar] = useState<string>(""); // Buruh Bongkar
  const [kasir, setKasir] = useState<string>("");

  const [minTotal, setMinTotal] = useState<string>("");
  const [maxTotal, setMaxTotal] = useState<string>("");

  // Filter tanggal
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<string>("asc");

  // Options untuk select dropdown
  const [supplierOptions, setSupplierOptions] = useState<any[]>([]);
  const [staffOptions, setStaffOptions] = useState<Staff[]>([]);
  const [pembeliOptions, setPembeliOptions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaksi | null>(null);

  // Options khusus berdasarkan role
  const kasirOptions = staffOptions.filter((staff) => staff.role === "kasir");
  const pengantarOptions = staffOptions.filter(
    (staff) => staff.role === "staffAntar",
  );
  const staffBongkarOptions = staffOptions.filter(
    (staff) => staff.role === "staffBongkar",
  );

  // Untuk tampilan mobile (accordion)
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // Opsi untuk react‑select pada status transaksi
  const statusOptions = [
    { value: "lunas", label: "Lunas" },
    { value: "lunas_cepat", label: "Lunas Cepat" },
    { value: "belum_lunas", label: "Belum Lunas" },
    { value: "tunda", label: "Tunda" },
    { value: "batal", label: "Batal" },
    { value: "cicilan", label: "Cicilan" },
  ];

  const openDetailDialog = (trx: Transaksi) => {
    setSelectedTransaction(trx);
  };

  const handleUpdateTransaction = (updatedTransaction: Transaksi) => {
    console.log("Updated Transaction:", updatedTransaction);
    updateDataTransaction(updatedTransaction._id, updatedTransaction);
    loadData();
  };

  const loadOptions = async () => {
    try {
      const supplierRes = await fetchSupplier();
      setSupplierOptions(supplierRes.data);
      const staffRes = await fetchStaff();
      const pembeliRes = await fetchPelanggan();
      setStaffOptions(staffRes.data);
      setPembeliOptions(pembeliRes.data);
    } catch (err) {
      console.error("Gagal memuat opsi:", err);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const loadData = async (
    overrideSortColumn?: string,
    overrideSortDirection?: string,
  ) => {
    setLoading(true);
    try {
      const params: { [key: string]: string } = {};
      if (searchTerm) params.search = searchTerm;
      if (metodePembayaran) params.metode_pembayaran = metodePembayaran;
      if (tipeTransaksi) params.tipe_transaksi = tipeTransaksi;
      if (supplier) params.supplier = supplier;
      if (pembeli) params.pembeli = pembeli;
      if (pengantar) params.pengantar = pengantar;
      if (staffBongkar) params.staff_bongkar = staffBongkar;
      if (kasir) params.kasir = kasir;
      if (minTotal) params.minTotal = minTotal;
      if (maxTotal) params.maxTotal = maxTotal;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const sortCol = overrideSortColumn || sortColumn;
      const sortDir = overrideSortDirection || sortDirection;
      if (sortCol) {
        params.sortBy = sortCol;
        params.sortOrder = sortDir;
      }
      if (statusTransaksi.length > 0) {
        params.status_transaksi = statusTransaksi.join(",");
      }
      const data = await fetchTransaction(params);
      console.log(data);
      setTransactions(data.data.transactions);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat data");
      toast.error(err.message || "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };
  const searchParams = useSearchParams();
  // Pertama, ambil URL parameter dan update state jika ada
  useEffect(() => {
    const noTransaksi = searchParams.get("no_transaksi");
    if (noTransaksi) {
      setSearchTerm(noTransaksi);
    } else {
      // Jika tidak ada parameter, loadData langsung dipanggil
      loadData();
    }
  }, [searchParams]);

  // Kedua, panggil loadData setiap kali searchTerm berubah (misal karena parameter baru diterima)
  useEffect(() => {
    if (searchTerm) {
      loadData();
    }
  }, [searchTerm]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleSort = (column: string) => {
    let newSortDirection = "asc";
    if (sortColumn === column) {
      newSortDirection = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortColumn(column);
    setSortDirection(newSortDirection);
    loadData(column, newSortDirection);
  };

  const renderSortIndicator = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? " ▲" : " ▼";
    }
    return "";
  };

  // Perhitungan ringkasan:
  const totalTransaksi = transactions.length;
  const pembelianTransactions = transactions.filter(
    (trx) => trx.tipe_transaksi === "pembelian",
  );
  const penjualanTransactions = transactions.filter(
    (trx) => trx.tipe_transaksi === "penjualan",
  );
  const pengeluaranTransactions = transactions.filter(
    (trx) => trx.tipe_transaksi === "pengeluaran",
  );

  const countPembelian = pembelianTransactions.length;
  const countPenjualan = penjualanTransactions.length;
  const countPengeluaranLainnya = pengeluaranTransactions.length;

  const totalPembelian = pembelianTransactions.reduce(
    (sum, trx) => sum + trx.total_harga,
    0,
  );
  const totalPenjualan = penjualanTransactions.reduce(
    (sum, trx) => sum + trx.total_harga,
    0,
  );
  const totalPengeluaranLainnya = pengeluaranTransactions.reduce(
    (sum, trx) => sum + trx.total_harga,
    0,
  );

  // Menggunakan metode "cicilan" untuk piutang dan hutang
  const totalPiutang = penjualanTransactions
    .filter((trx) => trx.metode_pembayaran === "cicilan")
    .reduce((sum, trx) => sum + trx.total_harga, 0);
  const totalHutang = pembelianTransactions
    .filter((trx) => trx.metode_pembayaran === "cicilan")
    .reduce((sum, trx) => sum + trx.total_harga, 0);

  // Summary saldo: (penjualan - piutang) - (pembelian - hutang) - pengeluaran lainnya
  const summarySaldo =
    totalPenjualan -
    totalPiutang -
    (totalPembelian - totalHutang) -
    totalPengeluaranLainnya;

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

  const toggleRow = (id: string) => {
    if (expandedRows.includes(id)) {
      setExpandedRows(expandedRows.filter((rowId) => rowId !== id));
    } else {
      setExpandedRows([...expandedRows, id]);
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
      `}</style>
      <div className="p-4">
        <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-100">
          Riwayat Transaksi
        </h1>
        {/* Ringkasan dengan tampilan lebih ringkas menggunakan grid */}
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-4 text-lg font-bold sm:grid-cols-3">
            <div className="rounded bg-gray-100 p-2 dark:bg-gray-800">
              <p className="text-sm font-medium">Total Transaksi Pembelian</p>
              <p className="text-lg">{totalTransaksi}</p>
            </div>
            <div className="rounded bg-gray-100 p-2 dark:bg-gray-800">
              <p className="text-sm font-medium">Nominal Transaksi Pembelian</p>
              <p className="text-lg">
                {totalPembelian.toLocaleString("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>
        </div>
        {/* Baris Atas: Input Nomor Transaksi di kiri, Saldo di kanan */}
        <div className="mb-4 flex flex-col items-end justify-between gap-4 sm:flex-row">
          <div className="flex-1">
            <label className="block text-sm font-medium">Nomor Transaksi</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              placeholder="Cari nomor transaksi"
            />
          </div>
        </div>

        {/* Grid Filter Lainnya */}
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div>
            <label className="block text-sm font-medium">
              Metode Pembayaran
            </label>
            <select
              value={metodePembayaran}
              onChange={(e) => setMetodePembayaran(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Semua</option>
              <option value="tunai">Tunai</option>
              <option value="edc">EDC</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cicilan">Cicilan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">
              Status Transaksi
            </label>
            <Select
              classNamePrefix="react-select"
              isMulti
              options={statusOptions}
              value={statusOptions.filter((option) =>
                statusTransaksi.includes(option.value),
              )}
              onChange={(selectedOptions) => {
                setStatusTransaksi(
                  selectedOptions
                    ? selectedOptions.map((option: any) => option.value)
                    : [],
                );
              }}
              className="mt-1"
              styles={customStyles}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Pelanggan</label>
            <Select
              styles={customStyles}
              isClearable
              options={pembeliOptions.map((item: any) => ({
                value: item._id,
                label: item.nama,
              }))}
              value={
                pembeli
                  ? {
                      value: pembeli,
                      label:
                        pembeliOptions.find((item: any) => item._id === pembeli)
                          ?.nama || "",
                    }
                  : null
              }
              onChange={(option: any) => setPembeli(option ? option.value : "")}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Supplier</label>
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Semua Supplier</option>
              {supplierOptions.map((item: any) => (
                <option key={item._id} value={item._id}>
                  {item.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Armada</label>
            <select
              value={pengantar}
              onChange={(e) => setPengantar(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Semua Armada</option>
              {pengantarOptions.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Buruh Bongkar</label>
            <select
              value={staffBongkar}
              onChange={(e) => setStaffBongkar(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Semua Buruh Bongkar</option>
              {staffBongkarOptions.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Kasir</label>
            <select
              value={kasir}
              onChange={(e) => setKasir(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Semua Kasir</option>
              {kasirOptions.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
          <button
            type="submit"
            className="col-span-1 rounded bg-blue-500 px-4 py-2 text-white sm:col-span-3"
          >
            Terapkan Filter
          </button>
        </form>

        {/* Tampilan Desktop (Table) */}
        <div className="hidden md:block">
          {loading && <p className="text-gray-500">Memuat data...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse border border-gray-300 dark:border-gray-600">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th
                      className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                      onClick={() => handleSort("no_transaksi")}
                    >
                      Nomor Transaksi{renderSortIndicator("no_transaksi")}
                    </th>
                    <th
                      className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                      onClick={() => handleSort("pembeli")}
                    >
                      Pelanggan{renderSortIndicator("pembeli")}
                    </th>
                    <th
                      className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                      onClick={() => handleSort("kasir")}
                    >
                      Kasir{renderSortIndicator("kasir")}
                    </th>
                    <th
                      className="cursor-pointer border px-4 py-2 text-right text-sm font-medium text-gray-600 dark:text-gray-200"
                      onClick={() => handleSort("total_harga")}
                    >
                      Total
                    </th>
                    <th
                      className="cursor-pointer border px-4 py-2 font-medium text-gray-600 dark:text-gray-200"
                      onClick={() => handleSort("tanggal_transaksi")}
                    >
                      Tanggal{renderSortIndicator("tanggal_transaksi")}
                    </th>
                    <th
                      className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                      onClick={() => handleSort("metode_pembayaran")}
                    >
                      Metode Pembayaran
                      {renderSortIndicator("metode_pembayaran")}
                    </th>
                    <th
                      className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                      onClick={() => handleSort("status_transaksi")}
                    >
                      Status Transaksi{renderSortIndicator("status_transaksi")}
                    </th>
                    <th
                      className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                      onClick={() => handleSort("tipe_transaksi")}
                    >
                      Tipe Transaksi{renderSortIndicator("tipe_transaksi")}
                    </th>
                    <th
                      className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                      onClick={() => handleSort("pengantar")}
                    >
                      Armada{renderSortIndicator("pengantar")}
                    </th>
                    <th
                      className="cursor-pointer border px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-200"
                      onClick={() => handleSort("staff_bongkar")}
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
                        {new Date(trx.tanggal_transaksi).toLocaleDateString(
                          "id-ID",
                          {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
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
                          className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
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
              <p className="text-gray-500">
                Tidak ada data transaksi ditemukan
              </p>
            )
          )}
        </div>

        {/* Tampilan Mobile (Accordion) */}
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
                        className="mt-2 block w-full rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
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

        {selectedTransaction && (
          <TransactionDetailDialog
            transaction={selectedTransaction}
            staffOptions={staffOptions}
            onClose={() => setSelectedTransaction(null)}
            onUpdate={handleUpdateTransaction}
          />
        )}
      </div>
    </>
  );
}
