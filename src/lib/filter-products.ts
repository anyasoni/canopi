import type { Product } from "./schemas/dataset";

export const filterProductsBySearchQuery = ({
  products,
  query,
}: {
  products: Product[];
  query: string;
}): Product[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return products;
  }

  return products.filter((product) => {
    const name = product.name.toLowerCase();
    const brand = product.brand.toLowerCase();
    const category = product.category.toLowerCase();
    return (
      name.includes(normalized) ||
      brand.includes(normalized) ||
      category.includes(normalized)
    );
  });
};
