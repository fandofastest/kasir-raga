"use client";

import {
  ChangeEvent,
  FormEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import * as XLSX from "xlsx";
import {
  fetchTransaction,
  fetchSupplier,
  fetchPelanggan,
  fetchKategori,
  fetchProducts,
  fetchKategoriKonsumen,
  fetchStaff,
} from "@/lib/dataService";


import Transaksi from "@/models/modeltsx/Transaksi";
import { Staff } from "@/models/modeltsx/staffTypes";
import { formatRupiah } from "@/components/tools";
import FilterForm, { TransactionType } from "@/components/laporan/FilterForm";
import ReportHeader from "@/components/laporan/ReportHeader";
import DesktopTable from "@/components/laporan/DesktopTable";
import MobileAccordion from "@/components/laporan/MobileAccordion";
import PrintTable from "@/components/laporan/PrintTable";
import Pagination from "@/components/laporan/Pagination";

export default function LaporanTransaksiPage() {
  /* ------------------------------------------------------------------------ */
  /*  1.  STATE                                                               */
  /* ------------------------------------------------------------------------ */
  const [tipeTransaksi, setTipeTransaksi] = useState<TransactionType>("penjualan");

  const isPenjualan = tipeTransaksi === "penjualan";
  const [statusTransaksi, setStatusTransaksi] = useState<string[]>([
    "lunas",
    "lunas_cepat",
  ]);
  
  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // filter
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [supplier, setSupplier] = useState("");
  const [pembeli, setPembeli] = useState("");
  const [metodePembayaran, setMetodePembayaran] = useState("");
  const [kategori, setKategori] = useState("");
  const [produk, setProduk] = useState("");
  const [kategoriKonsumen, setKategoriKonsumen] = useState("");
  const [kasir, setKasir] = useState("");
  const [pengantar, setPengantar] = useState("");
  const [staffBongkar, setStaffBongkar] = useState("");
  const [keterangan, setKeterangan] = useState("");

  // dropdown options
  const [supplierOptions, setSupplierOptions] = useState<any[]>([]);
  const [pembeliOptions, setPembeliOptions] = useState<any[]>([]);
  const [kategoriOptions, setKategoriOptions] = useState<any[]>([]);
  const [kategoriKonsumenOptions, setKategoriKonsumenOptions] = useState<any[]>(
    []
  );
  const [produkOptions, setProdukOptions] = useState<any[]>([]);
  const [staffOptions, setStaffOptions] = useState<Staff[]>([]);

  // UI
  const [isMobile, setIsMobile] = useState(false);
  const [openTransactions, setOpenTransactions] = useState<Set<string>>(
    new Set()
  );

  // toko info
  const [storeName, setStoreName] = useState("Nama Minimarket");
  const [storeAddress, setStoreAddress] = useState("Jln. Alamat Surabaya");
  const [storePhone, setStorePhone] = useState("081353935206");
  const [logo, setLogo] = useState("");

  // paginasi + sort
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  /* ------------------------------------------------------------------------ */
  /*  2.  EFFECTS & HELPERS                                                   */
  /* ------------------------------------------------------------------------ */
  // monitor lebar layar
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // info toko dari localStorage
  useEffect(() => {
    setStoreName(localStorage.getItem("companyName") ?? storeName);
    setStoreAddress(localStorage.getItem("companyAddress") ?? storeAddress);
    setStorePhone(localStorage.getItem("companyPhone") ?? storePhone);
    setLogo(localStorage.getItem("companyLogo") ?? logo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // muat dropdown
  const loadOptions = useCallback(async () => {
    try {
      // Create params to fetch all products without pagination
      const productParams = new URLSearchParams({
        limit: "1000", // Set a high limit to get all products
        page: "1"
      });
      
      const [
        s1,
        p1,
        k1,
        p2,
        kk1,
        stf,
      ] = await Promise.all([
        fetchSupplier(),
        fetchPelanggan(),
        fetchKategori(),
        fetchProducts(productParams), // Pass params to get all products
        fetchKategoriKonsumen(),
        fetchStaff(),
      ]);

      setSupplierOptions(s1.data);
      setPembeliOptions(p1.data);
      setKategoriOptions(k1.data);
      setProdukOptions(p2.data);
      setKategoriKonsumenOptions(kk1.data);
      setStaffOptions(stf.data);
    } catch (e) {
      console.error("Gagal memuat opsi:", e);
    }
  }, []);

  // muat transaksi
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const query: Record<string, string> = {
        tipe_transaksi: tipeTransaksi,
      };
      if (startDate) query.startDate = startDate;
      if (endDate) query.endDate = endDate;
      if (supplier) query.supplier = supplier;
      if (pembeli) query.pelanggan = pembeli;
      if (metodePembayaran) query.metode_pembayaran = metodePembayaran;
      if (kategori) query.kategori = kategori;
      if (produk) query.produk = produk;
      if (kategoriKonsumen) query.kategori_konsumen = kategoriKonsumen;
      if (kasir) query.kasir = kasir;
      if (pengantar) query.pengantar = pengantar;
      if (staffBongkar) query.staff_bongkar = staffBongkar;
      if (keterangan) query.keterangan = keterangan;
      if (statusTransaksi.length > 0) query.status_transaksi = statusTransaksi.join(",");

      const res = await fetchTransaction(query);
      // console.log(res.data.transactions);
      
      setTransactions(res.data.transactions);
      console.log(res.data.transactions);
      
      setCurrentPage(1);
    } catch (e: any) {
      setError(e.message ?? "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [
    endDate,
    kategori,
    kategoriKonsumen,
    kasir,
    keterangan,
    metodePembayaran,
    pembeli,
    pengantar,
    produk,
    staffBongkar,
    startDate,
    supplier,
    tipeTransaksi,
    statusTransaksi,
  ]);

  // initial load
  useEffect(() => {
    loadOptions();
    loadTransactions();
  }, [loadOptions, loadTransactions]);

  /* ------------------ kalkulasi modal & laba + sort + paginate ------------ */
  const getModal = (trx: Transaksi) =>
    trx.produk.reduce((acc, pd) => {
      const modal = pd.productId?.harga_modal ?? 0;
      const konversi = pd.satuans?.[0]?.konversi ?? 1;
      return acc + modal * pd.quantity * konversi;
    }, 0);

  const getLaba = (trx: Transaksi) => trx.total_harga - getModal(trx);

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (!sortColumn) return 0;
    let valA: any, valB: any;
    switch (sortColumn) {
      case "modal":
        valA = getModal(a);
        valB = getModal(b);
        break;
      case "laba":
        valA = getLaba(a);
        valB = getLaba(b);
        break;
      default:
        valA = (a as any)[sortColumn];
        valB = (b as any)[sortColumn];
    }
    if (typeof valA === "string") return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    return sortDirection === "asc" ? valA - valB : valB - valA;
  });

  const last = currentPage * itemsPerPage;
  const first = last - itemsPerPage;
  const paginatedTransactions = sortedTransactions.slice(first, last);
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);

  const totalValue = sortedTransactions.reduce((s, t) => s + t.total_harga, 0);
  const totalModal = sortedTransactions.reduce((s, t) => s + getModal(t), 0);
  const totalLaba = sortedTransactions.reduce((s, t) => s + getLaba(t), 0);

  /* ------------------------------------------------------------------------ */
  /*  3.  HANDLER                                                             */
  /* ------------------------------------------------------------------------ */
  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
    loadTransactions();
  };

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const handleExport = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const rows = sortedTransactions.map((trx, i) => ({
      No: i + 1,
      "No Transaksi": trx.no_transaksi,
      Tanggal: new Date(trx.tanggal_transaksi).toLocaleDateString("id-ID"),
      Tipe: trx.tipe_transaksi,
      ...(isPenjualan
        ? {
            Pelanggan: trx.pembeli?.nama ?? "-",
            Modal: getModal(trx),
            Total: trx.total_harga,
            Ongkir: trx.ongkir,
            Laba: getLaba(trx),
            Operator: typeof trx.kasir === "object" ? trx.kasir?.name : trx.kasir,
            "Jumlah Unit": trx.produk.reduce((sum, p) => sum + p.quantity, 0),
          }
        : {
            Supplier: trx.supplier?.nama ?? "-",
            Total: trx.total_harga,
            Operator: typeof trx.kasir === "object" ? trx.kasir?.name : trx.kasir,
            "Jumlah Unit": trx.produk.reduce((sum, p) => sum + p.quantity, 0),
          }),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const summary = isPenjualan
      ? [
          [],
          ["Jumlah Transaksi", sortedTransactions.length],
          ["Total Penjualan", totalValue],
          ["Total Modal", totalModal],
          ["Total Ongkir", sortedTransactions.reduce((s, t) => s + t.ongkir, 0)],
          ["Total Laba", totalLaba],
        ]
      : [
          [],
          ["Jumlah Transaksi", sortedTransactions.length],
          ["Total Pembelian", totalValue],
        ];
    XLSX.utils.sheet_add_aoa(ws, summary, { origin: -1 });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      isPenjualan ? "Penjualan" : "Pembelian"
    );
    XLSX.writeFile(wb, `${isPenjualan ? "LaporanPenjualan" : "LaporanPembelian"}.xlsx`);
  };

  /* ------------------------------------------------------------------------ */
  /*  4.  RENDER                                                              */
  /* ------------------------------------------------------------------------ */
  return (
    <>
      {/* global style buat print & dark‑mode */}
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
          .desktopTable { display: none !important; }
          .mobileAccordion { display: none !important; }
          body, table, th, td, p, h2, h3 {
            color: black !important; background: white !important;
          }
        }
      `}</style>

      <div className="p-4 dark:bg-boxdark dark:text-gray-100 print:bg-white">
        {/* ------------ FILTER FORM ------------ */}
        <FilterForm
         statusTransaksi={statusTransaksi}
        setStatusTransaksi={setStatusTransaksi}
        tipeTransaksi={tipeTransaksi}
        setTipeTransaksi={setTipeTransaksi}
          isPenjualan={isPenjualan}
          /* nilai filter */
          startDate={startDate} endDate={endDate}
          supplier={supplier} pembeli={pembeli}
          metodePembayaran={metodePembayaran}
          kategori={kategori} produk={produk}
          kategoriKonsumen={kategoriKonsumen}
          kasir={kasir} pengantar={pengantar}
          staffBongkar={staffBongkar} keterangan={keterangan}
          /* setter */
          setStartDate={setStartDate} setEndDate={setEndDate}
          setSupplier={setSupplier} setPembeli={setPembeli}
          setMetodePembayaran={setMetodePembayaran}
          setKategori={setKategori} setProduk={setProduk}
          setKategoriKonsumen={setKategoriKonsumen}
          setKasir={setKasir} setPengantar={setPengantar}
          setStaffBongkar={setStaffBongkar} setKeterangan={setKeterangan}
          /* options */
          supplierOptions={supplierOptions}
          pembeliOptions={pembeliOptions}
          kategoriOptions={kategoriOptions}
          kategoriKonsumenOptions={kategoriKonsumenOptions}
          produkOptions={produkOptions}
          staffOptions={staffOptions}
          onSubmit={handleFilterSubmit}
        />

        {/* ------------ HEADER + SUMMARY ------------ */}
        <ReportHeader
          isPenjualan={isPenjualan}
          storeName={storeName}
          storeAddress={storeAddress}
          storePhone={storePhone}
          logo={logo}
          totalValue={totalValue}
          totalModal={totalModal}
          totalLaba={totalLaba}
          count={sortedTransactions.length}
        />

        {/* ------------ TABLE / ACCORDION ------------ */}
        {!isMobile ? (
          <DesktopTable
            data={paginatedTransactions}
            produkFilter={!!kategori || !!produk}
            
            isPenjualan={isPenjualan}
            getModal={getModal}
            getLaba={getLaba}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        ) : (
          <MobileAccordion
            data={paginatedTransactions}
            produkFilter={!!produk || !!kategori}
            isPenjualan={isPenjualan}
            getModal={getModal}
            getLaba={getLaba}
            open={openTransactions}
            toggle={(id) =>
              setOpenTransactions((s) => {
                const n = new Set(s);
                n.has(id) ? n.delete(id) : n.add(id);
                return n;
              })
            }
          />
        )}

        {/* ------------ PRINT‑ONLY TABLE ------------ */}
        <PrintTable
          data={sortedTransactions}
          produkFilter={!!produk ||!!kategori}
          isPenjualan={isPenjualan}
          getModal={getModal}
          getLaba={getLaba}
        />

        {/* ------------ PAGINATION + ACTION BTN ------------ */}
        <Pagination
          current={currentPage}
          total={totalPages}
          go={(p) => setCurrentPage(p)}
          onExport={handleExport}
        />
      </div>
    </>
  );
}
