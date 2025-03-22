import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { Metadata } from "next";
import LaporanTransaksiPage from "../main";

export const metadata: Metadata = {
  title: "Sistem Kasir | Penjualan",
  description:
    "This is Sistem Kasir Penjualan page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const ProductsPage = () => {
  return (
    <DefaultLayout>
      <div className="max-w-600  mx-auto ">
        <Breadcrumb pageName="Laporan Penjualan" />

        <LaporanTransaksiPage transactionType="penjualan" />
      </div>
    </DefaultLayout>
  );
};

export default ProductsPage;
