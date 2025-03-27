import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { Metadata } from "next";
import LaporanTransaksiPage from "../LaporanTransaksiPage";
import LaporanPiutangHutangPage from "../LaporanPiutangHutangPage";
import LaporanProdukPage from "../LaporanProduk";

export const metadata: Metadata = {
  title: "Sistem Kasir | Produk",
  description:
    "This is Sistem Kasir Produk page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const ProductsPage = () => {
  return (
    <DefaultLayout>
      <div className="max-w-600  mx-auto ">
        <Breadcrumb pageName="Laporan Produk" />

        <LaporanProdukPage />
      </div>
    </DefaultLayout>
  );
};

export default ProductsPage;
