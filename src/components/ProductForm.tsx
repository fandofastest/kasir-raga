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
  photoUpload,
  fetchSupplier,
} from "@/lib/dataService";
import StaffFormModal from "@/app/staff/StaffForm";
import SupplierFormModal from "@/app/supplier/SupplierForm";
import { AddSatuanModal, RemoveSatuanModal } from "./SatuanForm";

// Tambahkan properti optional "error" untuk validasi di tiap baris satuan
interface SatuanPembelian {
  _id: string;
  satuanId: string;
  konversi: number;
  harga: number;
  error?: string;
}

interface SatuanData {
  _id: string;
  nama: string;
  deskripsi?: string;
}

interface Supplier {
  _id?: string;
  nama: string;
  alamat: string;
  kontak: string;
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

  // Ubah ke object Supplier
  const [supplier, setSupplier] = useState<Supplier | null>(null);

  // Brand & Kategori
  const [brand, setBrand] = useState<{ _id: string; nama: string } | null>(
    null,
  );
  const [kategori, setKategori] = useState<{
    _id: string;
    nama: string;
  } | null>(null);

  // Data satuans di form
  const [satuans, setSatuans] = useState<SatuanPembelian[]>([]);
  const [satuanOptions, setSatuanOptions] = useState<SatuanData[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<Supplier[]>([]);

  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal tambah/hapus satuan
  const [showAddSatuan, setShowAddSatuan] = useState(false);
  const [showRemoveSatuan, setShowRemoveSatuan] = useState(false);

  // Modal untuk tambah supplier/staff
  const [showStaffModal, setShowStaffModal] = useState(false);

  // Token
  const token =
    typeof window !== "undefined" ? localStorage.getItem("mytoken") : null;

  // Ambil daftar satuan & supplier
  async function loadDataAwal() {
    try {
      const satuanRes = await fetchSatuan();
      const supplierRes = await fetchSupplier();
      setSatuanOptions(satuanRes.data);
      setSupplierOptions(supplierRes.data);
    } catch (error) {
      console.error("Failed to fetch:", error);
    }
  }

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

  useEffect(() => {
    loadDataAwal();
  }, []);

  useEffect(() => {
    if (product) {
      setNamaProduk(product.nama_produk);
      setHargaModal(product.harga_modal.toString());
      setJumlah(product.jumlah.toString());

      if (product.supplier && typeof product.supplier === "object") {
        setSupplier(product.supplier as Supplier);
      } else {
        setSupplier(null);
      }

      setBrand(product.brand || null);
      setKategori(product.kategori || null);
      setImageUrl(product.image);

      if (Array.isArray(product.satuans) && product.satuans.length > 0) {
        setSatuans(
          product.satuans.map((s) => ({
            _id: s._id,
            satuanId: s.satuan?._id || "",
            konversi: s.konversi,
            harga: s.harga,
            error: "",
          })),
        );
      } else {
        setSatuans([
          {
            _id: generateUUID(),
            satuanId: "",
            konversi: 0,
            harga: 0,
            error: "",
          },
        ]);
      }
    } else {
      // Reset form jika tidak ada produk (tambah baru)
      setNamaProduk("");
      setHargaModal("");
      setJumlah("");
      setSupplier(null);
      setBrand(null);
      setKategori(null);
      setImageUrl("");
      setSatuans([
        { _id: generateUUID(), satuanId: "", konversi: 0, harga: 0, error: "" },
      ]);
    }
  }, [product]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Satuan row handling
  const addSatuanRow = () => {
    setSatuans((prev) => [
      ...prev,
      { _id: generateUUID(), satuanId: "", konversi: 0, harga: 0, error: "" },
    ]);
  };

  const removeSatuanRow = (id: string) => {
    setSatuans((prev) => prev.filter((item) => item._id !== id));
  };

  const calculateProfit = (item: SatuanPembelian) => {
    const modal = parseFloat(hargaModal) || 0;
    const cost = modal * item.konversi;
    if (cost > 0) {
      return (((item.harga - cost) / cost) * 100).toFixed(2);
    }
    return "0.00";
  };

  const updateSatuanProfit = (index: number, newProfit: number) => {
    setSatuans((prev) => {
      const newArr = [...prev];
      const currentRow = newArr[index];
      const modal = parseFloat(hargaModal) || 0;
      const cost = modal * currentRow.konversi;
      if (newProfit < 0) {
        newArr[index] = {
          ...currentRow,
          error: `% Keuntungan tidak boleh negatif.`,
        };
      } else {
        const newHarga = cost * (1 + newProfit / 100);
        newArr[index] = {
          ...currentRow,
          harga: Number(newHarga.toFixed(2)),
          error: "",
        };
      }
      return newArr;
    });
  };

  const updateSatuan = (
    index: number,
    field: keyof SatuanPembelian,
    value: any,
  ) => {
    setSatuans((prev) => {
      const newArr = [...prev];
      const currentRow = newArr[index];
      const modal = parseFloat(hargaModal) || 0;

      if (field === "konversi") {
        const newKonversi = Number(value);
        // Hitung harga jual otomatis dengan margin 5%
        const calculatedHarga = modal * newKonversi * 1.05;
        newArr[index] = {
          ...currentRow,
          konversi: newKonversi,
          harga: Number(calculatedHarga.toFixed(2)),
          error: "",
        };
      } else if (field === "harga") {
        const newHarga = Number(value);
        const minHarga = modal * currentRow.konversi;
        if (newHarga < minHarga) {
          newArr[index] = {
            ...currentRow,
            harga: newHarga,
            error: `Harga jual tidak boleh dibawah harga modal satuan (${minHarga.toFixed(2)})`,
          };
        } else {
          newArr[index] = { ...currentRow, harga: newHarga, error: "" };
        }
      } else {
        newArr[index] = { ...currentRow, [field]: value };
      }
      return newArr;
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = await photoUpload(e);
    if (url) {
      setImageUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    // Cari baris satuan yang memiliki error validasi
    const errorRows = satuans.filter((s) => s.error && s.error.length > 0);
    if (errorRows.length > 0) {
      // Menampilkan error dari baris satuan pertama (atau Anda bisa menampilkan semua jika diinginkan)
      toast.error(
        errorRows[0].error || "Terjadi kesalahan saat menambahkan produk.",
      );
      return;
    }

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
      supplier: supplier ? { _id: supplier._id, nama: supplier.nama } : null,
      brand,
      kategori,
      image: imageUrl,
      satuans: filteredSatuans,
    };

    let res;
    try {
      if (product && product._id) {
        res = await updateProduct(product._id, productData);
      } else {
        res = await createProduct(productData);
      }
    } catch (error) {
      console.log(error);
      console.log("====================================");
      console.log(res);
      console.log("====================================");
    }
    setLoading(false);

    if (res.status === 200 || res.status === 201) {
      toast.success(
        product ? "Produk berhasil diupdate!" : "Produk berhasil ditambahkan!",
      );
      // Reset form
      setNamaProduk("");
      setHargaModal("");
      setJumlah("");
      setSupplier(null);
      setBrand(null);
      setKategori(null);
      setImageUrl("");
      setSatuans([
        { _id: generateUUID(), satuanId: "", konversi: 0, harga: 0, error: "" },
      ]);
      onSubmit();
      onClose();
    } else {
      const responseData = await res;
      toast.error(`Gagal menyimpan produk: ${responseData.error}`);
    }
  };

  const handleCreatedSatuan = (newSat: { _id: string; nama: string }) => {
    setSatuanOptions((prev) => [...prev, newSat]);
  };

  const handleDeleteSatuan = (id: string) => {
    setSatuanOptions((prev) => prev.filter((item) => item._id !== id));
  };

  if (!isOpen) return null;

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
                  className="w-full rounded-lg border p-2 dark:bg-gray-800"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Supplier
                </label>
                <div className="flex items-center gap-2">
                  <select
                    className="w-full rounded-lg border p-2 dark:bg-gray-800"
                    value={supplier?._id || ""}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const foundSup = supplierOptions.find(
                        (sup) => sup._id === selectedId,
                      );
                      setSupplier(foundSup || null);
                    }}
                  >
                    <option value="">--Pilih Supplier--</option>
                    {supplierOptions.map((sup) => (
                      <option key={sup._id} value={sup._id}>
                        {sup.nama}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowStaffModal(true)}
                    className="bg-tosca hover:bg-toscadark-600 rounded px-2 py-1 text-white"
                  >
                    +
                  </button>
                </div>
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
                      src={`/api/image-proxy?url=${encodeURIComponent(imageUrl)}`}
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
                    className="bg-tosca hover:bg-toscadark rounded px-2 py-1 text-sm text-white"
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
                        className={`w-28 rounded border p-1 dark:bg-gray-800 ${item.error ? "border-red-500" : ""}`}
                        placeholder="0"
                        value={item.harga}
                        onChange={(e) =>
                          updateSatuan(idx, "harga", Number(e.target.value))
                        }
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="mb-1 text-sm text-gray-600 dark:text-gray-300">
                        % Keuntungan
                      </label>
                      <input
                        type="number"
                        className="w-20 rounded border p-1 dark:bg-gray-800"
                        placeholder="0"
                        value={calculateProfit(item)}
                        onChange={(e) =>
                          updateSatuanProfit(idx, Number(e.target.value))
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
              className="bg-tosca hover:bg-toscadark w-full rounded-lg px-4 py-2 text-white disabled:bg-gray-400"
            >
              {loading
                ? "Menyimpan..."
                : product
                  ? "Simpan Perubahan"
                  : "Simpan Produk"}
            </button>
            <div className="mt-2 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                Batal
              </button>
            </div>
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
      <SupplierFormModal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        onSubmit={() => {
          loadDataAwal();
          setShowStaffModal(false);
        }}
      />
    </>
  );
}
