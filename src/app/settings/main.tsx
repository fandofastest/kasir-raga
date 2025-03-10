"use client";

import React, { useState, useEffect, FormEvent } from "react";
import toast from "react-hot-toast";

const PreferencesPage: React.FC = () => {
  // Preferensi tampilan, misalnya mode gelap, bahasa, dan format tanggal
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("id"); // Default: Bahasa Indonesia
  const [dateFormat, setDateFormat] = useState<string>("DD MMMM YYYY"); // Format tanggal default

  useEffect(() => {
    // Muat preferensi dari localStorage jika tersedia
    const storedDarkMode = localStorage.getItem("darkMode");
    const storedLanguage = localStorage.getItem("language");
    const storedDateFormat = localStorage.getItem("dateFormat");
    if (storedDarkMode !== null) setDarkMode(storedDarkMode === "true");
    if (storedLanguage) setLanguage(storedLanguage);
    if (storedDateFormat) setDateFormat(storedDateFormat);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Simpan preferensi ke localStorage (atau panggil API update preference jika diperlukan)
    localStorage.setItem("darkMode", darkMode.toString());
    localStorage.setItem("language", language);
    localStorage.setItem("dateFormat", dateFormat);
    toast.success("Preferensi berhasil disimpan");
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
