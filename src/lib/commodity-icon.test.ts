import { describe, expect, it } from "vitest";
import { commodityIconForId } from "./commodity-icon";

describe("commodityIconForId", () => {
  it("returns the curated emoji for each known commodity id", () => {
    expect(commodityIconForId("palm-oil")).toBe("🌴");
    expect(commodityIconForId("cocoa")).toBe("🍫");
    expect(commodityIconForId("soy")).toBe("🌱");
    expect(commodityIconForId("coffee")).toBe("☕");
    expect(commodityIconForId("tea")).toBe("🍵");
    expect(commodityIconForId("dairy-feed")).toBe("🐄");
  });

  it("falls back to a generic leaf icon for unknown commodities", () => {
    expect(commodityIconForId("unknown-crop")).toBe("🌿");
  });
});
