import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { Metadata } from "next";
import LaporanTransaksiPage from "../LaporanTransaksiPage";
import LaporanPiutangHutangPage from "../LaporanPiutangHutangPage";
import LaporanBiayaLainnyaPage from "../LaporanBiayaLainnyaPage";

export const metadata: Metadata = {
  title: "Sistem Kasir | Biaya",
  description:
    "This is Sistem Kasir Hutang Biaya for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const ProductsPage = () => {
  return (
    <DefaultLayout>
      <div className="max-w-600  mx-auto ">
        <Breadcrumb pageName="Laporan Biaya" />

        <LaporanBiayaLainnyaPage />
      </div>
    </DefaultLayout>
  );
};

export default ProductsPage;
