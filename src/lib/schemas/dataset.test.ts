import { describe, expect, it } from "vitest";
import { CertificationStrength, CommodityAmount } from "../enums";
import { parseDataset } from "./dataset";

const minimalDataset = () => {
  return {
    commodities: [
      {
        id: "palm-oil",
        name: "Palm Oil",
        deforestationLink: "Plantations replace forest.",
        keyRegions: ["Indonesia"],
        scale: "Large global footprint.",
      },
    ],
    companies: [
      {
        id: "acme",
        name: "Acme Foods",
        deforestationPolicy: null,
        traceabilitySummary: "Claims mill-level traceability.",
        sourcingRegions: ["Indonesia"],
        certifications: ["RSPO"],
        incidents: [],
      },
    ],
    products: [
      {
        id: "test-spread",
        name: "Test Spread",
        brand: "Test Brand",
        companyId: "acme",
        category: "Spreads",
        barcode: "",
        imageUrl: "",
        commodities: [
          {
            commodityId: "palm-oil",
            isPrimary: true,
            amount: CommodityAmount.High,
          },
        ],
        certifications: [
          {
            name: "RSPO",
            scope: "Palm oil",
            strength: CertificationStrength.Moderate,
          },
        ],
        riskScore: 5,
        riskFactors: ["Contains palm oil."],
        mitigatingFactors: ["RSPO member."],
        alternatives: [],
        sources: [],
      },
    ],
  };
};

describe("parseDataset", () => {
  it("parses a minimal valid dataset and normalises missing ngosScore to null", () => {
    const data = parseDataset(minimalDataset());
    expect(data.products).toHaveLength(1);
    expect(data.companies[0]?.ngosScore).toBeNull();
  });

  it("preserves an explicit ngosScore string", () => {
    const input = minimalDataset();
    input.companies[0]!.ngosScore = "Example NGO score line.";
    const data = parseDataset(input);
    expect(data.companies[0]?.ngosScore).toBe("Example NGO score line.");
  });

  it("throws when riskScore is out of range", () => {
    const input = minimalDataset();
    input.products[0]!.riskScore = 0;
    expect(() => parseDataset(input)).toThrow(/Invalid dataset/);
  });
});
