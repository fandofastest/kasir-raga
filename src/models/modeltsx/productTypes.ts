// types/productTypes.ts
export interface Product {
  _id: string;
  nama_produk: string;
  harga: number;
  jumlah: number;
  supplier: string;
  satuan: { _id: string; nama: string } | null;
  kategori: { _id: string; nama: string } | null;
  brand: { _id: string; nama: string } | null;
  sku: string;
  image: string;
}
