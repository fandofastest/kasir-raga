"use client";

import { useState, useEffect } from "react";
import { XCircleIcon } from "lucide-react";
import toast from "react-hot-toast";
import { updateStaff } from "@/lib/dataService";

interface PermissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  initialPermissions: string[];
  onPermissionUpdated: () => void;
}

// Contoh daftar permission sesuai struktur yang digunakan di Sidebar.
// Anda bisa menyesuaikannya nantinya.
const permissionOptions = [
  "dashboard:view",
  "transaksi:view",
  "transaksi:penjualan:view",
  "transaksi:pembelian:view",
  "transaksi:pengeluaran:view",
  "transaksi:draft:view",
  "produk:view",
  "datauser:view",
  "konsumen:view",
  "staff:view",
  "supplier:view",
  "keuangan:view",
  "keuangan:cashflow:view",
  "keuangan:pembelian:view",
  "keuangan:penjualan:view",
  "keuangan:piutang:view",
  "keuangan:hutang:view",
  "keuangan:pengeluaran:view",
  "laporan:view",
  "laporan:penjualan:view",
  "laporan:pembelian:view",
  "laporan:piutang:view",
  "laporan:hutang:view",
  "laporan:produk:view",
  "laporan:biaya:view",
  "settings:view",
];

export default function PermissionFormModal({
  isOpen,
  onClose,
  staffId,
  initialPermissions,
  onPermissionUpdated,
}: PermissionFormModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    setSelectedPermissions(initialPermissions);
  }, [initialPermissions]);

  if (!isOpen) return null;

  const handleCheckboxChange = (perm: string) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await updateStaff(staffId, { permissions: selectedPermissions });
      onPermissionUpdated();
      onClose();
    } catch (error) {
      toast.error("Error updating permission");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-4 shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-2 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Edit Permissions</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <p className="font-medium">Select Permissions:</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {permissionOptions.map((perm) => (
                <label key={perm} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm)}
                    onChange={() => handleCheckboxChange(perm)}
                    className="h-4 w-4"
                  />
                  <span className="capitalize">{perm}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded bg-tosca px-4 py-2 text-white hover:bg-toscadark"
          >
            Save Permissions
          </button>
        </form>
      </div>
    </div>
  );
}
