"use client";

import { useState, useEffect } from "react";
import { fetchSupplier } from "@/lib/dataService"; // ganti sesuai endpoint real
import { Supplier } from "@/models/modeltsx/supplierTypes";

function SupplierList({
  selectedSupplier,
  setSelectedSupplier,
}: {
  selectedSupplier: Supplier | null;
  setSelectedSupplier: (supplier: Supplier) => void;
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const res = await fetchSupplier();
        // Contoh: pastikan res.data adalah array of Supplier
        // Tambahkan opsi default misal "Tanpa Supplier" (ID = 0)

        setSuppliers(res.data);

        // Set default selectedSupplier jadi "Tanpa Supplier"
        setSelectedSupplier(res.data[0]);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    }
    loadSuppliers();
  }, [setSelectedSupplier]);

  return (
    <div className="border-b border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
      <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
        Pilih Supplier
      </h3>
      <select
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
                   dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        value={selectedSupplier?.nama || ""}
        onChange={(e) => {
          const sup = suppliers.find((s) => s.nama === e.target.value);
          if (sup) {
            setSelectedSupplier(sup);
            console.log("Selected supplier:", sup);
          }
        }}
      >
        {suppliers.map((sup) => (
          <option key={sup._id} value={sup.nama}>
            {sup.nama}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SupplierList;
