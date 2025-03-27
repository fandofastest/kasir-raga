"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface ChartProductSalesProps {
  data: { productName: string; totalSales: number }[];
}

const defaultOptions: ApexOptions = {
  legend: {
    show: true,
    position: "top",
    horizontalAlign: "center",
  },
  chart: {
    fontFamily: "Satoshi, sans-serif",
    type: "bar",
    toolbar: { show: false },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: "50%",
    },
  },
  responsive: [
    { breakpoint: 1024, options: { chart: { height: 300 } } },
    { breakpoint: 1366, options: { chart: { height: 350 } } },
  ],
  dataLabels: { enabled: false },
  xaxis: {
    type: "category",
    categories: [],
    labels: {
      rotate: -45,
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    title: { text: "Unit Terjual", style: { fontSize: "12px" } },
    min: 0,
  },
  title: {
    text: "Unit Terjual per Produk",
    align: "center" as const,
  },
};

const ChartProductSales: React.FC<ChartProductSalesProps> = ({ data }) => {
  const options: ApexOptions = {
    ...defaultOptions,
    xaxis: {
      ...defaultOptions.xaxis,
      categories: data.map((item) => item.productName),
    },
  };

  const series = [
    {
      name: "Unit Terjual",
      data: data.map((item) => item.totalSales),
    },
  ];

  return (
    <div
      className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8"
      style={{ height: "350px" }}
    >
      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={350}
        width="100%"
      />
    </div>
  );
};

export default ChartProductSales;
