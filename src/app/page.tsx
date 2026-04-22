import type { Metadata } from "next";
import Image from "next/image";
import { ProductGrid } from "@/components/ProductGrid";
import { getAllProducts } from "@/lib/data";
import "./catalogue.css";

export const metadata: Metadata = {
  title: "Canopi - Is your product linked to deforestation?",
};

export default function HomePage() {
  const products = getAllProducts();

  return (
    <main className="home-page">
      <header className="home-page__header">
        <div className="home-page__title-row">
          <Image
            src="/brand/tree.png"
            alt="Canopi tree icon"
            width={40}
            height={40}
            className="home-page__title-icon"
          />
          <h1 className="home-page__title">
            CANOPI
          </h1>
          <Image
            src="/brand/tree.png"
            alt="Canopi tree icon"
            width={40}
            height={40}
            className="home-page__title-icon"
          />
        </div>
        <p className="home-page__description">
          Browse {products.length} products and open a detail page for a deforestation risk report.
        </p>
      </header>
      <ProductGrid products={products} />
    </main>
  );
}
