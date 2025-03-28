import { toast } from "react-hot-toast";
import { signOut } from "next-auth/react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
export const fetchProducts = async () => {
  const token = await fetchUser();
  const res = await fetch(apiUrl + "/product", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (res.status == 403) {
    toast.error("Session Expired");
    signOut({ callbackUrl: "/auth/signin" });
  }
  return { data, token };
};
export async function createProduct(productData) {
  const token = await fetchUser();

  const response = await fetch("/api/product", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  });
  if (!response.ok) {
    throw new Error("Failed to add product");
  }
  const data = await response.json();
  return data;
}
export async function updateProduct(productId, updateData) {
  const token = await fetchUser();

  const response = await fetch(`/api/product?id=${productId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  });
  if (!response.ok) {
    throw new Error("Failed to update product");
  }
  const data = await response.json();
  return data; // asumsikan struktur: { message, data: updatedProduct }
}

export const deleteProduct = async (id) => {
  const token = await fetchUser();
  const res = await fetch(apiUrl + "/product", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (res.status == 403) {
    toast.error("Session Expired");
    signOut({ callbackUrl: "/auth/signin" });
  }
  return data;
};

export const deleteKonsumen = async (id) => {
  const token = await fetchUser();
  const res = await fetch(apiUrl + "/konsumen", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (res.status == 403) {
    toast.error("Session Expired");
    signOut({ callbackUrl: "/auth/signin" });
  }
  return data;
};

const fetchUser = async () => {
  try {
    const token = localStorage.getItem("mytoken");
    if (token == null) {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      localStorage.setItem("mytoken", session.accessToken);
      return session.accessToken;
    }

    // log(session.accessToken);
    return token;
  } catch (error) {
    console.error("Error fetching session:", error);
  }
};

export const fetchPelanggan = async () => {
  const token = await fetchUser();
  const res = await fetch(apiUrl + "/konsumen", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (res.status == 403) {
    toast.error("Session Expired");
    signOut({ callbackUrl: "/auth/signin" });
  }
  return { data, token };
};
export const fetchStaff = async () => {
  const token = await fetchUser();
  const res = await fetch(apiUrl + "/user", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (res.status == 403) {
    toast.error("Session Expired");
    signOut({ callbackUrl: "/auth/signin" });
  }
  return { data, token };
};
export const fetchSupplier = async () => {
  const token = await fetchUser();
  const res = await fetch(apiUrl + "/supplier", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (res.status == 403) {
    toast.error("Session Expired");
    signOut({ callbackUrl: "/auth/signin" });
  }
  return { data, token };
};

export const updateStaff = async (id, updateData) => {
  const token = await fetchUser();
  const res = await fetch(`${apiUrl}/user?id=${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });
  const data = await res.json();

  if (res.status == 403) {
    toast.error("Session Expired");
    signOut({ callbackUrl: "/auth/signin" });
  }
  return data;
};

export const deleteSupplier = async (id) => {
  const token = await fetchUser();
  const res = await fetch(apiUrl + "/supplier", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (res.status == 403) {
    toast.error("Session Expired");
    signOut({ callbackUrl: "/auth/signin" });
  }
  return data;
};
export const deleteStaff = async (id) => {
  const token = await fetchUser();
  const res = await fetch(apiUrl + "/user", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (res.status == 403) {
    toast.error("Session Expired");
    signOut({ callbackUrl: "/auth/signin" });
  }
  return data;
};

export const fetchSatuan = async () => {
  const token = await fetchUser();
  const res = await fetch(apiUrl + "/satuan", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (res.status == 403) {
    toast.error("Session Expired");
    signOut({ callbackUrl: "/auth/signin" });
  }
  return { data, token };
};

export const deleteSatuan = async (id) => {
  const token = await fetchUser();
  const res = await fetch(apiUrl + "/satuan", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (res.status == 403) {
    toast.error("Session Expired");
    signOut({ callbackUrl: "/auth/signin" });
  }
  return data;
};
export const addSatuan = async (satName) => {
  const token = await fetchUser();
  const res = await fetch(apiUrl + "/satuan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ nama: satName, deskripsi: satName }),
  });
  const data = await res.json();
  if (!res.ok) {
    toast.error("Gagal menambah satuan: " + data.error);
  } else {
    toast.success("Berhasil menambah satuan!");
  }

  if (res.status == 403) {
    toast.error("Session Expired");
    signOut({ callbackUrl: "/auth/signin" });
  }
  return { data, token };
};

export const createTransaction = async (transactionData) => {
  // Ambil token dari session (pastikan fungsi fetchUser sudah tersedia)
  const token = await fetchUser();

  // Bangun URL dengan parameter tipe_transaksi (misalnya "pembelian" atau "penjualan")
  // Jika transactionData.tipe_transaksi sudah ada, gunakan nilainya; jika tidak, bisa di-set default.
  const tipe = transactionData.tipe_transaksi || "pembelian";
  const response = await fetch(apiUrl + `/transaksi`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(transactionData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create transaction");
  }
  const data = await response.json();
  return { data, token };
};

export const createPengeluaran = async (transactionData) => {
  // Ambil token dari session (pastikan fungsi fetchUser sudah tersedia)
  const token = await fetchUser();

  // Bangun URL dengan parameter tipe_transaksi (misalnya "pembelian" atau "penjualan")
  // Jika transactionData.tipe_transaksi sudah ada, gunakan nilainya; jika tidak, bisa di-set default.
  const tipe = transactionData.tipe_transaksi || "pembelian";
  const response = await fetch(apiUrl + `/transaksi/pengeluaran`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(transactionData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create transaction");
  }
  const data = await response.json();
  return { data, token };
};

export async function updateDataTransaction(transactionId, updateData) {
  const token = await fetchUser();
  const response = await fetch(apiUrl + `/transaksi?id=${transactionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update transaction");
  }

  const data = await response.json();
  return { data, token };
}

export const fetchTransaction = async (params = {}) => {
  const token = await fetchUser();

  // Membuat query string dari parameter yang diterima
  const queryParams = new URLSearchParams(params);

  const res = await fetch(`${apiUrl}/transaksi?${queryParams.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("====================================");
  console.log(`${apiUrl}/transaksi?${queryParams.toString()}`);
  console.log("====================================");

  const data = await res.json();

  if (res.status === 403) {
    toast.error("Session Expired");
    signOut({ callbackUrl: "/auth/signin" });
  }
  return { data, token };
};

export const payInstallment = async (transactionId, amount, paymentDate) => {
  const token = await fetchUser();
  const res = await fetch(
    `${apiUrl}/transaksi/${transactionId}/payInstallment`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount,
        paymentDate,
      }),
    },
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to pay installment");
  }
  return { data, token };
};

export const payHutang = async (transactionId, amount, paymentDate) => {
  const token = await fetchUser();
  const res = await fetch(`${apiUrl}/transaksi/${transactionId}/payHutang`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount,
      paymentDate: paymentDate || new Date().toISOString(),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Gagal memproses pembayaran hutang");
  }
  return { data, token };
};

export const fetchUserById = async (id) => {
  const token = await fetchUser();
  const res = await fetch(`${apiUrl}/user?id=${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return { data, token };
};
export const updateUser = async (id, updateData) => {
  const token = await fetchUser();
  const res = await fetch(`${apiUrl}/user?id=${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to update user");
  }
  return { data, token };
};
export const photoUpload = async (e) => {
  const token = await fetchUser();

  const file = e.target.files?.[0];
  if (!file || !token) return;
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(process.env.NEXT_PUBLIC_PHOTOURL + "/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (data.url) {
    return data.url;
  }
};
export const updatePreferences = async (updateData) => {
  const token = await fetchUser(); // Fungsi untuk mendapatkan token (sesuaikan jika perlu)

  const res = await fetch(`${apiUrl}/preferences`, {
    method: "POST", // Kita menggunakan POST untuk create/update
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to update preferences");
  }
  return { data, token };
};

export const getPreferences = async () => {
  const token = await fetchUser(); // Fungsi untuk mendapatkan token
  const res = await fetch(`${apiUrl}/preferences`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to get preferences");
  }
  return { data: data.data, token };
};
// dataService.ts
export async function fetchDraftTransaction(draftId) {
  const token = await fetchUser(); // fungsi yang mengambil token
  const res = await fetch(`${apiUrl}/transaksi/${draftId}/draft`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch draft transaction");
  }
  return { data: data.data, token };
}

export async function fetchKategori() {
  const token = await fetchUser(); // fungsi yang mengambil token
  const res = await fetch(`${apiUrl}/kategori`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  console.log("==================dadada==================");
  console.log(data);
  console.log("====================================");
  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch kategori");
  }
  return { data: data, token };
}
