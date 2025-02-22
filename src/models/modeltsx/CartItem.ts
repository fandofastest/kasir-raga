import { Product } from "./productTypes";

interface CartItem extends Product {
  quantity: number;
  note?: string;
}

export default CartItem;
