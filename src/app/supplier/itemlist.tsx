"use client";
import { useEffect, useState, useCallback } from "react";
import DropdownAction from "./dropwdownaction";
import { fetchSupplier } from "@/lib/dataService";
import { Supplier } from "@/models/modeltsx/supplierTypes"; // Sesuaikan path sesuai struktur proyek Anda
import SupplierFormModal from "./SupplierForm";

const ItemSupplier = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  // State untuk mengelola supplier yang di-expand pada tampilan mobile
  const [expandedSupplier, setExpandedSupplier] = useState<string[]>([]);

  useEffect(() => {
    const getSuppliers = async () => {
      try {
        const res = await fetchSupplier();
        setSuppliers(res.data);
        setFilteredSuppliers(res.data);
      } catch (error) {
        console.error("Gagal mengambil data supplier:", error);
      }
    };
    getSuppliers();
  }, []);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value.toLowerCase();
      setSearchQuery(query);

      const filtered = suppliers.filter((s) =>
        s.nama?.toLowerCase().includes(query),
      );
      setFilteredSuppliers(filtered);
    },
    [suppliers],
  );

  const handleOpenModal = (supplier: Supplier | null = null) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const toggleSupplier = (id: string) => {
    if (expandedSupplier.includes(id)) {
      setExpandedSupplier(expandedSupplier.filter((sid) => sid !== id));
    } else {
      setExpandedSupplier([...expandedSupplier, id]);
    }
  };

  // Fungsi hapus supplier
  const handleDelete = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s._id !== id));
    setFilteredSuppliers((prev) => prev.filter((s) => s._id !== id));
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Search & Button */}
      <div className="flex flex-col items-center justify-between space-y-4 px-4 py-6 md:flex-row md:space-x-4 md:space-y-0 md:px-6 xl:px-7.5">
        <input
          onChange={handleSearch}
          type="text"
          placeholder="Cari Supplier Disini..."
          className="w-full bg-transparent pl-9 pr-4 font-medium outline-1 focus:outline-slate-200 dark:focus:outline-slate-800 xl:w-125"
        />
        <button
          onClick={() => handleOpenModal()}
          className="rounded-md bg-blue-500 px-4 py-2 text-white"
        >
          Tambah Supplier
        </button>
      </div>

      {/* Tampilan Desktop (Table) */}
      <div className="hidden md:block">
        {/* Header Table */}
        <div className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-10 md:px-6 2xl:px-7.5">
          <div className="col-span-3 flex items-center">
            <p className="font-medium">Nama</p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="font-medium">Kontak</p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="font-medium">Alamat</p>
          </div>
          <div className="col-span-1"></div>
        </div>

        {/* Data Supplier */}
        {filteredSuppliers.length > 0 ? (
          filteredSuppliers.map((supplier) => (
            <div
              key={supplier._id}
              className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-10 md:px-6 2xl:px-7.5"
            >
              <div className="col-span-3 flex items-center">
                <p className="text-sm text-black dark:text-white">
                  {supplier.nama ?? "N/A"}
                </p>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="text-sm text-black dark:text-white">
                  {supplier.kontak ?? "N/A"}
                </p>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="text-sm text-black dark:text-white">
                  {supplier.alamat ?? "N/A"}
                </p>
              </div>
              <div className="col-span-1 flex items-center space-x-2">
                <DropdownAction
                  onEditClick={() => handleOpenModal(supplier)}
                  onDeleteSuccess={() => handleDelete(supplier._id ?? "")}
                  supplierId={supplier._id ?? ""}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-gray-500">
            Tidak ada supplier ditemukan.
          </p>
        )}
      </div>

      {/* Tampilan Mobile (Accordion) */}
      <div className="block md:hidden">
        {filteredSuppliers.length > 0 ? (
          filteredSuppliers.map((supplier) => (
            <div
              key={supplier._id}
              className="border-t border-stroke px-4 py-4 dark:border-strokedark"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-black dark:text-white">
                  {supplier.nama ?? "N/A"}
                </p>
                <button
                  onClick={() => toggleSupplier(supplier._id ?? "")}
                  className="text-2xl font-bold"
                >
                  {expandedSupplier.includes(supplier._id ?? "") ? "−" : "+"}
                </button>
              </div>
              {expandedSupplier.includes(supplier._id ?? "") && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-black dark:text-white">
                    <span className="font-medium">Kontak: </span>
                    {supplier.kontak ?? "N/A"}
                  </p>
                  <p className="text-sm text-black dark:text-white">
                    <span className="font-medium">Alamat: </span>
                    {supplier.alamat ?? "N/A"}
                  </p>
                  {/* Menu aksi ditampilkan langsung tanpa dropdown */}
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => handleOpenModal(supplier)}
                      className="rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(supplier._id ?? "")}
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
            Tidak ada supplier ditemukan.
          </p>
        )}
      </div>

      {/* Modal Form */}
      <SupplierFormModal
        onSubmit={() => {
          fetchSupplier().then((res) => {
            setSuppliers(res.data);
            setFilteredSuppliers(res.data);
          });
        }}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        supplier={selectedSupplier}
      />
    </div>
  );
};

export default ItemSupplier;
