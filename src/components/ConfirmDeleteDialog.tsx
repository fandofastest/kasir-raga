"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmDeleteDialog = ({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmDeleteDialogProps) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
      <Dialog.Content className="fixed left-1/2 top-1/2 w-96 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
        <Dialog.Title className="text-lg font-semibold">
          Konfirmasi Hapus
        </Dialog.Title>
        <Dialog.Description className="mt-2 text-sm text-gray-600">
          Apakah kamu yakin ingin menghapus item ini? Tindakan ini tidak bisa
          dibatalkan.
        </Dialog.Description>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Hapus
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default ConfirmDeleteDialog;
