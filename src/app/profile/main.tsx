"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { fetchUserById, updateUser } from "@/lib/dataService";
import { toast } from "react-hot-toast";

function MainSetting() {
  // Ambil userId dari session (sesuaikan dengan implementasi Anda)
  const [userId, setUserId] = useState("");

  // State untuk field sesuai model User
  const [name, setName] = useState("");
  const [nohp, setNohp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Ambil session untuk mendapatkan userId
        const resSession = await fetch("/api/auth/session");
        const session = await resSession.json();
        const uid = session.user.id;
        setUserId(uid);

        // Ambil data user berdasarkan uid
        const res = await fetchUserById(uid);
        const data = res.data;
        setName(data.name || "");
        setNohp(data.nohp || "");
        setEmail(data.email || "");
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Gagal memuat data user");
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateUser(userId, {
        name,
        nohp,
        email,
        password,
      });
      toast.success("User updated successfully");
      console.log(res);
    } catch (err: any) {
      toast.error(err.message || "Update failed");
      console.error(err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div>
      <div className="rounded-sm border border-stroke bg-white p-7 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-6 text-xl font-medium text-black dark:text-white">
          Informasi Pribadi
        </h3>
        <form onSubmit={handleSubmit}>
          {/* Nama Lengkap */}
          <div className="mb-5 flex flex-col gap-5 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <label
                htmlFor="name"
                className="mb-3 block text-sm font-medium text-black dark:text-white"
              >
                Nama Lengkap
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Nama lengkap Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
              />
            </div>
            {/* Nomor Handphone */}
            <div className="w-full sm:w-1/2">
              <label
                htmlFor="nohp"
                className="mb-3 block text-sm font-medium text-black dark:text-white"
              >
                No Handphone
              </label>
              <input
                type="text"
                id="nohp"
                name="nohp"
                placeholder="+628123456789"
                value={nohp}
                onChange={(e) => setNohp(e.target.value)}
                className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-5">
            <label
              htmlFor="email"
              className="mb-3 block text-sm font-medium text-black dark:text-white"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            />
          </div>

          {/* Password */}
          <div className="mb-5">
            <label
              htmlFor="password"
              className="mb-3 block text-sm font-medium text-black dark:text-white"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Kata sandi baru"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="flex justify-end gap-4">
            <button
              type="reset"
              className="rounded border border-stroke px-6 py-2 font-medium text-black hover:shadow dark:border-strokedark dark:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MainSetting;
