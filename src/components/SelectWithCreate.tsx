"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

// Komponen UI (shadcn atau sejenisnya)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Ikon dari lucide-react
import { SearchIcon, XIcon } from "lucide-react";

interface ItemData {
  _id: string;
  nama: string;
}

interface SelectWithDialogProps {
  value: ItemData | null;
  onChange: (value: ItemData) => void;
  unit: "satuan" | "brand" | "kategori";
}

export default function SelectWithDialog({
  value,
  onChange,
  unit,
}: SelectWithDialogProps) {
  // ===== STATE UTAMA =====
  // Item terpilih untuk <select>
  const [selectedItem, setSelectedItem] = useState<ItemData | null>(value);

  // Daftar item dari server
  const [items, setItems] = useState<ItemData[]>([]);
  // Loading fetch
  const [loading, setLoading] = useState(false);

  // ===== STATE UNTUK MODAL PENCARIAN =====
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  // Input pencarian / nama item baru
  const [query, setQuery] = useState("");

  // ===== STATE UNTUK MODAL EDIT =====
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // Menyimpan data item yang sedang di-edit
  const [editItem, setEditItem] = useState<ItemData>({ _id: "", nama: "" });

  // Ambil token (kalau di Next, perhatikan environment client)
  const token =
    typeof window !== "undefined" ? localStorage.getItem("mytoken") : null;

  // URL Endpoint
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/${unit}`
    : `/${unit}`;

  // ===== FETCH DATA =====
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        alert("Session Expired");
        signOut();
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      }
      console.log("====================================");
      console.log(apiUrl);
      console.log("====================================");
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ===== HANDLE SELECT DI <select> =====
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const found = items.find((item) => item._id === selectedId);
    if (found) {
      setSelectedItem(found);
      onChange(found);
    } else {
      setSelectedItem(null);
      onChange({ _id: "", nama: "" });
    }
  };

  // ===== MODAL PENCARIAN =====
  // Filter item
  const filteredItems = items.filter((i) =>
    i.nama.toLowerCase().includes(query.toLowerCase()),
  );

  // Pilih item -> update <select>, tutup modal
  const handleSelectItem = (item: ItemData) => {
    setSelectedItem(item);
    onChange(item);
    setIsSearchModalOpen(false);
  };

  // Tambah item baru
  const addNewItem = async () => {
    if (!query.trim()) return;
    const newItem = { nama: query };

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newItem),
      });
      const json = await res.json();
      const created = json?.data;
      if (created) {
        setItems((prev) => [...prev, created]);
        // Langsung pilih item yang baru
        setSelectedItem(created);
        onChange(created);
        // Tutup modal
        setQuery("");
        setIsSearchModalOpen(false);
      }
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  // Hapus item

  const deleteItem = async (nama: string) => {
    try {
      const res = await fetch(apiUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nama }),
      });
      setItems(items.filter((item) => item.nama !== nama));
      const data = await res.json();

      console.log("====================================");
      console.log(data);
      console.log("====================================");
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  // Update item (PUT request)
  const updateItem = async (id: string, updateData: ItemData) => {
    try {
      const res = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id, nama: updateData.nama }),
      });

      const updated = await res.json();

      if (updated.data) {
        // Perbarui state items
        setItems((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, nama: updateData.nama } : item,
          ),
        );
        setSelectedItem({ _id: id, nama: updateData.nama });
        onChange({ _id: id, nama: updateData.nama });
      }
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  // Buka modal Edit
  const openEditModal = (item: ItemData) => {
    setEditItem(item);
    setIsEditModalOpen(true);
  };

  // ===== MODAL EDIT =====
  // Simpan perubahan
  const handleEditSave = async () => {
    // if (!editItem._id) return;
    await updateItem(editItem._id, editItem);
    setIsEditModalOpen(false);
  };

  return (
    <div className="relative inline-block">
      {/* SELECT BIASA */}
      <select
        className="rounded border border-gray-300 bg-white px-2 py-1 text-black 
                   dark:border-gray-700 dark:bg-black dark:text-white"
        value={selectedItem?._id || ""}
        onChange={handleSelectChange}
      >
        <option value="">Pilih {unit}...</option>
        {items.map((item) => (
          <option key={item._id} value={item._id}>
            {item.nama}
          </option>
        ))}
      </select>

      {/* TOMBOL SEARCH -> BUKA MODAL PENCARIAN */}
      <Button
        type="button"
        className="ml-2"
        onClick={() => setIsSearchModalOpen(true)}
      >
        <SearchIcon size={16} />
      </Button>

      {/* ========== MODAL PENCARIAN ========== */}
      {isSearchModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center 
                     bg-black bg-opacity-50 p-4"
        >
          <div
            className="w-full max-w-md rounded bg-white p-4 text-black shadow-lg 
                       dark:border-gray-700 dark:bg-black dark:text-white"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Pilih / Kelola {unit}</h2>
              <button
                onClick={() => setIsSearchModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <XIcon size={20} />
              </button>
            </div>

            {/* Input Pencarian */}
            <Input
              className="mt-3 dark:bg-gray-800 dark:text-white"
              placeholder={`Cari atau tambah ${unit}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {loading && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                Loading...
              </div>
            )}

            {/* Daftar Item */}
            {!loading && (
              <div className="mt-2 max-h-72 overflow-auto border-t pt-2 dark:border-gray-700">
                {filteredItems.map((item) => (
                  <div
                    key={item._id}
                    className="mb-2 flex items-center justify-between p-2 
                               hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {/* Klik untuk pilih item */}
                    <div
                      onClick={() => handleSelectItem(item)}
                      className="cursor-pointer"
                    >
                      {item.nama}
                    </div>
                    <div className="flex gap-2">
                      {/* Edit */}
                      <Button type="button" onClick={() => openEditModal(item)}>
                        Edit
                      </Button>
                      {/* Delete */}
                      <Button
                        type="button"
                        onClick={() => deleteItem(item.nama)}
                      >
                        <XIcon size={16} />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Tombol tambah jika nama belum ada */}
                {query &&
                  !filteredItems.some(
                    (x) => x.nama.toLowerCase() === query.toLowerCase(),
                  ) && (
                    <Button
                      type="button"
                      className="mt-2 w-full"
                      onClick={addNewItem}
                    >
                      Tambah &quot;{query}&quot;
                    </Button>
                  )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== MODAL EDIT ========== */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center 
                     bg-black bg-opacity-50 p-4"
        >
          <div
            className="w-full max-w-sm rounded bg-white p-4 text-black shadow-lg 
                       dark:border-gray-700 dark:bg-black dark:text-white"
          >
            <h2 className="mb-4 text-xl font-bold">Edit {unit}</h2>
            <Input
              value={editItem.nama}
              onChange={(e) =>
                setEditItem((prev) => ({ ...prev, nama: e.target.value }))
              }
              className="mb-3"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={handleEditSave}>
                Simpan
              </Button>
              <Button type="button" onClick={() => setIsEditModalOpen(false)}>
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
