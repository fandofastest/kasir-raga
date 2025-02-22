"use client";
import CartItem from "@/models/modeltsx/CartItem";
import Customer from "@/models/modeltsx/Costumer";
import { Product } from "@/models/modeltsx/productTypes";
import { useState } from "react";
import CartSummary from "./CartSummary";
import ProductsList from "./ProductsList";
import toast from "react-hot-toast";

export default function PenjualanPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item._id === product._id);

      if (existing) {
        // Cek apakah jumlah di keranjang sudah sama dengan stok
        if (existing.quantity >= product.jumlah) {
          toast.error("Jumlah di keranjang sudah sama dengan stok.", {
            duration: 1000,
          });

          return prev; // Tidak menambahkan lagi
        }
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  return (
    <div className="mx-auto h-screen max-w-screen-2xl p-4">
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <ProductsList addToCart={addToCart} />
        </div>
        <div className="col-span-1">
          <CartSummary cartItems={cartItems} updateCart={setCartItems} />
        </div>
      </div>
    </div>
  );
}
