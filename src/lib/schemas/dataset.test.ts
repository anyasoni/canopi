import { describe, expect, it } from "vitest";
import { CertificationStrength, CommodityAmount } from "../enums";
import { parseDataset } from "./dataset";

type DatasetFixture = ReturnType<typeof makeDataset>;
type DatasetProduct = DatasetFixture["products"][number];
type DatasetCompany = DatasetFixture["companies"][number];

const makeDataset = () => ({
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
      deforestationPolicy: "",
      traceabilitySummary: "Claims mill-level traceability.",
      sourcingRegions: ["Indonesia"],
      certifications: ["RSPO"],
      incidents: [],
      ngosScore: "",
    },
  ],
  products: [
    {
      id: "test-spread",
      name: "Test Spread",
      brand: "Test Brand",
      companyId: "acme",
      category: "Spreads",
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
      sources: [] as Array<{ label: string; url: string }>,
    },
  ],
});

const withProduct = (
  overrides: Partial<DatasetProduct>,
): DatasetFixture => {
  const dataset = makeDataset();
  dataset.products = [{ ...dataset.products[0], ...overrides }];
  return dataset;
};

const withCompany = (
  overrides: Partial<DatasetCompany>,
): DatasetFixture => {
  const dataset = makeDataset();
  dataset.companies = [{ ...dataset.companies[0], ...overrides }];
  return dataset;
};

describe("parseDataset", () => {
  it("parses a minimal valid dataset", () => {
    const data = parseDataset(makeDataset());
    expect(data.products).toHaveLength(1);
    expect(data.companies).toHaveLength(1);
    expect(data.commodities).toHaveLength(1);
  });

  it("defaults an omitted company.ngosScore to null", () => {
    const dataset = makeDataset();
    const companyWithoutNgos: Omit<DatasetCompany, "ngosScore"> = {
      id: dataset.companies[0].id,
      name: dataset.companies[0].name,
      deforestationPolicy: dataset.companies[0].deforestationPolicy,
      traceabilitySummary: dataset.companies[0].traceabilitySummary,
      sourcingRegions: dataset.companies[0].sourcingRegions,
      certifications: dataset.companies[0].certifications,
      incidents: dataset.companies[0].incidents,
    };
    const data = parseDataset({ ...dataset, companies: [companyWithoutNgos] });
    expect(data.companies[0]?.ngosScore).toBeNull();
  });

  it("preserves an explicit company.ngosScore string", () => {
    const data = parseDataset(withCompany({ ngosScore: "Example NGO score." }));
    expect(data.companies[0]?.ngosScore).toBe("Example NGO score.");
  });

  it("rejects a product riskScore outside 1-10", () => {
    expect(() => parseDataset(withProduct({ riskScore: 0 }))).toThrow(/riskScore/);
    expect(() => parseDataset(withProduct({ riskScore: 11 }))).toThrow(/riskScore/);
  });

  it("rejects an unknown top-level key (strict schema)", () => {
    const bad = { ...makeDataset(), extra: [] };
    expect(() => parseDataset(bad)).toThrow(/Invalid dataset/);
  });

  it("rejects an invalid commodity amount enum value", () => {
    const bad = withProduct({
      commodities: [
        {
          commodityId: "palm-oil",
          isPrimary: true,
          // @ts-expect-error -- intentionally invalid enum value for parser negative test
          amount: "oodles",
        },
      ],
    });
    expect(() => parseDataset(bad)).toThrow(/amount/);
  });

  it("rejects a non-URL product source", () => {
    const bad = withProduct({
      sources: [{ label: "Bad source", url: "not-a-url" }],
    });
    expect(() => parseDataset(bad)).toThrow(/sources/);
  });
});
