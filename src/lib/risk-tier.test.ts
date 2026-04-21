import { describe, expect, it } from "vitest";
import { ReportRiskTier } from "./enums";
import { reportRiskTierFromScore } from "./risk-tier";

describe("reportRiskTierFromScore", () => {
  it("maps 1-3 to low", () => {
    expect(reportRiskTierFromScore(1)).toBe(ReportRiskTier.Low);
    expect(reportRiskTierFromScore(3)).toBe(ReportRiskTier.Low);
  });

  it("maps 4-6 to moderate", () => {
    expect(reportRiskTierFromScore(4)).toBe(ReportRiskTier.Moderate);
    expect(reportRiskTierFromScore(6)).toBe(ReportRiskTier.Moderate);
  });

  it("maps 7-10 to high", () => {
    expect(reportRiskTierFromScore(7)).toBe(ReportRiskTier.High);
    expect(reportRiskTierFromScore(10)).toBe(ReportRiskTier.High);
  });
});
