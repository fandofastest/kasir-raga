"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import { useMediaQuery } from "react-responsive";
import { ShoppingBasketIcon } from "lucide-react";

// ==== Import model types ====
import CartItem from "@/models/modeltsx/CartItem";
import Customer from "@/models/modeltsx/Costumer";
import Transaksi from "@/models/modeltsx/Transaksi";
import { Staff } from "@/models/modeltsx/staffTypes";

// ==== Import data services ====
import {
  fetchStaff,
  fetchSupplier,
  fetchPelanggan,
  createTransaction,
  updateDataTransaction,
  fetchDraftTransaction, // <-- Buat fungsi GET /transaksi/[id]/draft
} from "@/lib/dataService";

// ==== Komponen pendukung ====
import CustomersList from "./CustomerList";
import StaffFormModal from "../staff/StaffForm";
import MobileSalesModal from "./MobileSalesModal";
import TransactionSuccessDialog from "../pembelian/TransactionSuccessDialog";

// ==== Interface Props ====
interface CartSummaryProps {
  cartItems: CartItem[];
  updateCart: (items: CartItem[]) => void;
  onCheckoutSuccess: () => void;
}

function CartSummary({
  cartItems,
  updateCart,
  onCheckoutSuccess,
}: CartSummaryProps) {
  // ==================== HOOKS UTAMA ====================
  const router = useRouter();
  const searchParams = useSearchParams();

  // Cek apakah ada draftId di query param
  const draftId = searchParams.get("draftId");

  // Responsiveness
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [showMobileDialog, setShowMobileDialog] = useState(false);

  // =============== STATE UTAMA ===============
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("tunai");
  const [keterangan, setKeterangan] = useState<string>("");

  // Diskon
  const [enableDiscount, setEnableDiscount] = useState<boolean>(false);
  const [discount, setDiscount] = useState("");

  // Cicilan
  const [dp, setDp] = useState("");
  const [durasiPelunasan, setDurasiPelunasan] = useState<number>(0);
  const [unitPelunasan, setUnitPelunasan] = useState<"hari" | "bulan">("hari");

  // Staff & Armada
  const [staffOptions, setStaffOptions] = useState<Staff[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<string>(""); // Tukang Antar
  const [selectedUnloading, setSelectedUnloading] = useState<string>(""); // Buruh Bongkar

  // Dialog State
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);
  const [itemToUpdate, setItemToUpdate] = useState<CartItem | null>(null);
  const [tempQuantity, setTempQuantity] = useState<number>(1);

  // Dialog Transaksi Sukses
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [transactionData, setTransactionData] = useState<Transaksi>();

  // Animasi keranjang
  const [animateCart, setAnimateCart] = useState(false);
  const prevCartCount = useRef(0);

  // =============== HITUNG TOTAL ===============
  const totalPrice = cartItems.reduce((sum, item) => {
    if (item.satuans && item.satuans.length > 0) {
      return sum + item.satuans[0].harga * item.quantity;
    }
    return sum;
  }, 0);
  const totalHarga = totalPrice - Number(discount);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  function getTimestampWithCurrentTime(dateString: string): string {
    const now = new Date();
    // Ambil bagian jam, menit, detik (format "HH:MM:SS")
    const timePart = now.toTimeString().split(" ")[0];
    return `${dateString}T${timePart}`;
  }
  // =============== USEEFFECTS ===============
  // Animasi keranjang
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

  // Load Staff
  async function loadStaffData() {
    try {
      const res = await fetchStaff();
      setStaffOptions(res.data);
    } catch (error) {
      console.error("Gagal mengambil staff:", error);
    }
  }
  useEffect(() => {
    loadStaffData();
  }, []);

  const resetForm = () => {
    setSelectedCustomer(null);
    setPaymentMethod("tunai");
    setKeterangan("");
    setEnableDiscount(false);
    setDiscount("0");
    setDp("0");
    setDurasiPelunasan(0);
    setUnitPelunasan("hari");
    setSelectedDelivery("");
    setSelectedUnloading("");
  };

  // Load Supplier & Pelanggan
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

  // LOAD DRAFT JIKA draftId ADA
  useEffect(() => {
    if (draftId) {
      loadDraft(draftId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  // =============== FUNGSI LOAD DRAFT ===============
  async function loadDraft(id: string) {
    try {
      const res = await fetchDraftTransaction(id); // GET /transaksi/[id]/draft
      const draftData = res.data; // { data: transaction }

      // Isi state form: misalnya pembeli, method, pengantar, dsb.
      if (draftData.pembeli) setSelectedCustomer(draftData.pembeli);
      if (draftData.pengantar)
        setSelectedDelivery(draftData.pengantar._id || "");
      if (draftData.staff_bongkar)
        setSelectedUnloading(draftData.staff_bongkar._id || "");
      if (draftData.keterangan) setKeterangan(draftData.keterangan);
      if (draftData.metode_pembayaran)
        setPaymentMethod(draftData.metode_pembayaran);
      if (draftData.diskon) {
        setEnableDiscount(true);
        setDiscount(String(draftData.diskon));
      }
      // dsb: DP, durasiPelunasan, unitPelunasan if needed

      // Transform server => cart
      if (draftData.produk && Array.isArray(draftData.produk)) {
        const newCart: CartItem[] = draftData.produk.map((p: any) => {
          // p: { productId, quantity, harga, satuans, ... }
          // const mappedSatuans = p.satuans.map((satuanObj: any) => ({
          //   satuan: { _id: satuanObj._id, nama: satuanObj.nama },
          //   harga: p.harga, // Atau p.satuans[i].harga? Tergantung field di server
          // }));

          return {
            _id: p.productId._id,
            nama_produk: p.productId.nama_produk,
            image: p.productId.image,
            quantity: p.quantity,
            harga: p.harga,
            satuans: p.satuans,
            jumlah: 99999, // misal stok
          };
        });
        updateCart(newCart);
      }
      // dsb.

      toast.success("Draft loaded");
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat draft");
      console.error("Failed load draft:", err);
    }
  }

  // =============== FUNGSI STAFF (MODAL) ===============
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffModalRole, setStaffModalRole] = useState<
    "kasir" | "staffAntar" | "staffBongkar" | "superadmin"
  >("staffAntar");

  function handleAddStaff(
    role: "kasir" | "staffAntar" | "staffBongkar" | "superadmin",
  ) {
    setStaffModalRole(role);
    setShowAddStaffModal(true);
  }
  function handleStaffSubmit() {
    setShowAddStaffModal(false);
    loadStaffData();
  }

  // =============== FUNGSI QUANTITY CART ===============
  const handleDecrement = (item: CartItem) => {
    if (item.quantity <= 1) {
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
  const confirmRemoveItem = () => {
    if (!itemToRemove) return;
    updateCart(cartItems.filter((c) => c._id !== itemToRemove._id));
    setItemToRemove(null);
  };
  const cancelRemoveItem = () => {
    setItemToRemove(null);
  };

  // =============== FUNGSI CHECKOUT & DRAFT ===============
  async function handleCheckout() {
    if (!selectedCustomer) {
      toast.error("Pilih pelanggan terlebih dahulu");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Keranjang masih kosong");
      return;
    }
    if (paymentMethod === "cicilan" && Number(dp) > totalPrice) {
      toast.error("DP tidak boleh lebih besar dari total harga");
      return;
    }
    if (paymentMethod === "cicilan" && durasiPelunasan <= 0) {
      toast.error("Durasi pelunasan harus > 0");
      return;
    }

    // Build payload
    const payload = {
      kasir: "kasirUserId", // ganti session user id
      produk: cartItems.map((item) => ({
        productId: item._id,
        quantity: item.quantity,
        harga: item.satuans[0].harga,
        satuans: item.satuans,
      })),
      tanggal_transaksi: getTimestampWithCurrentTime(selectedDate),

      pembeli: selectedCustomer._id,
      pengantar: selectedDelivery || null,
      staff_bongkar: selectedUnloading || null,
      total_harga: totalHarga,
      metode_pembayaran:
        paymentMethod === "cicilan" ? "cicilan" : paymentMethod,
      status_transaksi: paymentMethod === "cicilan" ? "belum_lunas" : "lunas",
      tipe_transaksi: "penjualan",
      keterangan,
      diskon: enableDiscount ? Number(discount) : 0,
      ...(paymentMethod === "cicilan" && {
        dp,
        durasiPelunasan,
        unitPelunasan,
      }),
    };

    console.log("payload", payload);

    try {
      if (draftId) {
        // Update existing draft => final
        const respon = await updateDataTransaction(draftId, payload);
        toast.success("Transaksi draft diselesaikan");
        updateCart([]);
        setTransactionData(respon.data.data);
        setIsSuccessDialogOpen(true);
        onCheckoutSuccess();
        resetForm();
        router.push("/transaksi");
      } else {
        // Create new
        const respon = await createTransaction(payload);
        if (respon.data.status !== 201) {
          toast.error(respon.data.error || "Gagal melakukan transaksi");
        } else {
          toast.success(respon.data.message || "Transaksi berhasil dibuat");
          updateCart([]);
          setEnableDiscount(false);
          setTransactionData(respon.data.data);
          setIsSuccessDialogOpen(true);
          onCheckoutSuccess();
          resetForm();
          router.push("/transaksi");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat Checkout");
      console.error("Checkout error:", err);
    }
  }

  async function handleSaveDraft() {
    if (cartItems.length === 0) {
      toast.error("Keranjang kosong, tidak bisa simpan draft");
      return;
    }
    const draftPayload = {
      kasir: "kasirUserId",
      produk: cartItems.map((item) => ({
        productId: item._id,
        quantity: item.quantity,
        harga: item.satuans[0].harga,
        satuans: item.satuans,
      })),
      tanggal_transaksi: getTimestampWithCurrentTime(selectedDate),

      pembeli: selectedCustomer?._id || null,
      pengantar: selectedDelivery || null,
      staff_bongkar: selectedUnloading || null,
      total_harga: totalHarga,
      metode_pembayaran: paymentMethod,
      status_transaksi: "tunda", // draft
      tipe_transaksi: "penjualan",
      keterangan,
      diskon: enableDiscount ? Number(discount) : 0,
      ...(paymentMethod === "cicilan" && {
        dp,
        durasiPelunasan,
        unitPelunasan,
      }),
    };

    try {
      if (draftId) {
        // Update existing draft
        console.log(draftPayload);

        const { data } = await updateDataTransaction(draftId, draftPayload);
        toast.success("Draft diperbarui");
        updateCart([]);
        router.push(`/transaksi`);
        onCheckoutSuccess();
        resetForm();
      } else {
        // Create new draft
        const respon = await createTransaction(draftPayload);
        if (respon.data.status !== 201) {
          toast.error(respon.data.error || "Gagal menyimpan draft");
        } else {
          toast.success("Draft transaksi berhasil disimpan");
          // const newDraft = respon.data.data; // { _id, ... }
          updateCart([]);
          router.push(`/transaksi`);
          onCheckoutSuccess();
          resetForm();
          // Opsional: router.push(`/transaksi?draftId=${newDraft._id}`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan draft");
      console.error("Draft save error:", err);
    }
  }

  // -------------------------------------
  // MOBILE UI (Checkout Content)
  // -------------------------------------
  const mobileCheckoutContent = (
    <div className="space-y-4 ">
      {/* Pilih Pelanggan */}
      {/* Field Tanggal di Mobile */}
      <div className="mt-4">
        <label className="block text-sm font-medium">Tanggal Transaksi</label>
        <input
          type="date"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <CustomersList
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
      />

      {/* Pilihan Staff Antar dan Bongkar */}
      <div className="mt-4 grid grid-cols-1 gap-4">
        <div>
          <label className="text-sm font-medium">Pilih Armada</label>
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
                    staff.role !== "superadmin" &&
                    staff.role !== "kasir" &&
                    staff.role !== "staffAntar",
                )
                .map((staff) => (
                  <option key={staff._id} value={staff._id}>
                    {staff.name}
                  </option>
                ))}
            </select>
            <button
              onClick={() => {
                setShowAddStaffModal(true);
                setStaffModalRole("staffAntar");
              }}
              className="ml-2 rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600"
            >
              +
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Pilih Buruh Bongkar</label>
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
                    staff.role !== "superadmin" &&
                    staff.role !== "kasir" &&
                    staff.role !== "staffBongkar",
                )
                .map((staff) => (
                  <option key={staff._id} value={staff._id}>
                    {staff.name}
                  </option>
                ))}
            </select>
            <button
              onClick={() => {
                setShowAddStaffModal(true);
                setStaffModalRole("staffBongkar");
              }}
              className="ml-2 rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Daftar Produk */}
      <div className="overflow-y-auto">
        {cartItems.length > 0 ? (
          cartItems.map((item) => {
            const pricePerItem = item.harga;
            const satuanName = item.satuans?.[0]?.satuan?.nama || "";
            return (
              <div
                key={item._id}
                className="my-2 flex items-center justify-between rounded-md border border-stroke bg-gray-50 p-2 dark:border-strokedark dark:bg-gray-700"
              >
                <div className="flex items-center space-x-2">
                  {item.image && (
                    <Image
                      src={`/api/image-proxy?url=${encodeURIComponent(item.image)}`}
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

      {/* Form Pembayaran */}
      <div className="border-t border-stroke bg-white shadow-md dark:border-strokedark dark:bg-gray-700">
        <div className="mb-3 flex items-center justify-between text-sm font-semibold">
          <span>Total:</span>
          <span>Rp {totalHarga.toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 border-b border-stroke bg-white p-4 dark:border-strokedark dark:bg-gray-700 sm:grid-cols-2">
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

        {/* Cicilan */}
        {paymentMethod === "cicilan" && (
          <div className="mt-4 pl-4">
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
                  onChange={(e) => setDurasiPelunasan(Number(e.target.value))}
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
        <button
          className="mt-2 w-full rounded bg-yellow-500 py-2 text-white hover:bg-yellow-600"
          disabled={!selectedCustomer || cartItems.length === 0}
          onClick={() => {
            handleSaveDraft();
            setShowMobileDialog(false);
          }}
        >
          Simpan Draft
        </button>
      </div>
    </div>
  );

  // =============== RENDERING ===============
  return (
    <div className="relative flex h-full flex-col">
      {/* DESKTOP VIEW */}
      {!isMobile && (
        <>
          {/* Bagian Pelanggan, Staff Antar, Staff Bongkar */}
          <div className="border-b border-stroke p-4 dark:border-strokedark dark:bg-boxdark">
            {/* Field tambahan untuk tanggal transaksi */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Tanggal Transaksi
              </label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <CustomersList
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
            />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Armada */}
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
                    type="button"
                    onClick={() => handleAddStaff("staffAntar")}
                    className="ml-2 rounded bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600"
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
                    type="button"
                    onClick={() => handleAddStaff("staffBongkar")}
                    className="ml-2 rounded bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DAFTAR PRODUK */}
          <div className="flex-1 overflow-y-auto p-4">
            {cartItems.length > 0 ? (
              cartItems.map((item) => {
                const pricePerItem = item.satuans?.[0]?.harga || 0;
                const satuanName = item.satuans?.[0]?.satuan?.nama || "";
                const itemTotal = pricePerItem * item.quantity;
                return (
                  <div
                    key={item._id}
                    className="mb-3 flex items-center justify-between rounded-md border border-stroke bg-gray-50 p-2 dark:border-strokedark dark:bg-gray-700"
                  >
                    <div className="flex items-center space-x-2">
                      {item.image && (
                        <Image
                          src={`/api/image-proxy?url=${encodeURIComponent(item.image)}`}
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
                        onClick={() => {
                          // Jika sudah mencapai stok, tampilkan error
                          if (item.quantity >= item.jumlah) {
                            toast.error("Stok tidak cukup!");
                            return;
                          }
                          // Jika stok masih cukup, tambahkan
                          updateCart(
                            cartItems.map((ci) =>
                              ci._id === item._id &&
                              ci.satuans &&
                              item.satuans &&
                              ci.satuans[0].satuan._id ===
                                item.satuans[0].satuan._id
                                ? { ...ci, quantity: ci.quantity + 1 }
                                : ci,
                            ),
                          );
                        }}
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

          {/* BAGIAN BAWAH: Checkout & Save Draft */}
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
                      setDurasiPelunasan(0);
                      setUnitPelunasan("hari");
                      setDp("0");
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
            <div>
              <h3 className="mb-2 mt-2 text-xs font-semibold text-black dark:text-white">
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
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                )}
              </div>
            </div>
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
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600"
                disabled={!selectedCustomer || cartItems.length === 0}
                onClick={handleCheckout}
              >
                {selectedCustomer
                  ? `Bayar (${selectedCustomer.nama})`
                  : "Pilih Pelanggan"}
              </button>
              <button
                className="w-full rounded-md bg-yellow-500 py-2 text-sm text-white hover:bg-yellow-600"
                disabled={cartItems.length === 0}
                onClick={handleSaveDraft}
              >
                Simpan Draft
              </button>
            </div>
          </div>
        </>
      )}

      {/* MOBILE VIEW */}
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

      {/* FLOATING CART ICON (MOBILE) */}
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

      {/* DIALOG HAPUS ITEM */}
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

      {/* DIALOG UBAH QUANTITY */}
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

      {/* MODAL ADD STAFF */}
      <StaffFormModal
        isOpen={showAddStaffModal}
        onClose={() => setShowAddStaffModal(false)}
        onSubmit={handleStaffSubmit}
        initialRole={staffModalRole}
      />

      {/* DIALOG TRANSAKSI SUKSES */}
      <TransactionSuccessDialog
        isOpen={isSuccessDialogOpen}
        transactionData={transactionData as Transaksi}
        onClose={() => setIsSuccessDialogOpen(false)}
      />
    </div>
  );
}

export default CartSummary;
