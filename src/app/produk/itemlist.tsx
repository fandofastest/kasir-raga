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
import * as XLSX from 'xlsx'; // Import xlsx library

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false); // State for export loading
  
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
      
      // Add categories to query params
      if (categories && categories.length > 0) {
        params.append("categories", categories.join(','));
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

  // Update filteredProducts based ONLY on search query and selected categories
  useEffect(() => {
    // When filters change, reset to page 1 and fetch new data
    setPage(1); // Reset page to 1 when filters change
    getProducts(1, searchQuery, selectedCategories); // Fetch page 1 with new filters
    // Note: We no longer filter the 'products' state here.
    // 'getProducts' handles setting 'filteredProducts' correctly for page 1.
  }, [searchQuery, selectedCategories]); // Remove 'products' from dependencies

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

  // Function to handle Excel export - fetches all matching data
  const handleExportExcel = async () => {
    setIsExporting(true); // Start loading state
    try {
      // Prepare parameters to fetch ALL matching products
      const params = new URLSearchParams({
        limit: "-1", // Use a special limit or parameter to indicate fetching all
      });
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      if (selectedCategories && selectedCategories.length > 0) {
        params.append("categories", selectedCategories.join(','));
      }

      // Fetch all products matching the criteria
      const res = await fetchProducts(params);
      const allMatchingProducts = res.data || [];

      if (allMatchingProducts.length === 0) {
         alert("Tidak ada data produk yang cocok untuk diekspor."); // Or use a toast notification
         setIsExporting(false);
         return;
      }

      // Prepare data for Excel sheet
      const dataToExport = allMatchingProducts.map((product: Product) => ({ // Add explicit type : Product
        "Nama Barang": product.nama_produk ?? "N/A",
        "Kategori": product.kategori?.nama ?? "N/A",
        "Harga Modal": product.harga_modal ?? 0,
        "Stok": product.jumlah ?? 0,
        "Supplier": product.supplier?.nama ?? "N/A",
        // Add more fields as needed
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Produk");

      // Format Harga Modal column (optional)
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
          const cell_address = XLSX.utils.encode_cell({c: 2, r: R}); // Column C
          if(worksheet[cell_address]) {
              worksheet[cell_address].t = 'n';
              worksheet[cell_address].z = '#,##0';
          }
      }

      // Trigger download
      XLSX.writeFile(workbook, `Daftar_Produk_${searchQuery ? searchQuery + '_' : ''}${selectedCategories.length > 0 ? 'filtered_' : ''}${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (error) {
      console.error("Gagal mengekspor data produk:", error);
      alert("Terjadi kesalahan saat mengekspor data."); // Or use a toast notification
    } finally {
      setIsExporting(false); // End loading state
    }
  };


  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Search, Filter Kategori & Button */}
      <div className="flex flex-col items-center justify-between space-y-4 px-4 py-6 md:flex-row md:space-x-4 md:space-y-0 md:px-6 xl:px-7.5">
        <input
          onChange={handleSearch}
          type="text"
          placeholder="Cari Barang Disini..."
          className="w-full bg-transparent pl-9 pr-4 font-medium outline-1 focus:outline-slate-200 dark:focus:outline-slate-800 xl:w-125"
        />
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-black dark:text-white">Kategori</label> {/* Added dark:text-white to label */}
          <Select
            // classNamePrefix="react-select" // classNamePrefix is less flexible with Tailwind
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
            // Use classNames prop for Tailwind styling
            classNames={{
              control: (state) => `
                mt-1 border border-stroke dark:border-strokedark rounded-md shadow-sm 
                bg-white dark:bg-form-input 
                ${state.isFocused ? 'border-primary dark:border-primary ring-1 ring-primary' : ''}
              `,
              valueContainer: () => 'p-1 gap-1',
              input: () => 'text-black dark:text-white',
              placeholder: () => 'text-gray-500 dark:text-gray-400',
              menu: () => 'mt-1 p-1 border border-stroke dark:border-strokedark bg-white dark:bg-boxdark rounded-md shadow-lg',
              option: (state) => `
                p-2 rounded-md 
                ${state.isFocused ? 'bg-gray-100 dark:bg-gray-700' : ''} 
                ${state.isSelected ? 'bg-primary text-white dark:bg-primary dark:text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-600'}
                text-black dark:text-white
              `,
              multiValue: () => 'bg-gray-100 dark:bg-gray-700 rounded items-center py-0.5 pl-2 pr-1 gap-1.5',
              multiValueLabel: () => 'text-sm text-black dark:text-white',
              multiValueRemove: () => 'border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-800 text-gray-500 dark:text-gray-300 hover:text-red-800 dark:hover:text-red-300 rounded-md',
              indicatorsContainer: () => 'p-1 gap-1',
              clearIndicator: () => 'text-gray-500 dark:text-gray-400 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-800',
              indicatorSeparator: () => 'bg-gray-300 dark:bg-gray-700',
              dropdownIndicator: () => 'p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md',
              noOptionsMessage: () => 'text-gray-500 dark:text-gray-400 p-2',
            }}
            // Remove className="mt-1" as margin is handled in control class
          />
        </div>
        <div className="flex space-x-2"> {/* Wrap buttons */}
          <button
            onClick={handleExportExcel} // Add onClick handler
            className={`rounded-md px-4 py-2 text-white ${
              isExporting ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
            disabled={isExporting} // Disable while exporting
          >
            {isExporting ? 'Mengekspor...' : 'Export Excel'}
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="rounded-md bg-tosca px-4 py-2 text-white hover:bg-toscadark"
            disabled={isExporting} // Optionally disable add button during export
          >
            Tambah Produk
          </button>
        </div>
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
                <p className="text-sm text-black dark:text-white">
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
