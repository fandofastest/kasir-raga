"use client";
import Select from "react-select";
import { Staff } from "@/models/modeltsx/staffTypes";
import React, { Dispatch, SetStateAction, FormEvent } from "react";

interface Option { value: string; label: string }
export type TransactionType = 
  | "penjualan"
  | "pembelian"
type Props = {
  isPenjualan: boolean;
  startDate: string; endDate: string;
  supplier: string; pembeli: string;
  metodePembayaran: string; kategori: string; produk: string;
  kategoriKonsumen: string; kasir: string; pengantar: string;
  staffBongkar: string; keterangan: string;
  setStartDate: (v:string)=>void; setEndDate:(v:string)=>void;
  setSupplier:(v:string)=>void; setPembeli:(v:string)=>void;
  setMetodePembayaran:(v:string)=>void; setKategori:(v:string)=>void;
  setProduk:(v:string)=>void; setKategoriKonsumen:(v:string)=>void;
  setKasir:(v:string)=>void; setPengantar:(v:string)=>void;
  setStaffBongkar:(v:string)=>void; setKeterangan:(v:string)=>void;
  supplierOptions:any[]; pembeliOptions:any[];
  kategoriOptions:any[]; kategoriKonsumenOptions:any[];
  produkOptions:any[]; staffOptions:Staff[];
  onSubmit:(e:FormEvent)=>void;
  tipeTransaksi: TransactionType;
  setTipeTransaksi: Dispatch<SetStateAction<TransactionType>>;
  statusTransaksi: string[];
  setStatusTransaksi: (v: string[]) => void;

};
const statusOptions = [
  { value: "lunas",       label: "Lunas" },
  { value: "lunas_cepat", label: "Lunas Cepat" },
  { value: "belum_lunas", label: "Belum Lunas" },
  { value: "tunda",       label: "Tunda" },
  { value: "batal",       label: "Batal" },
  { value: "cicilan",     label: "Cicilan" },
];

const customStyles = {
  control:(p:any)=>({...p,background:"var(--rs-bg)",borderColor:"var(--rs-border)",color:"var(--rs-text)"}),
  singleValue:(p:any)=>({...p,color:"var(--rs-text)"}),
  menu:(p:any)=>({...p,background:"var(--rs-bg)"}),
  option:(p:any,s:any)=>({...p,background:s.isFocused?"var(--rs-option-hover)":"var(--rs-option-bg)",color:"var(--rs-text)"}),
};

export default function FilterForm(props:Props){
  const {
    isPenjualan,startDate,endDate,supplier,pembeli,metodePembayaran,kategori,produk,
    kategoriKonsumen,kasir,pengantar,staffBongkar,keterangan,
    setStartDate,setEndDate,setSupplier,setPembeli,setMetodePembayaran,setKategori,setProduk,
    setKategoriKonsumen,setKasir,setPengantar,setStaffBongkar,setKeterangan,
    supplierOptions,pembeliOptions,kategoriOptions,kategoriKonsumenOptions,produkOptions,staffOptions,
    onSubmit,
  } = props;

  return (
    <form onSubmit={onSubmit} className="print:hidden mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* tanggal */}
            {/* Jenis Transaksi */}
            <div>
        <label className="block text-sm font-medium">Jenis Transaksi</label>
        <Select
          styles={customStyles}
          options={[
            { value: "penjualan", label: "Penjualan" },
            { value: "pembelian", label: "Pembelian" },
 
          ]}
          value={{
            value: props.tipeTransaksi,
            label:
              props.tipeTransaksi.charAt(0).toUpperCase() +
              props.tipeTransaksi.slice(1),
          }}
          onChange={(sel) => {
            // sel!.value sudah TransactionType
            props.setTipeTransaksi(sel!.value);
          }}
          isClearable={false}
          placeholder="Pilih Jenis..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Tanggal Mulai</label>
        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 text-sm dark:bg-gray-800"/>
      </div>
      <div>
        <label className="block text-sm font-medium">Tanggal Akhir</label>
        <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 text-sm dark:bg-gray-800"/>
      </div>

      {/* supplier / pembeli */}
      <div>
        <label className="block text-sm font-medium">{isPenjualan?"Pelanggan":"Supplier"}</label>
        <Select styles={customStyles}
          options={(isPenjualan?pembeliOptions:supplierOptions).map((o)=>({value:o._id,label:o.nama}))}
          isClearable placeholder={`Pilih ${isPenjualan?"Konsumen":"Supplier"}...`}
          onChange={(v)=>isPenjualan?setPembeli(v?.value??""):setSupplier(v?.value??"")} />
      </div>

      {/* kategori konsumen */}
      {isPenjualan && (
        <div>
          <label className="block text-sm font-medium">Kategori Konsumen</label>
          <Select styles={customStyles}
            options={kategoriKonsumenOptions.map(o=>({value:o._id,label:o.nama}))}
            isClearable placeholder="Pilih Kategori..."
            onChange={(v)=>setKategoriKonsumen(v?.value??"")}/>
        </div>
      )}

      {/* metode pembayaran */}
      <div>
        <label className="block text-sm font-medium">Metode Pembayaran</label>
        <Select styles={customStyles}
          options={[
            {value:"edc",label:"EDC"},
            {value:"tunai",label:"Tunai"},
            {value:"bank_transfer",label:"Transfer"},
            {value:"cicilan",label:"Cicilan"},
          ]}
          isClearable placeholder="Pilih Metode..."
          onChange={(v)=>setMetodePembayaran(v?.value??"")}/>
      </div>
{/* Status Transaksi */}
<div>
  <label className="block text-sm font-medium dark:text-gray-300">
    Status Transaksi
  </label>
  <Select
    styles={customStyles}
    options={statusOptions}
    isMulti
    placeholder="Pilih Status..."
    value={statusOptions.filter(o => props.statusTransaksi.includes(o.value))}
    onChange={(selected) => {
      const vals = (selected || []).map(s => s.value);
      
      props.setStatusTransaksi(vals);
    }}
  />
</div>

      {/* kategori */}
      <div>
        <label className="block text-sm font-medium">Kategori</label>
        <Select styles={customStyles}
          options={kategoriOptions.map(o=>({value:o._id,label:o.nama}))}
          isClearable placeholder="Pilih Kategori..."
          onChange={(v)=>setKategori(v?.value??"")}/>
      </div>

      {/* produk */}
      <div>
        <label className="block text-sm font-medium">Produk</label>
        <Select styles={customStyles}
          options={produkOptions.map(o=>({value:o.nama_produk,label:o.nama_produk}))}
          isClearable placeholder="Pilih Produk..."
          onChange={(v)=>setProduk(v?.value??"")}/>
      </div>

      {/* kasir + pengantar + bongkar */}
      {[
        {label:"Kasir (Operator)", val:kasir, set:setKasir},
        {label:"Pengantar", val:pengantar, set:setPengantar},
        {label:"Staff Bongkar", val:staffBongkar, set:setStaffBongkar},
      ].map(({label,val,set})=>(
        <div key={label}>
          <label className="block text-sm font-medium">{label}</label>
          <Select styles={customStyles}
            options={staffOptions.map(s=>({value:s._id,label:s.name}))}
            isClearable placeholder={`Pilih ${label}...`}
            onChange={(v)=>set(v?.value??"")}/>
        </div>
      ))}

      {/* keterangan */}
      <div>
        <label className="block text-sm font-medium">Keterangan</label>
        <input value={keterangan} onChange={e=>setKeterangan(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 text-sm dark:bg-gray-800"
          placeholder="Cari keterangan..."/>
      </div>

      {/* tombol */}
      <div className="flex items-end">
        <button type="submit" className="w-full rounded bg-tosca px-4 py-2 text-white hover:bg-toscadark">Terapkan Filter</button>
      </div>
    </form>
  );
}
