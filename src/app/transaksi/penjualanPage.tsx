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
  const [refreshProducts, setRefreshProducts] = useState<number>(0);
  const handleCheckoutSuccess = () => {
    // Update refreshProducts, misalnya dengan timestamp baru
    setRefreshProducts(Date.now());
  };
  const addToCart = (product: Product, quantity: number) => {
    setCartItems((prev) => {
      // Ambil satuan dari index 0
      const chosenSatuan = product.satuans && product.satuans[0];
      if (!chosenSatuan) {
        toast.error("Produk tidak memiliki satuan.");
        return prev;
      }

      // Cari item di keranjang berdasarkan product id dan satuan yang sama (dari index 0)
      const existing = prev.find(
        (item) =>
          item._id === product._id &&
          item.satuans &&
          item.satuans[0].satuan._id === chosenSatuan.satuan._id,
      );

      if (existing) {
        // Jika jumlah di keranjang sudah mencapai stok, tampilkan error
        if (existing.quantity >= product.jumlah) {
          toast.error("Jumlah di keranjang sudah sama dengan stok.", {
            duration: 3000,
          });
          return prev;
        }
        // Tambahkan quantity jika sudah ada
        return prev.map((item) =>
          item._id === product._id &&
          item.satuans &&
          item.satuans[0].satuan._id === chosenSatuan.satuan._id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      // Jika belum ada, tambahkan produk ke keranjang
      return [
        ...prev,
        {
          ...product,
          quantity,
          harga: chosenSatuan.harga,
          satuans: [chosenSatuan],
        },
      ];
    });
  };

  return (
    <div className="mx-auto h-screen max-w-screen-2xl p-4">
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <ProductsList addToCart={addToCart} refreshKey={refreshProducts} />
        </div>
        <div className="col-span-1">
          <CartSummary
            onCheckoutSuccess={handleCheckoutSuccess}
            cartItems={cartItems}
            updateCart={setCartItems}
          />
        </div>
      </div>
    </div>
  );
}
