import { describe, expect, it } from "vitest";
import type { Product } from "./schemas/dataset";
import { filterProductsBySearchQuery } from "./filter-products";

const baseProduct = (overrides: Partial<Product>): Product => ({
  id: "p1",
  name: "Chocolate Bar",
  brand: "Cocoa Co",
  companyId: "c1",
  category: "Snacks",
  barcode: "123",
  imageUrl: "https://example.com/x.png",
  commodities: [],
  certifications: [],
  riskScore: 5,
  riskFactors: [],
  mitigatingFactors: [],
  alternatives: [],
  sources: [],
  ...overrides,
});

describe("filterProductsBySearchQuery", () => {
  const products = [
    baseProduct({ id: "1", name: "Palm Spread", brand: "GreenFields", category: "Spreads" }),
    baseProduct({ id: "2", name: "Oat Drink", brand: "BlueRiver", category: "Beverages" }),
  ];

  it("returns all products when query is empty or whitespace", () => {
    expect(filterProductsBySearchQuery({ products, query: "" })).toEqual(products);
    expect(filterProductsBySearchQuery({ products, query: "   " })).toEqual(products);
  });

  it("filters by name case-insensitively", () => {
    expect(filterProductsBySearchQuery({ products, query: "PALM" })).toEqual([products[0]]);
    expect(filterProductsBySearchQuery({ products, query: "oat" })).toEqual([products[1]]);
  });

  it("filters by brand case-insensitively", () => {
    expect(filterProductsBySearchQuery({ products, query: "green" })).toEqual([products[0]]);
    expect(filterProductsBySearchQuery({ products, query: "BLUE" })).toEqual([products[1]]);
  });

  it("filters by category case-insensitively", () => {
    expect(filterProductsBySearchQuery({ products, query: "beverage" })).toEqual([products[1]]);
    expect(filterProductsBySearchQuery({ products, query: "SPREADS" })).toEqual([products[0]]);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterProductsBySearchQuery({ products, query: "zzz" })).toEqual([]);
  });
});
