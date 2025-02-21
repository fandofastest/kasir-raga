import Image from "next/image";
import { Product } from "@/models/modeltsx/productTypes";

const productsdata: Product[] = [
  {
    _id: "1",
    nama_produk: "Laptop Asus ROG",
    harga: 20000000,
    jumlah: 5,
    supplier: "PT Teknologi Jaya",
    satuan: { _id: "s1", nama: "Unit" },
    kategori: { _id: "k1", nama: "Elektronik" },
    brand: { _id: "b1", nama: "Asus" },
    sku: "ASUS-ROG-001",
    image: "/images/products/laptop-asus.png",
  },
  {
    _id: "2",
    nama_produk: "iPhone 14 Pro",
    harga: 18000000,
    jumlah: 3,
    supplier: "Apple Store Indonesia",
    satuan: { _id: "s1", nama: "Unit" },
    kategori: { _id: "k1", nama: "Elektronik" },
    brand: { _id: "b2", nama: "Apple" },
    sku: "IPHONE14PRO-002",
    image: "/images/products/iphone14pro.png",
  },
  {
    _id: "3",
    nama_produk: "Samsung Galaxy S23",
    harga: 15000000,
    jumlah: 8,
    supplier: "Samsung Distributor",
    satuan: { _id: "s1", nama: "Unit" },
    kategori: { _id: "k1", nama: "Elektronik" },
    brand: { _id: "b3", nama: "Samsung" },
    sku: "SAMSUNG-S23-003",
    image: "/images/products/galaxy-s23.png",
  },
  {
    _id: "4",
    nama_produk: "Smart TV LG 55 Inch",
    harga: 12000000,
    jumlah: 4,
    supplier: "PT LG Electronics",
    satuan: { _id: "s1", nama: "Unit" },
    kategori: { _id: "k2", nama: "Peralatan Rumah Tangga" },
    brand: { _id: "b4", nama: "LG" },
    sku: "LG-TV-55-004",
    image: "/images/products/lg-tv-55.png",
  },
  {
    _id: "5",
    nama_produk: "Headphone Sony WH-1000XM5",
    harga: 5000000,
    jumlah: 10,
    supplier: "Sony Indonesia",
    satuan: { _id: "s1", nama: "Unit" },
    kategori: { _id: "k3", nama: "Aksesoris" },
    brand: { _id: "b5", nama: "Sony" },
    sku: "SONY-WH1000XM5-005",
    image: "/images/products/sony-headphone.png",
  },
];
const TableTwo = () => {
  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="px-4 py-6 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Top Products
        </h4>
      </div>

      <div className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5">
        <div className="col-span-3 flex items-center">
          <p className="font-medium">Product Name</p>
        </div>
        <div className="col-span-2 hidden items-center sm:flex">
          <p className="font-medium">Category</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Price</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Sold</p>
        </div>
        <div className="col-span-1 flex items-center">
          <p className="font-medium">Profit</p>
        </div>
      </div>

      {productsdata.map((product, key) => (
        <div
          className="grid grid-cols-6 border-t border-stroke px-4 py-4.5 dark:border-strokedark sm:grid-cols-8 md:px-6 2xl:px-7.5"
          key={key}
        >
          <div className="col-span-3 flex items-center">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-12.5 w-15 rounded-md">
                <Image
                  src={product.image}
                  width={60}
                  height={50}
                  alt="Product"
                />
              </div>
              <p className="text-sm text-black dark:text-white">
                {product.nama_produk}
              </p>
            </div>
          </div>
          <div className="col-span-2 hidden items-center sm:flex">
            <p className="text-sm text-black dark:text-white">
              {product.kategori?.nama}
            </p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">
              ${product.harga}
            </p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-black dark:text-white">
              {product.satuan?.nama}
            </p>
          </div>
          <div className="col-span-1 flex items-center">
            <p className="text-sm text-meta-3">${product.kategori?.nama}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TableTwo;
