"use client";
import { useEffect, useState } from "react";
import DropdownAction from "./dropwdownaction";
import { fetchPelanggan } from "@/lib/dataService";
import PelangganFormModal from "./PelangganForm";

// Definisi interface untuk tipe Pelanggan
interface Pelanggan {
  _id: string;
  nama: string;
  nohp: string;
  alamat: string;
}

const ItemPelanggan = () => {
  const [pelanggan, setPelanggan] = useState<Pelanggan[]>([]);
  const [filteredPelanggan, setFilteredPelanggan] = useState<Pelanggan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPelanggan, setSelectedPelanggan] = useState<Pelanggan | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  // State untuk mengelola pelanggan yang di-expand pada tampilan mobile
  const [expandedPelanggan, setExpandedPelanggan] = useState<string[]>([]);

  useEffect(() => {
    fetchPelanggan().then((res) => {
      setPelanggan(res.data);
      setFilteredPelanggan(res.data);
    });
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = pelanggan.filter((p) =>
      p.nama.toLowerCase().includes(query),
    );
    setFilteredPelanggan(filtered);
  };

  const handleOpenModal = (pelanggan: Pelanggan | null = null) => {
    setSelectedPelanggan(pelanggan);
    setIsModalOpen(true);
  };

  const togglePelanggan = (id: string) => {
    if (expandedPelanggan.includes(id)) {
      setExpandedPelanggan(expandedPelanggan.filter((pid) => pid !== id));
    } else {
      setExpandedPelanggan([...expandedPelanggan, id]);
    }
  };

  // Fungsi hapus untuk mobile (inline)
  const handleDelete = (id: string) => {
    setPelanggan((prev) => prev.filter((item) => item._id !== id));
    setFilteredPelanggan((prev) => prev.filter((item) => item._id !== id));
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Search & Button */}
      <div className="flex flex-col items-center justify-between space-y-4 px-4 py-6 md:flex-row md:space-x-4 md:space-y-0 md:px-6 xl:px-7.5">
        <input
          onChange={handleSearch}
          type="text"
          placeholder="Cari Pelanggan Disini..."
          className="w-full bg-transparent pl-9 pr-4 font-medium outline-1 focus:outline-slate-200 dark:focus:outline-slate-800 xl:w-125"
        />
        <button
          onClick={() => handleOpenModal()}
          className="bg-tosca rounded-md px-4 py-2 text-white"
        >
          Tambah Pelanggan
        </button>
      </div>

      {/* Tampilan Desktop (Table) */}
      <div className="hidden md:block">
        {/* Header Table */}
        <div className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-10 md:px-6 2xl:px-7.5">
          <div className="col-span-3 flex items-center">
            <p className="font-medium">Nama Pelanggan</p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="font-medium">No HP</p>
          </div>
          <div className="col-span-3 flex items-center">
            <p className="font-medium">Alamat</p>
          </div>
          <div className="col-span-1"></div>
        </div>

        {/* Daftar Pelanggan */}
        {filteredPelanggan.length > 0 ? (
          filteredPelanggan.map((p) => (
            <div
              key={p._id}
              className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-10 md:px-6 2xl:px-7.5"
            >
              <div className="col-span-3 flex items-center">
                <p className="text-sm text-black dark:text-white">
                  {p.nama ?? "N/A"}
                </p>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="text-sm text-black dark:text-white">
                  {p.nohp ?? "N/A"}
                </p>
              </div>
              <div className="col-span-3 flex items-center">
                <p className="text-sm text-black dark:text-white">
                  {p.alamat ?? "N/A"}
                </p>
              </div>
              <div className="col-span-1 flex items-center space-x-2">
                <DropdownAction
                  onEditClick={() => handleOpenModal(p)}
                  onDeleteSuccess={() => {
                    setPelanggan((prev) =>
                      prev.filter((item) => item._id !== p._id),
                    );
                    setFilteredPelanggan((prev) =>
                      prev.filter((item) => item._id !== p._id),
                    );
                  }}
                  id={p._id}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-gray-500">
            Tidak ada pelanggan ditemukan.
          </p>
        )}
      </div>

      {/* Tampilan Mobile (Accordion) */}
      <div className="block md:hidden">
        {filteredPelanggan.length > 0 ? (
          filteredPelanggan.map((p) => (
            <div
              key={p._id}
              className="border-t border-stroke px-4 py-4 dark:border-strokedark"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-black dark:text-white">
                  {p.nama ?? "N/A"}
                </p>
                <button
                  onClick={() => togglePelanggan(p._id)}
                  className="text-2xl font-bold"
                >
                  {expandedPelanggan.includes(p._id) ? "−" : "+"}
                </button>
              </div>
              {expandedPelanggan.includes(p._id) && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-black dark:text-white">
                    <span className="font-medium">No HP: </span>
                    {p.nohp ?? "N/A"}
                  </p>
                  <p className="text-sm text-black dark:text-white">
                    <span className="font-medium">Alamat: </span>
                    {p.alamat ?? "N/A"}
                  </p>
                  {/* Menu aksi tampil secara langsung */}
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => handleOpenModal(p)}
                      className="hover:bg-toscadark bg-tosca rounded px-4 py-2 text-sm text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
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
            Tidak ada pelanggan ditemukan.
          </p>
        )}
      </div>

      {/* Modal Form Pelanggan */}
      <PelangganFormModal
        onSubmit={() => {
          fetchPelanggan().then((res) => {
            setPelanggan(res.data);
            setFilteredPelanggan(res.data);
          });
        }}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pelanggan={selectedPelanggan}
      />
    </div>
  );
};

export default ItemPelanggan;
