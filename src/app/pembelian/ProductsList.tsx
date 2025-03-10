"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Product, SatuanPembelian } from "@/models/modeltsx/productTypes";
import CartItem from "@/models/modeltsx/CartItem";
import { fetchProducts } from "@/lib/dataService";
import { GridIcon, ListIcon, XCircleIcon } from "lucide-react";

interface EditSatuan {
  _id: string; // ID subdok SatuanPembelian
  konversi: number; // SatuanPembelian.konversi
  namaSatuan: string;
  hargaJual: number; // bisa diedit
  profitPercent: number; // bisa diedit
}

interface ProductsListProps {
  // Di pembelian, Anda mungkin punya addToPurchaseCart,
  // tapi di sini kita buat addToCart(item, quantity)
  addToCart: (item: CartItem, quantity: number, harga: number) => void;
  refreshKey: number;
}

export default function ProductsList({
  addToCart,
  refreshKey,
}: ProductsListProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Form di modal
  const [purchasePrice, setPurchasePrice] = useState<number>(0); // Harga beli per 1 unit dasar
  const [quantity, setQuantity] = useState<number>(1);

  // Daftar satuan (edit) - perhitungan profit/hargaJual
  const [editSatuans, setEditSatuans] = useState<EditSatuan[]>([]);

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
    console.log("====================================");
    console.log("refreshKey:", refreshKey);
    console.log("====================================");
  }, [refreshKey]);

  // Filter
  const filteredProducts = products.filter((p) =>
    p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Ketika klik "Tambah" => buka modal
  const handleTambahClick = (product: Product) => {
    setActiveProduct(product);

    // Set harga beli (purchasePrice) default misal product.harga_modal
    setPurchasePrice(product.harga_modal || 0);
    setQuantity(1);

    // Siapkan editSatuans
    const newEditSatuans: EditSatuan[] = (product.satuans || []).map((s) => {
      const costSatuan = (product.harga_modal || 0) * s.konversi;
      // default hargaJual => s.harga, atau 0
      const defaultHJ = s.harga;
      let profitPercent = 0;
      if (costSatuan > 0) {
        profitPercent = ((defaultHJ - costSatuan) / costSatuan) * 100;
      }
      return {
        _id: s._id,
        konversi: s.konversi,
        namaSatuan: s.satuan.nama,
        hargaJual: defaultHJ,
        profitPercent: +profitPercent.toFixed(2),
      };
    });

    setEditSatuans(newEditSatuans);
  };

  // Perubahan purchasePrice => update profitPercent di setiap satuan
  const handlePurchasePriceChange = (newVal: number) => {
    setPurchasePrice(newVal);

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

  // User edit hargaJual di satuan
  const handleHargaJualChange = (index: number, newHJ: number) => {
    setEditSatuans((prev) => {
      const clone = [...prev];
      const old = clone[index];

      const costSatuan = purchasePrice * old.konversi;
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

  // User edit profitPercent => update hargaJual
  const handleProfitPercentChange = (index: number, newProfit: number) => {
    setEditSatuans((prev) => {
      const clone = [...prev];
      const old = clone[index];

      const costSatuan = purchasePrice * old.konversi;
      const newHJ = costSatuan * (1 + newProfit / 100);

      clone[index] = {
        ...old,
        profitPercent: newProfit,
        hargaJual: +newHJ.toFixed(2),
      };
      return clone;
    });
  };

  // totalBeli = purchasePrice * quantity
  const totalBeli = purchasePrice * quantity;

  // Konfirmasi => addToCart
  const handleConfirmAdd = () => {
    if (!activeProduct) return;

    // Perbarui product.satuans => harga = editSatuan.hargaJual
    const newSatuans: SatuanPembelian[] = (activeProduct.satuans || []).map(
      (s) => {
        const found = editSatuans.find((ed) => ed._id === s._id);
        if (found) {
          return {
            ...s,
            harga: found.hargaJual,
          };
        }
        return s;
      },
    );

    const cartItem: CartItem = {
      ...activeProduct,
      satuans: newSatuans,
      quantity,
      harga: purchasePrice,
      // Bisa simpan purchasePrice disini,
      //  mis. "harga_beli" = purchasePrice if needed
    };

    addToCart(cartItem, quantity, purchasePrice);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setActiveProduct(null);
    setEditSatuans([]);
  };

  return (
    <div className="p-4">
      {/* Search & Toggle View */}
      <div className="mb-3 flex items-center space-x-3 ">
        <input
          type="text"
          placeholder="Cari produk..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-5/6 rounded-md border border-gray-300 
                     px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 
                     dark:border-gray-600 dark:bg-gray-700 dark:text-white 
                     dark:focus:ring-blue-500"
        />
        <button
          onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
          className="flex w-1/6 items-center justify-center 
                     rounded-md border border-stroke bg-white px-3 py-1 text-sm 
                     hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark 
                     dark:text-white dark:hover:bg-strokedark"
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
            ? "grid  grid-cols-2 gap-4 overflow-y-auto md:grid-cols-3 lg:grid-cols-4 "
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
                className={`
                  rounded-md border border-stroke p-3 shadow-sm 
                  transition-shadow hover:shadow-lg dark:border-strokedark dark:bg-boxdark
                  ${
                    viewMode === "grid"
                      ? "flex flex-col items-center space-y-2 text-center"
                      : "flex w-full flex-row items-center justify-between space-x-4"
                  }`}
              >
                {/* Gambar Produk */}
                <Image
                  src={product.image}
                  alt={product.nama_produk}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-md object-contain"
                />

                {/* Info Produk */}
                <div className="flex-1">
                  <p className="font-medium text-black dark:text-white">
                    {product.nama_produk}
                  </p>
                  {product.satuans && product.satuans.length > 0 ? (
                    <p className="text-sm text-gray-500">
                      Rp{firstPrice.toLocaleString()}
                    </p>
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
                  className={`ml-auto rounded-md bg-blue-500 px-3 py-1 text-sm font-semibold  text-white hover:bg-blue-600
                    ${viewMode === "grid" ? "w-full" : ""}
                   `}
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
          className="fixed inset-0 z-50 flex items-center justify-center 
                     bg-black bg-opacity-50 transition-opacity"
          onClick={handleCloseModal}
        >
          <div
            className="relative max-h-[80vh] w-full max-w-md overflow-y-auto 
                       rounded-lg bg-white p-6 shadow-lg
                       dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseModal}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 
                         dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>

            <h2 className="mb-4 text-lg font-semibold dark:text-white">
              Tambah ke Pembelian
            </h2>
            <p className="mb-3 text-sm text-gray-700 dark:text-gray-200">
              {activeProduct.nama_produk}
            </p>

            {/* Form */}
            <div className="grid gap-4">
              {/* HARGA BELI */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Harga Beli /1 unit
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
                  value={purchasePrice}
                  onChange={(e) =>
                    handlePurchasePriceChange(Number(e.target.value))
                  }
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>

              {/* TOTAL BELI */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Total Beli
                </label>
                <input
                  type="text"
                  readOnly
                  className="w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
                  value={`Rp ${(purchasePrice * quantity).toLocaleString()}`}
                />
              </div>
            </div>

            {/* DAFTAR SEMUA SATUAN (Harga Jual & Persentase Profit) */}
            <div className="mt-4 border-t pt-3">
              <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                Set Harga Jual & Profit
              </p>
              {editSatuans.map((ed, idx) => {
                return (
                  <div
                    key={ed._id}
                    className="mb-2 flex flex-wrap items-center space-x-2"
                  >
                    <label className="w-24 text-sm font-medium text-gray-700 dark:text-gray-200">
                      {ed.namaSatuan}
                    </label>

                    {/* hargaJual input */}
                    <input
                      type="number"
                      className="w-24 rounded border p-1 dark:bg-gray-800 dark:text-white"
                      value={ed.hargaJual}
                      onChange={(e) =>
                        handleHargaJualChange(idx, Number(e.target.value))
                      }
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      / {ed.konversi} unit
                    </span>

                    {/* profitPercent input */}
                    <input
                      type="number"
                      className="w-20 rounded border p-1 dark:bg-gray-800 dark:text-white"
                      value={ed.profitPercent}
                      onChange={(e) =>
                        handleProfitPercentChange(idx, Number(e.target.value))
                      }
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      %
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="rounded bg-gray-300 px-4 py-2 text-sm hover:bg-gray-400 dark:text-black"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAdd}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white 
                           hover:bg-blue-700"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
