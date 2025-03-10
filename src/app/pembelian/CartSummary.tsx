"use client";

import { useState, useEffect } from "react";
import SupplierList from "./SupplierList";
import { Supplier } from "@/models/modeltsx/supplierTypes";
import CartItem from "@/models/modeltsx/CartItem";
import Image from "next/image";
import toast from "react-hot-toast";
import { fetchStaff, createTransaction } from "@/lib/dataService"; // Pastikan fetchStaff tersedia
import TransactionSuccessDialog from "./TransactionSuccessDialog";
import Transaksi from "@/models/modeltsx/Transaksi";

export default function CartSummary({
  cartItems,
  updateCart,
  onCheckoutSuccess,
}: {
  cartItems: CartItem[];
  updateCart: (items: CartItem[]) => void;
  onCheckoutSuccess: () => void;
}) {
  // Supplier untuk pembelian
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("tunai");
  const [keterangan, setKeterangan] = useState<string>("");

  // State diskon: toggle untuk mengaktifkan diskon dan nilai diskon
  const [enableDiscount, setEnableDiscount] = useState<boolean>(false);
  const [discount, setDiscount] = useState<number>(0);

  // Dropdown untuk Tukang Antar dan Tukang Bongkar
  const [staffOptions, setStaffOptions] = useState<
    { _id: string; name: string }[]
  >([]);
  const [selectedDelivery, setSelectedDelivery] = useState<string>(""); // Tukang Antar
  const [selectedUnloading, setSelectedUnloading] = useState<string>(""); // Tukang Bongkar

  // Dialog hapus item
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);
  // Dialog ubah quantity
  const [itemToUpdate, setItemToUpdate] = useState<CartItem | null>(null);
  const [tempQuantity, setTempQuantity] = useState<number>(1);

  const totalPrice =
    cartItems.reduce((sum, item) => sum + item.harga * item.quantity, 0) -
    discount;

  const handleDecrement = (item: CartItem) => {
    if (item.quantity === 1) {
      setItemToRemove(item);
    } else {
      updateCart(
        cartItems.map((ci) =>
          ci._id === item._id
            ? { ...ci, quantity: Math.max(ci.quantity - 1, 1) }
            : ci,
        ),
      );
    }
  };

  const handleQuantityClick = (item: CartItem) => {
    setItemToUpdate(item);
    setTempQuantity(item.quantity);
  };

  const confirmUpdateQuantity = () => {
    if (!itemToUpdate) return;
    // const newQty = Math.min(tempQuantity, itemToUpdate.jumlah);
    updateCart(
      cartItems.map((ci) =>
        ci._id === itemToUpdate._id ? { ...ci, quantity: tempQuantity } : ci,
      ),
    );
    setItemToUpdate(null);
  };

  const cancelUpdateQuantity = () => {
    setItemToUpdate(null);
  };

  const confirmRemoveItem = () => {
    if (!itemToRemove) return;
    updateCart(cartItems.filter((ci) => ci._id !== itemToRemove._id));
    setItemToRemove(null);
  };

  const cancelRemoveItem = () => {
    setItemToRemove(null);
  };

  // State untuk dialog transaksi sukses (invoice)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [transactionData, setTransactionData] = useState<Transaksi>();

  const handleTransactionSuccess = (data: any) => {
    setTransactionData(data);
    setIsSuccessDialogOpen(true);
  };

  // Ambil data staff untuk dropdown tukang antar & tukang bongkar
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

  // Fungsi checkout: kirim payload transaksi ke API
  const handleCheckout = async () => {
    if (!selectedSupplier) {
      toast.error("Pilih supplier terlebih dahulu");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Keranjang masih kosong");
      return;
    }
    try {
      // Jika tidak memilih tukang antar atau bongkar, kita set sebagai null
      const deliveryId = selectedDelivery || null;
      const unloadingId = selectedUnloading || null;

      const transactionPayload = {
        kasir: "kasirUserId", // Ganti dengan ID kasir dari session atau context
        produk: cartItems.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
          harga: item.harga,
          satuans: item.satuans.map((s) => ({
            satuan: s.satuan, // Pastikan struktur objek sesuai model
            harga: s.harga,
            konversi: s.konversi,
          })),
        })),
        supplier: selectedSupplier._id, // Supplier sebagai pembeli
        pengantar: deliveryId, // Tukang Antar (bisa null)
        staff_bongkar: unloadingId, // Tukang Bongkar (bisa null)
        total_harga: totalPrice,
        metode_pembayaran: paymentMethod,
        status_transaksi: paymentMethod === "hutang" ? "belum_lunas" : "lunas", // Sesuaikan dengan logika bisnis
        tipe_transaksi: "pembelian",
        keterangan,
        diskon: enableDiscount ? discount : 0,
      };

      // console.log(transactionData);

      const respon = await createTransaction(transactionPayload);
      if (respon.data.status !== 201) {
        toast.error(respon.data.error || "Gagal melakukan transaksi");
      } else {
        toast.success(respon.data.message || "Transaksi berhasil dibuat");
        updateCart([]);
        handleTransactionSuccess(respon.data.data);
        onCheckoutSuccess();
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Terjadi kesalahan saat melakukan transaksi");
    }
  };

  return (
    <div className="relative flex h-full flex-col">
      {/* Bagian atas: Supplier & Staff Selection */}
      <div className="border-b border-stroke p-4 dark:border-strokedark">
        <SupplierList
          selectedSupplier={selectedSupplier}
          setSelectedSupplier={setSelectedSupplier}
        />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Pilih Tukang Antar
            </label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={selectedDelivery}
              onChange={(e) => setSelectedDelivery(e.target.value)}
            >
              <option value="">--Tidak Ada--</option>
              {staffOptions.map((staff) => (
                <option key={staff._id} value={staff._id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Pilih Tukang Bongkar
            </label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={selectedUnloading}
              onChange={(e) => setSelectedUnloading(e.target.value)}
            >
              <option value="">--Tidak Ada--</option>
              {staffOptions.map((staff) => (
                <option key={staff._id} value={staff._id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Daftar item keranjang */}
      <div className="flex-1 overflow-y-auto p-4">
        {cartItems.length > 0 ? (
          cartItems.map((item) => {
            const satuanAktif = item.satuans?.[0];
            const pricePerItem = item.harga_modal;
            const itemTotal = pricePerItem * item.quantity;
            const satuanName = satuanAktif?.satuan?.nama || "";
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
                          ci._id === item._id
                            ? {
                                ...ci,
                                quantity: ci.quantity + 1,
                              }
                            : ci,
                        ),
                      )
                    }
                  >
                    +
                  </button>
                  <p className="ml-2 w-20 text-right text-sm font-medium text-black dark:text-white">
                    Rp{itemTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500">Keranjang masih kosong</p>
        )}
      </div>

      {/* Bagian bawah: Total, Metode Pembayaran, Keterangan & Diskon */}
      <div className="sticky bottom-0 border-t border-stroke bg-white p-4 shadow-md dark:border-strokedark dark:bg-boxdark">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold">
          <span>Total:</span>
          <span>Rp{totalPrice.toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 border-b border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
              Metode Pembayaran
            </h3>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="tunai">Tunai</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="hutang">Hutang</option>
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
        <div>
          <h3 className="mb-2 text-xs font-semibold text-black dark:text-white">
            Diskon
          </h3>
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
        <button
          className="mt-3 w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600"
          disabled={!selectedSupplier || cartItems.length === 0}
          onClick={handleCheckout}
        >
          {selectedSupplier
            ? `Beli dari (${selectedSupplier.nama})`
            : "Pilih Supplier"}
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
