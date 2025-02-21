import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import ItemList from "./itemlist";
import Head from "next/head";
import { Metadata } from "next";

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

        <ItemList />
      </div>
    </DefaultLayout>
  );
};

export default ProductsPage;
