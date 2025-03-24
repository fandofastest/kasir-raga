import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Head from "next/head";
import { Metadata } from "next";
import TransactionHistoryPage from "./TransactionHistoryPage";

export const metadata: Metadata = {
  title: "Sistem Kasir | Penjualan",
  description:
    "This is Sistem Kasir Penjualan  for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const HistoryPage = () => {
  return (
    <DefaultLayout>
      <div className="max-w-600  max-h-: mx-auto">
        <Breadcrumb pageName="Penjualan" />

        <div className="colo grid h-full w-full grid-cols-5 gap-8 ">
          <div className="col-span-5 xl:col-span-8">
            <div className="w-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <TransactionHistoryPage tipeTransaksi="penjualan" />
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default HistoryPage;
