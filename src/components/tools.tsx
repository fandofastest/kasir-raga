function formatRupiah(totalPenjualan: number) {
  if (typeof totalPenjualan !== "number") return "";
  return totalPenjualan.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export { formatRupiah };
