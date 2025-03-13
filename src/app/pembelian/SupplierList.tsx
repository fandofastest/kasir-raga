"use client";

import { useState, useEffect } from "react";
import { fetchSupplier } from "@/lib/dataService"; // sesuaikan endpoint real
import { Supplier } from "@/models/modeltsx/supplierTypes";
import SupplierFormModal from "../supplier/SupplierForm";

interface SupplierListProps {
  selectedSupplier: Supplier | null;
  setSelectedSupplier: (supplier: Supplier) => void;
}

export default function SupplierList({
  selectedSupplier,
  setSelectedSupplier,
}: SupplierListProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  const loadSuppliers = async () => {
    try {
      const res = await fetchSupplier();
      // Pastikan res.data adalah array of Supplier
      setSuppliers(res.data);
      // Jika belum ada supplier yang dipilih, set default ke supplier pertama
      if (!selectedSupplier && res.data.length > 0) {
        setSelectedSupplier(res.data[0]);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  return (
    <div>
      <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
        Pilih Supplier
      </h3>
      <div className="flex items-center justify-between">
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          value={selectedSupplier?.nama || ""}
          onChange={(e) => {
            const sup = suppliers.find((s) => s.nama === e.target.value);
            if (sup) {
              setSelectedSupplier(sup);
            }
          }}
        >
          {suppliers.map((sup) => (
            <option key={sup._id} value={sup.nama}>
              {sup.nama}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowSupplierModal(true)}
          className="ml-2 rounded bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600"
        >
          +
        </button>
      </div>

      {showSupplierModal && (
        <SupplierFormModal
          isOpen={showSupplierModal}
          onClose={() => setShowSupplierModal(false)}
          onSubmit={() => {
            // Setelah supplier ditambahkan, refresh data supplier
            loadSuppliers();
          }}
          supplier={null} // Karena ini untuk menambah supplier baru
        />
      )}
    </div>
  );
}
