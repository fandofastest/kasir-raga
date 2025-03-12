"use client";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { deleteStaff } from "@/lib/dataService";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

interface DropdownActionProps {
  staffId: string;
  onDeleteSuccess: () => void;
  onEditClick?: () => void;
  onPermissionClick?: () => void;
}

const DropdownAction = ({
  staffId,
  onDeleteSuccess,
  onEditClick,
  onPermissionClick,
}: DropdownActionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDelete = () => {
    deleteStaff(staffId).then(() => {
      setIsOpen(false);
      setIsDialogOpen(false);
      onDeleteSuccess();
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative col-span-1 flex items-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="float-right inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-black shadow hover:text-primary dark:bg-meta-4 dark:text-white"
      >
        Action
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-md bg-white py-2 shadow-lg dark:bg-boxdark">
          <button
            onClick={() => {
              setIsOpen(false);
              if (onEditClick) onEditClick();
            }}
            className="flex w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-meta-4"
          >
            Edit
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              if (onPermissionClick) onPermissionClick();
            }}
            className="flex w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-meta-4"
          >
            Ubah Permission
          </button>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-meta-4"
          >
            Delete
          </button>
        </div>
      )}

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDeleteDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default DropdownAction;
