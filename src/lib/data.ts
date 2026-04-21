import datasetJson from "@/data/dataset.json";
import { parseDataset } from "./schemas/dataset";
import type { Commodity, Company, Product } from "./schemas/dataset";
import type { ProductContext } from "./types";

const data = parseDataset(datasetJson);

export const getAllProducts = (): Product[] => data.products;

export const getProductById = (id: string): Product | undefined =>
  data.products.find((p) => p.id === id);

export const getCompanyById = (id: string): Company | undefined =>
  data.companies.find((c) => c.id === id);

export const getCommodityById = (id: string): Commodity | undefined =>
  data.commodities.find((c) => c.id === id);

export const getProductContext = (productId: string): ProductContext | undefined => {
  const product = getProductById(productId);
  if (!product) {
    return undefined;
  }

  const company = getCompanyById(product.companyId);
  const commodities = product.commodities.map((pc) => ({
    ...pc,
    detail: getCommodityById(pc.commodityId),
  }));

  return { product, company, commodities };
};
