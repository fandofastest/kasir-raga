export interface Product {
  _id: string;
  nama_produk: string;
  harga_modal: number;
  supplier: string;
  sku: string;
  image: string;
  jumlah: number;
  satuans: SatuanPembelian[]; // Array satuan pembelian
  kategori: { _id: string; nama: string } | null;
  brand: { _id: string; nama: string } | null;
}

// Struktur satuan pembelian
export interface SatuanPembelian {
  _id: string;
  satuan: { _id: string; nama: string };
  konversi: number; // Contoh: 1 Box = 12 Pcs
  harga: number;
}
