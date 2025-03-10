"use client";

import { XCircleIcon } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Supplier } from "@/models/modeltsx/supplierTypes"; // Sesuaikan path sesuai struktur proyek Anda

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  supplier?: Supplier | null;
}

export default function SupplierFormModal({
  isOpen,
  onClose,
  onSubmit,
  supplier,
}: SupplierFormModalProps) {
  const [name, setName] = useState("");
  const [nohp, setNohp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("mytoken");

  useEffect(() => {
    if (supplier) {
      setName(supplier.nama);
      setNohp(supplier.kontak);
      setAlamat(supplier.alamat || "");
    } else {
      setName("");
      setNohp("");
      setAlamat("");
    }
  }, [supplier]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const supplierData: Supplier = {
      nama: name,
      kontak: nohp,
      alamat,
    };

    setLoading(true);
    let res;
    if (supplier?._id) {
      res = await fetch(`/api/supplier/?id=${supplier._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(supplierData),
      });
    } else {
      res = await fetch("/api/supplier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(supplierData),
      });
    }

    setLoading(false);
    const data = await res.json();
    if (res.ok) {
      onSubmit();
      toast.success(
        supplier
          ? "Supplier berhasil diperbarui!"
          : "Supplier berhasil ditambahkan!",
        { duration: 3000, position: "top-center" },
      );
      onClose();
    } else {
      toast.error("Gagal menyimpan supplier: " + data.error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {supplier ? "Edit Supplier" : "Tambah Supplier Baru"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <input
            type="text"
            placeholder="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border p-2 dark:bg-gray-800"
          />

          <input
            type="text"
            placeholder="Nomor HP"
            value={nohp}
            onChange={(e) => setNohp(e.target.value)}
            required
            className="w-full rounded-lg border p-2 dark:bg-gray-800"
          />
          <input
            type="text"
            placeholder="Alamat"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            className="w-full rounded-lg border p-2 dark:bg-gray-800"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {loading
              ? "Menyimpan..."
              : supplier
                ? "Simpan Perubahan"
                : "Simpan Supplier"}
          </button>
        </form>
      </div>
    </div>
  );
}
