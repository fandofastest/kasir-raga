import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Head from "next/head";
import { Metadata } from "next";
import HutangPage from "./hutang";

export const metadata: Metadata = {
  title: "Sistem Kasir | Hutang",
  description:
    "This is Sistem Kasir Hutang page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const MainPage = () => {
  return (
    <DefaultLayout>
      <div className="max-w-600  max-h-: mx-auto">
        <Breadcrumb pageName="Hutang" />

        <div className="colo grid h-full w-full grid-cols-5 gap-8 ">
          <div className="col-span-5 xl:col-span-8">
            <div className="w-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <HutangPage />
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default MainPage;
