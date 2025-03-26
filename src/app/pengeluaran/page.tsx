import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { Metadata } from "next";
import TransaksiLainLainPage from "./main";

export const metadata: Metadata = {
  title: "Sistem Kasir | Pengeluaran",
  description:
    "This is Sistem Kasir Produk page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const ProductsPage = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto min-h-screen px-4">
        <Breadcrumb pageName="Pengeluaran" />

        <div className="grid h-full w-full grid-cols-1 gap-8 md:grid-cols-5">
          <div className="col-span-full">
            <div className="w-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <TransaksiLainLainPage />
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default ProductsPage;
