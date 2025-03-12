"use client";

import React, { useState, useEffect, FormEvent } from "react";
import toast from "react-hot-toast";
import { photoUpload } from "@/lib/dataService"; // Fungsi upload foto yang sudah diimplementasikan

const PreferencesPage: React.FC = () => {
  // Preferensi tampilan
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("id"); // Default: Bahasa Indonesia
  const [dateFormat, setDateFormat] = useState<string>("DD MMMM YYYY"); // Format tanggal default

  // Setting profil perusahaan
  const [companyName, setCompanyName] = useState<string>("");
  // Simpan URL logo yang sudah diupload
  const [imageUrl, setImageUrl] = useState<string>("");
  const [companyAddress, setCompanyAddress] = useState<string>("");
  const [companyPhone, setCompanyPhone] = useState<string>("");

  // Misalnya token didapat dari localStorage atau context
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Muat preferensi tampilan dari localStorage jika tersedia
    const storedDarkMode = localStorage.getItem("darkMode");
    const storedLanguage = localStorage.getItem("language");
    const storedDateFormat = localStorage.getItem("dateFormat");
    if (storedDarkMode !== null) setDarkMode(storedDarkMode === "true");
    if (storedLanguage) setLanguage(storedLanguage);
    if (storedDateFormat) setDateFormat(storedDateFormat);

    // Muat setting profil perusahaan dari localStorage
    const storedCompanyName = localStorage.getItem("companyName");
    const storedCompanyAddress = localStorage.getItem("companyAddress");
    const storedCompanyPhone = localStorage.getItem("companyPhone");
    const storedImageUrl = localStorage.getItem("companyLogo");
    if (storedCompanyName) setCompanyName(storedCompanyName);
    if (storedCompanyAddress) setCompanyAddress(storedCompanyAddress);
    if (storedCompanyPhone) setCompanyPhone(storedCompanyPhone);
    if (storedImageUrl) setImageUrl(storedImageUrl);
  }, []);

  // Fungsi upload logo menggunakan file input dan fungsi photoUpload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = await photoUpload(e);
    if (url) {
      setImageUrl(url);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Buat objek preferensi
    const preferences = {
      darkMode,
      language,
      dateFormat,
      companyName,
      companyLogo: imageUrl,
      companyAddress,
      companyPhone,
    };

    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan preferensi");
      }

      // Simpan juga ke localStorage jika diperlukan
      localStorage.setItem("darkMode", darkMode.toString());
      localStorage.setItem("language", language);
      localStorage.setItem("dateFormat", dateFormat);
      localStorage.setItem("companyName", companyName);
      localStorage.setItem("companyAddress", companyAddress);
      localStorage.setItem("companyPhone", companyPhone);
      localStorage.setItem("companyLogo", imageUrl);

      toast.success("Preferensi berhasil disimpan");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message);
    }
  };

  return (
    <div className="p-4">
      <div className="rounded-sm border border-stroke bg-white p-7 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-6 text-xl font-medium text-black dark:text-white">
          Preferensi dan Tampilan
        </h3>
        <form onSubmit={handleSubmit}>
          {/* Mode Gelap */}
          <div className="mb-5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Mode Gelap
            </label>
            <select
              value={darkMode ? "true" : "false"}
              onChange={(e) => setDarkMode(e.target.value === "true")}
              className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            >
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>

          {/* Bahasa */}
          <div className="mb-5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Bahasa
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Format Tanggal */}
          <div className="mb-5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Format Tanggal
            </label>
            <input
              type="text"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              placeholder="Contoh: DD MMMM YYYY"
              className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            />
          </div>

          <h3 className="mb-6 text-xl font-medium text-black dark:text-white">
            Profil Perusahaan
          </h3>

          {/* Nama Perusahaan */}
          <div className="mb-5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Nama Perusahaan
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Masukkan nama perusahaan"
              className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            />
          </div>

          {/* Logo Perusahaan */}
          <div className="mb-5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Logo Perusahaan
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
            />
            {/* Preview logo jika sudah diupload */}
            {imageUrl && (
              <div className="mt-3">
                <img src={imageUrl} alt="Logo Preview" className="max-h-20" />
              </div>
            )}
          </div>

          {/* Alamat */}
          <div className="mb-5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Alamat
            </label>
            <textarea
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="Masukkan alamat perusahaan"
              className="w-full rounded border border-stroke bg-gray px-4 py-3 text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
              rows={3}
            ></textarea>
          </div>

          {/* Nomor HP */}
          <div className="mb-5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Nomor HP
            </label>
            <input
              type="text"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              placeholder="Masukkan nomor HP perusahaan"
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
};

export default PreferencesPage;
