"use client";
import { useEffect, useState, useCallback } from "react";
import DropdownAction from "./dropwdownaction";
import { fetchStaff } from "@/lib/dataService";
import { Staff } from "@/models/modeltsx/staffTypes"; // Sesuaikan path sesuai struktur proyek Anda
import StaffFormModal from "./StaffForm";

const ItemStaff = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const getStaff = async () => {
      try {
        const res = await fetchStaff();
        setStaff(res.data);
        setFilteredStaff(res.data);
      } catch (error) {
        console.error("Gagal mengambil data staff:", error);
      }
    };
    getStaff();
  }, []);

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value.toLowerCase();
      setSearchQuery(query);

      const filtered = staff.filter((s) =>
        s.name?.toLowerCase().includes(query),
      );
      setFilteredStaff(filtered);
    },
    [staff],
  );

  const handleOpenModal = (staff: Staff | null = null) => {
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Search & Button */}
      <div className="flex justify-between space-x-4 px-4 py-6 md:px-6 xl:px-7.5">
        <input
          onChange={handleSearch}
          type="text"
          placeholder="Cari Staff Disini..."
          className="w-full bg-transparent pl-9 pr-4 font-medium outline-1 focus:outline-slate-200 dark:focus:outline-slate-800 xl:w-125"
        />
        <button
          onClick={() => handleOpenModal()}
          className="rounded-md bg-blue-500 px-4 py-2 text-white"
        >
          Tambah Staff
        </button>
      </div>

      {/* Header Table */}
      <div className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-10 md:px-6 2xl:px-7.5">
        <div className="col-span-3 flex items-center">
          <p className="font-medium">Nama</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Email</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">No HP</p>
        </div>
        <div className="col-span-2 flex items-center">
          <p className="font-medium">Role</p>
        </div>
      </div>

      {/* Data Staff */}
      {filteredStaff.length > 0 ? (
        filteredStaff.map((staff) => (
          <div
            className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-10 md:px-6 2xl:px-7.5"
            key={staff._id}
          >
            <div className="col-span-3 flex items-center">
              <p className="text-sm text-black dark:text-white">
                {staff.name ?? "N/A"}
              </p>
            </div>
            <div className="col-span-2 flex items-center">
              <p className="text-sm text-black dark:text-white">
                {staff.email ?? "N/A"}
              </p>
            </div>
            <div className="col-span-2 flex items-center">
              <p className="text-sm text-black dark:text-white">
                {staff.nohp ?? "N/A"}
              </p>
            </div>
            <div className="col-span-2 flex items-center">
              <p className="text-sm text-black dark:text-white">
                {staff.role ?? "kasir"}
              </p>
            </div>
            <div className="col-span-1 flex items-center space-x-2">
              <DropdownAction
                onEditClick={() => handleOpenModal(staff)}
                onDeleteSuccess={() => {
                  setStaff((prevStaff) =>
                    prevStaff.filter((s) => s._id !== staff._id),
                  );
                  setFilteredStaff((prevStaff) =>
                    prevStaff.filter((s) => s._id !== staff._id),
                  );
                }}
                staffId={staff._id ?? ""}
              />
            </div>
          </div>
        ))
      ) : (
        <p className="py-4 text-center text-gray-500">
          Tidak ada staff ditemukan.
        </p>
      )}

      {/* Modal Form */}
      <StaffFormModal
        onSubmit={() => {
          fetchStaff().then((res) => {
            setStaff(res.data);
            setFilteredStaff(res.data);
          });
        }}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        staff={selectedStaff}
      />
    </div>
  );
};

export default ItemStaff;
