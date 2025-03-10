import { Product } from "./productTypes";

interface CartItem extends Product {
  quantity: number;
  harga: number;
  note?: string;
}

export default CartItem;
