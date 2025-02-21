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

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex justify-between space-x-4 px-4 py-6 md:px-6 xl:px-7.5">
        <input
          onChange={handleSearch}
          type="text"
          placeholder="Cari Pelanggan Disini..."
          className="w-full bg-transparent pl-9 pr-4 font-medium outline-1 focus:outline-slate-200 dark:focus:outline-slate-800 xl:w-125"
        />
        <button
          onClick={() => handleOpenModal()}
          className="rounded-md bg-blue-500 px-4 py-2 text-white"
        >
          Tambah Pelanggan
        </button>
      </div>

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
      </div>

      {/* Daftar Pelanggan */}
      {filteredPelanggan.map((pelanggan) => (
        <div
          className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-10 md:px-6 2xl:px-7.5"
          key={pelanggan._id}
        >
          <div className="col-span-3 flex items-center">
            <p className="text-sm text-black dark:text-white">
              {pelanggan.nama ?? "N/A"}
            </p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="text-sm text-black dark:text-white">
              {pelanggan.nohp ?? "N/A"}
            </p>
          </div>
          <div className="col-span-3 flex items-center">
            <p className="text-sm text-black dark:text-white">
              {pelanggan.alamat ?? "N/A"}
            </p>
          </div>
          <div className="col-span-1 flex items-center space-x-2">
            <DropdownAction
              onEditClick={() => handleOpenModal(pelanggan)}
              onDeleteSuccess={() => {
                setPelanggan((prevPelanggan) =>
                  prevPelanggan.filter((p) => p._id !== pelanggan._id),
                );
                setFilteredPelanggan((prevPelanggan) =>
                  prevPelanggan.filter((p) => p._id !== pelanggan._id),
                );
              }}
              id={pelanggan._id}
            />
          </div>
        </div>
      ))}

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
