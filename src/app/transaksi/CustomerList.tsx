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
        setCustomers([
          { id: 0, nama: "Bukan Member", nohp: "", alamat: "" },
          ...res.data,
        ]);
        setSelectedCustomer({
          id: 0,
          nama: "Bukan Member",
          nohp: "",
          alamat: "",
        });
      });
    }
    loadCustomer();
  }, []);

  return (
    <div className="border-b border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
      <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
        Pilih Pelanggan
      </h3>
      <select
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        value={selectedCustomer?.nama || ""}
        onChange={(e) => {
          const customer = customers.find((c) => c.nama == e.target.value);
          if (customer) {
            setSelectedCustomer(customer);
            console.log("====================================");
            console.log(selectedCustomer);
            console.log("====================================");
          }
        }}
      >
        {customers.map((customer) => (
          <option key={customer.id} value={customer.nama}>
            {customer.nama}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CustomersList;
