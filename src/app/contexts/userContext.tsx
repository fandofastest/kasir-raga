import React, { createContext, useContext, useEffect, useState } from "react";

type UserType = {
  id: string;
  name: string;
  email: string;
  token: string;
};

type UserContextType = {
  user: UserType | null;
  loginUser: (user: UserType) => void;
  logoutUser: () => void;
};

const UserContext = createContext<UserContextType>({} as UserContextType);

export const useUser = (): UserContextType => useContext(UserContext);

export default function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserType | null>(null);

  // Ambil user dari localStorage saat pertama kali aplikasi dimuat
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      console.log(storedUser);
    }
  }, []);

  const loginUser = (userData: UserType) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData)); // Simpan user ke localStorage
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem("user"); // Hapus dari localStorage saat logout
  };

  return (
    <UserContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </UserContext.Provider>
  );
}
