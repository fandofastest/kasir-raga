"use client";

import { fetchPelanggan } from "@/lib/dataService";
import Customer from "@/models/modeltsx/Costumer";
import { useState, useEffect } from "react";
import PelangganFormModal from "../konsumen/PelangganForm";
import Select from "react-select";

interface OptionType {
  value: string;
  label: string;
  customer: Customer;
}

function CustomersList({
  selectedCustomer,
  setSelectedCustomer,
}: {
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showPelangganModal, setShowPelangganModal] = useState(false);

  async function loadCustomer() {
    try {
      const res = await fetchPelanggan();
      console.log(res);
      setCustomers(res.data);
      if (!selectedCustomer && res.data.length > 0) {
        setSelectedCustomer(res.data[0]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  }

  useEffect(() => {
    loadCustomer();
  }, []);

  const options: OptionType[] = customers.map((customer) => ({
    value: customer._id as string,
    label: customer.nama,
    customer,
  }));

  const selectedOption = selectedCustomer
    ? {
        value: selectedCustomer._id as string,
        label: selectedCustomer.nama,
        customer: selectedCustomer,
      }
    : null;
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
          Pilih Pelanggan
        </h3>
        <div className="flex items-center">
          <Select
            className="flex-1"
            classNamePrefix="react-select"
            options={options}
            value={selectedOption}
            onChange={(option) => {
              if (option) {
                setSelectedCustomer(option.customer);
              } else {
                setSelectedCustomer(null);
              }
            }}
            placeholder="Cari pelanggan..."
            isClearable
            styles={customStyles}
          />
          <button
            type="button"
            onClick={() => setShowPelangganModal(true)}
            className="ml-2 rounded bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600"
          >
            +
          </button>
        </div>

        {showPelangganModal && (
          <PelangganFormModal
            isOpen={showPelangganModal}
            onClose={() => setShowPelangganModal(false)}
            onSubmit={() => {
              loadCustomer();
              setShowPelangganModal(false);
            }}
            pelanggan={null}
          />
        )}
      </div>
    </>
  );
}

export default CustomersList;
