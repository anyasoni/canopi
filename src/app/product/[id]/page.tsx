import Link from "next/link";
import { notFound } from "next/navigation";
import { Report } from "@/components/Report";
import { RiskBadge } from "@/components/RiskBadge";
import { getProductById } from "@/lib/data";
import "../../catalogue.css";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

const ProductPage = async ({ params }: ProductPageProps) => {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <main className="product-page">
      <Link href="/" className="product-page__back-link">
        ← Back to products
      </Link>
      <header className="product-page__header">
        <div className="product-page__title-row">
          <h1 className="product-page__title">{product.name}</h1>
          <RiskBadge score={product.riskScore} size="lg" />
        </div>
        <p className="product-page__meta">
          {product.brand} · <span className="product-page__category">{product.category}</span>
        </p>
      </header>
      <hr className="product-page__divider" />
      <Report productId={product.id} sources={product.sources} />
    </main>
  );
};

export default ProductPage;
