"use client";

import Image from "next/image";
import { useState } from "react";

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

export default function CafePage() {
  // Contoh data produk
  const [products] = useState<Product[]>([
    { id: 1, name: "Dancow Putih", price: 15000, image: "/images/milk-1.png" },
    { id: 2, name: "Susu Jahe", price: 17000, image: "/images/milk-2.png" },
    { id: 3, name: "Milo", price: 20000, image: "/images/milk-3.png" },
    { id: 4, name: "STMJ", price: 18000, image: "/images/milk-4.png" },
    { id: 5, name: "Susu Coklat", price: 17000, image: "/images/milk-5.png" },
  ]);

  // Contoh data keranjang
  const [cartItems] = useState<CartItem[]>([
    {
      id: 101,
      name: "Nasgor Biasa",
      price: 15000,
      quantity: 1,
      note: "Tanpa acar, pedas",
      image: "/images/nasgor.png",
    },
    {
      id: 102,
      name: "Kwetiau Goreng",
      price: 20000,
      quantity: 1,
      note: "Extra sayur",
      image: "/images/kwetiau.png",
    },
    {
      id: 103,
      name: "Es Teh",
      price: 3000,
      quantity: 2,
      image: "/images/esteh.png",
    },
  ]);

  // Hitung total
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Toggle kategori (Food / Drink) - contoh dummy
  const [activeTab, setActiveTab] = useState<"food" | "drink">("drink");

  return (
    <div className="h-full w-full overflow-hidden bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100">
      <div className="grid h-full grid-cols-3">
        {/* Kolom Kiri: Daftar Produk */}
        <div className="col-span-2 flex flex-col border-r border-gray-200 dark:border-gray-700">
          {/* Bagian atas: Search bar & Tab Kategori */}
          <div className="border-b border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            {/* Search Bar */}
            <div className="mb-3 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-48 rounded-md border border-stroke bg-transparent px-2 text-sm outline-none dark:border-form-strokedark dark:text-white"
              />
              <button className="h-9 rounded-md bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-600">
                Cari
              </button>
            </div>
            {/* Tabs Kategori */}
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab("food")}
                className={`rounded-full px-4 py-1 text-sm font-semibold transition-colors ${
                  activeTab === "food"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Food
              </button>
              <button
                onClick={() => setActiveTab("drink")}
                className={`rounded-full px-4 py-1 text-sm font-semibold transition-colors ${
                  activeTab === "drink"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Drink
              </button>
            </div>
          </div>

          {/* Grid Produk */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col items-center justify-center rounded-md border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="relative h-20 w-20">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="mt-2 text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    Rp{product.price.toLocaleString()}
                  </p>
                  <button className="mt-2 w-full rounded-md bg-blue-500 py-1 text-sm font-semibold text-white hover:bg-blue-600">
                    Tambah
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Keranjang */}
        <div className="relative flex flex-col bg-white dark:bg-gray-800">
          {/* List Item di Keranjang (scrollable) */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="mb-3 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-700"
              >
                {/* Gambar & Info */}
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
                    <p className="text-sm font-semibold">{item.name}</p>
                    {item.note && (
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        {item.note}
                      </p>
                    )}
                  </div>
                </div>
                {/* Qty & Price */}
                <div className="flex items-center space-x-2">
                  <button className="h-6 w-6 rounded bg-blue-500 text-white hover:bg-blue-600">
                    -
                  </button>
                  <span className="w-5 text-center text-sm">
                    {item.quantity}
                  </span>
                  <button className="h-6 w-6 rounded bg-blue-500 text-white hover:bg-blue-600">
                    +
                  </button>
                  <p className="ml-2 w-16 text-right text-sm font-medium">
                    Rp{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Cart (sticky) */}
          <div className="bottom-200 sticky flex flex-col border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 flex items-center justify-between text-sm font-semibold">
              <p>Total</p>
              <p>Rp{totalPrice.toLocaleString()}</p>
            </div>
            <button className="rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600">
              Bayar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
