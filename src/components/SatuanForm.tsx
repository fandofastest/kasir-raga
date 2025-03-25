// -------------------------------------------------------------------
// Komponen: AddSatuanModal

import { addSatuan, deleteSatuan } from "@/lib/dataService";
import { XCircleIcon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

// -------------------------------------------------------------------
interface AddSatuanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatedSatuan: (newSat: { _id: string; nama: string }) => void;
}

export const AddSatuanModal: React.FC<AddSatuanModalProps> = ({
  isOpen,
  onClose,
  onCreatedSatuan,
}) => {
  const [satName, setSatName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!satName.trim()) return;
    try {
      const res = await addSatuan(satName);
      const data = res.data; // { _id, nama } dari server
      onCreatedSatuan(data);
      onClose();
    } catch (error) {
      toast.error("Terjadi kesalahan saat menambah satuan.");
      console.error(error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-lg bg-white p-4 shadow dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-2 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">
            Tambah Satuan
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XCircleIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            type="text"
            placeholder="Nama Satuan"
            value={satName}
            onChange={(e) => setSatName(e.target.value)}
            className="w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Simpan
          </button>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------------
// Komponen: RemoveSatuanModal
// -------------------------------------------------------------------
interface RemoveSatuanModalProps {
  isOpen: boolean;
  onClose: () => void;
  satuanOptions: { _id: string; nama: string }[];
  onDeleteSatuan: (id: string) => void;
}

export const RemoveSatuanModal: React.FC<RemoveSatuanModalProps> = ({
  isOpen,
  onClose,
  satuanOptions,
  onDeleteSatuan,
}) => {
  const [selectedSatuanId, setSelectedSatuanId] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSatuanId) return;
    try {
      await deleteSatuan(selectedSatuanId);
      onDeleteSatuan(selectedSatuanId);
      onClose();
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus satuan.");
      console.error(error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-lg bg-white p-4 shadow dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-2 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">
            Hapus Satuan
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XCircleIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <select
            className="w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
            value={selectedSatuanId}
            onChange={(e) => setSelectedSatuanId(e.target.value)}
          >
            <option value="">--Pilih Satuan--</option>
            {satuanOptions.map((opt) => (
              <option key={opt._id} value={opt._id}>
                {opt.nama}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Hapus
          </button>
        </form>
      </div>
    </div>
  );
};
