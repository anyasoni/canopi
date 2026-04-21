import { ReportRiskTier } from "./enums";

export const reportRiskTierFromScore = (score: number): ReportRiskTier => {
  if (score <= 3) {
    return ReportRiskTier.Low;
  }
  if (score <= 6) {
    return ReportRiskTier.Moderate;
  }
  return ReportRiskTier.High;
};
