"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Product } from "@/models/modeltsx/productTypes";
import { fetchProducts } from "@/lib/dataService";
import CartItem from "@/models/modeltsx/CartItem";
import CartSummary from "./CartSummary";
import Customer from "@/models/modeltsx/Costumer";

// ---------------------
// Interfaces
// ---------------------

// ---------------------
// ProductsList Component
// ---------------------
function ProductsList({
  addToCart,
}: {
  addToCart: (product: Product) => void;
}) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    async function loadProducts() {
      const data = await fetchProducts();
      setProducts(data.data);
    }
    loadProducts();
  }, []);

  // Filter produk berdasarkan nama
  const filteredProducts = products.filter((product) =>
    product.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-4">
      {/* Search Bar */}
      <div className="mb-3 flex items-center space-x-3">
        <input
          type="text"
          placeholder="Cari produk..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-5/6 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <button
          onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
          className=" w-1/6 rounded-md border border-stroke bg-white px-3 py-1 text-sm hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-strokedark"
        >
          {viewMode === "list" ? "Grid View" : "List View"}
        </button>
      </div>

      {/* List/Grid View */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
            : "flex flex-col space-y-3"
        }
      >
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div
              key={product._id}
              className={`rounded-md border border-stroke p-3 shadow-default dark:border-strokedark dark:bg-boxdark ${
                viewMode === "grid"
                  ? "flex flex-col items-center space-y-2 text-center"
                  : "flex w-full flex-row items-center justify-between space-x-4"
              }`}
            >
              {/* Gambar */}
              <Image
                src={product.image}
                alt={product.nama_produk}
                width={80}
                height={80}
                className="h-20 w-20 rounded-md object-contain"
              />

              {/* Info Produk */}
              <div className="flex-1">
                <p className="font-medium text-black dark:text-white">
                  {product.nama_produk}
                </p>
                <p className="text-sm text-gray-500">
                  Rp{product.harga.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Stok: {product.jumlah}</p>
              </div>
              {/* Tombol Tambah */}
              <button
                className={`ml-auto rounded-md px-3 py-1 text-sm font-semibold text-white ${
                  product.jumlah === 0
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
                onClick={() => addToCart(product)}
                disabled={product.jumlah === 0}
              >
                {product.jumlah === 0 ? "Habis" : "Tambah"}
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Produk tidak ditemukan
          </p>
        )}
      </div>
    </div>
  );
}

export default ProductsList;
// ---------------------
// CartSummary Component
// ---------------------

// ---------------------
// Main Page: PenjualanPage
// ---------------------
