import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Head from "next/head";
import { Metadata } from "next";
import PenjualanPage from "./penjualanPage";

export const metadata: Metadata = {
  title: "Sistem Kasir | Produk",
  description:
    "This is Sistem Kasir Produk page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const ProductsPage = () => {
  return (
    <DefaultLayout>
      <div className="max-w-600  mx-auto">
        <Breadcrumb pageName="Transaksi" />

        <PenjualanPage />
      </div>
    </DefaultLayout>
  );
};

export default ProductsPage;
