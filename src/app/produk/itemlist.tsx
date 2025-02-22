"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import DropdownAction from "./dropwdownaction";
import ProductFormModal from "@/components/ProductForm";
import { fetchProducts } from "@/lib/dataService";
import { Product } from "@/models/modeltsx/productTypes";

const TableTwo = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const getProducts = async () => {
      try {
        const res = await fetchProducts();
        setProducts(res.data);
        setFilteredProducts(res.data);
      } catch (error) {
        console.error("Gagal mengambil data produk:", error);
      }
    };
    getProducts();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = products.filter((p) =>
      p.nama_produk?.toLowerCase().includes(query),
    );

    setFilteredProducts(filtered);
  };

  const handleOpenModal = (product: Product | null = null) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Search & Button */}
      <div className="flex justify-between space-x-4 px-4 py-6 md:px-6 xl:px-7.5">
        <input
          onChange={handleSearch}
          type="text"
          placeholder="Cari Barang Disini..."
          className="w-full bg-transparent pl-9 pr-4 font-medium outline-1 focus:outline-slate-200 dark:focus:outline-slate-800 xl:w-125"
        />
        <button
          onClick={() => handleOpenModal()}
          className="rounded-md bg-blue-500 px-4 py-2 text-white"
        >
          Tambah Produk
        </button>
      </div>

      {/* Header Table */}
      <div className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
        <div className="col-span-3 flex items-center">
          <p className="font-medium">Nama Barang</p>
        </div>
        <div className="col-span-1 hidden items-center sm:flex">
          <p className="font-medium">Kategori</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Harga</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Stok</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Supplier</p>
        </div>
      </div>

      {/* Data Produk */}
      {filteredProducts.length > 0 ? (
        filteredProducts.map((product) => (
          <div
            className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
            key={product._id}
          >
            <div className="col-span-3 flex items-center">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="rounded-md object-contain">
                  <Image
                    src={product.image ?? "/images/product/product-01.png"}
                    width={100}
                    height={100}
                    alt="Product"
                    className="h-30 w-30 rounded-md object-contain"
                  />
                </div>
                <p className="text-sm text-black dark:text-white">
                  {product.nama_produk ?? "N/A"}
                </p>
              </div>
            </div>
            <div className="col-span-1 hidden items-center sm:flex">
              <p className="text-sm text-black dark:text-white">
                {product.kategori?.nama ?? "N/A"}
              </p>
            </div>
            <div className="col-span-1 flex items-center">
              <p className="text-sm text-black dark:text-white">
                {product.harga
                  ? product.harga.toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    })
                  : "N/A"}
              </p>
            </div>
            <div className="col-span-1 flex items-center">
              <p className="text-sm text-black dark:text-white">
                {product.jumlah}
              </p>
            </div>
            <div className="col-span-1 flex items-center">
              <p className="text-sm text-meta-3">{product.supplier ?? "N/A"}</p>
            </div>
            <div className="col-span-1 flex items-center space-x-2">
              <DropdownAction
                onEditClick={() => handleOpenModal(product)}
                onDeleteSuccess={() => {
                  setProducts((prevProducts) =>
                    prevProducts.filter((prod) => prod._id !== product._id),
                  );
                  setFilteredProducts((prevProducts) =>
                    prevProducts.filter((prod) => prod._id !== product._id),
                  );
                }}
                productId={product._id}
              />
            </div>
          </div>
        ))
      ) : (
        <p className="py-4 text-center text-gray-500">
          Tidak ada produk ditemukan.
        </p>
      )}

      {/* Modal Form */}
      <ProductFormModal
        onSubmit={() => {
          fetchProducts().then((res) => {
            setProducts(res.data);
            setFilteredProducts(res.data);
          });
        }}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
};

export default TableTwo;
