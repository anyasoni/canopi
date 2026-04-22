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
      <Report productId={product.id} />
      {product.sources.length > 0 ? (
        <section className="product-page__sources" aria-label="Product information sources">
          <h2 className="product-page__sources-title">Sources</h2>
          <ul className="product-page__sources-list">
            {product.sources.map((source) => (
              <li key={source.url} className="product-page__sources-item">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="product-page__source-link"
                >
                  {source.label.trim().length > 0 ? source.label : source.url}
                </a>
                <p className="product-page__source-url">{source.url}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
};

export default ProductPage;
