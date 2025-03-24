"use client";

import React, { useState } from "react";
import Transaksi from "@/models/modeltsx/Transaksi";

interface ActionModalProps {
  trx: Transaksi;
  outstanding: number;
  openInstallmentModal: (trx: Transaksi) => void;
  openSettleModal: (trx: Transaksi) => void;
  openHistoryModal: (trx: Transaksi) => void;
}

const ActionModal: React.FC<ActionModalProps> = ({
  trx,
  outstanding,
  openInstallmentModal,
  openSettleModal,
  openHistoryModal,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleOptionClick = (option: "installment" | "settle" | "history") => {
    if (option === "installment") {
      openInstallmentModal(trx);
    } else if (option === "settle") {
      openSettleModal(trx);
    } else if (option === "history") {
      openHistoryModal(trx);
    }
    closeModal();
  };

  return (
    <div>
      <button
        onClick={openModal}
        className="rounded-md bg-blue-600 px-4 py-2 text-white shadow transition-colors duration-200 hover:bg-blue-700"
      >
        Aksi
      </button>
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeModal}
        >
          <div
            className="w-64 rounded-md bg-white p-4 shadow-lg dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {outstanding > 0 && (
              <button
                onClick={() => handleOptionClick("installment")}
                className="block w-full rounded bg-green-500 px-4 py-2 text-left text-sm text-white hover:bg-green-600"
                disabled={outstanding <= 0}
              >
                Bayar Cicilan
              </button>
            )}
            {outstanding > 0 && (
              <button
                onClick={() => handleOptionClick("settle")}
                className="mt-1 block w-full rounded bg-red-500 px-4 py-2 text-left text-sm text-white hover:bg-red-600"
              >
                Lunasi
              </button>
            )}
            <button
              onClick={() => handleOptionClick("history")}
              className="mt-1 block w-full rounded bg-indigo-500 px-4 py-2 text-left text-sm text-white hover:bg-indigo-600"
            >
              Riwayat Pembayaran
            </button>
            <button
              onClick={closeModal}
              className="mt-4 block w-full rounded bg-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-400"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionModal;
