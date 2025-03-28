"use client";

import React, { useState, useEffect } from "react";
import CardDataStats from "@/components/CardDataStats";
import ChartOne from "@/components/Charts/ChartOne";
import ChatCard from "@/components/Chat/ChatCard";
import {
  DollarSign,
  ShoppingBag,
  UserPlus,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { fetchTransaction, fetchPelanggan } from "@/lib/dataService";
import ChartProductSales from "../Charts/ChartProductSales";

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [totalPendapatan, setTotalPendapatan] = useState<number>(0);
  const [totalPesanan, setTotalPesanan] = useState<number>(0);
  const [totalKonsumen, setTotalKonsumen] = useState<number>(0);
  const [totalPembayaranTertunggak, setTotalPembayaranTertunggak] =
    useState<number>(0);
  const [totalKeuntungan, setTotalKeuntungan] = useState<number>(0);
  const [productSalesData, setProductSalesData] = useState<
    { productName: string; totalSales: number }[]
  >([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Ambil seluruh transaksi
        const transRes = await fetchTransaction();
        const allTransactions = transRes.data.transactions;

        // Filter transaksi penjualan untuk pendapatan, pesanan, keuntungan, dan data unit terjual per produk
        const penjualan = allTransactions.filter(
          (trx: any) => trx.tipe_transaksi === "penjualan",
        );
        const revenue = penjualan.reduce(
          (sum: number, trx: any) => sum + trx.total_harga,
          0,
        );
        setTotalPendapatan(revenue);
        setTotalPesanan(penjualan.length);

        // Hitung keuntungan: Keuntungan = (harga jual - harga modal) * quantity
        const profit = penjualan.reduce((sum: number, trx: any) => {
          const trxProfit = trx.produk.reduce((pSum: number, detail: any) => {
            const cost = detail.productId?.harga_modal || 0;
            const profitPerUnit = detail.harga - cost;
            return pSum + profitPerUnit * detail.quantity;
          }, 0);
          return sum + trxProfit;
        }, 0);
        setTotalKeuntungan(profit);

        // Agregasi unit terjual per produk (menggunakan detail.quantity)
        const productUnitsMap: { [key: string]: number } = {};
        penjualan.forEach((trx: any) => {
          trx.produk.forEach((detail: any) => {
            const productName =
              detail.productId?.nama_produk ||
              detail.productId ||
              "Produk Tidak Diketahui";
            const units = detail.quantity; // gunakan quantity sebagai unit terjual
            productUnitsMap[productName] =
              (productUnitsMap[productName] || 0) + units;
          });
        });
        const aggregatedProductUnits = Object.keys(productUnitsMap).map(
          (productName) => ({
            productName,
            // Agar tetap kompatibel dengan komponen ChartProductSales,
            // kita gunakan field "totalSales" untuk menampung nilai unit terjual.
            totalSales: productUnitsMap[productName],
          }),
        );
        setProductSalesData(aggregatedProductUnits);

        // Ambil total konsumen (pelanggan)
        const konsumenRes = await fetchPelanggan();
        setTotalKonsumen(konsumenRes.data.length);

        // Ambil transaksi hutang (pembelian dengan metode "hutang" dan status "belum_lunas")
        const hutangRes = await fetchTransaction({
          tipe_transaksi: "pembelian",
          metode_pembayaran: "hutang",
          status_transaksi: "belum_lunas",
        });
        const hutangTransactions = hutangRes.data.transactions;
        const outstanding = hutangTransactions.reduce(
          (sum: number, trx: any) => {
            const paid = trx.sudah_dibayar || 0;
            return sum + (trx.total_harga - paid);
          },
          0,
        );
        setTotalPembayaranTertunggak(outstanding);
      } catch (err: any) {
        setError(err.message || "Gagal memuat data dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) return <p>Loading Dashboard...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  const cardStats = [
    {
      title: "Total Pendapatan",
      total: totalPendapatan.toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
      }),
      rate: "",
      levelUp: true,
      children: <DollarSign className="h-6 w-6" />,
    },
    {
      title: "Total Pesanan",
      total: totalPesanan.toString(),
      rate: "",
      levelUp: false,
      children: <ShoppingBag className="h-6 w-6" />,
    },
    {
      title: "Total Konsumen",
      total: totalKonsumen.toString(),
      rate: "",
      levelUp: true,
      children: <UserPlus className="h-6 w-6" />,
    },
    {
      title: "Pembayaran Tertunggak",
      total: totalPembayaranTertunggak.toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 2,
      }),
      rate: "",
      levelDown: true,
      children: <AlertCircle className="h-6 w-6" />,
    },
    {
      title: "Keuntungan",
      total: totalKeuntungan.toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 2,
      }),
      rate: "",
      levelUp: true,
      children: <TrendingUp className="h-6 w-6" />,
    },
  ];

  return (
    <div className="p-4 dark:bg-gray-900 dark:text-gray-100">
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {cardStats.map((stat, index) => (
          <CardDataStats
            key={index}
            title={stat.title}
            total={stat.total}
            rate={stat.rate}
            levelUp={stat.levelUp}
            levelDown={stat.levelDown}
          >
            {stat.children}
          </CardDataStats>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartOne />
        {/* Chart baru: Unit Terjual per Produk */}
      </div>

      <div>
        <ChartProductSales data={productSalesData} />
      </div>

      {/* Chat Card */}
      <div className="mt-8">
        <ChatCard />
      </div>
    </div>
  );
};

export default DashboardPage;
