"use client";

import { useState, useEffect, useRef } from "react";
import SupplierList from "./SupplierList";
import { Supplier } from "@/models/modeltsx/supplierTypes";
import CartItem from "@/models/modeltsx/CartItem";
import Image from "next/image";
import toast from "react-hot-toast";
import { fetchStaff, createTransaction } from "@/lib/dataService";
import TransactionSuccessDialog from "./TransactionSuccessDialog";
import Transaksi from "@/models/modeltsx/Transaksi";
import { useMediaQuery } from "react-responsive";
import MobileCheckoutModal from "./MobileChecoutModal";
import { ShoppingBasketIcon } from "lucide-react";
import StaffFormModal from "../staff/StaffForm";

// Import komponen dialog form staff

export default function CartSummary({
  cartItems,
  updateCart,
  onCheckoutSuccess,
}: {
  cartItems: CartItem[];
  updateCart: (items: CartItem[]) => void;
  onCheckoutSuccess: () => void;
}) {
  // State dan variabel untuk transaksi dan UI lainnya
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("tunai");
  const [keterangan, setKeterangan] = useState<string>("");

  const [enableDiscount, setEnableDiscount] = useState<boolean>(false);
  const [discount, setDiscount] = useState<number>(0);

  // Staff options
  const [staffOptions, setStaffOptions] = useState<
    { _id: string; name: string; role: string }[]
  >([]);
  const [selectedDelivery, setSelectedDelivery] = useState<string>("");
  const [selectedUnloading, setSelectedUnloading] = useState<string>("");

  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);
  const [itemToUpdate, setItemToUpdate] = useState<CartItem | null>(null);
  const [tempQuantity, setTempQuantity] = useState<number>(1);

  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [transactionData, setTransactionData] = useState<Transaksi>();

  // State untuk modal mobile
  const [showMobileDialog, setShowMobileDialog] = useState(false);
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  // State untuk modal tambah staff (untuk Tukang Antar & Bongkar)
  const [showStaffFormModal, setShowStaffFormModal] = useState(false);
  const [staffRoleToAdd, setStaffRoleToAdd] = useState<
    "staffAntar" | "staffBongkar" | null
  >(null);

  // Fungsi refresh daftar staff
  const refreshStaffList = async () => {
    try {
      const res = await fetchStaff();
      setStaffOptions(res.data);
    } catch (error) {
      console.error("Gagal mengambil staff:", error);
    }
  };

  useEffect(() => {
    refreshStaffList();
  }, []);

  const totalPrice =
    cartItems.reduce((sum, item) => sum + item.harga * item.quantity, 0) -
    discount;

  // Floating cart icon animation: jika jumlah item naik, icon akan animasi
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
      const deliveryId = selectedDelivery || null;
      const unloadingId = selectedUnloading || null;

      const transactionPayload = {
        kasir: "kasirUserId", // ganti sesuai kebutuhan
        produk: cartItems.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
          harga: item.harga,
          satuans: item.satuans.map((s) => ({
            satuan: s.satuan,
            harga: s.harga,
            konversi: s.konversi,
          })),
        })),
        supplier: selectedSupplier._id,
        pengantar: deliveryId,
        staff_bongkar: unloadingId,
        total_harga: totalPrice,
        metode_pembayaran: paymentMethod,
        status_transaksi: paymentMethod === "hutang" ? "belum_lunas" : "lunas",
        tipe_transaksi: "pembelian",
        keterangan,
        diskon: enableDiscount ? discount : 0,
      };

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

  return (
    <div className="bg-white dark:bg-gray-800">
      {/* Bagian atas (supplier & dropdown staff) hanya untuk desktop */}
      {!isMobile && (
        <div className="border-b border-stroke p-4 dark:border-strokedark">
          <SupplierList
            selectedSupplier={selectedSupplier}
            setSelectedSupplier={setSelectedSupplier}
          />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Dropdown Tukang Antar dengan tombol tambah di sebelah list */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Pilih Tukang Antar
              </label>
              <div className="flex items-center">
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={selectedDelivery}
                  onChange={(e) => setSelectedDelivery(e.target.value)}
                >
                  <option value="">--Tidak Ada--</option>
                  {staffOptions
                    .filter(
                      (staff) =>
                        staff.role !== "superadmin" && staff.role !== "kasir",
                    )
                    .map((staff) => (
                      <option key={staff._id} value={staff._id}>
                        {staff.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => {
                    setStaffRoleToAdd("staffAntar");
                    setShowStaffFormModal(true);
                  }}
                  className="ml-2 rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600"
                >
                  +
                </button>
              </div>
            </div>
            {/* Dropdown Tukang Bongkar dengan tombol tambah di sebelah list */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Pilih Tukang Bongkar
              </label>
              <div className="flex items-center">
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={selectedUnloading}
                  onChange={(e) => setSelectedUnloading(e.target.value)}
                >
                  <option value="">--Tidak Ada--</option>
                  {staffOptions
                    .filter(
                      (staff) =>
                        staff.role !== "superadmin" && staff.role !== "kasir",
                    )
                    .map((staff) => (
                      <option key={staff._id} value={staff._id}>
                        {staff.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => {
                    setStaffRoleToAdd("staffBongkar");
                    setShowStaffFormModal(true);
                  }}
                  className="ml-2 rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daftar item produk hanya tampil jika desktop */}
      {!isMobile && (
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
                    <p className="text-sm font-semibold text-black dark:text-white">
                      {item.nama_produk} {satuanName && `(${satuanName})`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className="h-6 w-6 rounded bg-blue-500 text-white hover:bg-blue-600"
                      onClick={() => {
                        if (item.quantity === 1) {
                          setItemToRemove(item);
                        } else {
                          updateCart(
                            cartItems.map((ci) =>
                              ci._id === item._id
                                ? {
                                    ...ci,
                                    quantity: Math.max(ci.quantity - 1, 1),
                                  }
                                : ci,
                            ),
                          );
                        }
                      }}
                    >
                      -
                    </button>
                    <span
                      className="w-fit cursor-pointer text-center text-sm"
                      onClick={() => {
                        setItemToUpdate(item);
                        setTempQuantity(item.quantity);
                      }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      className="h-6 w-6 rounded bg-blue-500 text-white hover:bg-blue-600"
                      onClick={() =>
                        updateCart(
                          cartItems.map((ci) =>
                            ci._id === item._id
                              ? { ...ci, quantity: ci.quantity + 1 }
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
      )}

      {/* Checkout dan keterangan keranjang untuk desktop */}
      {!isMobile && (
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
      )}

      {/* Tombol Checkout untuk Mobile */}
      {isMobile && (
        <div className="fixed bottom-4 left-4 right-4">
          <button
            className="w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600"
            onClick={() => setShowMobileDialog(true)}
          >
            Checkout - Rp{totalPrice.toLocaleString()}
          </button>
        </div>
      )}

      {/* Modal Checkout Mobile */}
      {isMobile && (
        <MobileCheckoutModal
          isOpen={showMobileDialog}
          onClose={() => setShowMobileDialog(false)}
        >
          {/* SupplierList ditampilkan di modal checkout mobile */}
          <div className="mb-4">
            <SupplierList
              selectedSupplier={selectedSupplier}
              setSelectedSupplier={setSelectedSupplier}
            />
          </div>
          {/* List Produk di Modal */}
          <div className="mb-4 border-strokedark dark:border-strokedark">
            <p className="text-sm font-semibold text-gray-700 dark:text-white">
              Daftar Produk
            </p>
            {cartItems.length > 0 ? (
              cartItems.map((item) => {
                const satuanAktif = item.satuans?.[0];
                const pricePerItem = item.harga_modal;
                const itemTotal = pricePerItem * item.quantity;
                const satuanName = satuanAktif?.satuan?.nama || "";
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

          {/* Dropdown Staff dengan tombol tambah */}
          <div className="mt-4 grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm">Pilih Tukang Antar</label>
              <div className="flex items-center">
                <select
                  className="w-full border p-2 dark:bg-gray-700 dark:text-white"
                  value={selectedDelivery}
                  onChange={(e) => setSelectedDelivery(e.target.value)}
                >
                  <option value="">--Tidak Ada--</option>
                  {staffOptions
                    .filter((staff) => staff.role === "staffAntar")
                    .map((staff) => (
                      <option key={staff._id} value={staff._id}>
                        {staff.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => {
                    setStaffRoleToAdd("staffAntar");
                    setShowStaffFormModal(true);
                  }}
                  className="ml-2 rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm">Pilih Tukang Bongkar</label>
              <div className="flex items-center">
                <select
                  className="w-full border p-2 dark:bg-gray-700 dark:text-white"
                  value={selectedUnloading}
                  onChange={(e) => setSelectedUnloading(e.target.value)}
                >
                  <option value="">--Tidak Ada--</option>
                  {staffOptions
                    .filter((staff) => staff.role === "staffBongkar")
                    .map((staff) => (
                      <option key={staff._id} value={staff._id}>
                        {staff.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => {
                    setStaffRoleToAdd("staffBongkar");
                    setShowStaffFormModal(true);
                  }}
                  className="ml-2 rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm">Metode Pembayaran</label>
            <select
              className="w-full border p-2 dark:bg-gray-700 dark:text-white"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="tunai">Tunai</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="hutang">Hutang</option>
            </select>
          </div>
          <div className="mt-4">
            <label className="block text-sm">Keterangan</label>
            <input
              type="text"
              className="w-full border p-2 dark:bg-gray-700 dark:text-white"
              placeholder="Tulis keterangan (opsional)"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold">Diskon</label>
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
                  className="w-full rounded-md border p-2 text-xs dark:bg-gray-700 dark:text-white"
                  placeholder="Masukkan diskon"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              )}
            </div>
          </div>
          <button
            className="mt-4 w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600"
            disabled={!selectedSupplier || cartItems.length === 0}
            onClick={() => {
              handleCheckout();
              setShowMobileDialog(false);
            }}
          >
            {selectedSupplier
              ? `Beli dari (${selectedSupplier.nama})`
              : "Pilih Supplier"}
          </button>
        </MobileCheckoutModal>
      )}

      {/* Dialog Hapus Item */}
      {itemToRemove && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setItemToRemove(null)}
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
                onClick={() => setItemToRemove(null)}
                className="rounded bg-gray-300 px-3 py-1 text-sm text-black hover:bg-gray-400"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  updateCart(
                    cartItems.filter((ci) => ci._id !== itemToRemove._id),
                  );
                  setItemToRemove(null);
                }}
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
          onClick={() => setItemToUpdate(null)}
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
                onClick={() => setItemToUpdate(null)}
                className="rounded bg-gray-300 px-3 py-1 text-sm text-black hover:bg-gray-400"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  updateCart(
                    cartItems.map((ci) =>
                      ci._id === itemToUpdate._id
                        ? { ...ci, quantity: tempQuantity }
                        : ci,
                    ),
                  );
                  setItemToUpdate(null);
                }}
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

      {/* Floating Cart Icon */}
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

      {/* Dialog Form Tambah Staff */}
      {showStaffFormModal && (
        <StaffFormModal
          isOpen={showStaffFormModal}
          onClose={() => {
            setShowStaffFormModal(false);
            setStaffRoleToAdd(null);
          }}
          onSubmit={() => {
            refreshStaffList();
          }}
          staff={null}
          initialRole={staffRoleToAdd || undefined}
        />
      )}
    </div>
  );
}
