import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { Metadata } from "next";
import PersonalInformationPage from "./main";
import PreferencesPage from "./main";

export const metadata: Metadata = {
  title: "Settings | MyApp",
  description: "Update your profile information",
};

const Settings = () => {
  return (
    <DefaultLayout>
      <div className="mx-auto max-w-4xl p-4">
        <Breadcrumb pageName="Settings" />
        <PreferencesPage />
      </div>
    </DefaultLayout>
  );
};

export default Settings;
