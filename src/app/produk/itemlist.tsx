"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import DropdownAction from "./dropwdownaction";
import ProductFormModal from "@/components/ProductForm";
import { fetchProducts, fetchKategori } from "@/lib/dataService";
import { Product } from "@/models/modeltsx/productTypes";
import { formatRupiah } from "@/components/tools";
import ProductImage from "@/components/ImageView";
import Select from "react-select";

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<string[]>([]);
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState<any>(null);

  // Modified fetch products function
  const getProducts = async (pageNum = 1, search = "", categories: string[] = []) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
      });
      
      if (search) {
        params.append("search", search);
      }
      
      const res = await fetchProducts(params);
      
      if (pageNum === 1) {
        setProducts(res.data || []);
        setFilteredProducts(res.data || []);
      } else {
        setProducts(prev => [...prev, ...(res.data || [])]);
        setFilteredProducts(prev => [...prev, ...(res.data || [])]);
      }
      
      setPagination(res.pagination);
      setHasMore(res.pagination?.page < res.pagination?.totalPages);
      setLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data produk:", error);
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    setPage(1);
    getProducts(1, searchQuery, selectedCategories);
  }, []);

  // Handle search and category filter with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      getProducts(1, searchQuery, selectedCategories);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategories]);

  // Infinite scroll handler
  const handleScroll = () => {
    if (loading || !hasMore) return;
    
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      setPage(prev => prev + 1);
      getProducts(page + 1, searchQuery, selectedCategories);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, page, searchQuery, selectedCategories]);

  // Add loading indicator at the bottom of both desktop and mobile views
  useEffect(() => {
    const getCategories = async () => {
      try {
        const res = await fetchKategori();
        setCategories(res.data);
      } catch (error) {
        console.error("Gagal mengambil data kategori:", error);
      }
    };
    getCategories();
  }, []);

  // Siapkan opsi untuk react-select dari data kategori
  const categoryOptions = categories.map((cat: any) => ({
    value: cat._id,
    label: cat.nama,
  }));

  // Update filteredProducts berdasarkan search query dan kategori yang terpilih
  useEffect(() => {
    const filtered = products.filter((p) => {
      const matchesSearch = p.nama_produk?.toLowerCase().includes(searchQuery);
      const matchesCategory =
        selectedCategories.length === 0 ||
        (p.kategori && selectedCategories.includes(p.kategori._id));
      return matchesSearch && matchesCategory;
    });
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategories, products]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const handleOpenModal = (product: Product | null = null) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const toggleProduct = (id: string) => {
    if (expandedProducts.includes(id)) {
      setExpandedProducts(expandedProducts.filter((pid) => pid !== id));
    } else {
      setExpandedProducts([...expandedProducts, id]);
    }
  };

  // Fungsi hapus produk
  const handleDelete = (id: string) => {
    setProducts((prevProducts) =>
      prevProducts.filter((prod) => prod._id !== id),
    );
    setFilteredProducts((prevProducts) =>
      prevProducts.filter((prod) => prod._id !== id),
    );
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Search, Filter Kategori & Button */}
      <div className="flex flex-col items-center justify-between space-x-0 space-y-4 px-4 py-6 md:flex-row md:space-x-4 md:space-y-0 md:px-6 xl:px-7.5">
        <input
          onChange={handleSearch}
          type="text"
          placeholder="Cari Barang Disini..."
          className="w-full bg-transparent pl-9 pr-4 font-medium outline-1 focus:outline-slate-200 dark:focus:outline-slate-800 xl:w-125"
        />
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium">Kategori</label>
          <Select
            classNamePrefix="react-select"
            isMulti
            options={categoryOptions}
            value={categoryOptions.filter((option) =>
              selectedCategories.includes(option.value),
            )}
            onChange={(selectedOptions) => {
              setSelectedCategories(
                selectedOptions
                  ? selectedOptions.map((option: any) => option.value)
                  : [],
              );
            }}
            className="mt-1"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="rounded-md bg-tosca px-4 py-2 text-white hover:bg-toscadark"
        >
          Tambah Produk
        </button>
      </div>

      {/* Tampilan Desktop (Table) */}
      <div className="hidden md:block">
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
          <div className="col-span-1"></div>
        </div>

        {/* Data Produk */}
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div
              key={product._id}
              className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
            >
              <div className="col-span-3 flex items-center">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative h-[100px] w-[100px] rounded-md border border-gray-300">
                    <ProductImage product={product} />
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
                  {formatRupiah(product.harga_modal ?? 0)}
                </p>
              </div>
              <div className="col-span-1 flex items-center">
                <p className="text-sm text-black dark:text-white">
                  {product.jumlah}
                </p>
              </div>
              <div className="col-span-1 flex items-center">
                <p className="text-sm text-meta-3">
                  {product.supplier ? product.supplier.nama : "N/A"}
                </p>
              </div>
              <div className="col-span-1 flex items-center space-x-2">
                <DropdownAction
                  onEditClick={() => handleOpenModal(product)}
                  onDeleteSuccess={() => {
                    handleDelete(product._id);
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
      </div>

      {/* Tampilan Mobile (Accordion) */}
      <div className="block md:hidden">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div
              key={product._id}
              className="border-t border-stroke px-4 py-4 dark:border-strokedark"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-md border border-gray-300">
                    <ProductImage product={product} />
                  </div>
                  <p className="font-medium text-black dark:text-white">
                    {product.nama_produk ?? "N/A"}
                  </p>
                </div>
                <button
                  onClick={() => toggleProduct(product._id)}
                  className="text-2xl font-bold"
                >
                  {expandedProducts.includes(product._id) ? "−" : "+"}
                </button>
              </div>
              {expandedProducts.includes(product._id) && (
                <div className="mt-2">
                  <p className="text-sm text-black dark:text-white">
                    <span className="font-medium">Kategori: </span>
                    {product.kategori?.nama ?? "N/A"}
                  </p>
                  <p className="text-sm text-black dark:text-white">
                    <span className="font-medium">Harga: </span>
                    {product.harga_modal
                      ? product.harga_modal.toLocaleString("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        })
                      : "N/A"}
                  </p>
                  <p className="text-sm text-black dark:text-white">
                    <span className="font-medium">Stok: </span>
                    {product.jumlah}
                  </p>
                  <p className="text-sm text-black dark:text-white">
                    <span className="font-medium">Supplier: </span>
                    {product.supplier ?? "N/A"}
                  </p>
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="rounded bg-tosca px-4 py-2 text-sm text-white hover:bg-toscadark"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="rounded bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-gray-500">
            Tidak ada produk ditemukan.
          </p>
        )}
      </div>

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

export default ProductList;
