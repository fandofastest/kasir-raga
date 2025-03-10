"use client";

import { useState, useEffect } from "react";
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

function CartSummary({
  cartItems,
  updateCart,
  onCheckoutSuccess,
}: {
  cartItems: CartItem[];
  updateCart: (items: CartItem[]) => void;
  onCheckoutSuccess: () => void;
}) {
  // Pilihan pelanggan
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  // Metode pembayaran, dengan opsi tambahan "cicilan"
  const [paymentMethod, setPaymentMethod] = useState<string>("tunai");
  const [keterangan, setKeterangan] = useState<string>("");

  // State diskon: toggle dan nilai diskon
  const [enableDiscount, setEnableDiscount] = useState<boolean>(false);
  const [discount, setDiscount] = useState<number>(0);

  // Tambahan DP untuk cicilan
  const [dp, setDp] = useState<number>(0);

  // Dropdown untuk Tukang Antar dan Tukang Bongkar
  const [staffOptions, setStaffOptions] = useState<Staff[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<string>(""); // Tukang Antar
  const [selectedUnloading, setSelectedUnloading] = useState<string>(""); // Tukang Bongkar

  // Tambahan untuk cicilan: pilih tenor (misal 3,6,9,12,24 bulan)
  const [tenor, setTenor] = useState<number>(0);

  // Dialog hapus item
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);
  // Dialog ubah quantity
  const [itemToUpdate, setItemToUpdate] = useState<CartItem | null>(null);
  const [tempQuantity, setTempQuantity] = useState<number>(1);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [transactionData, setTransactionData] = useState<Transaksi>();

  // Hitung total price berdasarkan harga dari satuan yang dipilih (index 0), dikurangi diskon
  const totalPrice =
    cartItems.reduce((sum, item) => {
      if (item.satuans && item.satuans.length > 0) {
        return sum + item.satuans[0].harga * item.quantity;
      }
      return sum;
    }, 0) - discount;

  // Fungsi decrement quantity berdasarkan product id dan satuan yang sama
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

  // Klik quantity untuk membuka dialog ubah quantity
  const handleQuantityClick = (item: CartItem) => {
    setItemToUpdate(item);
    setTempQuantity(item.quantity);
  };

  // Simpan perubahan quantity pada item yang sesuai (product id & satuan sama)
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

  // Konfirmasi hapus item
  const confirmRemoveItem = () => {
    if (!itemToRemove) return;
    updateCart(cartItems.filter((ci) => ci._id !== itemToRemove._id));
    setItemToRemove(null);
  };

  const cancelRemoveItem = () => {
    setItemToRemove(null);
  };

  // Ambil data staff untuk dropdown Tukang Antar & Tukang Bongkar
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

  // Ambil opsi supplier & pelanggan (dikelola oleh CustomersList)
  useEffect(() => {
    async function loadSupplier() {
      try {
        const res = await fetchSupplier();
        // SupplierList mengelola tampilan supplier
      } catch (error) {
        console.error("Gagal mengambil supplier:", error);
      }
    }
    async function loadCustomer() {
      try {
        const res = await fetchPelanggan();
        // CustomersList mengelola tampilan pelanggan
      } catch (error) {
        console.error("Gagal mengambil pelanggan:", error);
      }
    }
    loadSupplier();
    loadCustomer();
  }, []);

  // Buat opsi berdasarkan role untuk dropdown staff
  const kasirOptions = staffOptions.filter((staff) => staff.role === "kasir");
  const pengantarOptions = staffOptions.filter(
    (staff) => staff.role === "staffAntar",
  );
  const staffBongkarOptions = staffOptions.filter(
    (staff) => staff.role === "staffBongkar",
  );

  // Fungsi checkout (contoh, sesuaikan dengan API)
  const handleCheckout = async () => {
    if (!selectedCustomer) {
      toast.error("Pilih pelanggan terlebih dahulu");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Keranjang masih kosong");
      return;
    }
    // Pastikan jika metode cicilan, DP tidak lebih besar dari totalPrice
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
      pembeli: selectedCustomer._id, // contoh: pelanggan
      pengantar: selectedDelivery || null,
      staff_bongkar: selectedUnloading || null,
      total_harga: totalPrice,
      metode_pembayaran:
        paymentMethod === "cicilan" ? "cicilan" : paymentMethod,
      status_transaksi: paymentMethod === "cicilan" ? "belum_lunas" : "lunas",
      tipe_transaksi: "penjualan",
      keterangan,
      discount,
      ...(paymentMethod === "cicilan" && { tenor, dp }),
    };

    try {
      console.log(transactionPayload);
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

  // Hitung total transaksi dan total keseluruhan harga
  const totalTransaksi = cartItems.length;
  const totalHarga = totalPrice;

  return (
    <div className="relative flex h-full flex-col">
      {/* Pilihan pelanggan */}
      <CustomersList
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
      />

      {/* Daftar item dengan scroll */}
      <div className="flex-1 overflow-y-auto p-4">
        {cartItems.length > 0 ? (
          cartItems.map((item) => {
            // Gunakan harga yang sudah disetel pada properti "harga"
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

      {/* Bagian bawah: Total, Metode Pembayaran, Keterangan, Diskon, Cicilan, & Pilihan Pengantar/Tukang Bongkar */}
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
        {/* Checkbox Diskon */}
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                placeholder="Masukkan diskon"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
              />
            )}
          </div>
        </div>
        {/* Jika metode pembayaran cicilan, tampilkan dropdown tenor, input DP, dan perhitungan cicilan */}
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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

      {/* Dialog Konfirmasi Hapus Item */}
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
