"use client";

import { useState, useEffect } from "react";
import { fetchPelanggan } from "@/lib/dataService";
import Customer from "@/models/modeltsx/Costumer";
import PelangganFormModal from "../konsumen/PelangganForm";

interface CustomersListProps {
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer) => void;
}

export default function CustomersList({
  selectedCustomer,
  setSelectedCustomer,
}: CustomersListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showPelangganModal, setShowPelangganModal] = useState(false);

  const loadCustomers = async () => {
    try {
      const res = await fetchPelanggan();
      setCustomers(res.data);
      if (!selectedCustomer && res.data.length > 0) {
        setSelectedCustomer(res.data[0]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <div className="border-b border-stroke bg-white dark:border-strokedark dark:bg-gray-700">
      <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
        Pilih Pelanggan
      </h3>
      <div className="flex items-center justify-between">
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          value={selectedCustomer?._id || ""}
          onChange={(e) => {
            const customer = customers.find((c) => c._id === e.target.value);
            if (customer) {
              setSelectedCustomer(customer);
            }
          }}
        >
          {customers.map((customer) => (
            <option key={customer._id} value={customer._id}>
              {customer.nama}
            </option>
          ))}
        </select>
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
            loadCustomers();
            setShowPelangganModal(false);
          }}
          pelanggan={null} // Untuk menambah pelanggan baru
        />
      )}
    </div>
  );
}
