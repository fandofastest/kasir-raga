"use client";

import React, { useState, useEffect, FormEvent } from "react";
import toast from "react-hot-toast";
import { photoUpload } from "@/lib/dataService"; // Fungsi upload foto yang sudah diimplementasikan
import { getPreferences, updatePreferences } from "@/lib/dataService";

const PreferencesPage: React.FC = () => {
  // Preferensi tampilan
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>("id");
  const [dateFormat, setDateFormat] = useState<string>("DD MMMM YYYY");

  // Setting profil perusahaan
  const [companyName, setCompanyName] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>(""); // URL logo yang sudah diupload
  const [companyAddress, setCompanyAddress] = useState<string>("");
  const [companyPhone, setCompanyPhone] = useState<string>("");

  // Preference tambahan: maksimal hari pelunasan yang dianggap aman
  const [maxPelunasanHari, setMaxPelunasanHari] = useState<number>(30);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getPreferences();

        // Update state dengan data dari server
        setDarkMode(data.darkMode);
        setLanguage(data.language);
        setDateFormat(data.dateFormat);
        setCompanyName(data.companyName);
        setImageUrl(data.companyLogo);
        setCompanyAddress(data.companyAddress);
        setCompanyPhone(data.companyPhone);
        setMaxPelunasanHari(data.maxPelunasanHari);

        // Simpan ke localStorage untuk keperluan halaman lain
        localStorage.setItem("darkMode", data.darkMode || "false");
        localStorage.setItem("language", data.language);
        localStorage.setItem("dateFormat", data.dateFormat);
        localStorage.setItem("companyName", data.companyName);
        localStorage.setItem("companyAddress", data.companyAddress);
        localStorage.setItem("companyPhone", data.companyPhone);
        localStorage.setItem("companyLogo", data.companyLogo);
        localStorage.setItem("maxPelunasanHari", data.maxPelunasanHari);
      } catch (error: any) {
        console.error("Error fetching preferences:", error);
        toast.error("Gagal mengambil preferensi dari server");
      }
    };

    fetchData();
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

    // Buat objek preferensi untuk dikirim ke server
    const preferences = {
      darkMode: darkMode || false,
      language: language || "id",
      dateFormat: dateFormat || "DD MMMM YYYY",
      companyName: companyName || " ",
      companyLogo: imageUrl || "",
      companyAddress: companyAddress || "",
      companyPhone: companyPhone || "",
      maxPelunasanHari: maxPelunasanHari || 30,
    };

    try {
      const { data } = await updatePreferences(preferences);

      // Perbarui state dan localStorage dengan data terbaru dari server
      setDarkMode(data.darkMode);
      setLanguage(data.language);
      setDateFormat(data.dateFormat);
      setCompanyName(data.companyName);
      setImageUrl(data.companyLogo);
      setCompanyAddress(data.companyAddress);
      setCompanyPhone(data.companyPhone);
      setMaxPelunasanHari(data.maxPelunasanHari);

      localStorage.setItem("darkMode", data.darkMode);
      localStorage.setItem("language", data.language);
      localStorage.setItem("dateFormat", data.dateFormat);
      localStorage.setItem("companyName", data.companyName);
      localStorage.setItem("companyAddress", data.companyAddress);
      localStorage.setItem("companyPhone", data.companyPhone);
      localStorage.setItem("companyLogo", data.companyLogo);
      localStorage.setItem("maxPelunasanHari", data.maxPelunasanHari);

      toast.success("Preferensi berhasil disimpan");
    } catch (error: any) {
      console.error("Error updating preferences:", error);
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

          {/* Maksimal Hari Pelunasan */}
          <div className="mb-5">
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Maksimal Hari Pelunasan
            </label>
            <input
              type="number"
              value={maxPelunasanHari}
              onChange={(e) => setMaxPelunasanHari(Number(e.target.value))}
              placeholder="Masukkan maksimal hari pelunasan"
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
