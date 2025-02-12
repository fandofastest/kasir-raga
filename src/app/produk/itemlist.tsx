"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import DropdownAction from "./dropwdownaction";
import ProductFormModal from "@/components/ProductForm";
import { fetchProducts } from "@/lib/dataService";

const TableTwo = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProducts().then((res) => {
      setProducts(res.data);
      setFilteredProducts(res.data);
    });
  }, []);

  const handleSearch = (e: any) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = products.filter((p) =>
      p.nama_produk?.toLowerCase().includes(query),
    );

    setFilteredProducts(filtered);
    console.log("====================================");
    console.log(filtered.length);
    console.log("====================================");
  };

  const handleOpenModal = (product = null) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
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

      {filteredProducts.map((product) => (
        <div
          className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
          key={product._id}
        >
          <div className="col-span-3 flex items-center">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-20 w-30 rounded-md">
                <Image
                  src={product.image ?? "/images/product/product-01.png"}
                  width={100}
                  height={100}
                  alt="Product"
                />
              </div>
              <p className="text-sm text-black dark:text-white">
                {product.nama_produk ?? "N/A"}
              </p>
            </div>
          </div>
          <div className="col-span-1 hidden items-center sm:flex">
            <p className="text-sm text-black dark:text-white">
              {product.kategori ? product.kategori.nama : "N/A"}
            </p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">
              {product.harga ?? "N/A"}
            </p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">
              {product.jumlah}
            </p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-meta-3">{product.supplier}</p>
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
      ))}

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
