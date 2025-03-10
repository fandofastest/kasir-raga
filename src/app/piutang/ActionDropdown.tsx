"use client";

import React, { useState, useRef, useEffect } from "react";
import Transaksi from "@/models/modeltsx/Transaksi";

interface ActionDropdownProps {
  trx: Transaksi;
  outstanding: number;
  openInstallmentModal: (trx: Transaksi) => void;
  openSettleModal: (trx: Transaksi) => void;
  openHistoryModal: (trx: Transaksi) => void;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({
  trx,
  outstanding,
  openInstallmentModal,
  openSettleModal,
  openHistoryModal,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Toggle dropdown
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOptionClick = (option: "installment" | "settle" | "history") => {
    if (option === "installment") {
      openInstallmentModal(trx);
    } else if (option === "settle") {
      openSettleModal(trx);
    } else if (option === "history") {
      openHistoryModal(trx);
    }
    setDropdownOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
      >
        Aksi
      </button>
      {dropdownOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          {outstanding > 0 && (
            <button
              onClick={() => handleOptionClick("installment")}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              disabled={outstanding <= 0}
            >
              Bayar Cicilan
            </button>
          )}
          {outstanding > 0 && (
            <button
              onClick={() => handleOptionClick("settle")}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Lunasi
            </button>
          )}
          <button
            onClick={() => handleOptionClick("history")}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Riwayat Pembayaran
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionDropdown;
