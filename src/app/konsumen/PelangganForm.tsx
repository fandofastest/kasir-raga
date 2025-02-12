"use client";

import { XCircleIcon } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface Pelanggan {
  _id?: string;
  nama: string;
  nohp: string;
  alamat: string;
}

interface PelangganFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  pelanggan?: Pelanggan | null;
}

export default function PelangganFormModal({
  isOpen,
  onClose,
  onSubmit,
  pelanggan,
}: PelangganFormModalProps) {
  const [nama, setNama] = useState("");
  const [nohp, setNohp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("mytoken");

  useEffect(() => {
    if (pelanggan) {
      setNama(pelanggan.nama);
      setNohp(pelanggan.nohp);
      setAlamat(pelanggan.alamat);
    } else {
      setNama("");
      setNohp("");
      setAlamat("");
    }
  }, [pelanggan]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const pelangganData: Pelanggan = {
      nama,
      nohp,
      alamat,
    };

    setLoading(true);
    let res;
    if (pelanggan?._id) {
      res = await fetch(`/api/konsumen/?id=${pelanggan._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pelangganData),
      });
      console.log("====================================");
      console.log(pelangganData);
      console.log("====================================");
    } else {
      res = await fetch("/api/konsumen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pelangganData),
      });
    }

    setLoading(false);
    const data = await res.json();
    if (res.ok) {
      onSubmit();
      toast.success(
        pelanggan
          ? "Pelanggan berhasil diperbarui!"
          : "Pelanggan berhasil ditambahkan!",
        { duration: 3000, position: "top-center" },
      );
      onClose();
    } else {
      toast.error("Gagal menyimpan pelanggan: " + data.error);
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
            {pelanggan ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
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
            name="nama"
            placeholder="Nama Pelanggan"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
            className="w-full rounded-lg border p-2 dark:bg-gray-800"
          />
          <input
            type="text"
            name="nohp"
            placeholder="Nomor HP"
            value={nohp}
            onChange={(e) => setNohp(e.target.value)}
            required
            className="w-full rounded-lg border p-2 dark:bg-gray-800"
          />
          <input
            type="text"
            name="alamat"
            placeholder="Alamat"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            required
            className="w-full rounded-lg border p-2 dark:bg-gray-800"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {loading
              ? "Menyimpan..."
              : pelanggan
                ? "Simpan Perubahan"
                : "Simpan Pelanggan"}
          </button>
        </form>
      </div>
    </div>
  );
}
