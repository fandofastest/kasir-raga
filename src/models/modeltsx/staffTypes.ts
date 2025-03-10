// staffTypes.ts
export interface Staff {
  _id?: string;
  name: string;
  email?: string;
  password?: string;
  role: "kasir" | "staffAntar" | "staffBongkar";

  nohp: string;
  alamat?: string;
}
