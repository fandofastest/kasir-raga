"use client";
import { useState } from "react";
import Image from "next/image";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  image?: string;
}

const CartSummary = () => {
  // State untuk menyimpan item dalam keranjang
  const [cartItems, setCartItems] = useState<CartItem[]>([
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
  ]);

  // Menghitung total harga
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Fungsi untuk menambah jumlah barang
  const handleIncrease = (id: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };

  // Fungsi untuk mengurangi jumlah barang
  const handleDecrease = (id: number) => {
    setCartItems(
      (prevItems) =>
        prevItems
          .map((item) =>
            item.id === id
              ? { ...item, quantity: Math.max(1, item.quantity - 1) }
              : item,
          )
          .filter((item) => item.quantity > 0), // Menghapus item jika quantity = 0
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Daftar item dalam keranjang */}
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
                      sizes="48px"
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
                <button
                  className="h-6 w-6 rounded bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() => handleDecrease(item.id)}
                >
                  -
                </button>
                <span className="w-5 text-center text-sm">{item.quantity}</span>
                <button
                  className="h-6 w-6 rounded bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() => handleIncrease(item.id)}
                >
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

      {/* Footer */}
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
};

export default CartSummary;
