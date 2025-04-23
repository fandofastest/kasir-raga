interface Customer {
  _id: string;
  nama: string;
  nohp: string;
  kategori : string;
  alamat: string;
  kategori_konsumen?: { _id: string; nama: string };

}

export default Customer;
