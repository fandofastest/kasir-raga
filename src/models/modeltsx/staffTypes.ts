// staffTypes.ts
export interface Staff {
  _id?: string;
  name: string;
  email?: string;
  password?: string;
  role: "kasir" | "tukangAntar";
  nohp: string;
  alamat?: string;
}
