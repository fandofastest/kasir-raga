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
    const res = await fetch("/api/auth/session");
    const session = await res.json();
    localStorage.setItem("mytoken", session.accessToken);
    return session.accessToken;
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
