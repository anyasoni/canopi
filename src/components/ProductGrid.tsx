"use client";

import { useCallback, useMemo, useState } from "react";
import type { Product } from "@/lib/schemas/dataset";
import { filterProductsBySearchQuery } from "@/lib/filter-products";
import { ProductCard } from "./ProductCard";
import { SearchBar } from "./SearchBar";

type ProductGridProps = {
  products: Product[];
};

export const ProductGrid = ({ products }: ProductGridProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const onDebouncedQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredProducts = useMemo(
    () => filterProductsBySearchQuery({ products, query: searchQuery }),
    [products, searchQuery],
  );

  return (
    <div className="product-grid">
      <SearchBar onDebouncedQueryChange={onDebouncedQueryChange} />
      {filteredProducts.length === 0 ? (
        <p className="product-grid__empty">
          No products found
        </p>
      ) : (
        <div className="product-grid__items">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
