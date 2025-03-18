import { Product } from "./productTypes";

interface CartItem extends Product {
  quantity: number;
  harga: number;
  harga_modal: number;
  note?: string;
}

export default CartItem;
