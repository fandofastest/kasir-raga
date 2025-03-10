import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { Metadata } from "next";
import ItemStaff from "./itemlist";

export const metadata: Metadata = {
  title: "Sistem Kasir | Karyawan",
  description:
    "This is Sistem Kasir Produk page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};
const ProductsPage = () => {
  return (
    <DefaultLayout>
      <div className="max-w-600  mx-auto">
        <Breadcrumb pageName="Karyawan" />

        <div className="colo grid h-full w-full grid-cols-5 gap-8 ">
          <div className="col-span-5 xl:col-span-8">
            <div className="w-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <ItemStaff />
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default ProductsPage;
