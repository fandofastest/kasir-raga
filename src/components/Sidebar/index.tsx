"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SidebarItem from "@/components/Sidebar/SidebarItem";
import ClickOutside from "@/components/ClickOutside";
import useLocalStorage from "@/hooks/useLocalStorage";
import {
  ArrowLeftRightIcon,
  DollarSignIcon,
  LayoutDashboardIcon,
  PackageSearchIcon,
  SettingsIcon,
  SmileIcon,
  UsersIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/userauth";

// Interface untuk menu item
interface MenuItem {
  icon?: React.ReactNode;
  label: string;
  route: string;
  requiredPermission?: string;
  children?: MenuItem[];
}

// Interface untuk group menu
interface MenuGroup {
  name: string;
  menuItems: MenuItem[];
}

// Contoh menuGroups dengan tipe yang sudah didefinisikan
const menuGroups: MenuGroup[] = [
  {
    name: "MENU",
    menuItems: [
      {
        icon: <LayoutDashboardIcon />,
        label: "Dashboard",
        route: "/",
        requiredPermission: "dashboard:view",
      },
      {
        icon: <ArrowLeftRightIcon />,
        label: "Transaksi",
        route: "#",
        requiredPermission: "transaksi:view",
        children: [
          {
            label: "Penjualan",
            route: "/transaksi",
            requiredPermission: "penjualan:view",
          },
          {
            label: "Pembelian",
            route: "/pembelian",
            requiredPermission: "pembelian:view",
          },
          {
            label: "Pengeluaran",
            route: "/pengeluaran",
            requiredPermission: "pengeluaran:view",
          },
          {
            label: "History",
            route: "/history",
            requiredPermission: "history:view",
          },
          {
            label: "Draft",
            route: "/draft",
            requiredPermission: "draft:view",
          },
        ],
      },
      {
        icon: <PackageSearchIcon />,
        label: "Produk",
        route: "/produk",
        requiredPermission: "produk:view",
      },
      {
        icon: <UsersIcon />,
        label: "Data User",
        route: "#",
        requiredPermission: "user:view",
        children: [
          {
            label: "Konsumen",
            route: "/konsumen",
            requiredPermission: "konsumen:view",
          },
          {
            label: "Staff",
            route: "/staff",
            requiredPermission: "staff:view",
          },
          {
            label: "Supplier",
            route: "/supplier",
            requiredPermission: "supplier:view",
          },
        ],
      },
      {
        icon: <DollarSignIcon />,
        label: "Keuangan",
        route: "#",
        requiredPermission: "keuangan:view",
        children: [
          {
            label: "Piutang",
            route: "/piutang",
            requiredPermission: "piutang:view",
          },
          {
            label: "Hutang",
            route: "/hutang",
            requiredPermission: "hutang:view",
          },
        ],
      },
      {
        icon: <SmileIcon />,
        label: "Laporan",
        route: "#",
        requiredPermission: "laporan:view",
        children: [
          {
            label: "Penjualan",
            route: "/laporan/penjualan",
            requiredPermission: "laporan:penjualan:view",
          },
          {
            label: "Pembelian",
            route: "/laporan/pembelian",
            requiredPermission: "laporan:pembelian:view",
          },
          // {
          //   label: "Keuangan",
          //   route: "/laporan/keuangan",
          //   requiredPermission: "laporan:keuangan:view",
          // },
        ],
      },
      {
        icon: <SettingsIcon />,
        label: "Settings",
        route: "/settings",
        requiredPermission: "settings:view",
      },
    ],
  },
];

// Interface untuk User dari useAuth
interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  accessToken?: string | null;
  permissions?: string[];
}

// Fungsi helper untuk mengecek permission, dengan pengecualian jika role superadmin
const hasPermission = (item: MenuItem, user: User | null): boolean => {
  // Jika role superadmin, dapatkan akses penuh
  if (user && user.role === "superadmin") return true;
  if (!item.requiredPermission) return true;
  return user && user.permissions
    ? user.permissions.includes(item.requiredPermission)
    : false;
};

// Fungsi untuk memfilter menu item beserta children-nya
const filterMenuItem = (item: MenuItem, user: User | null): MenuItem | null => {
  if (item.children) {
    const filteredChildren = item.children.filter((child) =>
      hasPermission(child, user),
    );
    if (hasPermission(item, user) && filteredChildren.length > 0) {
      return { ...item, children: filteredChildren };
    }
    return null;
  }
  return hasPermission(item, user) ? item : null;
};

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const [pageName, setPageName] = useLocalStorage("selectedMenu", "dashboard");
  const { user } = useAuth();

  // Hanya ubah bagian logo di header sidebar
  const [logoUrl, setLogoUrl] = useState<string>("/images/logo/logo.svg");
  const [storeName, setStoreName] = useState<string>("Toko Default");

  useEffect(() => {
    const storedLogo = localStorage.getItem("companyLogo");
    if (storedLogo) {
      setLogoUrl(storedLogo);
    }
    const storedStoreName = localStorage.getItem("companyName");
    if (storedStoreName) {
      setStoreName(storedStoreName);
    }
  }, []);

  const filteredMenuGroups: MenuGroup[] = menuGroups
    .map((group) => ({
      ...group,
      menuItems: group.menuItems
        .map((item) => filterMenuItem(item, user as User))
        .filter((item): item is MenuItem => item !== null),
    }))
    .filter((group) => group.menuItems.length > 0);

  return (
    <ClickOutside onClick={() => setSidebarOpen(false)}>
      <aside
        className={`fixed left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-white duration-300 ease-linear dark:bg-boxdark lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* SIDEBAR HEADER */}
        <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
          <Link href="/">
            <div className="flex items-center gap-2">
              <Image
                width={60}
                height={32}
                src={`/api/image-proxy?url=${encodeURIComponent(logoUrl)}`}
                alt="Logo"
                priority
              />
              <span className=" font-bold text-black dark:text-white">
                {storeName}
              </span>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            className="block lg:hidden"
          >
            <svg
              className="fill-current"
              width="20"
              height="18"
              viewBox="0 0 20 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
                fill=""
              />
            </svg>
          </button>
        </div>
        {/* SIDEBAR HEADER */}

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
            {filteredMenuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <h3 className="mb-4 ml-4 text-sm font-semibold">
                  {group.name}
                </h3>
                <ul className="mb-6 flex flex-col gap-1.5">
                  {group.menuItems.map((menuItem, menuIndex) => (
                    <SidebarItem
                      key={menuIndex}
                      item={menuItem}
                      pageName={pageName}
                      setPageName={setPageName}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </ClickOutside>
  );
};

export default Sidebar;
