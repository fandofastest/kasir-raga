"use client";
import Transaksi from "@/models/modeltsx/Transaksi";
import { formatRupiah } from "@/components/tools";
import DateDisplay from "@/components/DateDisplay";

interface Props {
  data: Transaksi[];
  produkFilter: boolean;
  isPenjualan: boolean;
  getModal: (t: Transaksi) => number;
  getLaba: (t: Transaksi) => number;
}

export default function PrintTable({
  data,
  produkFilter,
  isPenjualan,
  getModal,
  getLaba,
}: Props) {
  // Jika filter produk aktif, pecah menjadi baris per produk
  const rows = produkFilter
    ? data.flatMap((trx) =>
        trx.produk.map((pd) => ({ trx, pd }))
      )
    : data.map((trx) => ({ trx, pd: null }));

  return (
    <div className="hidden print:block">
      <table className="w-full border text-xs">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">No. Transaksi</th>
            <th className="border px-2 py-1">Tanggal</th>
            <th className="border px-2 py-1">Tipe</th>
            <th className="border px-2 py-1">
              {isPenjualan ? "Pelanggan" : "Supplier"}
            </th>
            {produkFilter && <th className="border px-2 py-1">Produk</th>}

            {produkFilter ? (
              <>
                <th className="border px-2 py-1 text-right">Harga Modal</th>
                <th className="border px-2 py-1 text-right">Harga Jual</th>
                {isPenjualan && (
                  <th className="border px-2 py-1 text-right">Laba</th>
                )}
              </>
            ) : (
              <>
                {isPenjualan && (
                  <th className="border px-2 py-1 text-right">Modal</th>
                )}
                <th className="border px-2 py-1 text-right">Total</th>
                {isPenjualan && (
                  <th className="border px-2 py-1 text-right">Laba</th>
                )}
              </>
            )}

            <th className="border px-2 py-1">Operator</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ trx, pd }, idx) => (
            <tr key={`${trx._id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="border px-2 py-1">{trx.no_transaksi}</td>
              <td className="border px-2 py-1">
                <DateDisplay date={trx.tanggal_transaksi} format="dd/MM/yyyy" />
              </td>
              <td className="border px-2 py-1">{trx.tipe_transaksi}</td>
              <td className="border px-2 py-1">
                {isPenjualan
                  ? trx.pembeli?.nama ?? "-"
                  : trx.supplier?.nama ?? "-"}
              </td>

              {produkFilter ? (
                <>                  
                  <td className="border px-2 py-1">
                    {pd?.productId?.nama_produk ?? pd?.nama_produk}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {formatRupiah((pd?.productId?.harga_modal ?? 0) * (pd?.quantity ?? 0))}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {formatRupiah((pd?.harga ?? 0) *(pd?.quantity ?? 0))}
                  </td>
                  {isPenjualan && (
                    <td className="border px-2 py-1 text-right">
                      {formatRupiah(
                        (pd?.harga ?? 0) * (pd?.quantity ?? 0) -
                          (pd?.productId?.harga_modal ?? 0) * (pd?.quantity ?? 0)
                      )}
                    </td>
                  )}
                </>
              ) : (
                <>
                  {isPenjualan && (
                    <td className="border px-2 py-1 text-right">
                      {formatRupiah(getModal(trx))}
                    </td>
                  )}
                  <td className="border px-2 py-1 text-right">
                    {formatRupiah(trx.total_harga)}
                  </td>
                  {isPenjualan && (
                    <td className="border px-2 py-1 text-right">
                      {formatRupiah(getLaba(trx))}
                    </td>
                  )}
                </>
              )}

              <td className="border px-2 py-1">
                {typeof trx.kasir === "object" ? trx.kasir.name : trx.kasir}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
