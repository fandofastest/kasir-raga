import ECommerce from "@/components/Dashboard/E-commerce";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserProvider from "./contexts/userContext";

export default async function Home() {
  // const session = await auth();

  // if (!session) {
  //   redirect("/auth/signin");
  // }

  return (
    <>
      <DefaultLayout>
        <ECommerce />
      </DefaultLayout>
    </>
  );
}
