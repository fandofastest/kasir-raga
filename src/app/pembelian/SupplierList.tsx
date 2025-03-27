"use client";
import Select from "react-select";

import { useState, useEffect } from "react";
import { fetchSupplier } from "@/lib/dataService"; // sesuaikan endpoint real
import { Supplier } from "@/models/modeltsx/supplierTypes";
import SupplierFormModal from "../supplier/SupplierForm";
import supplier from "@/models/supplier";
interface OptionType {
  value: string;
  label: string;
  supplier: Supplier;
}

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
  const options: OptionType[] = suppliers.map((supplier) => ({
    value: supplier._id as string,
    label: supplier.nama,
    supplier,
  }));
  const selectedOption = selectedSupplier
    ? {
        value: selectedSupplier._id as string,
        label: selectedSupplier.nama,
        supplier: selectedSupplier,
      }
    : null;
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

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: "var(--rs-bg)",
      borderColor: "var(--rs-border)",
      color: "var(--rs-text)",
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: "var(--rs-text)",
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: "var(--rs-bg)",
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? "var(--rs-option-hover)"
        : "var(--rs-option-bg)",
      color: "var(--rs-text)",
    }),
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  return (
    <>
      <style jsx global>{`
        :root {
          --rs-bg: white;
          --rs-text: black;
          --rs-border: #e2e8f0;
          --rs-option-bg: white;
          --rs-option-hover: #e2e8f0;
        }
        .dark {
          --rs-bg: #1f2937; /* Tailwind: bg-gray-800 */
          --rs-text: white;
          --rs-border: #374151; /* Tailwind: border-gray-700 */
          --rs-option-bg: #1f2937;
          --rs-option-hover: #374151;
        }
      `}</style>
      <div>
        <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
          Pilih Supplier
        </h3>
        <div className="flex w-full items-center   ">
          <Select
            className="flex-1"
            classNamePrefix="react-select"
            options={options}
            value={selectedOption}
            onChange={(option) => {
              setSelectedSupplier(option?.supplier as Supplier);
            }}
            placeholder="Cari pelanggan..."
            isClearable
            styles={customStyles}
          />
          {/* <select
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
          </select> */}
          <button
            type="button"
            onClick={() => setShowSupplierModal(true)}
            className="bg-tosca hover:bg-toscadark-600 ml-2 rounded px-3 py-2 text-sm text-white"
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
    </>
  );
}
