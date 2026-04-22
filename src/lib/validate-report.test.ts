import { describe, expect, it } from "vitest";
import { ReportRiskTier } from "./enums";
import { parseDeforestationReport } from "./validate-report";

const minimalValidReport = () => {
  return {
    verdict: {
      score: 5,
      level: ReportRiskTier.Moderate,
      summary: "Moderate overall risk.",
    },
    commodities: [
      {
        id: "cocoa",
        name: "Cocoa",
        amount: "high",
        riskTier: ReportRiskTier.Moderate,
        explanation: "Cocoa can drive deforestation when poorly sourced.",
      },
    ],
    certifications: [
      {
        name: "Example",
        scope: "Cocoa",
        strength: "moderate",
        verdict: "Helps but is not a guarantee.",
      },
    ],
    company: {
      name: "Example Co",
      summary: "Mixed public record.",
      incidents: [],
    },
    bottomLine: "Worth comparing alternatives when available.",
    alternatives: [],
  };
};

describe("parseDeforestationReport", () => {
  it("accepts a minimal valid report", () => {
    const parsed = parseDeforestationReport(minimalValidReport());
    expect(parsed).not.toBeNull();
    expect(parsed?.verdict.score).toBe(5);
  });

  it("rejects unknown top-level keys (strict schema)", () => {
    const bad = { ...minimalValidReport(), extra: 1 };
    expect(parseDeforestationReport(bad)).toBeNull();
  });

  it("rejects verdict score outside 1-10", () => {
    const bad = {
      ...minimalValidReport(),
      verdict: { ...minimalValidReport().verdict, score: 11 },
    };
    expect(parseDeforestationReport(bad)).toBeNull();
  });
});
