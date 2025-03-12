"use client";

import CartItem from "@/models/modeltsx/CartItem";
import Customer from "@/models/modeltsx/Costumer";
import { Product } from "@/models/modeltsx/productTypes";
import { useState } from "react";
import CartSummary from "./CartSummary";
import ProductsList from "./ProductsList";
import toast from "react-hot-toast";
import ProductFormModal from "@/components/ProductForm";

export default function PembelianPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [refreshProducts, setRefreshProducts] = useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const handleCheckoutSuccess = () => {
    setRefreshProducts(Date.now());
  };

  const addToCart = (product: Product, quantity: number, harga: number) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: quantity, harga: harga }];
    });
  };

  const handleAddProductSuccess = () => {
    toast.success("Produk berhasil ditambahkan!");
    setRefreshProducts(Date.now());
    setIsDialogOpen(false);
  };

  return (
    <div className="mx-auto h-screen max-w-screen-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Pembelian</h1>
        <button
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          onClick={() => setIsDialogOpen(true)}
        >
          + Add Product
        </button>
      </div>
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2">
          <ProductsList refreshKey={refreshProducts} addToCart={addToCart} />
        </div>
        <div className="col-span-1">
          <CartSummary
            onCheckoutSuccess={handleCheckoutSuccess}
            cartItems={cartItems}
            updateCart={setCartItems}
          />
        </div>
      </div>
      {isDialogOpen && (
        <ProductFormModal
          onClose={() => setIsDialogOpen(false)}
          isOpen={isDialogOpen}
          product={null}
          onSubmit={handleAddProductSuccess}
        />
      )}
    </div>
  );
}
