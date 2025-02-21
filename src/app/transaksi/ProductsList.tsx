"use client";

import { useState } from "react";
import Image from "next/image";

// ---------------------
// Interfaces
// ---------------------
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  image?: string;
}

// ---------------------
// ProductsList Component
// ---------------------
function ProductsList() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const products: Product[] = [
    { id: 1, name: "Produk A", price: 50000, image: "/images/product-a.png" },
    { id: 2, name: "Produk B", price: 30000, image: "/images/product-b.png" },
    { id: 3, name: "Produk C", price: 45000, image: "/images/product-c.png" },
    // Tambahkan produk lain sesuai kebutuhan
  ];

  return (
    <div className="p-4">
      {/* Header: Judul & Toggle View */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold dark:text-white">Daftar Produk</h2>
        <button
          onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
          className="rounded-md border border-stroke bg-white px-3 py-1 text-sm hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-strokedark"
        >
          {viewMode === "list" ? "Grid View" : "List View"}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex items-center space-x-2">
        <input
          type="text"
          placeholder="Search produk..."
          className="h-9 w-48 rounded-md border border-stroke bg-transparent px-2 text-sm outline-none dark:border-form-strokedark dark:text-white"
        />
        <button className="h-9 rounded-md bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-600">
          Cari
        </button>
      </div>

      {/* Daftar Produk (Grid / List) */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
            : "space-y-3"
        }
      >
        {products.map((product) => (
          <div
            key={product.id}
            className={`rounded-md border border-stroke p-3 shadow-default dark:border-strokedark dark:bg-boxdark ${
              viewMode === "grid"
                ? "flex flex-col items-center space-y-2 text-center"
                : "flex items-center justify-between"
            }`}
          >
            <div>
              <p className="font-medium text-black dark:text-white">
                {product.name}
              </p>
              <p className="text-sm text-gray-500">
                Rp{product.price.toLocaleString()}
              </p>
            </div>
            <button className="mt-2 w-full rounded-md bg-blue-500 py-1 text-sm font-semibold text-white hover:bg-blue-600">
              Tambah
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------
// CartSummary Component
// ---------------------
function CartSummary() {
  const cartItems: CartItem[] = [
    {
      id: 101,
      name: "Produk A",
      price: 50000,
      quantity: 2,
      note: "Catatan A",
      image: "/images/product-a.png",
    },
    {
      id: 102,
      name: "Produk B",
      price: 30000,
      quantity: 1,
      note: "Catatan B",
      image: "/images/product-b.png",
    },
    // Tambahkan item lain sesuai kebutuhan
  ];

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <div className="flex h-full flex-col">
      {/* Daftar item (scrollable) */}
      <div className="flex-1 overflow-y-auto p-4">
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <div
              key={item.id}
              className="mb-3 flex items-center justify-between rounded-md border border-stroke bg-gray-50 p-2 dark:border-strokedark dark:bg-gray-700"
            >
              <div className="flex items-center space-x-2">
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-white dark:bg-gray-800">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-black dark:text-white">
                    {item.name}
                  </p>
                  {item.note && (
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      {item.note}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="h-6 w-6 rounded bg-blue-500 text-white hover:bg-blue-600">
                  -
                </button>
                <span className="w-5 text-center text-sm">{item.quantity}</span>
                <button className="h-6 w-6 rounded bg-blue-500 text-white hover:bg-blue-600">
                  +
                </button>
                <p className="ml-2 w-16 text-right text-sm font-medium text-black dark:text-white">
                  Rp{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Keranjang masih kosong</p>
        )}
      </div>

      {/* Footer Cart (tetap terlihat) */}
      <div className="border-t border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold">
          <span>Total:</span>
          <span>Rp{totalPrice.toLocaleString()}</span>
        </div>
        <button className="w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600">
          Bayar
        </button>
      </div>
    </div>
  );
}

// ---------------------
// Main Page: PenjualanPage
// ---------------------
export default function PenjualanPage() {
  return (
    <div className="mx-auto h-screen max-w-screen-lg p-4">
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3">
        {/* Kolom Kiri: Daftar Produk */}
        <div className="col-span-2 flex flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <ProductsList />
        </div>
        {/* Kolom Kanan: Keranjang */}
        <div className="col-span-1 flex flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <CartSummary />
        </div>
      </div>
    </div>
  );
}
