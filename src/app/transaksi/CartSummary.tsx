import { useState } from "react";
import CustomersList from "./CustomerList";
import Customer from "@/models/modeltsx/Costumer";
import CartItem from "@/models/modeltsx/CartItem";
import Image from "next/image";

function CartSummary({
  cartItems,
  updateCart,
}: {
  cartItems: CartItem[];
  updateCart: (items: CartItem[]) => void;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("tunai");

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.harga * item.quantity,
    0,
  );

  return (
    <div className="relative flex h-full flex-col">
      {/* Pilihan pelanggan */}
      <CustomersList
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer} // Perbaiki di sini
      />

      {/* List item dengan scroll */}
      <div className="flex-1 overflow-y-auto p-4">
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <div
              key={item._id}
              className="mb-3 flex items-center justify-between rounded-md border border-stroke bg-gray-50 p-2 dark:border-strokedark dark:bg-gray-700"
            >
              <div className="flex items-center space-x-2">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.nama_produk}
                    width={48}
                    height={48}
                    className="rounded-md"
                  />
                )}
                <div>
                  <p className="text-sm font-semibold text-black dark:text-white">
                    {item.nama_produk}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="h-6 w-6 rounded bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() =>
                    updateCart(
                      cartItems.map((ci) =>
                        ci._id === item._id
                          ? { ...ci, quantity: Math.max(ci.quantity - 1, 1) }
                          : ci,
                      ),
                    )
                  }
                >
                  -
                </button>
                <span className="w-5 text-center text-sm">{item.quantity}</span>
                <button
                  className="h-6 w-6 rounded bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() =>
                    updateCart(
                      cartItems.map((ci) =>
                        ci._id === item._id
                          ? {
                              ...ci,
                              quantity: Math.min(ci.quantity + 1, item.jumlah),
                            } // Batas maksimal stok
                          : ci,
                      ),
                    )
                  }
                >
                  +
                </button>

                <p className="ml-2 w-16 text-right text-sm font-medium text-black dark:text-white">
                  Rp{(item.harga * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Keranjang masih kosong</p>
        )}
      </div>

      {/* Tombol Bayar Floating */}
      <div className="sticky bottom-0 border-t border-stroke bg-white p-4 shadow-md dark:border-strokedark dark:bg-boxdark">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold">
          <span>Total:</span>
          <span>Rp{totalPrice.toLocaleString()}</span>
        </div>
        {/* Pilihan metode pembayaran */}
        <div className="border-b border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
          <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
            Metode Pembayaran
          </h3>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="tunai">Tunai</option>
            <option value="edc">EDC</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        <button
          className="w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600"
          disabled={!selectedCustomer}
        >
          {selectedCustomer
            ? `Bayar (${selectedCustomer.nama})`
            : "Pilih Pelanggan"}
        </button>
      </div>
    </div>
  );
}

export default CartSummary;
