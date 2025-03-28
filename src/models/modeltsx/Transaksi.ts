import { Product } from "./productTypes";
import { Staff } from "./staffTypes";

interface Transaksi {
  _id: string;
  no_transaksi: string;
  kasir: Staff | string;
  pembeli?: { nama: string };
  supplier?: { nama: string };
  total_harga: number;
  createdAt: string;
  metode_pembayaran: "tunai" | "edc" | "bank_transfer" | "cicilan" | "hutang";
  status_transaksi: "lunas" | "belum_lunas" | "tunda" | "batal" | "lunas_cepat";
  tipe_transaksi: "pembelian" | "penjualan" | "pengeluaran" | "pemasukan";
  keterangan: string;
  pengantar: Staff | string;
  diskon: number;
  tanggal_transaksi: string;
  produk: {
    productId: Product;
    quantity: number;
    harga: number;
    satuans: any;
  }[];
  staff_bongkar: Staff | string;
  // Field tambahan untuk cicilan/hutang
  dp?: number;
  tenor?: number;
  cicilanPerBulan?: number;
  sudah_dibayar?: number;
  jadwalPembayaran?: {
    dueDate: Date;
    installment: number;
    paid: boolean;
    paymentDate?: Date;
  }[];
}

export default Transaksi;
