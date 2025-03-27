"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { fetchTransaction } from "@/lib/dataService";
import Transaksi from "@/models/modeltsx/Transaksi";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const defaultOptions: ApexOptions = {
  legend: {
    show: true,
    position: "top",
    horizontalAlign: "center",
  },
  chart: {
    fontFamily: "Satoshi, sans-serif",
    type: "area",
    dropShadow: {
      enabled: true,
      color: "#000000",
      top: 10,
      blur: 4,
      left: 0,
      opacity: 0.1,
    },
    toolbar: { show: false },
  },
  responsive: [
    { breakpoint: 1024, options: { chart: { height: 300 } } },
    { breakpoint: 1366, options: { chart: { height: 350 } } },
  ],
  stroke: { width: [2, 2], curve: "smooth" },
  grid: {
    xaxis: { lines: { show: true } },
    yaxis: { lines: { show: true } },
  },
  dataLabels: { enabled: false },
  markers: {
    size: 4,
    colors: ["#fff", "#fff"],
    strokeColors: ["#28a745", "#dc3545"],
    strokeWidth: 3,
    strokeOpacity: 0.9,
    fillOpacity: 1,
    hover: { sizeOffset: 5 },
  },
  xaxis: {
    type: "category",
    categories: [],
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { title: { style: { fontSize: "12px" } }, min: 0 },
  colors: ["#28a745", "#dc3545"],
};

interface ChartOneState {
  series: {
    name: string;
    data: number[];
  }[];
}

const ChartOne: React.FC = () => {
  const [series, setSeries] = useState<ChartOneState["series"]>([
    { name: "Pemasukan", data: new Array(12).fill(0) },
    { name: "Pengeluaran", data: new Array(12).fill(0) },
  ]);
  const [options, setOptions] = useState<ApexOptions>(defaultOptions);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "day" | "week" | "month"
  >("month");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Ambil seluruh transaksi (Anda dapat menambahkan filter tahun jika diperlukan)
        const res = await fetchTransaction({});
        const transactions: Transaksi[] = res.data.transactions;

        let income: number[] = [];
        let expense: number[] = [];
        let categories: string[] = [];

        if (selectedPeriod === "month") {
          income = new Array(12).fill(0);
          expense = new Array(12).fill(0);
          categories = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          transactions.forEach((trx) => {
            const date = new Date(trx.createdAt);
            const m = date.getMonth();
            if (trx.tipe_transaksi === "penjualan") {
              income[m] += trx.total_harga;
            } else if (trx.tipe_transaksi === "pembelian") {
              expense[m] += trx.total_harga;
            }
          });
        } else if (selectedPeriod === "week") {
          income = new Array(7).fill(0);
          expense = new Array(7).fill(0);
          categories = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          transactions.forEach((trx) => {
            const date = new Date(trx.createdAt);
            const day = date.getDay();
            if (trx.tipe_transaksi === "penjualan") {
              income[day] += trx.total_harga;
            } else if (trx.tipe_transaksi === "pembelian") {
              expense[day] += trx.total_harga;
            }
          });
        } else if (selectedPeriod === "day") {
          income = new Array(24).fill(0);
          expense = new Array(24).fill(0);
          categories = Array.from({ length: 24 }, (_, i) => i.toString());
          transactions.forEach((trx) => {
            const date = new Date(trx.createdAt);
            const hour = date.getHours();
            if (trx.tipe_transaksi === "penjualan") {
              income[hour] += trx.total_harga;
            } else if (trx.tipe_transaksi === "pembelian") {
              expense[hour] += trx.total_harga;
            }
          });
        }

        setSeries([
          { name: "Pemasukan", data: income },
          { name: "Pengeluaran", data: expense },
        ]);
        setOptions((prev) => ({
          ...prev,
          xaxis: { ...prev.xaxis, categories },
        }));
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedPeriod]);

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
            <div className="flex w-full flex-wrap gap-3 sm:gap-5">
              {/* Summary Pemasukan */}
              <div className="flex min-w-47.5">
                <span className="mr-2 mt-1 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-green-500">
                  <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-tosca"></span>
                </span>
                <div className="w-full">
                  <p className="font-semibold text-green-500">Pemasukan</p>
                  <p className="text-sm font-medium">Jan - Dec</p>
                </div>
              </div>
              {/* Summary Pengeluaran */}
              <div className="flex min-w-47.5">
                <span className="mr-2 mt-1 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-red-500">
                  <span className="block h-2.5 w-full max-w-2.5 rounded-full bg-red-500"></span>
                </span>
                <div className="w-full">
                  <p className="font-semibold text-red-500">Pengeluaran</p>
                  <p className="text-sm font-medium">Jan - Dec</p>
                </div>
              </div>
            </div>
            <div className="flex w-full max-w-45 justify-end">
              <div className="inline-flex items-center rounded-md bg-white p-1.5 dark:bg-meta-4">
                <button
                  onClick={() => setSelectedPeriod("day")}
                  className={`rounded px-3 py-1 text-xs font-medium ${
                    selectedPeriod === "day"
                      ? "bg-white shadow-card dark:bg-boxdark dark:text-white"
                      : "text-black hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark"
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setSelectedPeriod("week")}
                  className={`rounded px-3 py-1 text-xs font-medium ${
                    selectedPeriod === "week"
                      ? "bg-white shadow-card dark:bg-boxdark dark:text-white"
                      : "text-black hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark"
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setSelectedPeriod("month")}
                  className={`rounded px-3 py-1 text-xs font-medium ${
                    selectedPeriod === "month"
                      ? "bg-white shadow-card dark:bg-boxdark dark:text-white"
                      : "text-black hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark"
                  }`}
                >
                  Month
                </button>
              </div>
            </div>
          </div>
          <div>
            <div id="chartOne" className="-ml-5">
              <ReactApexChart
                options={options}
                series={series}
                type="area"
                height={350}
                width={"100%"}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChartOne;
