"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface MobileSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function MobileSalesModal({
  isOpen,
  onClose,
  children,
}: MobileSalesModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto dark:bg-gray-800"
        onClose={onClose}
      >
        <div className="min-h-screen px-4 text-center dark:bg-gray-800">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            {/* Overlay sebagai latar belakang */}
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          </Transition.Child>

          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-4 scale-95"
          >
            <div className="my-8 inline-block w-full max-w-md transform overflow-hidden rounded-t-lg bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-700 dark:text-white">
              {children}
              <button
                onClick={onClose}
                className="mt-4 w-full rounded-md bg-gray-300 py-2 text-black hover:bg-gray-400"
              >
                Tutup
              </button>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
