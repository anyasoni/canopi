import { Package } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/lib/schemas/dataset";
import { RiskBadge } from "./RiskBadge";

type ProductCardProps = {
  product: Product;
};

const hasRenderableImage = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const ProductCard = ({ product }: ProductCardProps) => {
  const showImage = hasRenderableImage(product.imageUrl);

  return (
    <Link href={`/product/${product.id}`} className="product-card">
      <div className="product-card__image-wrap">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- dataset image hosts vary and are user-curated
          <img src={product.imageUrl} alt={`${product.name} package`} className="product-card__image" />
        ) : (
          <Package
            className="product-card__fallback-icon"
            strokeWidth={1.25}
            aria-hidden
          />
        )}
      </div>
      <div className="product-card__body">
        <div className="product-card__top">
          <div className="product-card__meta">
            <h2 className="product-card__name">{product.name}</h2>
            <p className="product-card__brand">{product.brand}</p>
          </div>
          <RiskBadge score={product.riskScore} />
        </div>
        <span className="product-card__category">{product.category}</span>
      </div>
    </Link>
  );
};
