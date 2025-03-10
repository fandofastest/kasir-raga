import { fetchPelanggan } from "@/lib/dataService";
import Customer from "@/models/modeltsx/Costumer";
import { useState } from "react";
import { useEffect } from "react";
function CustomersList({
  selectedCustomer,
  setSelectedCustomer,
}: {
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer) => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    async function loadCustomer() {
      await fetchPelanggan().then((res) => {
        console.log(res);
        setCustomers(res.data);
        setSelectedCustomer(res.data[0]);
      });
    }
    loadCustomer();
  });

  return (
    <div className="border-b border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
      <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
        Pilih Pelanggan
      </h3>
      <select
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        value={selectedCustomer?._id || ""}
        onChange={(e) => {
          const customer = customers.find((c) => c._id == e.target.value);
          if (customer) {
            setSelectedCustomer(customer);
            console.log("====================================");
            console.log(selectedCustomer);
            console.log("====================================");
          }
        }}
      >
        {customers.map((customer) => (
          <option key={customer._id} value={customer._id}>
            {customer.nama}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CustomersList;
