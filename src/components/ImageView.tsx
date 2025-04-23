import { useState } from "react";
import Image from "next/image";

export default function ProductImage({ product: product }: any) {
  const defaultImage = "/images/product/default.png";
  const initialSrc = product.image
    ? `/api/image-proxy?url=${encodeURIComponent(product.image)}`
    : defaultImage;
  const [src, setSrc] = useState(initialSrc);

  return (
    <Image
    quality={1}
      fill
      src={src}
      alt="Product"
      loading="lazy"
      className="rounded-md object-cover"
      onError={() => {
        if (src !== defaultImage) {
          setSrc(defaultImage);
        }
      }}
    />
  );
}
