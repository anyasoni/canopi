import type { Commodity, Company, Product, ProductCommodity } from "./schemas/dataset";

export type ProductContextCommodity = ProductCommodity & {
  detail?: Commodity;
};

export type ProductContext = {
  product: Product;
  company?: Company;
  commodities: ProductContextCommodity[];
};
