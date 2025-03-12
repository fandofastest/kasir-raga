// staffTypes.ts
export interface Staff {
  _id?: string;
  name: string;
  email?: string;
  password?: string;
  role: "kasir" | "staffAntar" | "staffBongkar" | "superadmin";
  nohp: string;
  alamat?: string;
  permissions?: string[]; // Tambahkan properti permissions untuk menyimpan hak akses
}
