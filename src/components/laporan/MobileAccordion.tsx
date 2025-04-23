"use client";
import Transaksi from "@/models/modeltsx/Transaksi";
import { formatRupiah } from "@/components/tools";

interface Props {
  data: Transaksi[];
  produkFilter: boolean;
  isPenjualan: boolean;
  getModal: (t: Transaksi) => number;
  getLaba: (t: Transaksi) => number;
  open: Set<string>;
  toggle: (id: string) => void;
}

export default function MobileAccordion({
  data,
  produkFilter,
  isPenjualan,
  getModal,
  getLaba,
  open,
  toggle,
}: Props) {
  return (
    <div className="mobileAccordion print:hidden">
      {data.map((trx) => (
        <div key={trx._id} className="mb-2 rounded border">
          {/* Header ringkas: No, Harga, Tanggal, Toggle */}
          <div
            className="flex cursor-pointer items-center justify-between p-2"
            onClick={() => toggle(trx._id)}
          >
            <div>
              <p className="font-bold">{trx.no_transaksi}</p>
              <p className="text-sm">{formatRupiah(trx.total_harga)}</p>
              <p className="text-xs text-gray-500">
                {new Date(trx.tanggal_transaksi).toLocaleDateString("id-ID")} {/* Change date source here */}
              </p>
            </div>
            <div className="font-bold">{open.has(trx._id) ? "-" : "+"}</div>
          </div>

          {/* Detail isi ketika terbuka */}
          {open.has(trx._id) && (
            <div className="border-t p-2 space-y-2">
              <p>
                <b>{isPenjualan ? "Pelanggan:" : "Supplier:"}</b> {isPenjualan ? trx.pembeli?.nama : trx.supplier?.nama}
              </p>

              {produkFilter ? (
                /* Pisah detail per produk */
                trx.produk.map((pd, idx) => {
                  const hargaModal = (pd.productId?.harga_modal ?? 0) * pd.quantity;
                  const hargaJual = (pd.harga  ?? 0) * pd.quantity;
                  const labaProduk = isPenjualan ? hargaJual - hargaModal : 0;
                  return (
                    <div key={idx} className="pt-2">
                      <p><b>Produk:</b> {pd.productId?.nama_produk ?? pd.nama_produk}</p>
                      <p><b>Harga Modal:</b> {formatRupiah(hargaModal)}</p>
                      <p><b>Harga Jual:</b> {formatRupiah(hargaJual)}</p>
                      {isPenjualan && <p><b>Laba:</b> {formatRupiah(labaProduk)}</p>}
                    </div>
                  );
                })
              ) : (
                /* Ringkasan transaksi keseluruhan */
                <>
                  {isPenjualan && <p><b>Modal:</b> {formatRupiah(getModal(trx))}</p>}
                  <p><b>Total:</b> {formatRupiah(trx.total_harga)}</p>
                  {isPenjualan && <p><b>Laba:</b> {formatRupiah(getLaba(trx))}</p>}
                </>
              )}

              <p><b>Operator:</b> {typeof trx.kasir === "object" ? trx.kasir.name : trx.kasir}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}