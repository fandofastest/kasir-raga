"use client";
import { MouseEvent } from "react";

interface Props{
  current:number; total:number;
  go:(p:number)=>void;
  onExport:(e:MouseEvent<HTMLButtonElement>)=>void;
}

export default function Pagination({current,total,go,onExport}:Props){
  return(
    <div className="mt-4 flex items-center justify-between print:hidden">
      <div className="flex gap-2 text-sm">
        <button onClick={()=>go(current-1)} disabled={current===1} className="rounded border px-2 py-1 disabled:opacity-50">Prev</button>
        <span>Page {current} of {total}</span>
        <button onClick={()=>go(current+1)} disabled={current===total} className="rounded border px-2 py-1 disabled:opacity-50">Next</button>
      </div>

      <div className="flex gap-2">
        <button onClick={onExport} className="rounded bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-600">Export to Excel</button>
        <button onClick={()=>window.print()} className="rounded bg-tosca px-4 py-2 text-white hover:bg-toscadark">Print Laporan</button>
      </div>
    </div>
  );
}
