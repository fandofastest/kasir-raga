"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchStaff, fetchTransaction } from "@/lib/dataService";
import { Staff } from "@/models/modeltsx/staffTypes";
import Transaksi from "@/models/modeltsx/Transaksi";

// Perluas tipe Staff untuk menambahkan properti transactionCount
interface EmployeeWithCount extends Staff {
  transactionCount: number;
}

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeWithCount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Ambil data karyawan dan filter agar tidak menyertakan yang berperan "kasir" atau "superadmin"
        const staffRes = await fetchStaff();
        const staffData: Staff[] = staffRes.data.filter(
          (staff: Staff) =>
            staff.role !== "kasir" && staff.role !== "superadmin",
        );

        // Ambil data transaksi
        const transactionRes = await fetchTransaction({});
        const transactions: Transaksi[] = transactionRes.data.transactions;

        // Buat mapping staff id ke jumlah transaksi (dari field: staff_bongkar dan pengantar)
        const countMap: Record<string, number> = {};
        transactions.forEach((trx) => {
          // Hitung transaksi dari field staff_bongkar
          if (typeof trx.staff_bongkar === "object" && trx.staff_bongkar?._id) {
            const id = trx.staff_bongkar._id;
            countMap[id] = (countMap[id] || 0) + 1;
          }
          // Hitung transaksi dari field pengantar
          if (typeof trx.pengantar === "object" && trx.pengantar?._id) {
            const id = trx.pengantar._id;
            countMap[id] = (countMap[id] || 0) + 1;
          }
        });

        // Gabungkan data karyawan (non kasir dan non superadmin) dengan jumlah transaksi (default 0)
        const employeesWithCount: EmployeeWithCount[] = staffData.map(
          (staff) => ({
            ...staff,
            transactionCount: countMap[staff?._id ?? ""] || 0,
          }),
        );

        // Urutkan berdasarkan jumlah transaksi secara menurun
        employeesWithCount.sort(
          (a, b) => b.transactionCount - a.transactionCount,
        );

        setEmployees(employeesWithCount);
      } catch (err: any) {
        setError(err.message || "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <h4 className="mb-6 px-7.5 text-xl font-semibold text-black dark:text-white">
        Karyawan dengan Transaksi Terbanyak
      </h4>
      <div>
        {employees.map((employee) => (
          <Link
            href="/"
            key={employee._id}
            className="flex items-center gap-5 px-7.5 py-3 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <div className="relative h-14 w-14 rounded-full">
              <Image
                src={"/images/user/user-01.png"}
                alt={employee.name}
                width={56}
                height={56}
                className="rounded-full"
              />
            </div>
            <div className="flex flex-1 items-center justify-between">
              <div>
                <h5 className="font-medium text-black dark:text-white">
                  {employee.name}
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {employee.transactionCount} Transaksi
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EmployeeList;
