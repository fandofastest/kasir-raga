"use client";

import { XCircleIcon } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
 import { PlusCircle } from "lucide-react";
import { Trash2 } from "lucide-react";

interface Pelanggan {
  _id?: string;
  nama: string;
  nohp: string;
  alamat: string;
  kategori?: string;
}

interface Kategori {
  _id: string;
  nama: string;
  deskripsi?: string;
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
  const [kategori, setKategori] = useState<string>("");
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [kategoriModalOpen, setKategoriModalOpen] = useState(false);
  const [newKategoriNama, setNewKategoriNama] = useState("");
  const [newKategoriDeskripsi, setNewKategoriDeskripsi] = useState("");
  useEffect(() => {
    // Fetch kategori list
    fetch("/api/kategorikonsumen", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setKategoriList(data));
  }, [token]);

  useEffect(() => {
    if (pelanggan) {
      setNama(pelanggan.nama);
      setNohp(pelanggan.nohp);
      setAlamat(pelanggan.alamat);
      setKategori(pelanggan.kategori || "");
    } else {
      setNama("");
      setNohp("");
      setAlamat("");
      setKategori("");
    }
  }, [pelanggan]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const pelangganData: any = {
      nama,
      nohp,
      alamat,
      kategori,
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

  const handleAddKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const res = await fetch("/api/kategorikonsumen", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nama: newKategoriNama,
        deskripsi: newKategoriDeskripsi,
      }),
    });
    if (res.ok) {
      const newKategori = await res.json();
      setKategoriList([...kategoriList, newKategori]);
      setKategori(newKategori._id);
      setKategoriModalOpen(false);
      setNewKategoriNama("");
      setNewKategoriDeskripsi("");
      toast.success("Kategori berhasil ditambahkan!");
    } else {
      const data = await res.json();
      toast.error("Gagal menambah kategori: " + data.error);
    }
  };

  const handleDeleteKategori = async (id: string) => {
    if (!token) return;
    if (!window.confirm("Yakin hapus kategori ini?")) return;
    const res = await fetch("/api/kategorikonsumen", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setKategoriList(kategoriList.filter(kat => kat._id !== id));
      // If the deleted kategori is selected, reset selection
      if (kategori === id) setKategori("");
      toast.success("Kategori berhasil dihapus!");
    } else {
      const data = await res.json();
      toast.error("Gagal menghapus kategori: " + data.error);
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
          <div className="flex items-center gap-2">
            <select
              name="kategori"
              value={kategori}
              onChange={e => setKategori(e.target.value)}
              required
              className="w-full rounded-lg border p-2 dark:bg-gray-800"
            >
              <option value="">Pilih Kategori</option>
              {kategoriList.map(kat => (
                <option key={kat._id} value={kat._id}>
                  {kat.nama}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="flex items-center px-2 py-1 rounded bg-tosca text-white hover:bg-toscadark"
              onClick={() => setKategoriModalOpen(true)}
              title="Tambah Kategori"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>
          <button
            type="submit"
            className="bg-tosca hover:bg-toscadark w-full rounded-lg px-4 py-2 text-white"
          >
            {loading
              ? "Menyimpan..."
              : pelanggan
                ? "Simpan Perubahan"
                : "Simpan Pelanggan"}
          </button>
        </form>
        {/* Modal for adding kategori */}
        {kategoriModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-sm relative">
              <button
                className="absolute top-2 right-2 text-gray-500"
                onClick={() => setKategoriModalOpen(false)}
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
              <h3 className="text-lg font-semibold mb-4">Tambah Kategori Konsumen</h3>
              <form onSubmit={handleAddKategori} className="space-y-3">
                <input
                  type="text"
                  placeholder="Nama Kategori"
                  value={newKategoriNama}
                  onChange={e => setNewKategoriNama(e.target.value)}
                  required
                  className="w-full rounded-lg border p-2 dark:bg-gray-800"
                />
                <input
                  type="text"
                  placeholder="Deskripsi (opsional)"
                  value={newKategoriDeskripsi}
                  onChange={e => setNewKategoriDeskripsi(e.target.value)}
                  className="w-full rounded-lg border p-2 dark:bg-gray-800"
                />
                <button
                  type="submit"
                  className="bg-tosca hover:bg-toscadark w-full rounded-lg px-4 py-2 text-white"
                >
                  Simpan Kategori
                </button>
              </form>
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Daftar Kategori</h4>
                <ul className="max-h-40 overflow-y-auto">
                  {kategoriList.map(kat => (
                    <li key={kat._id} className="flex items-center justify-between py-1 border-b last:border-b-0">
                      <span>{kat.nama}</span>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 ml-2"
                        onClick={() => handleDeleteKategori(kat._id)}
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
