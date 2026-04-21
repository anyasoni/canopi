import { describe, expect, it } from "vitest";
import { ReportPostBodySchema } from "./report-post-body";

describe("ReportPostBodySchema", () => {
  it("accepts a non-empty productId", () => {
    const result = ReportPostBodySchema.safeParse({ productId: "nutella-750g" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productId).toBe("nutella-750g");
    }
  });

  it("trims productId", () => {
    const result = ReportPostBodySchema.safeParse({ productId: "  nutella-750g  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productId).toBe("nutella-750g");
    }
  });

  it("rejects empty productId", () => {
    expect(ReportPostBodySchema.safeParse({ productId: "" }).success).toBe(false);
  });

  it("rejects extra keys (strict)", () => {
    expect(
      ReportPostBodySchema.safeParse({ productId: "x", extra: 1 }).success,
    ).toBe(false);
  });
});
