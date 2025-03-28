import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Head from "next/head";
import { Metadata } from "next";
import TransactionDraftPage from "./TransactionDraftPage";

export const metadata: Metadata = {
  title: "Sistem Kasir | Draft",
  description:
    "This is Sistem Kasir Draft for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

const HistoryPage = () => {
  return (
    <DefaultLayout>
      <div className="max-w-600  mx-auto h-full">
        <Breadcrumb pageName="Draft" />

        <div className="colo grid h-full w-full grid-cols-5 gap-8 ">
          <div className="col-span-5 xl:col-span-8">
            <div className="w-full rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <TransactionDraftPage />
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default HistoryPage;
