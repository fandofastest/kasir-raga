import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { Metadata } from "next";
import LaporanTransaksiPage from "../LaporanTransaksiPage";
import LaporanPiutangHutangPage from "../LaporanPiutangHutangPage";

export const metadata: Metadata = {
  title: "Sistem Kasir | HutPiutangang",
  description:
    "This is Sistem Kasir Piutang page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const ProductsPage = () => {
  return (
    <DefaultLayout>
      <div className="max-w-600  mx-auto ">
        <Breadcrumb pageName="Laporan Piutang" />

        <LaporanPiutangHutangPage reportType="piutang" />
      </div>
    </DefaultLayout>
  );
};

export default ProductsPage;
