"use client";
import Image from "next/image";
import { formatRupiah } from "@/components/tools";

interface Props{
  isPenjualan:boolean;
  storeName:string;storeAddress:string;storePhone:string;logo:string;
  totalValue:number;totalModal:number;totalLaba:number;count:number;
}

export default function ReportHeader({
  isPenjualan,storeName,storeAddress,storePhone,logo,
  totalValue,totalModal,totalLaba,count
}:Props){
  return(
    <>
      <div className="mb-10 mt-8 text-center sm:mt-0">
        <h1 className="text-xl font-bold">LAPORAN TRANSAKSI</h1>
      </div>

      <div className="mb-4 flex flex-col items-center border-b pb-2 dark:border-gray-700 sm:flex-row sm:justify-between">
        <div className="flex items-center space-x-4">
          <Image src={`/api/image-proxy?url=${encodeURIComponent(logo)}`} alt="Logo" width={100} height={100} className="h-16 w-16 object-cover"/>
          <div>
            <h2 className="text-lg font-bold">{storeName}</h2>
            <p>{storeAddress}</p>
            <p>{storePhone}</p>
          </div>
        </div>
        <div className="mt-4 text-right text-sm font-bold sm:mt-0">
          <p>{new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
          {isPenjualan?(
            <>
              <p>Total Penjualan: {formatRupiah(totalValue)}</p>
              <p>Total Modal: {formatRupiah(totalModal)}</p>
              <p>Total Laba: {formatRupiah(totalLaba)}</p>
            </>
          ):(
            <>
              <p>Total Pembelian: {formatRupiah(totalValue)}</p>
              <p>Total Transaksi: {count}</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
