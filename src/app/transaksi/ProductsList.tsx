"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Product } from "@/models/modeltsx/productTypes";
import CartItem from "@/models/modeltsx/CartItem";
import { fetchProducts } from "@/lib/dataService";
import { GridIcon, ListIcon, XCircleIcon } from "lucide-react";
// (Gunakan ikon sesuai preferensi,
//  misal dari heroicons, lucide, dsb.)

interface ProductsListProps {
  addToCart: (item: CartItem, quantity: number) => void;
  refreshKey: number;
}

export default function ProductsList({
  addToCart,
  refreshKey,
}: ProductsListProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [selectedSatuanId, setSelectedSatuanId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  async function loadProducts() {
    try {
      const data = await fetchProducts();
      setProducts(data.data);
    } catch (error) {
      toast.error("Gagal memuat produk");
      console.error(error);
    }
  }
  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
    console.log("====================================");
    console.log("refreshKey:", refreshKey);
    console.log("====================================");
  }, [refreshKey]);

  // Filter berdasarkan searchTerm
  const filteredProducts = products.filter((p) =>
    p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Saat klik "Tambah"
  const handleTambahClick = (product: Product) => {
    setActiveProduct(product);

    // Default satuan => product.satuans[0] jika ada
    if (product.satuans && product.satuans.length > 0) {
      const defaultSat = product.satuans[0];
      setSelectedSatuanId(defaultSat.satuan._id);
      setUnitPrice(defaultSat.harga);
    } else {
      setSelectedSatuanId("");
      setUnitPrice(0);
    }

    setQuantity(1);
  };

  // Saat ganti satuan
  const handleSelectSatuan = (satuanId: string) => {
    setSelectedSatuanId(satuanId);

    if (activeProduct && activeProduct.satuans) {
      const found = activeProduct.satuans.find(
        (s) => s.satuan._id === satuanId,
      );
      if (found) {
        setUnitPrice(found.harga);
        console.log("====================================");
        console.log(found.harga);
        console.log("====================================");
      }
    }
  };

  // Total harga = unitPrice * quantity
  const totalPrice = unitPrice * quantity;

  // Konfirmasi menambahkan item ke cart
  const handleConfirmAdd = () => {
    if (!activeProduct) return;

    const chosenSatuan = activeProduct.satuans.find(
      (s) => s.satuan._id === selectedSatuanId,
    );
    if (!chosenSatuan) {
      toast.error("Pilih satuan terlebih dahulu");
      return;
    }

    // Bentuk CartItem
    const cartItem: CartItem = {
      ...activeProduct,
      // Hanya 1 satuan terpilih
      satuans: [chosenSatuan],
      harga: unitPrice,
      quantity,
    };

    addToCart(cartItem, quantity);
    setActiveProduct(null);
  };

  // Tutup Modal
  const handleCloseModal = () => {
    setActiveProduct(null);
  };

  return (
    <div className="p-4">
      {/* Search & Toggle View */}
      <div className="mb-3 flex items-center space-x-3">
        <input
          type="text"
          placeholder="Cari produk..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-5/6 rounded-md border border-gray-300 
                     px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 
                     dark:border-gray-600 dark:bg-gray-700 dark:text-white 
                     dark:focus:ring-blue-500"
        />
        <button
          onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
          className="flex w-1/6 items-center justify-center 
                     rounded-md border border-stroke bg-white px-3 py-1 text-sm 
                     hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark 
                     dark:text-white dark:hover:bg-strokedark"
        >
          {viewMode === "list" ? (
            <>
              <GridIcon className="mr-1 h-4 w-4" /> Grid
            </>
          ) : (
            <>
              <ListIcon className="mr-1 h-4 w-4" /> List
            </>
          )}
        </button>
      </div>

      {/* Daftar Produk */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
            : "flex flex-col space-y-3"
        }
      >
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const firstPrice =
              product.satuans && product.satuans.length > 0
                ? product.satuans[0].harga
                : 0;

            return (
              <div
                key={product._id}
                className={`
                  rounded-md border border-stroke p-3 shadow-sm 
                  transition-shadow hover:shadow-lg dark:border-strokedark dark:bg-boxdark
                  ${
                    viewMode === "grid"
                      ? "flex flex-col items-center space-y-2 text-center"
                      : "flex w-full flex-row items-center justify-between space-x-4"
                  }`}
              >
                {/* Gambar Produk */}
                <div className="relative h-[100px] w-[100px] rounded-md border border-gray-300">
                  <Image
                    src={product.image ?? "/images/product/product-01.png"}
                    alt="Product"
                    fill
                    className="rounded-md object-cover"
                  />
                </div>
                {/* Info Produk */}
                <div className="flex-1">
                  <p className="font-medium text-black dark:text-white">
                    {product.nama_produk}
                  </p>
                  {product.satuans && product.satuans.length > 0 ? (
                    <p className="text-sm text-gray-500">
                      Rp{firstPrice.toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">No Price</p>
                  )}
                </div>

                {/* Stok */}
                <div>
                  <p className="text-sm text-gray-500">
                    Stok: {product.jumlah}
                  </p>
                </div>

                {/* Tombol Tambah */}
                <button
                  className={`ml-auto rounded-md px-3 py-1 text-sm font-semibold text-white ${
                    viewMode === "grid" ? "w-full" : ""
                  }
                    ${
                      product.jumlah === 0
                        ? "cursor-not-allowed bg-gray-400"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  onClick={() => handleTambahClick(product)}
                  disabled={product.jumlah === 0}
                >
                  {product.jumlah === 0 ? "Habis" : "Tambah"}
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Produk tidak ditemukan
          </p>
        )}
      </div>

      {/* MODAL: Pilih Satuan & Quantity */}
      {activeProduct && (
        <div
          className="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-black
                     bg-opacity-50 transition-opacity"
          // Silakan definisikan animasi "animate-fadeIn" di tailwind.config atau css kustom
          onClick={handleCloseModal}
        >
          <div
            className="animate-modalSlideIn relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg 
                       bg-white p-6 shadow-lg
                       transition-transform dark:bg-gray-900"
            // Definisikan animasi "animate-modalSlideIn" sesuai preferensi
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon Close di sudut kanan atas */}
            <button
              onClick={handleCloseModal}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 
                         dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>

            <h2 className="mb-4 text-lg font-semibold dark:text-white">
              Tambah ke Keranjang
            </h2>
            <p className="mb-3 text-sm text-gray-700 dark:text-gray-200">
              {activeProduct.nama_produk}
            </p>

            {/* Form di-grid agar rapi */}
            <div className="grid gap-4">
              {/* Pilih Satuan */}
              {activeProduct.satuans && activeProduct.satuans.length > 0 ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Pilih Satuan
                  </label>
                  <select
                    className="w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
                    value={selectedSatuanId}
                    onChange={(e) => handleSelectSatuan(e.target.value)}
                  >
                    {activeProduct.satuans.map((s) => (
                      <option key={s._id} value={s.satuan._id}>
                        {s.satuan.nama} - Rp {s.harga.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Tidak ada satuan
                </p>
              )}

              {/* Quantity */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>

              {/* Harga satuan */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Harga Satuan
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
                  value={`Rp ${unitPrice.toLocaleString()}`}
                />
              </div>

              {/* Total Harga */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Total
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
                  value={`Rp ${totalPrice.toLocaleString()}`}
                />
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="rounded bg-gray-300 px-4 py-2 text-sm hover:bg-gray-400 dark:text-black"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAdd}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white 
                           hover:bg-blue-700"
                disabled={!selectedSatuanId}
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
