import { describe, expect, it } from "vitest";
import { getAllProducts, getProductContext } from "./data";
import { CommodityAmount, ReportRiskTier } from "./enums";
import { generateFallbackReport } from "./generate-report";
import { reportRiskTierFromScore } from "./risk-tier";
import { parseDeforestationReport } from "./validate-report";

const loadContext = (productId: string) => {
  const ctx = getProductContext(productId);
  if (!ctx) {
    throw new Error(`Missing product context for ${productId} in fixture data`);
  }
  return ctx;
};

describe("generateFallbackReport", () => {
  it("produces a schema-valid report with the correct verdict for every product", () => {
    const products = getAllProducts();
    expect(products.length).toBeGreaterThan(0);

    for (const product of products) {
      const context = loadContext(product.id);
      const report = generateFallbackReport(context);

      expect(parseDeforestationReport(report), product.id).not.toBeNull();
      expect(report.verdict.score, product.id).toBe(product.riskScore);
      expect(report.verdict.level, product.id).toBe(
        reportRiskTierFromScore(product.riskScore),
      );
      expect(report.verdict.summary, product.id).toContain(String(product.riskScore));
    }
  });

  it("maps product commodities onto report commodities with matching risk tiers", () => {
    const context = loadContext("nutella-750g");
    const report = generateFallbackReport(context);

    expect(report.commodities.map((c) => c.id)).toEqual(
      context.commodities.map((c) => c.commodityId),
    );

    const palmOil = report.commodities.find((c) => c.id === "palm-oil");
    expect(palmOil).toBeDefined();
    expect(palmOil?.amount).toBe(CommodityAmount.High);
    expect(palmOil?.riskTier).toBe(ReportRiskTier.High);
    expect(palmOil?.name).toBe("Palm Oil");
    expect(palmOil?.explanation.length).toBeGreaterThan(0);
  });

  it("maps each product certification into a report certification with a verdict", () => {
    const context = loadContext("nutella-750g");
    const report = generateFallbackReport(context);

    expect(report.certifications).toHaveLength(context.product.certifications.length);
    for (const cert of report.certifications) {
      expect(cert.verdict.length).toBeGreaterThan(0);
    }
  });

  it("preserves company incidents and summary when a company is present", () => {
    const context = loadContext("nutella-750g");
    const report = generateFallbackReport(context);

    expect(context.company).toBeDefined();
    expect(report.company.name).toBe(context.company?.name);
    expect(report.company.incidents).toHaveLength(context.company?.incidents.length ?? -1);
    expect(report.company.summary).toContain(context.company?.traceabilitySummary ?? "");
  });

  it("only lists alternatives that resolve to real products in the dataset", () => {
    const knownIds = new Set(getAllProducts().map((p) => p.id));

    for (const product of getAllProducts()) {
      const context = loadContext(product.id);
      const report = generateFallbackReport(context);

      for (const alt of report.alternatives) {
        expect(knownIds.has(alt.id), `${product.id} -> ${alt.id}`).toBe(true);
      }
      expect(report.alternatives.length).toBeLessThanOrEqual(
        context.product.alternatives.length,
      );
    }
  });

  it("tailors the bottom line to the product risk level", () => {
    const products = getAllProducts();
    const byTier = new Map<ReportRiskTier, string>();
    for (const product of products) {
      const report = generateFallbackReport(loadContext(product.id));
      byTier.set(report.verdict.level, report.bottomLine);
      expect(report.bottomLine).toContain(product.name);
    }

    expect(byTier.size).toBeGreaterThan(1);
    const unique = new Set(byTier.values());
    expect(unique.size).toBe(byTier.size);
  });
});
