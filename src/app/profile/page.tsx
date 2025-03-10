import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { Metadata } from "next";
import MainSetting from "./main";

export const metadata: Metadata = {
  title: "Profile | MyApp",
  description: "Update your profile information",
};

const Settings = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto max-w-4xl p-4">
        <Breadcrumb pageName="Profile" />
        <MainSetting />
      </div>
    </DefaultLayout>
  );
};

export default Settings;
