"use client";
import Transaksi from "@/models/modeltsx/Transaksi";
import { formatRupiah } from "@/components/tools";

interface Props {
  data: Transaksi[];
  produkFilter: boolean;
  isPenjualan: boolean;
  getModal: (t: Transaksi) => number;
  getLaba: (t: Transaksi) => number;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSort: (col: string) => void;
}

export default function DesktopTable({
  data,
  produkFilter,
  isPenjualan,
  getModal,
  getLaba,
  sortColumn,
  sortDirection,
  onSort,
}: Props) {
  // Jika filter kategori/produk aktif, pisah baris per produk
  const rows = produkFilter
    ? data.flatMap((trx) =>
        trx.produk.map((pd) => ({ trx, pd }))
      )
    : data.map((trx) => ({ trx, pd: null }));

  return (
    <div className="desktopTable overflow-x-auto print:hidden">
      <table className="w-full border text-xs dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th
              className="border px-2 py-1 cursor-pointer"
              onClick={() => onSort("no_transaksi")}
            >
              No. Transaksi {sortColumn === "no_transaksi" && (sortDirection === "asc" ? "▲" : "▼")}
            </th>
            <th
              className="border px-2 py-1 cursor-pointer"
              onClick={() => onSort("createdAt")}
            >
              Tanggal {sortColumn === "createdAt" && (sortDirection === "asc" ? "▲" : "▼")}
            </th>
            <th
              className="border px-2 py-1 cursor-pointer"
              onClick={() => onSort("tipe_transaksi")}
            >
              Tipe {sortColumn === "tipe_transaksi" && (sortDirection === "asc" ? "▲" : "▼")}
            </th>
            <th className="border px-2 py-1">{isPenjualan ? "Pelanggan" : "Supplier"}</th>
            {produkFilter && <th className="border px-2 py-1">Produk</th>}
            {produkFilter ? (
              <> {/* Baris produk: harga dan laba per produk */}
                <th className="border px-2 py-1 cursor-pointer" onClick={() => onSort("modal")}>
                  Harga Modal {sortColumn === "modal" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th className="border px-2 py-1 cursor-pointer" onClick={() => onSort("harga_produk")}>
                  Harga Jual {sortColumn === "harga_produk" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                {isPenjualan && (
                  <th
                    className="border px-2 py-1 cursor-pointer"
                    onClick={() => onSort("laba")}
                  >
                    Laba {sortColumn === "laba" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                )}
              </>
            ) : (
              <> {/* Baris transaksi keseluruhan */}
                {isPenjualan && (
                  <th className="border px-2 py-1 cursor-pointer" onClick={() => onSort("modal")}>Modal {sortColumn === "modal" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                )}
                <th className="border px-2 py-1 cursor-pointer" onClick={() => onSort("total_harga")}>
                  Total {sortColumn === "total_harga" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                {isPenjualan && (
                  <th className="border px-2 py-1 cursor-pointer" onClick={() => onSort("laba")}>Laba {sortColumn === "laba" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                )}
              </>
            )}
            <th className="border px-2 py-1">Operator</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ trx, pd }, idx) => {
            if (produkFilter && pd) {
              // per produk
              const hargaModal = (pd.productId?.harga_modal ?? 0) * pd.quantity;
              const hargaJual = pd.harga * pd.quantity; // asumsi pd.price harga jual per unit
              const labaProduk = isPenjualan ? hargaJual - hargaModal : 0;
              return (
                <tr key={`${trx._id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="border px-2 py-1">{trx.no_transaksi}</td>
                  <td className="border px-2 py-1">{new Date(trx.createdAt).toLocaleDateString("id-ID")}</td>
                  <td className="border px-2 py-1">{trx.tipe_transaksi}</td>
                  <td className="border px-2 py-1">{isPenjualan ? trx.pembeli?.nama : trx.supplier?.nama}</td>
                  <td className="border px-2 py-1">{pd.productId?.nama_produk ?? pd.nama_produk}</td>
                  <td className="border px-2 py-1 text-right">{formatRupiah(hargaModal)}</td>
                  <td className="border px-2 py-1 text-right">{formatRupiah(hargaJual)}</td>
                  {isPenjualan && (
                    <td className="border px-2 py-1 text-right">{formatRupiah(labaProduk)}</td>
                  )}
                  <td className="border px-2 py-1">{typeof trx.kasir === "object" ? trx.kasir.name : trx.kasir}</td>
                </tr>
              );
            }
            // baris transaksi normal
            return (
              <tr key={trx._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="border px-2 py-1">{trx.no_transaksi}</td>
                <td className="border px-2 py-1">{new Date(trx.createdAt).toLocaleDateString("id-ID")}</td>
                <td className="border px-2 py-1">{trx.tipe_transaksi}</td>
                <td className="border px-2 py-1">{isPenjualan ? trx.pembeli?.nama : trx.supplier?.nama}</td>
                {produkFilter && <td className="border px-2 py-1">-</td>}
                {isPenjualan && (
                  <td className="border px-2 py-1 text-right">{formatRupiah(getModal(trx))}</td>
                )}
                <td className="border px-2 py-1 text-right">{formatRupiah(trx.total_harga)}</td>
                {isPenjualan && (
                  <td className="border px-2 py-1 text-right">{formatRupiah(getLaba(trx))}</td>
                )}
                <td className="border px-2 py-1">{typeof trx.kasir === "object" ? trx.kasir.name : trx.kasir}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
