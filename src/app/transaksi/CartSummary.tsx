"use client";

import { useState, useEffect, useRef } from "react";
import CustomersList from "./CustomerList";
import Customer from "@/models/modeltsx/Costumer";
import CartItem from "@/models/modeltsx/CartItem";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  fetchStaff,
  fetchSupplier,
  fetchPelanggan,
  createTransaction,
} from "@/lib/dataService";
import { Staff } from "@/models/modeltsx/staffTypes";
import TransactionSuccessDialog from "../pembelian/TransactionSuccessDialog";
import Transaksi from "@/models/modeltsx/Transaksi";
import { useMediaQuery } from "react-responsive";
import MobileSalesModal from "./MobileSalesModal";
import { ShoppingBasketIcon } from "lucide-react"; // Tambahkan import ikon keranjang

function CartSummary({
  cartItems,
  updateCart,
  onCheckoutSuccess,
}: {
  cartItems: CartItem[];
  updateCart: (items: CartItem[]) => void;
  onCheckoutSuccess: () => void;
}) {
  // Pilihan pelanggan dan metode pembayaran
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("tunai");
  const [keterangan, setKeterangan] = useState<string>("");

  // State diskon
  const [enableDiscount, setEnableDiscount] = useState<boolean>(false);
  const [discount, setDiscount] = useState<number>(0);

  // Tambahan untuk cicilan
  const [dp, setDp] = useState<number>(0);
  const [tenor, setTenor] = useState<number>(0);

  // Dropdown untuk staff (jika diperlukan)
  const [staffOptions, setStaffOptions] = useState<Staff[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<string>(""); // Tukang Antar
  const [selectedUnloading, setSelectedUnloading] = useState<string>(""); // Tukang Bongkar

  // Dialog hapus dan ubah quantity
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);
  const [itemToUpdate, setItemToUpdate] = useState<CartItem | null>(null);
  const [tempQuantity, setTempQuantity] = useState<number>(1);

  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [transactionData, setTransactionData] = useState<Transaksi>();

  // Deteksi mobile dan kontrol modal checkout
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [showMobileDialog, setShowMobileDialog] = useState(false);

  // State dan logika untuk animasi ikon keranjang
  const [animateCart, setAnimateCart] = useState(false);
  const prevCartCount = useRef(0);

  useEffect(() => {
    const currentCount = cartItems.reduce(
      (acc, item) => acc + item.quantity,
      0,
    );
    if (currentCount > prevCartCount.current) {
      setAnimateCart(true);
      const timer = setTimeout(() => setAnimateCart(false), 1000);
      return () => clearTimeout(timer);
    }
    prevCartCount.current = currentCount;
  }, [cartItems]);

  // Hitung total harga (menggunakan harga dari satuan index 0) dikurangi diskon
  const totalPrice = cartItems.reduce((sum, item) => {
    if (item.satuans && item.satuans.length > 0) {
      return sum + item.satuans[0].harga * item.quantity;
    }
    return sum;
  }, 0);
  const totalHarga = totalPrice - discount;

  // Fungsi decrement quantity (jika jumlah 1, munculkan dialog hapus)
  const handleDecrement = (item: CartItem) => {
    if (item.quantity === 1) {
      setItemToRemove(item);
    } else {
      updateCart(
        cartItems.map((ci) =>
          ci._id === item._id &&
          ci.satuans &&
          ci.satuans.length > 0 &&
          item.satuans &&
          item.satuans.length > 0 &&
          ci.satuans[0].satuan._id === item.satuans[0].satuan._id
            ? { ...ci, quantity: Math.max(ci.quantity - 1, 1) }
            : ci,
        ),
      );
    }
  };

  // Dialog ubah quantity
  const handleQuantityClick = (item: CartItem) => {
    setItemToUpdate(item);
    setTempQuantity(item.quantity);
  };

  const confirmUpdateQuantity = () => {
    if (!itemToUpdate) return;
    const newQty = Math.min(tempQuantity, itemToUpdate.jumlah);
    updateCart(
      cartItems.map((ci) =>
        ci._id === itemToUpdate._id &&
        ci.satuans &&
        ci.satuans.length > 0 &&
        itemToUpdate.satuans &&
        itemToUpdate.satuans.length > 0 &&
        ci.satuans[0].satuan._id === itemToUpdate.satuans[0].satuan._id
          ? { ...ci, quantity: newQty }
          : ci,
      ),
    );
    setItemToUpdate(null);
  };

  const cancelUpdateQuantity = () => {
    setItemToUpdate(null);
  };

  // Dialog hapus item
  const confirmRemoveItem = () => {
    if (!itemToRemove) return;
    updateCart(cartItems.filter((ci) => ci._id !== itemToRemove._id));
    setItemToRemove(null);
  };

  const cancelRemoveItem = () => {
    setItemToRemove(null);
  };

  // Ambil data staff untuk dropdown (jika diperlukan)
  useEffect(() => {
    async function loadStaff() {
      try {
        const res = await fetchStaff();
        setStaffOptions(res.data);
      } catch (error) {
        console.error("Gagal mengambil staff:", error);
      }
    }
    loadStaff();
  }, []);

  // Ambil data supplier dan pelanggan (CustomersList akan mengelola tampilan pelanggan)
  useEffect(() => {
    async function loadSupplier() {
      try {
        await fetchSupplier();
      } catch (error) {
        console.error("Gagal mengambil supplier:", error);
      }
    }
    async function loadCustomer() {
      try {
        await fetchPelanggan();
      } catch (error) {
        console.error("Gagal mengambil pelanggan:", error);
      }
    }
    loadSupplier();
    loadCustomer();
  }, []);

  // Fungsi checkout
  const handleCheckout = async () => {
    if (!selectedCustomer) {
      toast.error("Pilih pelanggan terlebih dahulu");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Keranjang masih kosong");
      return;
    }
    if (paymentMethod === "cicilan" && dp > totalPrice) {
      toast.error("DP tidak boleh lebih besar dari total harga");
      return;
    }

    const transactionPayload = {
      kasir: "kasirUserId", // ambil dari session atau context
      produk: cartItems.map((item) => ({
        productId: item._id,
        quantity: item.quantity,
        harga: item.satuans[0].harga,
        satuans: item.satuans.map((s) => ({
          satuan: s.satuan,
          harga: s.harga,
          konversi: s.konversi,
        })),
      })),
      pembeli: selectedCustomer._id,
      pengantar: selectedDelivery || null,
      staff_bongkar: selectedUnloading || null,
      total_harga: totalHarga,
      metode_pembayaran:
        paymentMethod === "cicilan" ? "cicilan" : paymentMethod,
      status_transaksi: paymentMethod === "cicilan" ? "belum_lunas" : "lunas",
      tipe_transaksi: "penjualan",
      keterangan,
      discount,
      ...(paymentMethod === "cicilan" && { tenor, dp }),
    };

    try {
      const respon = await createTransaction(transactionPayload);
      if (respon.data.status !== 201) {
        toast.error(respon.data.error || "Gagal melakukan transaksi");
      } else {
        toast.success(respon.data.message || "Transaksi berhasil dibuat");
        updateCart([]);
        setTransactionData(respon.data.data);
        setIsSuccessDialogOpen(true);
        onCheckoutSuccess();
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Terjadi kesalahan saat melakukan transaksi");
    }
  };

  // Konten form checkout (untuk mobile modal)
  const mobileCheckoutContent = (
    <div className="space-y-4">
      {/* Pilihan Pelanggan */}
      <CustomersList
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
      />
      {/* Daftar Produk */}
      <div className="overflow-y-auto">
        {cartItems.length > 0 ? (
          cartItems.map((item) => {
            const pricePerItem = item.harga;
            const itemTotal = pricePerItem * item.quantity;
            const satuanName = item.satuans?.[0]?.satuan?.nama || "";
            return (
              <div
                key={item._id}
                className="my-2 flex items-center justify-between rounded-md border border-stroke bg-gray-50 p-2 dark:border-strokedark dark:bg-gray-700"
              >
                <div className="flex items-center space-x-2">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.nama_produk}
                      width={40}
                      height={40}
                      className="rounded-md"
                    />
                  )}
                  <p className="text-sm font-semibold text-black dark:text-white">
                    {item.nama_produk} {satuanName && `(${satuanName})`}
                  </p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {item.quantity} x Rp{pricePerItem.toLocaleString()}
                </p>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500">Keranjang masih kosong</p>
        )}
      </div>
      {/* Form Checkout */}
      <div className="border-t border-stroke bg-white shadow-md dark:border-strokedark dark:bg-gray-700">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold">
          <span>Total:</span>
          <span>Rp {totalHarga.toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 border-b border-stroke bg-gray-700 bg-white dark:border-strokedark sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
              Metode Pembayaran
            </h3>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                if (e.target.value !== "cicilan") {
                  setTenor(0);
                  setDp(0);
                }
              }}
            >
              <option value="tunai">Tunai</option>
              <option value="edc">EDC</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cicilan">Cicilan</option>
            </select>
          </div>
          <div>
            <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
              Keterangan
            </h3>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Tulis keterangan (opsional)"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-2 ">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Diskon
          </label>
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              checked={enableDiscount}
              onChange={() => setEnableDiscount(!enableDiscount)}
              className="h-4 w-4"
            />
            {enableDiscount && (
              <input
                type="number"
                min={0}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Masukkan diskon"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            )}
          </div>
        </div>
        {paymentMethod === "cicilan" && (
          <div className="mt-4 pl-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tenor (bulan)
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={tenor}
                  onChange={(e) => setTenor(Number(e.target.value))}
                >
                  <option value={0}>Pilih tenor</option>
                  <option value={3}>3 Bulan</option>
                  <option value={6}>6 Bulan</option>
                  <option value={9}>9 Bulan</option>
                  <option value={12}>12 Bulan</option>
                  <option value={24}>24 Bulan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Down Payment (DP)
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Masukkan DP"
                  value={dp}
                  onChange={(e) => setDp(Number(e.target.value))}
                />
              </div>
            </div>
            {tenor > 0 && (
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Cicilan per bulan: Rp{" "}
                {((totalPrice - dp) / tenor).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </div>
            )}
          </div>
        )}
        <button
          className="mt-3 w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600"
          disabled={!selectedCustomer || cartItems.length === 0}
          onClick={() => {
            handleCheckout();
            setShowMobileDialog(false);
          }}
        >
          {selectedCustomer
            ? `Bayar (${selectedCustomer.nama})`
            : "Pilih Pelanggan"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full flex-col">
      {/* Tampilan Desktop */}
      {!isMobile && (
        <>
          <CustomersList
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
          />
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length > 0 ? (
              cartItems.map((item) => {
                const pricePerItem = item.harga;
                const itemTotal = pricePerItem * item.quantity;
                const satuanName = item.satuans?.[0]?.satuan?.nama || "";
                return (
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
                          {item.nama_produk} {satuanName && `(${satuanName})`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className="h-6 w-6 rounded bg-blue-500 text-white hover:bg-blue-600"
                        onClick={() => handleDecrement(item)}
                      >
                        -
                      </button>
                      <span
                        className="w-fit cursor-pointer text-center text-sm"
                        onClick={() => handleQuantityClick(item)}
                        title="Ubah quantity"
                      >
                        {item.quantity}
                      </span>
                      <button
                        className="h-6 w-6 rounded bg-blue-500 text-white hover:bg-blue-600"
                        onClick={() =>
                          updateCart(
                            cartItems.map((ci) =>
                              ci._id === item._id &&
                              ci.satuans &&
                              item.satuans &&
                              ci.satuans[0].satuan._id ===
                                item.satuans[0].satuan._id
                                ? {
                                    ...ci,
                                    quantity: Math.min(
                                      ci.quantity + 1,
                                      item.jumlah,
                                    ),
                                  }
                                : ci,
                            ),
                          )
                        }
                      >
                        +
                      </button>
                      <p className="ml-2 w-20 text-right text-sm font-medium text-black dark:text-white">
                        Rp {itemTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500">Keranjang masih kosong</p>
            )}
          </div>
          <div className="sticky bottom-0 border-t border-stroke bg-white p-4 shadow-md dark:border-strokedark dark:bg-boxdark">
            <div className="mb-3 flex items-center justify-between text-sm font-semibold">
              <span>Total:</span>
              <span>Rp {totalHarga.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-1 gap-4 border-b border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
                  Metode Pembayaran
                </h3>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    if (e.target.value !== "cicilan") {
                      setTenor(0);
                      setDp(0);
                    }
                  }}
                >
                  <option value="tunai">Tunai</option>
                  <option value="edc">EDC</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cicilan">Cicilan</option>
                </select>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
                  Keterangan
                </h3>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Tulis keterangan (opsional)"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-2 pl-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Diskon
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enableDiscount}
                  onChange={() => setEnableDiscount(!enableDiscount)}
                  className="h-4 w-4"
                />
                {enableDiscount && (
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Masukkan diskon"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                )}
              </div>
            </div>
            {paymentMethod === "cicilan" && (
              <div className="mt-4 pl-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tenor (bulan)
                    </label>
                    <select
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      value={tenor}
                      onChange={(e) => setTenor(Number(e.target.value))}
                    >
                      <option value={0}>Pilih tenor</option>
                      <option value={3}>3 Bulan</option>
                      <option value={6}>6 Bulan</option>
                      <option value={9}>9 Bulan</option>
                      <option value={12}>12 Bulan</option>
                      <option value={24}>24 Bulan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Down Payment (DP)
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="Masukkan DP"
                      value={dp}
                      onChange={(e) => setDp(Number(e.target.value))}
                    />
                  </div>
                </div>
                {tenor > 0 && (
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    Cicilan per bulan: Rp{" "}
                    {((totalPrice - dp) / tenor).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
              </div>
            )}
            <button
              className="mt-3 w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600"
              disabled={!selectedCustomer || cartItems.length === 0}
              onClick={handleCheckout}
            >
              {selectedCustomer
                ? `Bayar (${selectedCustomer.nama})`
                : "Pilih Pelanggan"}
            </button>
          </div>
        </>
      )}

      {/* Tampilan Mobile: tombol checkout tetap (jika diinginkan) */}
      {isMobile && (
        <div className="fixed bottom-4 left-4 right-4">
          <button
            className="w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600"
            onClick={() => setShowMobileDialog(true)}
          >
            Checkout - Rp {totalHarga.toLocaleString()}
          </button>
          <MobileSalesModal
            isOpen={showMobileDialog}
            onClose={() => setShowMobileDialog(false)}
          >
            {mobileCheckoutContent}
          </MobileSalesModal>
        </div>
      )}

      {/* Floating Cart Icon (ditampilkan jika ada item di keranjang) */}
      {cartItems.length > 0 && (
        <div
          className={`fixed bottom-24 right-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-blue-500 text-white ${
            animateCart ? "animate-bounce" : ""
          }`}
          onClick={() => {
            if (isMobile) setShowMobileDialog(true);
          }}
        >
          <ShoppingBasketIcon size={24} />
          <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
            {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
          </span>
        </div>
      )}

      {/* Dialog Hapus Item */}
      {itemToRemove && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50"
          onClick={cancelRemoveItem}
        >
          <div
            className="relative w-full max-w-sm rounded-lg bg-white p-4 shadow dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">
              Hapus Item?
            </h2>
            <p className="mb-4 text-sm text-gray-700 dark:text-gray-200">
              Apakah Anda yakin ingin menghapus{" "}
              <span className="font-semibold">{itemToRemove.nama_produk}</span>{" "}
              dari keranjang?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelRemoveItem}
                className="rounded bg-gray-300 px-3 py-1 text-sm text-black hover:bg-gray-400"
              >
                Batal
              </button>
              <button
                onClick={confirmRemoveItem}
                className="rounded bg-red-500 px-3 py-1 text-sm font-semibold text-white hover:bg-red-600"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Ubah Quantity */}
      {itemToUpdate && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50"
          onClick={cancelUpdateQuantity}
        >
          <div
            className="relative w-full max-w-sm rounded-lg bg-white p-4 shadow dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">
              Ubah Quantity
            </h2>
            <p className="mb-4 text-sm text-gray-700 dark:text-gray-200">
              {itemToUpdate.nama_produk}
            </p>
            <input
              type="number"
              min={1}
              className="mb-4 w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
              value={tempQuantity}
              onChange={(e) => setTempQuantity(parseInt(e.target.value) || 1)}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelUpdateQuantity}
                className="rounded bg-gray-300 px-3 py-1 text-sm text-black hover:bg-gray-400"
              >
                Batal
              </button>
              <button
                onClick={confirmUpdateQuantity}
                className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <TransactionSuccessDialog
        isOpen={isSuccessDialogOpen}
        transactionData={transactionData as Transaksi}
        onClose={() => setIsSuccessDialogOpen(false)}
      />
    </div>
  );
}

export default CartSummary;
