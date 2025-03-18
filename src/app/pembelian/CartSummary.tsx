"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import { useMediaQuery } from "react-responsive";
import { ShoppingBasketIcon } from "lucide-react";

import SupplierList from "./SupplierList";
import { Supplier } from "@/models/modeltsx/supplierTypes";
import CartItem from "@/models/modeltsx/CartItem";
import StaffFormModal from "../staff/StaffForm";
import MobileCheckoutModal from "./MobileChecoutModal";
import TransactionSuccessDialog from "./TransactionSuccessDialog";
import Transaksi from "@/models/modeltsx/Transaksi";

import {
  fetchStaff,
  createTransaction,
  updateDataTransaction,
  // Buat juga fetchDraftTransaction di dataService untuk GET /transaksi/[id]/draft
  fetchDraftTransaction,
} from "@/lib/dataService";

interface CartSummaryProps {
  cartItems: CartItem[];
  updateCart: (items: CartItem[]) => void;
  onCheckoutSuccess: () => void;
}

export default function CartSummary({
  cartItems,
  updateCart,
  onCheckoutSuccess,
}: CartSummaryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId"); // Tangkap draftId jika ada

  // State utama
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("tunai");
  const [keterangan, setKeterangan] = useState<string>("");
  const [enableDiscount, setEnableDiscount] = useState<boolean>(false);
  const [discount, setDiscount] = useState<string>(""); // string agar mudah diinput
  const discountValue = Number(discount) || 0;

  // Tambahan state untuk metode cicilan
  const [dp, setDp] = useState<string>("0");
  const [durasiPelunasan, setDurasiPelunasan] = useState<number>(0);
  const [unitPelunasan, setUnitPelunasan] = useState<"hari" | "bulan">("hari");

  // Staf (Tukang Antar & Bongkar)
  const [staffOptions, setStaffOptions] = useState<
    { _id: string; name: string; role: string }[]
  >([]);
  const [selectedDelivery, setSelectedDelivery] = useState<string>(""); // pengantar
  const [selectedUnloading, setSelectedUnloading] = useState<string>(""); // staff_bongkar

  // Dialog hapus & update item
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);
  const [itemToUpdate, setItemToUpdate] = useState<CartItem | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>("1");

  // Dialog Transaksi Sukses
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [transactionData, setTransactionData] = useState<Transaksi>();

  // Responsiveness
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [showMobileDialog, setShowMobileDialog] = useState(false);

  // Floating cart icon animation
  const [animateCart, setAnimateCart] = useState(false);
  const prevCartCount = useRef(0);

  // Modal tambah staff
  const [showStaffFormModal, setShowStaffFormModal] = useState(false);
  const [staffRoleToAdd, setStaffRoleToAdd] = useState<
    "staffAntar" | "staffBongkar" | null
  >(null);

  // Hitung total
  const rawTotal = cartItems.reduce(
    (sum, item) => sum + item.harga * item.quantity,
    0,
  );
  const totalPrice = rawTotal - discountValue;

  // ================== USE EFFECTS ==================
  useEffect(() => {
    // Animasi keranjang
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

  useEffect(() => {
    // Load staff
    refreshStaffList();
  }, []);

  // Jika draftId ada, load draft
  useEffect(() => {
    if (draftId) {
      loadDraftData(draftId);
    }
  }, [draftId]);

  async function refreshStaffList() {
    try {
      const res = await fetchStaff();
      setStaffOptions(res.data);
    } catch (error) {
      console.error("Gagal mengambil staff:", error);
    }
  }

  // ================== LOAD DRAFT ==================
  async function loadDraftData(id: string) {
    try {
      const res = await fetchDraftTransaction(id);
      const draft = res.data;
      console.log("DRAFT PEMBELIAN:", draft);
      if (!draft) return;

      // Isi state: supplier, paymentMethod, diskon, dsb.
      if (draft.supplier) setSelectedSupplier(draft.supplier);
      if (draft.pengantar) setSelectedDelivery(draft.pengantar._id || "");
      if (draft.staff_bongkar)
        setSelectedUnloading(draft.staff_bongkar._id || "");
      if (draft.keterangan) setKeterangan(draft.keterangan);
      if (draft.diskon) {
        setEnableDiscount(true);
        setDiscount(String(draft.diskon));
      }
      if (draft.metode_pembayaran) setPaymentMethod(draft.metode_pembayaran);
      // Jika draft memakai cicilan, set juga DP, durasi, unit pelunasan
      if (draft.metode_pembayaran === "cicilan") {
        if (draft.dp) setDp(String(draft.dp));
        if (draft.durasiPelunasan) setDurasiPelunasan(draft.durasiPelunasan);
        if (draft.unitPelunasan) setUnitPelunasan(draft.unitPelunasan);
      }

      // Transform produk => cart
      if (draft.produk && Array.isArray(draft.produk)) {
        const newCart = draft.produk.map((p: any) => {
          // p = { productId, quantity, harga, satuans, dsb. }
          // Map satuans array
          const mappedSatuans = p.satuans.map((s: any) => ({
            satuan: { _id: s._id, nama: s.nama },
            harga: p.harga, // atau s.harga jika per-satuan harganya beda
          }));
          return {
            _id: p.productId._id,
            nama_produk: p.productId.nama_produk,
            image: p.productId.image,
            quantity: p.quantity,
            harga: p.harga,
            satuans: mappedSatuans,
            harga_modal: p.harga_modal,
            // stok dummy
            jumlah: 9999,
          };
        });
        updateCart(newCart);
      }

      toast.success("Draft loaded (Pembelian)");
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat draft pembelian");
      console.error("Load draft pembelian error:", err);
    }
  }

  // ================== HANDLE STAFF MODAL ==================
  function handleAddStaff(role: "staffAntar" | "staffBongkar") {
    setStaffRoleToAdd(role);
    setShowStaffFormModal(true);
  }

  // ================== HANDLE QUANTITY & REMOVE ==================
  function handleRemoveItem(item: CartItem) {
    updateCart(cartItems.filter((ci) => ci._id !== item._id));
    setItemToRemove(null);
  }
  function handleUpdateItemQty() {
    if (!itemToUpdate) return;
    const newQty = parseInt(tempQuantity) || 1;
    updateCart(
      cartItems.map((ci) =>
        ci._id === itemToUpdate._id ? { ...ci, quantity: newQty } : ci,
      ),
    );
    setItemToUpdate(null);
  }

  // ================== DRAFT & CHECKOUT LOGIC ==================
  async function handleSaveDraft() {
    if (!selectedSupplier) {
      toast.error("Pilih supplier terlebih dahulu untuk draft!");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Keranjang masih kosong");
      return;
    }
    const draftPayload = {
      kasir: "kasirUserId", // Ganti
      produk: cartItems.map((item) => ({
        productId: item._id,
        quantity: item.quantity,
        harga: item.harga,
        satuans: item.satuans?.[0]?.satuan?._id || null,
        harga_modal: item.harga_modal,
      })),
      supplier: selectedSupplier._id,
      pengantar: selectedDelivery || null,
      staff_bongkar: selectedUnloading || null,
      total_harga: totalPrice,
      metode_pembayaran: paymentMethod,
      status_transaksi: "tunda", // DRAFT
      tipe_transaksi: "pembelian",
      keterangan,
      diskon: enableDiscount ? discountValue : 0,
      ...(paymentMethod === "cicilan" && {
        dp,
        durasiPelunasan,
        unitPelunasan,
      }),
    };

    try {
      if (draftId) {
        // Update draft
        const res = await updateDataTransaction(draftId, draftPayload);
        console.log(res.data);

        if (res.data.status !== 200) {
          toast.error(res.data.error || "Gagal memperbarui draft");
        } else {
          toast.success("Draft pembelian diperbarui");
          router.push(`/pembelian`);
          updateCart([]);
        }
      } else {
        // Create new draft
        const res = await createTransaction(draftPayload);
        if (res.data.status !== 201) {
          toast.error(res.data.error || "Gagal menyimpan draft");
        } else {
          toast.success("Draft pembelian berhasil disimpan");
          router.push(`/pembelian`);
          updateCart([]);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan draft pembelian");
      console.error("Save draft pembelian error:", err);
    }
  }

  async function handleCheckout() {
    if (!selectedSupplier) {
      toast.error("Pilih supplier terlebih dahulu");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Keranjang masih kosong");
      return;
    }

    const finalPayload = {
      kasir: "kasirUserId", // Ganti
      produk: cartItems.map((item) => ({
        productId: item._id,
        quantity: item.quantity,
        harga: item.harga,
        satuans: item.satuans?.[0]?.satuan?._id || null,
        harga_modal: item.harga_modal,
      })),
      supplier: selectedSupplier._id,
      pengantar: selectedDelivery || null,
      staff_bongkar: selectedUnloading || null,
      total_harga: totalPrice,
      metode_pembayaran: paymentMethod,
      // Jika metode adalah hutang atau cicilan, status tetap "belum_lunas"
      status_transaksi:
        paymentMethod === "hutang" || paymentMethod === "cicilan"
          ? "belum_lunas"
          : "lunas",
      tipe_transaksi: "pembelian",
      keterangan,
      diskon: enableDiscount ? discountValue : 0,
      ...(paymentMethod === "cicilan" && {
        dp,
        durasiPelunasan,
        unitPelunasan,
      }),
    };

    try {
      if (draftId) {
        // Update existing draft, ubah status menjadi lunas / belum_lunas
        console.log("====================================");
        console.log(finalPayload);
        console.log("====================================");
        const res = await updateDataTransaction(draftId, finalPayload);
        toast.success("Transaksi draft pembelian diselesaikan");
        updateCart([]);
        setTransactionData(res.data.data);
        setIsSuccessDialogOpen(true);
        onCheckoutSuccess();
        router.push(`/pembelian`);
      } else {
        // Create new
        const respon = await createTransaction(finalPayload);
        if (respon.data.status !== 201) {
          toast.error(respon.data.error || "Gagal melakukan transaksi");
        } else {
          toast.success(respon.data.message || "Transaksi berhasil dibuat");
          updateCart([]);
          setTransactionData(respon.data.data);
          setIsSuccessDialogOpen(true);
          onCheckoutSuccess();
          setEnableDiscount(false);
          router.push(`/pembelian`);
        }
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Terjadi kesalahan saat melakukan transaksi");
    }
  }

  // ================== RENDER ==================
  return (
    <div className="bg-white dark:bg-gray-800">
      {/* Bagian atas (supplier) + staff antar/bongkar: tampil di desktop */}
      {!isMobile && (
        <>
          <div className="border-b border-stroke p-4 dark:border-strokedark">
            <SupplierList
              selectedSupplier={selectedSupplier}
              setSelectedSupplier={setSelectedSupplier}
            />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Tukang Antar */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Pilih Armada
                </label>
                <div className="flex items-center gap-2">
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={selectedDelivery}
                    onChange={(e) => setSelectedDelivery(e.target.value)}
                  >
                    <option value="">--Tidak Ada--</option>
                    {staffOptions
                      .filter((st) => st.role === "staffAntar")
                      .map((st) => (
                        <option key={st._id} value={st._id}>
                          {st.name}
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

              {/* Buruh Bongkar */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Pilih Buruh Bongkar
                </label>
                <div className="flex items-center gap-2">
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={selectedUnloading}
                    onChange={(e) => setSelectedUnloading(e.target.value)}
                  >
                    <option value="">--Tidak Ada--</option>
                    {staffOptions
                      .filter((st) => st.role === "staffBongkar")
                      .map((st) => (
                        <option key={st._id} value={st._id}>
                          {st.name}
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

          {/* Daftar Produk */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length > 0 ? (
              cartItems.map((item) => {
                const satuanName = item.satuans?.[0]?.satuan?.nama || "";
                const itemTotal = item.harga * item.quantity;
                return (
                  <div
                    key={item._id}
                    className="mb-3 flex items-center justify-between rounded-md border border-stroke bg-gray-50 p-2 dark:border-strokedark dark:bg-gray-700"
                  >
                    <div className="flex items-center space-x-2">
                      {item.image && (
                        <Image
                          src={`/api/image-proxy?url=${encodeURIComponent(
                            item.image,
                          )}`}
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
                          if (item.quantity <= 1) {
                            setItemToRemove(item);
                          } else {
                            updateCart(
                              cartItems.map((ci) =>
                                ci._id === item._id
                                  ? { ...ci, quantity: ci.quantity - 1 }
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
                          setTempQuantity(item.quantity.toString());
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

          {/* Bagian Bawah: Diskon, Metode Pembayaran, Cicilan, Tombol Bayar/Simpan Draft */}
          <div className="sticky bottom-0 border-t border-stroke bg-white p-4 shadow-md dark:border-strokedark dark:bg-boxdark">
            <div className="mb-3 flex items-center justify-between text-sm font-semibold">
              <span>Total:</span>
              <span>Rp{totalPrice.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-1 gap-4 border-b border-stroke bg-white dark:border-strokedark dark:bg-boxdark sm:grid-cols-2">
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
                      setDurasiPelunasan(0);
                      setUnitPelunasan("hari");
                      setDp("0");
                    }
                  }}
                >
                  <option value="tunai">Tunai</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  {/* <option value="hutang">Hutang</option> */}
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

            {/* Tampilan input cicilan jika metode cicilan dipilih */}
            {paymentMethod === "cicilan" && (
              <div className="mt-2">
                <div className="grid grid-cols-2 gap-4">
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
                      onChange={(e) => setDp(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Durasi Pelunasan
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="Masukkan durasi"
                      value={durasiPelunasan}
                      onChange={(e) =>
                        setDurasiPelunasan(Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Unit Pelunasan
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={unitPelunasan}
                    onChange={(e) =>
                      setUnitPelunasan(e.target.value as "hari" | "bulan")
                    }
                  >
                    <option value="hari">Hari</option>
                    <option value="bulan">Bulan</option>
                  </select>
                </div>
              </div>
            )}

            <div className="mt-4 flex space-x-2">
              <button
                className="flex-1 rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600"
                disabled={!selectedSupplier || cartItems.length === 0}
                onClick={handleCheckout}
              >
                {selectedSupplier
                  ? `Bayar (${selectedSupplier.nama})`
                  : "Pilih Supplier"}
              </button>
              <button
                className="flex-1 rounded-md bg-yellow-500 py-2 text-white hover:bg-yellow-600"
                disabled={!selectedSupplier || cartItems.length === 0}
                onClick={handleSaveDraft}
              >
                Simpan Draft
              </button>
            </div>
          </div>
        </>
      )}

      {/* MOBILE: Button Checkout */}
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

      {/* MOBILE: Modal Checkout */}
      {isMobile && (
        <MobileCheckoutModal
          isOpen={showMobileDialog}
          onClose={() => setShowMobileDialog(false)}
        >
          {/* SupplierList */}
          <div className="mb-4">
            <SupplierList
              selectedSupplier={selectedSupplier}
              setSelectedSupplier={setSelectedSupplier}
            />
          </div>
          {/* Daftar Produk di Modal */}
          <div className="mb-4 border-b border-t border-strokedark py-4 dark:border-strokedark">
            {cartItems.length > 0 ? (
              cartItems.map((item) => {
                const itemTotal = item.harga * item.quantity;
                const satuanName = item.satuans?.[0]?.satuan?.nama || "";
                return (
                  <div
                    key={item._id}
                    className="my-2 flex items-center justify-between rounded-md border border-stroke bg-gray-50 p-2 dark:border-strokedark dark:bg-gray-700"
                  >
                    <div className="flex items-center space-x-2">
                      {item.image && (
                        <Image
                          src={`/api/image-proxy?url=${encodeURIComponent(
                            item.image,
                          )}`}
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
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {item.quantity} x Rp{item.harga.toLocaleString()}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500">Keranjang masih kosong</p>
            )}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium">
              Metode Pembayaran
            </label>
            <select
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                if (e.target.value !== "cicilan") {
                  setDurasiPelunasan(0);
                  setUnitPelunasan("hari");
                  setDp("0");
                }
              }}
            >
              <option value="tunai">Tunai</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="hutang">Hutang</option>
              <option value="cicilan">Cicilan</option>
            </select>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium">Keterangan</label>
            <input
              type="text"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Tulis keterangan (opsional)"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
            />
          </div>

          {/* Input Cicilan di Mobile */}
          {paymentMethod === "cicilan" && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    Down Payment (DP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Masukkan DP"
                    value={dp}
                    onChange={(e) => setDp(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Durasi Pelunasan
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Masukkan durasi"
                    value={durasiPelunasan}
                    onChange={(e) => setDurasiPelunasan(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium">
                  Unit Pelunasan
                </label>
                <select
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  value={unitPelunasan}
                  onChange={(e) =>
                    setUnitPelunasan(e.target.value as "hari" | "bulan")
                  }
                >
                  <option value="hari">Hari</option>
                  <option value="bulan">Bulan</option>
                </select>
              </div>
            </div>
          )}

          {/* Tombol Checkout Mobile */}
          <button
            className="mt-4 w-full rounded bg-blue-500 py-2 text-white hover:bg-blue-600"
            disabled={!selectedSupplier || cartItems.length === 0}
            onClick={() => {
              handleCheckout();
              setShowMobileDialog(false);
            }}
          >
            {selectedSupplier
              ? `Bayar (${selectedSupplier.nama})`
              : "Pilih Supplier"}
          </button>
          {/* Tombol Simpan Draft Mobile */}
          <button
            className="mt-2 w-full rounded bg-yellow-500 py-2 text-white hover:bg-yellow-600"
            disabled={!selectedSupplier || cartItems.length === 0}
            onClick={() => {
              handleSaveDraft();
              setShowMobileDialog(false);
            }}
          >
            Simpan Draft
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
                onClick={() => handleRemoveItem(itemToRemove)}
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
              onChange={(e) => setTempQuantity(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setItemToUpdate(null)}
                className="rounded bg-gray-300 px-3 py-1 text-sm text-black hover:bg-gray-400"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateItemQty}
                className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Transaksi Sukses */}
      <TransactionSuccessDialog
        isOpen={isSuccessDialogOpen}
        transactionData={transactionData as Transaksi}
        onClose={() => setIsSuccessDialogOpen(false)}
      />

      {/* Floating Cart Icon (Mobile) */}
      {cartItems.length > 0 && isMobile && (
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

      {/* Modal Tambah Staff */}
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
          initialRole={staffRoleToAdd || undefined}
        />
      )}
    </div>
  );
}
