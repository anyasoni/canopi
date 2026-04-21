import { describe, expect, it } from "vitest";
import { getProductContext, getProductById } from "./data";

describe("getProductById", () => {
  it("returns a product for a known id", () => {
    const product = getProductById("nutella-750g");
    expect(product).toBeDefined();
    expect(product?.name).toBe("Nutella");
  });

  it("returns undefined for unknown id", () => {
    expect(getProductById("does-not-exist")).toBeUndefined();
  });
});

describe("getProductContext", () => {
  it("returns undefined for unknown product id", () => {
    expect(getProductContext("does-not-exist")).toBeUndefined();
  });

  it("returns product, company, and commodity details for a known id", () => {
    const ctx = getProductContext("nutella-750g");
    expect(ctx).not.toBeNull();
    expect(ctx?.product.id).toBe("nutella-750g");
    expect(ctx?.company?.id).toBe("ferrero");
    expect(ctx?.commodities.length).toBeGreaterThan(0);
    expect(ctx?.commodities[0]?.detail?.id).toBe("palm-oil");
  });
});
