"use client";

import { useEffect, useState } from "react";
import { Combobox } from "@headlessui/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { signOut } from "next-auth/react";

interface SelectWithCreateProps {
  value: { nama: string } | null;
  onChange: (value: { _id: string; nama: string }) => void;
  unit: "satuan" | "brand" | "kategori";
}

export default function SelectWithCreate({
  value,
  onChange,
  unit,
}: SelectWithCreateProps) {
  const [query, setQuery] = useState(value ? value.nama : "");
  const [items, setItems] = useState<{ _id: string; nama: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL + `/${unit}`;
  const token = localStorage.getItem("mytoken");
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status == 403) {
        alert("Session Expired");
        signOut();
      }

      setItems(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNewItem = async () => {
    if (!query.trim()) return;
    const newItem = { nama: query };
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(newItem),
      });
      const createdItem = await res.json();
      const dataitem = createdItem.data;
      setItems([...items, dataitem]);
      onChange(dataitem);
      setQuery(dataitem.nama);
      // fetchData();
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding new item:", error);
    }
  };

  const deleteItem = async (nama: string) => {
    try {
      await fetch(apiUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nama }),
      });
      setItems(items.filter((item) => item.nama !== nama));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const filteredItems =
    (query || "").trim() === ""
      ? items
      : items.filter((item) =>
          item.nama?.toLowerCase().includes((query || "").toLowerCase()),
        );

  return (
    <div className="relative w-full">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={`Pilih atau tambah ${unit}...`}
        className="w-full bg-white dark:bg-black"
      />
      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto bg-white shadow-lg dark:bg-black">
          {loading && <div className="p-2 text-gray-500">Loading...</div>}
          {Array.isArray(filteredItems) && filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item._id}
                className="flex cursor-pointer items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div
                  onMouseDown={() => {
                    onChange(item);
                    setQuery(item.nama);
                    setIsOpen(false);
                  }}
                >
                  {item.nama}
                </div>
                <button
                  className="ml-2 text-red-500 hover:text-red-700"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    deleteItem(item.nama);
                  }}
                >
                  <XIcon size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="p-2 text-gray-500">Tidak ada data</div>
          )}

          {query &&
            !filteredItems.some(
              (item) => item.nama.toLowerCase() === query.toLowerCase(),
            ) && (
              <Button onMouseDown={addNewItem} className="mt-2 w-full">
                Tambah {query}
              </Button>
            )}
        </div>
      )}
    </div>
  );
}
