"use client";

import { XCircleIcon } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import SelectWithCreate from "./SelectWithCreate";
import toast from "react-hot-toast";

interface Product {
  _id: string;
  nama_produk: string;
  harga: number;
  jumlah: number;
  supplier: string;
  satuan: { _id: string; nama: string } | null;
  kategori: { _id: string; nama: string } | null;
  brand: { _id: string; nama: string } | null;
  sku: string;
  image: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  product?: Product | null; // Jika ada product, berarti mode edit
}

export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  product,
}: ProductFormModalProps) {
  const [namaProduk, setNamaProduk] = useState("");
  const [harga, setHarga] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [supplier, setSupplier] = useState("");
  const [sku, setSku] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedSatuan, setSelectedSatuan] = useState<{
    _id: string;
    nama: string;
  } | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<{
    _id: string;
    nama: string;
  } | null>(null);
  const [selectedKategori, setSelectedKategori] = useState<{
    _id: string;
    nama: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("mytoken");

  useEffect(() => {
    if (product) {
      setNamaProduk(product.nama_produk);
      setHarga(product.harga.toString());
      setJumlah(product.jumlah.toString());
      setSupplier(product.supplier);
      setSku(product.sku);
      setImageUrl(product.image);
      setSelectedSatuan(product.satuan);
      setSelectedBrand(product.brand);
      setSelectedKategori(product.kategori);
    } else {
      // Reset form jika modal dibuka untuk tambah produk
      setNamaProduk("");
      setHarga("");
      setJumlah("");
      setSupplier("");
      setSku("");
      setImageUrl("");
      setSelectedSatuan(null);
      setSelectedBrand(null);
      setSelectedKategori(null);
    }
  }, [product]);

  if (!isOpen) return null;

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const productData = {
      nama_produk: namaProduk,
      harga: parseFloat(harga),
      jumlah: parseInt(jumlah),
      supplier,
      satuan: selectedSatuan,
      kategori: selectedKategori,
      brand: selectedBrand,
      sku,
      image: imageUrl,
    };

    setLoading(true);
    let res;
    if (product) {
      // Update produk (PUT request)
      res = await fetch(`/api/product/?id=${product._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });
    } else {
      // Tambah produk baru (POST request)
      res = await fetch("/api/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });
    }

    console.log("====================================");
    console.log(productData);
    console.log(product?._id);
    console.log("====================================");
    setLoading(false);
    const data = await res.json();
    if (res.ok) {
      onSubmit();
      toast.success(
        product
          ? "Produk berhasil diperbarui!"
          : "Produk berhasil ditambahkan!",
        { duration: 3000, position: "top-center" },
      );
      onClose();
    } else {
      toast.error("Gagal menyimpan produk: " + data.error);
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
            {product ? "Edit Produk" : "Tambah Produk Baru"}
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
            name="nama_produk"
            placeholder="Nama Produk"
            value={namaProduk}
            onChange={(e) => setNamaProduk(e.target.value)}
            required
            className="w-full rounded-lg border p-2 dark:bg-gray-800"
          />
          <input
            type="number"
            name="harga"
            placeholder="Harga"
            value={harga}
            onChange={(e) => setHarga(e.target.value)}
            required
            className="w-full rounded-lg border p-2 dark:bg-gray-800"
          />
          <input
            type="number"
            name="jumlah"
            placeholder="Jumlah"
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value)}
            required
            className="w-full rounded-lg border p-2 dark:bg-gray-800"
          />
          <input
            type="text"
            name="supplier"
            placeholder="Supplier"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            required
            className="w-full rounded-lg border p-2 dark:bg-gray-800"
          />

          <SelectWithCreate
            value={selectedSatuan}
            onChange={setSelectedSatuan}
            unit="satuan"
          />
          <SelectWithCreate
            value={selectedKategori}
            onChange={setSelectedKategori}
            unit="kategori"
          />
          <SelectWithCreate
            value={selectedBrand}
            onChange={setSelectedBrand}
            unit="brand"
          />

          <input
            type="text"
            name="sku"
            placeholder="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
            className="w-full rounded-lg border p-2 dark:bg-gray-800"
          />
          <input
            type="file"
            onChange={handleUpload}
            className="w-full rounded-lg border p-2 dark:bg-gray-800"
          />
          {imageUrl && (
            <Image
              src={imageUrl}
              alt="Preview"
              width={200}
              height={200}
              className="mx-auto mt-2 rounded-lg object-cover"
            />
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
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
  );
}
