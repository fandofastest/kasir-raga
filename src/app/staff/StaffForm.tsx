"use client";

import { XCircleIcon } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Staff } from "@/models/modeltsx/staffTypes";
import { fetchStaff, deleteStaff } from "@/lib/dataService";
import ReactDOM from "react-dom";

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  staff?: Staff | null;
  initialRole?: "kasir" | "staffAntar" | "staffBongkar" | "superadmin";
}

export default function StaffFormModal({
  isOpen,
  onClose,
  onSubmit,
  staff,
  initialRole,
}: StaffFormModalProps) {
  const [role, setRole] = useState<
    "kasir" | "staffAntar" | "staffBongkar" | "superadmin"
  >("kasir");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nohp, setNohp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("mytoken");

  useEffect(() => {
    if (staff) {
      setRole(staff.role);
      setName(staff.name);
      setNohp(staff.nohp);
      setAlamat(staff.alamat || "");
      if (staff.role === "kasir") {
        setEmail(staff.email || "");
      }
    } else {
      // Jika tidak ada staff, gunakan initialRole jika tersedia
      setRole(initialRole || "kasir");
      setName("");
      setEmail("");
      setPassword("");
      setNohp("");
      setAlamat("");
    }
  }, [staff, initialRole]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const staffData: Staff = {
      name,
      role,
      nohp,
      alamat,
    };

    if (role === "kasir") {
      staffData.email = email;
      if (!staff?._id) {
        staffData.password = password;
      }
    }

    setLoading(true);
    let res;
    if (staff?._id) {
      // Logika update jika diperlukan
      res = await fetch(`/api/user/?id=${staff._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(staffData),
      });
    } else {
      res = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(staffData),
      });
    }

    setLoading(false);
    const data = await res.json();
    if (res.ok) {
      onSubmit();
      toast.success(
        staff ? "Staff berhasil diperbarui!" : "Staff berhasil ditambahkan!",
        { duration: 3000, position: "top-center" },
      );
      onClose();
    } else {
      toast.error("Gagal menyimpan staff: " + data.error);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose} // Klik di backdrop akan menutup modal
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white shadow-lg dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam konten merembet ke backdrop
      >
        <div className="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {staff ? "Edit Staff" : "Tambah Staff Baru"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Staff["role"])}
            className="w-full rounded-lg border p-2 dark:bg-gray-800"
          >
            <option value="kasir">Kasir</option>
            <option value="staffAntar">Staff Antar</option>
            <option value="staffBongkar">Staff Bongkar</option>
          </select>
          <input
            type="text"
            placeholder="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border p-2 dark:bg-gray-800"
          />
          {role === "kasir" && (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border p-2 dark:bg-gray-800"
              />
              {!staff && (
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border p-2 dark:bg-gray-800"
                />
              )}
            </>
          )}
          <input
            type="text"
            placeholder="Nomor HP"
            value={nohp}
            onChange={(e) => setNohp(e.target.value)}
            required
            className="w-full rounded-lg border p-2 dark:bg-gray-800"
          />
          <input
            type="text"
            placeholder="Alamat"
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            className="w-full rounded-lg border p-2 dark:bg-gray-800"
          />
          <button
            type="submit"
            className="bg-tosca hover:bg-toscadark w-full rounded-lg px-4 py-2 text-white"
          >
            {loading
              ? "Menyimpan..."
              : staff
                ? "Simpan Perubahan"
                : "Simpan Staff"}
          </button>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
