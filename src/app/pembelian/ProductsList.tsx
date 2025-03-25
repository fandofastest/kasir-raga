"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Product, SatuanPembelian } from "@/models/modeltsx/productTypes";
import CartItem from "@/models/modeltsx/CartItem";
import { fetchProducts, fetchSatuan, addSatuan } from "@/lib/dataService";
import { GridIcon, ListIcon, XCircleIcon } from "lucide-react";
import { AddSatuanModal, RemoveSatuanModal } from "@/components/SatuanForm";

// Fungsi helper untuk generate UUID
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// -------------------------------------------------------------------
// Interface untuk EditSatuan (di modal pembelian)
// -------------------------------------------------------------------
interface EditSatuan {
  _id: string; // ID unik baris
  satuanId: string; // _id dari satuan yang dipilih
  konversi: number;
  hargaJual: number;
  profitPercent: number;
}

// -------------------------------------------------------------------
// Komponen utama: ProductsList
// -------------------------------------------------------------------
interface ProductsListProps {
  addToCart: (
    item: CartItem,
    quantity: number,
    harga: number,
    harga_modal: number,
  ) => void;
  refreshKey: number;
}

export default function ProductsList({
  addToCart,
  refreshKey,
}: ProductsListProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRemoveSatuan, setShowRemoveSatuan] = useState(false);

  // Modal states
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [showAddSatuan, setShowAddSatuan] = useState(false);

  // Form di modal pembelian
  const [purchasePrice, setPurchasePrice] = useState("");
  const [quantity, setQuantity] = useState("1");

  // Edit satuan
  const [editSatuans, setEditSatuans] = useState<EditSatuan[]>([]);

  // Global satuan options (untuk select)
  const [satuanOptions, setSatuanOptions] = useState<
    { _id: string; nama: string }[]
  >([]);
  const handleDeleteSatuan = (id: string) => {
    setSatuanOptions((prev) => prev.filter((item) => item._id !== id));
  };

  // -------------------------------------------------------------------
  // Fetch data produk
  // -------------------------------------------------------------------
  async function loadProducts() {
    try {
      const data = await fetchProducts();
      setProducts(data.data);
    } catch (error) {
      toast.error("Gagal memuat produk");
      console.error(error);
    }
  }
  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadProducts();
    console.log("refreshKey:", refreshKey);
  }, [refreshKey]);

  // -------------------------------------------------------------------
  // Fungsi untuk mengupdate konversi dan menghitung harga jual otomatis
  // -------------------------------------------------------------------
  const handleKonversiChange = (index: number, newKonversi: number) => {
    setEditSatuans((prev) => {
      const newArr = [...prev];
      const modalPrice = Number(purchasePrice) || 0;
      if (modalPrice === 0) {
        toast.error("Harga modal tidak valid");
        return prev;
      }
      // Hitung harga jual: modalPrice * newKonversi * 1.05 (margin 5%)
      const newHargaJual = modalPrice * newKonversi * 1.05;
      newArr[index] = {
        ...newArr[index],
        konversi: newKonversi,
        hargaJual: Number(newHargaJual.toFixed(2)),
        profitPercent: 5, // secara default margin 5%
      };
      return newArr;
    });
  };

  // -------------------------------------------------------------------
  // Fungsi untuk menangani perubahan manual pada harga jual dengan warning
  // -------------------------------------------------------------------
  const handleHargaJualChange = (index: number, newHJ: number) => {
    setEditSatuans((prev) => {
      const clone = [...prev];
      const old = clone[index];
      const costSatuan = Number(purchasePrice) * old.konversi;
      if (newHJ < costSatuan) {
        toast.error("Harga jual tidak boleh dibawah harga modal satuan");
        newHJ = costSatuan; // koreksi harga jual ke minimal
      }
      let profit = 0;
      if (costSatuan > 0) {
        profit = ((newHJ - costSatuan) / costSatuan) * 100;
      }
      clone[index] = {
        ...old,
        hargaJual: newHJ,
        profitPercent: +profit.toFixed(2),
      };
      return clone;
    });
  };

  // -------------------------------------------------------------------
  // Fetch data satuan
  // -------------------------------------------------------------------
  useEffect(() => {
    async function loadSatuanOptions() {
      try {
        const res = await fetchSatuan();
        setSatuanOptions(res.data);
      } catch (error) {
        console.error("Gagal memuat satuan:", error);
      }
    }
    loadSatuanOptions();
  }, []);

  // -------------------------------------------------------------------
  // Filter produk berdasarkan searchTerm
  // -------------------------------------------------------------------
  const filteredProducts = products.filter((p) =>
    p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // -------------------------------------------------------------------
  // Buka modal pembelian dan inisialisasi data
  // -------------------------------------------------------------------
  const handleTambahClick = (product: Product) => {
    setActiveProduct(product);
    setPurchasePrice((product.harga_modal || 0).toString());
    setQuantity("1");

    if (product.satuans && product.satuans.length > 0) {
      const newEditSatuans: EditSatuan[] = product.satuans.map((s) => {
        const costSatuan = (product.harga_modal || 0) * s.konversi;
        const defaultHJ = s.harga;
        let profitPercent = 0;
        if (costSatuan > 0) {
          profitPercent = ((defaultHJ - costSatuan) / costSatuan) * 100;
        }
        return {
          _id: s._id,
          satuanId: s.satuan._id,
          konversi: s.konversi,
          hargaJual: defaultHJ,
          profitPercent: +profitPercent.toFixed(2),
        };
      });
      setEditSatuans(newEditSatuans);
    } else {
      // Jika produk tidak memiliki data satuan, inisialisasi dengan satu baris default
      setEditSatuans([
        {
          _id: generateUUID(),
          satuanId: "",
          konversi: 1,
          hargaJual: Number(product.harga_modal),
          profitPercent: 0,
        },
      ]);
    }
  };

  // -------------------------------------------------------------------
  // Purchase Price berubah => update profit di semua baris
  // -------------------------------------------------------------------
  const handlePurchasePriceChange = (newVal: any) => {
    setPurchasePrice(newVal.toString());
    setEditSatuans((prev) =>
      prev.map((ed) => {
        const costSatuan = newVal * ed.konversi;
        let profit = 0;
        if (costSatuan > 0) {
          profit = ((ed.hargaJual - costSatuan) / costSatuan) * 100;
        }
        return { ...ed, profitPercent: +profit.toFixed(2) };
      }),
    );
  };

  // -------------------------------------------------------------------
  // Edit field di baris satuan (tetap untuk field selain konversi)
  // -------------------------------------------------------------------
  const handleEditSatuanChange = (
    index: number,
    field: keyof EditSatuan,
    value: any,
  ) => {
    setEditSatuans((prev) => {
      const newArr = [...prev];
      newArr[index] = { ...newArr[index], [field]: value };
      return newArr;
    });
  };

  // -------------------------------------------------------------------
  // Saat user memilih satuan, jika baris terakhir sudah terisi, tambah baris baru
  // -------------------------------------------------------------------
  const handleSatuanSelectChange = (index: number, newVal: string) => {
    handleEditSatuanChange(index, "satuanId", newVal);
    // Jika user sedang mengisi baris terakhir & memilih satuan, tambah baris baru
    if (index === editSatuans.length - 1 && newVal) {
      setEditSatuans((prev) => [
        ...prev,
        {
          _id: generateUUID(),
          satuanId: "",
          konversi: 1,
          hargaJual: Number(purchasePrice),
          profitPercent: 0,
        },
      ]);
    }
  };

  // -------------------------------------------------------------------
  // Filter satuan yang sudah dipilih agar tidak muncul di baris lain
  // -------------------------------------------------------------------
  const getAvailableOptionsForRow = (rowIndex: number) => {
    const usedSatuanIds = editSatuans
      .filter((_, idx) => idx !== rowIndex)
      .map((ed) => ed.satuanId)
      .filter(Boolean);
    return satuanOptions.filter(
      (opt) =>
        !usedSatuanIds.includes(opt._id) ||
        opt._id === editSatuans[rowIndex].satuanId,
    );
  };

  // -------------------------------------------------------------------
  // Hapus baris satuan (tombol merah), minimal 1 baris
  // -------------------------------------------------------------------
  const handleRemoveSatuanRow = (index: number) => {
    if (editSatuans.length > 1) {
      setEditSatuans((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  // -------------------------------------------------------------------
  // User edit harga jual => update profit (gunakan fungsi handleHargaJualChange yang sudah diupdate)
  // -------------------------------------------------------------------
  // (Fungsi ini sudah ada, cukup update warnanya seperti di handleHargaJualChange di atas)

  // -------------------------------------------------------------------
  // User edit profit => update harga jual (tetap)
  // -------------------------------------------------------------------
  const handleProfitPercentChange = (index: number, newProfit: number) => {
    setEditSatuans((prev) => {
      const clone = [...prev];
      const old = clone[index];
      const costSatuan = Number(purchasePrice) * old.konversi;
      const newHJ = costSatuan * (1 + newProfit / 100);
      clone[index] = {
        ...old,
        profitPercent: newProfit,
        hargaJual: +newHJ.toFixed(2),
      };
      return clone;
    });
  };

  // -------------------------------------------------------------------
  // Hitung total beli
  // -------------------------------------------------------------------
  const totalBeli = Number(purchasePrice) * Number(quantity);

  // -------------------------------------------------------------------
  // Konfirmasi: tambah ke cart
  // -------------------------------------------------------------------
  const handleConfirmAdd = () => {
    if (!activeProduct) return;

    // Buat array satuan untuk cart dari data editSatuans
    const newSatuans: SatuanPembelian[] = editSatuans.map((ed) => {
      const satuanOption = satuanOptions.find((opt) => opt._id === ed.satuanId);
      return {
        _id: ed.satuanId,
        satuan: {
          _id: satuanOption ? satuanOption._id : "",
          nama: satuanOption ? satuanOption.nama : "",
        },
        konversi: ed.konversi,
        harga: ed.hargaJual,
      };
    });

    const cartItem: CartItem = {
      ...activeProduct,
      satuans: newSatuans,
      quantity: Number(quantity),
      harga: Number(purchasePrice),
      harga_modal: Number(hargaModalBaru),
    };

    addToCart(
      cartItem,
      Number(quantity),
      Number(purchasePrice),
      Number(hargaModalBaru),
    );
    handleCloseModal();
  };

  // -------------------------------------------------------------------
  // Tutup modal
  // -------------------------------------------------------------------
  const handleCloseModal = () => {
    setActiveProduct(null);
    setEditSatuans([]);
  };

  // -------------------------------------------------------------------
  // Setelah satuan baru dibuat, tambahkan ke editSatuans & update global
  // -------------------------------------------------------------------
  const handleCreatedSatuan = (newSat: { _id: string; nama: string }) => {
    setEditSatuans((prev) => [
      ...prev,
      {
        _id: newSat._id,
        satuanId: newSat._id,
        konversi: 1,
        hargaJual: Number(purchasePrice),
        profitPercent: 0,
      },
    ]);
    setSatuanOptions((prev) => [...prev, newSat]);
  };

  const hargaModalBaru = activeProduct
    ? (
        (Number(activeProduct.harga_modal) * Number(activeProduct.jumlah) +
          Number(purchasePrice) * Number(quantity)) /
        (Number(activeProduct.jumlah) + Number(quantity))
      ).toFixed(2)
    : "";

  // -------------------------------------------------------------------
  // Render (layout tidak diubah)
  // -------------------------------------------------------------------
  return (
    <div className="p-4">
      {/* Search & Toggle View */}
      <div className="mb-3 flex items-center space-x-3">
        <input
          type="text"
          placeholder="Cari produk..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-5/6 rounded-md border border-gray-300 px-3 py-2 text-sm 
                     focus:border-blue-500 focus:ring-blue-500 
                     dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-500"
        />
        <button
          onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
          className="flex w-1/6 items-center justify-center rounded-md border 
                     border-stroke bg-white px-3 py-1 text-sm hover:bg-gray-100 
                     dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-strokedark"
        >
          {viewMode === "list" ? (
            <>
              <GridIcon className="mr-1 h-4 w-4" /> Grid
            </>
          ) : (
            <>
              <ListIcon className="mr-1 h-4 w-4" /> List
            </>
          )}
        </button>
      </div>

      {/* Daftar Produk */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-2 gap-4 overflow-y-auto md:grid-cols-3 lg:grid-cols-4"
            : "flex h-fit max-h-[65vh] flex-col space-y-3 overflow-y-auto"
        }
      >
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const firstPrice =
              product.satuans && product.satuans.length > 0
                ? product.satuans[0].harga
                : 0;
            return (
              <div
                key={product._id}
                className={`rounded-md border border-stroke p-3 shadow-sm transition-shadow 
                           hover:shadow-lg dark:border-strokedark dark:bg-boxdark ${
                             viewMode === "grid"
                               ? "flex flex-col items-center space-y-2 text-center"
                               : "flex w-full flex-row items-center justify-between space-x-4"
                           }`}
              >
                {/* Gambar Produk */}
                <div className="relative h-[100px] w-[100px] rounded-md border border-gray-300">
                  <Image
                    src={
                      product.image
                        ? `/api/image-proxy?url=${encodeURIComponent(product.image)}`
                        : "/images/product/default.png"
                    }
                    alt="Product"
                    fill
                    className="rounded-md object-cover"
                  />
                </div>
                {/* Info Produk */}
                <div className="flex-1">
                  <p className="font-medium text-black dark:text-white">
                    {product.nama_produk}
                  </p>
                  {product.satuans && product.satuans.length > 0 ? (
                    <>
                      <p className="text-sm text-gray-500">
                        Rp{firstPrice.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Harga Modal: Rp
                        {Number(product.harga_modal).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No Price</p>
                  )}
                </div>

                {/* Stok */}
                <div>
                  <p className="text-sm text-gray-500">
                    Stok: {product.jumlah}
                  </p>
                </div>
                {/* Tombol Tambah */}
                <button
                  className={`ml-auto rounded-md bg-blue-500 px-3 py-1 text-sm font-semibold text-white 
                             hover:bg-blue-600 ${viewMode === "grid" ? "w-full" : ""}`}
                  onClick={() => handleTambahClick(product)}
                >
                  Tambah
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Produk tidak ditemukan
          </p>
        )}
      </div>

      {/* MODAL: Form Pembelian */}
      {activeProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity"
          onClick={handleCloseModal}
        >
          <div
            className="relative max-h-[80vh] w-full max-w-full overflow-y-auto rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900 sm:max-w-md md:max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseModal}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
            <h2 className="mb-4 text-lg font-semibold dark:text-white">
              Tambah ke Pembelian
            </h2>
            <p className="mb-3 text-sm text-gray-700 dark:text-gray-200">
              {activeProduct.nama_produk}
            </p>

            <div className="space-y-4">
              {/* Form: Harga Beli & Quantity */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Harga Beli /1 unit
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="mt-1 w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
                      value={purchasePrice}
                      onChange={(e) =>
                        handlePurchasePriceChange(e.target.value)
                      }
                    />
                  </div>
                  {activeProduct &&
                    Number(purchasePrice) !==
                      Number(activeProduct.harga_modal) && (
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                          Harga Modal Terbaru
                        </label>
                        <input
                          type="number"
                          readOnly
                          className="mt-1 w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
                          value={hargaModalBaru}
                        />
                      </div>
                    )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="mt-1 w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Total Beli
                  </label>
                  <input
                    type="text"
                    readOnly
                    className="mt-1 w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
                    value={`Rp ${totalBeli.toLocaleString()}`}
                  />
                </div>
              </div>

              {/* DAFTAR SATUAN */}
              <div className="border-t pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Daftar Satuan
                  </label>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAddSatuan(true)}
                      className="rounded bg-green-500 px-2 py-1 text-sm text-white hover:bg-green-600"
                    >
                      + Tambah Satuan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRemoveSatuan(true)}
                      className="rounded bg-red-500 px-2 py-1 text-sm text-white hover:bg-red-600"
                    >
                      - Hapus Satuan
                    </button>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {editSatuans.map((ed, idx) => (
                    <div
                      key={ed._id}
                      className="flex flex-wrap items-center gap-3"
                    >
                      {/* Select Satuan */}
                      <div className="flex flex-col">
                        {idx === 0 && (
                          <label className="mb-1 text-sm text-gray-600 dark:text-gray-300">
                            Satuan
                          </label>
                        )}
                        <select
                          className="min-w-[120px] rounded border p-2 text-sm dark:bg-gray-800 dark:text-gray-100"
                          value={ed.satuanId}
                          onChange={(e) =>
                            handleSatuanSelectChange(idx, e.target.value)
                          }
                        >
                          <option value="">--Pilih Satuan--</option>
                          {getAvailableOptionsForRow(idx).map((opt) => (
                            <option key={opt._id} value={opt._id}>
                              {opt.nama}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Input Konversi */}
                      <div className="flex flex-col">
                        {idx === 0 && (
                          <label className="mb-1 text-sm text-gray-600 dark:text-gray-300">
                            Konversi
                          </label>
                        )}
                        <input
                          type="number"
                          placeholder="Konversi"
                          className="w-20 rounded border p-2 text-sm dark:bg-gray-800 dark:text-white"
                          value={ed.konversi}
                          onChange={(e) =>
                            handleKonversiChange(idx, Number(e.target.value))
                          }
                        />
                      </div>

                      {/* Input Harga */}
                      <div className="flex flex-col">
                        {idx === 0 && (
                          <label className="mb-1 text-sm text-gray-600 dark:text-gray-300">
                            Harga
                          </label>
                        )}
                        <input
                          type="number"
                          placeholder="Harga"
                          className="w-24 rounded border p-2 text-sm dark:bg-gray-800 dark:text-white"
                          value={ed.hargaJual}
                          onChange={(e) =>
                            handleHargaJualChange(idx, Number(e.target.value))
                          }
                        />
                      </div>

                      {/* Label Unit */}
                      <div className="flex flex-col">
                        {idx === 0 && (
                          <label className="invisible mb-1 text-sm text-gray-600 dark:text-gray-300">
                            Unit
                          </label>
                        )}
                        <span className="self-center text-sm text-gray-600 dark:text-gray-300">
                          / unit
                        </span>
                      </div>

                      {/* Input Profit */}
                      <div className="flex flex-col">
                        {idx === 0 && (
                          <label className="mb-1 text-sm text-gray-600 dark:text-gray-300">
                            Profit
                          </label>
                        )}
                        <input
                          type="number"
                          placeholder="Profit"
                          className="w-20 rounded border p-2 text-sm dark:bg-gray-800 dark:text-white"
                          value={ed.profitPercent}
                          onChange={(e) =>
                            handleProfitPercentChange(
                              idx,
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>

                      {/* Tombol Hapus Row (jika lebih dari satu) */}
                      {editSatuans.length > 1 && (
                        <div className="mt-2 sm:mt-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveSatuanRow(idx)}
                            className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                          >
                            -
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-stretch sm:flex-row sm:justify-end sm:space-x-4">
              <button
                onClick={handleCloseModal}
                className="mb-3 rounded bg-gray-300 px-4 py-2 text-sm hover:bg-gray-400 dark:text-black sm:mb-0"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAdd}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Satuan */}
      <AddSatuanModal
        isOpen={showAddSatuan}
        onClose={() => setShowAddSatuan(false)}
        onCreatedSatuan={handleCreatedSatuan}
      />
      {/* Di sini panggil modal Tambah/Hapus Satuan (jika Anda punya) */}

      <RemoveSatuanModal
        isOpen={showRemoveSatuan}
        onClose={() => setShowRemoveSatuan(false)}
        satuanOptions={satuanOptions}
        onDeleteSatuan={handleDeleteSatuan}
      />
    </div>
  );
}
