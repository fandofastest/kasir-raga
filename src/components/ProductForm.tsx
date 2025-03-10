"use client";

import React, { useEffect, useState } from "react";
import { XCircleIcon } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

import SelectWithCreate from "./SelectWithCreate";
import { Product } from "@/models/modeltsx/productTypes";
import {
  fetchSatuan,
  addSatuan,
  deleteSatuan,
  updateProduct,
  createProduct,
} from "@/lib/dataService";

// -------------------------------------------------------------------
// Sub-komponen: AddSatuanModal
// -------------------------------------------------------------------
function AddSatuanModal({
  isOpen,
  onClose,
  onCreatedSatuan,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreatedSatuan: (newSat: { _id: string; nama: string }) => void;
}) {
  const [satName, setSatName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!satName.trim()) return;
    try {
      const res = await addSatuan(satName);
      const data = res.data; // { _id, nama } dari server
      onCreatedSatuan(data);
      onClose();
    } catch (error) {
      toast.error("Terjadi kesalahan saat menambah satuan.");
      console.error(error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-lg bg-white p-4 shadow dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-2 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">
            Tambah Satuan
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XCircleIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            type="text"
            placeholder="Nama Satuan"
            value={satName}
            onChange={(e) => setSatName(e.target.value)}
            className="w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Simpan
          </button>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Sub-komponen: RemoveSatuanModal
// -------------------------------------------------------------------
function RemoveSatuanModal({
  isOpen,
  onClose,
  satuanOptions,
  onDeleteSatuan,
}: {
  isOpen: boolean;
  onClose: () => void;
  satuanOptions: { _id: string; nama: string }[];
  onDeleteSatuan: (id: string) => void;
}) {
  const [selectedSatuanId, setSelectedSatuanId] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSatuanId) return;
    try {
      await deleteSatuan(selectedSatuanId);
      onDeleteSatuan(selectedSatuanId);
      onClose();
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus satuan.");
      console.error(error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-lg bg-white p-4 shadow dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-2 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">
            Hapus Satuan
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XCircleIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <select
            className="w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
            value={selectedSatuanId}
            onChange={(e) => setSelectedSatuanId(e.target.value)}
          >
            <option value="">--Pilih Satuan--</option>
            {satuanOptions.map((opt) => (
              <option key={opt._id} value={opt._id}>
                {opt.nama}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Hapus
          </button>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Komponen Utama: ProductFormModal
// -------------------------------------------------------------------

interface SatuanPembelian {
  _id: string; // ID unik baris (untuk form)
  satuanId: string; // _id dari dokumen satuan yang dipilih
  konversi: number;
  harga: number;
}

interface SatuanData {
  _id: string;
  nama: string;
  deskripsi?: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  product?: Product | null;
}

export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  product,
}: ProductFormModalProps) {
  // State dasar produk
  const [namaProduk, setNamaProduk] = useState("");
  const [hargaModal, setHargaModal] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [supplier, setSupplier] = useState("");
  const [sku, setSku] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Brand & Kategori
  const [brand, setBrand] = useState<{ _id: string; nama: string } | null>(
    null,
  );
  const [kategori, setKategori] = useState<{
    _id: string;
    nama: string;
  } | null>(null);

  // Data satuans di form (multi baris)
  const [satuans, setSatuans] = useState<SatuanPembelian[]>([]);
  // Daftar satuan dari DB
  const [satuanOptions, setSatuanOptions] = useState<SatuanData[]>([]);
  const [loading, setLoading] = useState(false);

  // Toggle modal tambah/hapus satuan
  const [showAddSatuan, setShowAddSatuan] = useState(false);
  const [showRemoveSatuan, setShowRemoveSatuan] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("mytoken") : null;

  // Fetch data satuan saat mount
  useEffect(() => {
    async function getSatuan() {
      try {
        const res = await fetchSatuan();
        const data = res.data;
        setSatuanOptions(data);
      } catch (error) {
        console.error("Failed to fetch satuan:", error);
      }
    }
    getSatuan();
  }, []);
  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

  // Set data form jika mode edit
  useEffect(() => {
    if (product) {
      setNamaProduk(product.nama_produk);
      setHargaModal(product.harga_modal.toString());
      setJumlah(product.jumlah.toString());
      setSupplier(product.supplier);
      setSku(product.sku);
      setImageUrl(product.image);
      setBrand(product.brand || null);
      setKategori(product.kategori || null);

      if (Array.isArray(product.satuans) && product.satuans.length > 0) {
        setSatuans(
          product.satuans.map((s) => ({
            _id: s._id,
            satuanId: s.satuan?._id || "",
            konversi: s.konversi,
            harga: s.harga,
          })),
        );
      } else {
        setSatuans([
          { _id: generateUUID(), satuanId: "", konversi: 0, harga: 0 },
        ]);
      }
    } else {
      setNamaProduk("");
      setHargaModal("");
      setJumlah("");
      setSupplier("");
      setSku("");
      setImageUrl("");
      setBrand(null);
      setKategori(null);
      setSatuans([
        { _id: generateUUID(), satuanId: "", konversi: 0, harga: 0 },
      ]);
    }
  }, [product]);

  if (!isOpen) return null;

  const addSatuanRow = () => {
    setSatuans((prev) => [
      ...prev,
      { _id: generateUUID(), satuanId: "", konversi: 0, harga: 0 },
    ]);
  };

  const removeSatuanRow = (id: string) => {
    setSatuans((prev) => prev.filter((item) => item._id !== id));
  };

  const updateSatuan = (
    index: number,
    field: keyof SatuanPembelian,
    value: any,
  ) => {
    setSatuans((prev) => {
      const newArr = [...prev];
      newArr[index] = { ...newArr[index], [field]: value };
      return newArr;
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (data.url) {
      setImageUrl(data.url);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    const filteredSatuans = satuans
      .filter((s) => s.satuanId !== "")
      .map((s) => ({
        satuan: { _id: s.satuanId },
        konversi: s.konversi,
        harga: s.harga,
      }));

    const productData = {
      nama_produk: namaProduk,
      harga_modal: parseFloat(hargaModal),
      jumlah,
      supplier,
      sku,
      image: imageUrl,
      brand,
      kategori,
      satuans: filteredSatuans,
    };

    let res;
    if (product && product._id) {
      res = await updateProduct(product._id, productData);
    } else {
      res = await createProduct(productData);
    }
    console.log("====================================");
    console.log(res);
    console.log("====================================");

    setLoading(false);
    const responseData = await res;
    if (res.status === 200 || res.status === 201) {
      toast.success(
        product ? "Produk berhasil diupdate!" : "Produk berhasil ditambahkan!",
      );
      onSubmit();
      onClose();
    } else {
      toast.error(`Gagal menyimpan produk: ${responseData.error}`);
    }
  };

  const handleCreatedSatuan = (newSat: { _id: string; nama: string }) => {
    setSatuanOptions((prev) => [...prev, newSat]);
  };

  const handleDeleteSatuan = (id: string) => {
    setSatuanOptions((prev) => prev.filter((item) => item._id !== id));
  };

  const getAvailableOptionsForRow = (rowIndex: number) => {
    const usedSatuanIds = satuans
      .filter((_, i) => i !== rowIndex)
      .map((row) => row.satuanId)
      .filter(Boolean);
    return satuanOptions.filter((opt) => {
      const thisRowSatuanId = satuans[rowIndex].satuanId;
      if (usedSatuanIds.includes(opt._id) && opt._id !== thisRowSatuanId) {
        return false;
      }
      return true;
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <div
          className="scrollable relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-lg dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {product ? "Edit Produk" : "Tambah Produk"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Nama Produk
                </label>
                <input
                  type="text"
                  placeholder="Nama Produk"
                  value={namaProduk}
                  onChange={(e) => setNamaProduk(e.target.value)}
                  required
                  className="w-full rounded-lg border p-2 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Harga Modal
                </label>
                <input
                  type="number"
                  placeholder="Harga Modal"
                  value={hargaModal}
                  onChange={(e) => setHargaModal(e.target.value)}
                  required
                  className="w-full rounded-lg border p-2 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Jumlah Stok
                </label>
                <input
                  type="number"
                  placeholder="Stok"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  required
                  className="w-full rounded-lg border p-2 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Supplier
                </label>
                <input
                  type="text"
                  placeholder="Supplier"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full rounded-lg border p-2 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  SKU
                </label>
                <input
                  type="text"
                  placeholder="SKU"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full rounded-lg border p-2 dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Upload Gambar
                </label>
                <input
                  type="file"
                  onChange={handleUpload}
                  className="w-full rounded-lg border p-2 dark:bg-gray-800"
                />
                {imageUrl && (
                  <div className="mt-2 flex justify-center">
                    <Image
                      src={imageUrl}
                      alt="Preview"
                      width={100}
                      height={100}
                      className="rounded-lg object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4 dark:border-gray-700">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Brand
                </label>
                <SelectWithCreate
                  value={brand}
                  onChange={(val) => setBrand(val)}
                  unit="brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Kategori
                </label>
                <SelectWithCreate
                  value={kategori}
                  onChange={(val) => setKategori(val)}
                  unit="kategori"
                />
              </div>
            </div>

            <div className="border-t pt-4 dark:border-gray-700">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Daftar Satuan
                </label>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSatuan(true)}
                    className="rounded bg-green-500 px-2 py-1 text-sm text-white hover:bg-green-600"
                  >
                    + Tambah Satuan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRemoveSatuan(true)}
                    className="rounded bg-red-500 px-2 py-1 text-sm text-white hover:bg-red-600"
                  >
                    - Hapus Satuan
                  </button>
                </div>
              </div>

              {satuans.map((item, idx) => {
                const usedSatuanIds = satuans
                  .filter((_, i) => i !== idx)
                  .map((row) => row.satuanId)
                  .filter(Boolean);
                const availableOptions = satuanOptions.filter((opt) => {
                  const thisRowSatuanId = satuans[idx].satuanId;
                  if (
                    usedSatuanIds.includes(opt._id) &&
                    opt._id !== thisRowSatuanId
                  ) {
                    return false;
                  }
                  return true;
                });

                return (
                  <div key={item._id} className="mb-3 flex flex-wrap gap-4">
                    <div className="flex flex-col">
                      <label className="mb-1 text-sm text-gray-600 dark:text-gray-300">
                        Satuan
                      </label>
                      <select
                        className="w-32 rounded border p-1 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                        value={item.satuanId}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          updateSatuan(idx, "satuanId", newVal);
                          if (idx === satuans.length - 1 && newVal) {
                            addSatuanRow();
                          }
                        }}
                      >
                        <option value="">--Pilih--</option>
                        {availableOptions.map((opt) => (
                          <option key={opt._id} value={opt._id}>
                            {opt.nama}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="mb-1 text-sm text-gray-600 dark:text-gray-300">
                        Konversi
                      </label>
                      <input
                        type="number"
                        className="w-24 rounded border p-1 dark:bg-gray-800"
                        placeholder="0"
                        value={item.konversi}
                        onChange={(e) =>
                          updateSatuan(idx, "konversi", Number(e.target.value))
                        }
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="mb-1 text-sm text-gray-600 dark:text-gray-300">
                        Harga
                      </label>
                      <input
                        type="number"
                        className="w-28 rounded border p-1 dark:bg-gray-800"
                        placeholder="0"
                        value={item.harga}
                        onChange={(e) =>
                          updateSatuan(idx, "harga", Number(e.target.value))
                        }
                      />
                    </div>

                    {satuans.length > 1 && (
                      <div className="flex items-end">
                        <button
                          type="button"
                          className="text-red-600 dark:text-red-400"
                          onClick={() => removeSatuanRow(item._id)}
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading
                ? "Menyimpan..."
                : product
                  ? "Simpan Perubahan"
                  : "Simpan Produk"}
            </button>
          </form>
        </div>
      </div>

      <AddSatuanModal
        isOpen={showAddSatuan}
        onClose={() => setShowAddSatuan(false)}
        onCreatedSatuan={handleCreatedSatuan}
      />

      <RemoveSatuanModal
        isOpen={showRemoveSatuan}
        onClose={() => setShowRemoveSatuan(false)}
        satuanOptions={satuanOptions}
        onDeleteSatuan={handleDeleteSatuan}
      />
    </>
  );
}
