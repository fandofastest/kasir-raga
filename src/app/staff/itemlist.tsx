"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchStaff } from "@/lib/dataService";
import { Staff } from "@/models/modeltsx/staffTypes";
import StaffFormModal from "./StaffForm";
import DropdownAction from "./dropwdownaction";
import PermissionFormModal from "./PermissionFormModal";

const ItemStaff = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // State untuk mengelola staff yang di-expand pada tampilan mobile
  const [expandedStaff, setExpandedStaff] = useState<string[]>([]);
  const router = useRouter();

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

  const handleOpenPermissionModal = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsPermissionModalOpen(true);
  };

  // Fungsi untuk hapus staff
  const handleDelete = (id: string) => {
    setStaff((prevStaff) => prevStaff.filter((item) => item._id !== id));
    setFilteredStaff((prevStaff) =>
      prevStaff.filter((item) => item._id !== id),
    );
  };

  const toggleStaff = (id: string) => {
    if (expandedStaff.includes(id)) {
      setExpandedStaff(expandedStaff.filter((sid) => sid !== id));
    } else {
      setExpandedStaff([...expandedStaff, id]);
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Search & Button */}
      <div className="flex flex-col items-center justify-between space-y-4 px-4 py-6 md:flex-row md:space-x-4 md:space-y-0 md:px-6 xl:px-7.5">
        <input
          onChange={handleSearch}
          type="text"
          placeholder="Cari Staff Disini..."
          className="w-full bg-transparent pl-9 pr-4 font-medium outline-1 focus:outline-slate-200 dark:focus:outline-slate-800 xl:w-125"
        />
        <button
          onClick={() => handleOpenModal()}
          className="bg-tosca rounded-md px-4 py-2 text-white"
        >
          Tambah Staff
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
            <p className="font-medium">Email</p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="font-medium">No HP</p>
          </div>
          <div className="col-span-2 flex items-center">
            <p className="font-medium">Role</p>
          </div>
          <div className="col-span-1"></div>
        </div>
        {/* Data Staff */}
        {filteredStaff.length > 0 ? (
          filteredStaff.map((s) => (
            <div
              key={s._id}
              className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-10 md:px-6 2xl:px-7.5"
            >
              <div className="col-span-3 flex items-center">
                <p className="text-sm text-black dark:text-white">
                  {s.name ?? "N/A"}
                </p>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="text-sm text-black dark:text-white">
                  {s.email ?? "N/A"}
                </p>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="text-sm text-black dark:text-white">
                  {s.nohp ?? "N/A"}
                </p>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="text-sm text-black dark:text-white">
                  {s.role ?? "kasir"}
                </p>
              </div>
              <div className="col-span-1 flex items-center space-x-2">
                <DropdownAction
                  onEditClick={() => handleOpenModal(s)}
                  onDeleteSuccess={() => {
                    handleDelete(s._id ?? "");
                  }}
                  onPermissionClick={() => handleOpenPermissionModal(s)}
                  staffId={s._id ?? ""}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-gray-500">
            Tidak ada staff ditemukan.
          </p>
        )}
      </div>

      {/* Tampilan Mobile (Accordion) */}
      <div className="block md:hidden">
        {filteredStaff.length > 0 ? (
          filteredStaff.map((s) => (
            <div
              key={s._id}
              className="border-t border-stroke px-4 py-4 dark:border-strokedark"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-black dark:text-white">
                  {s.name ?? "N/A"}
                </p>
                <button
                  onClick={() => toggleStaff(s._id ?? "")}
                  className="text-2xl font-bold"
                >
                  {expandedStaff.includes(s._id ?? "") ? "−" : "+"}
                </button>
              </div>
              {expandedStaff.includes(s._id ?? "") && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-black dark:text-white">
                    <span className="font-medium">Email: </span>
                    {s.email ?? "N/A"}
                  </p>
                  <p className="text-sm text-black dark:text-white">
                    <span className="font-medium">No HP: </span>
                    {s.nohp ?? "N/A"}
                  </p>
                  <p className="text-sm text-black dark:text-white">
                    <span className="font-medium">Role: </span>
                    {s.role ?? "kasir"}
                  </p>
                  {/* Menu aksi tampil secara langsung */}
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => handleOpenModal(s)}
                      className="hover:bg-toscadark bg-tosca rounded px-4 py-2 text-sm text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleOpenPermissionModal(s)}
                      className="bg-tosca hover:bg-toscadark-600 rounded px-4 py-2 text-sm text-white"
                    >
                      Permission
                    </button>
                    <button
                      onClick={() => handleDelete(s._id ?? "")}
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
            Tidak ada staff ditemukan.
          </p>
        )}
      </div>

      {/* Modal Form Staff */}
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

      {/* Modal Ubah Permission */}
      {selectedStaff && (
        <PermissionFormModal
          isOpen={isPermissionModalOpen}
          onClose={() => setIsPermissionModalOpen(false)}
          staffId={selectedStaff._id ?? ""}
          initialPermissions={selectedStaff.permissions ?? []}
          onPermissionUpdated={() => {
            fetchStaff().then((res) => {
              setStaff(res.data);
              setFilteredStaff(res.data);
            });
          }}
        />
      )}
    </div>
  );
};

export default ItemStaff;
