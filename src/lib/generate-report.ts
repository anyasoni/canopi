import { CertificationStrength, CommodityAmount } from "./enums";
import type { ProductContext } from "./types";
import {
  type DeforestationReport,
  ReportRiskTier,
  type ReportAlternative,
  type ReportCertification,
  type ReportCommodity,
  type ReportCompany,
  type ReportCompanyIncident,
  type ReportVerdict,
} from "./report-types";
import { getProductById } from "./data";
import { reportRiskTierFromScore } from "./risk-tier";

const reportTierFromCommodityAmount = (amount: CommodityAmount): ReportRiskTier => {
  if (amount === CommodityAmount.High) {
    return ReportRiskTier.High;
  }
  if (amount === CommodityAmount.Moderate) {
    return ReportRiskTier.Moderate;
  }
  return ReportRiskTier.Low;
};

const buildVerdict = (context: ProductContext): ReportVerdict => {
  const { product } = context;
  const level = reportRiskTierFromScore(product.riskScore);
  const primaryRisk = product.riskFactors[0] ?? "Review the sections below for supply-chain context.";
  const summary = `Overall risk is rated ${level} (${product.riskScore}/10). ${primaryRisk}`;

  return {
    score: product.riskScore,
    level,
    summary,
  };
};

const buildCommodities = (context: ProductContext): ReportCommodity[] =>
  context.commodities.map((row) => {
    const name = row.detail?.name ?? row.commodityId;
    const explanation =
      row.detail?.deforestationLink ??
      "No commodity description is available in the dataset for this ingredient.";
    return {
      id: row.commodityId,
      name,
      amount: row.amount,
      riskTier: reportTierFromCommodityAmount(row.amount),
      explanation,
    };
  });

const certificationVerdictForStrength = (strength: CertificationStrength): string => {
  switch (strength) {
    case CertificationStrength.VeryStrong:
      return "This label is among the stronger signals in the dataset, but it still reflects what the scheme certifies—not every supply-chain risk.";
    case CertificationStrength.Strong:
      return "This certification is a meaningful signal; compare it with commodity sourcing regions and any incidents below.";
    case CertificationStrength.Moderate:
      return "This claim helps, but mass-balance or mixed models can limit how much uncertified material is kept out of the product.";
    case CertificationStrength.Weak:
      return "Treat this label cautiously: relative to stronger schemes, it may allow more gap between marketing claims and physical traceability.";
  }
};

const buildCertifications = (context: ProductContext): ReportCertification[] =>
  context.product.certifications.map((c) => ({
    name: c.name,
    scope: c.scope,
    strength: c.strength,
    verdict: certificationVerdictForStrength(c.strength),
  }));

const buildCompany = (context: ProductContext): ReportCompany => {
  const company = context.company;
  if (!company) {
    return {
      name: context.product.brand,
      summary: "Company-level sourcing data is missing from the dataset for this product.",
      incidents: [],
    };
  }

  const incidents: ReportCompanyIncident[] = company.incidents.map((i) => ({
    year: i.year,
    source: i.source,
    summary: i.summary,
  }));

  const ngo = company.ngosScore ?? "";
  const summary = `${company.traceabilitySummary} ${ngo}`.trim();

  return {
    name: company.name,
    summary,
    incidents,
  };
};

const bottomLineFromLevel = (level: ReportRiskTier, productName: string): string => {
  if (level === ReportRiskTier.Low) {
    return `${productName} sits in a lower editorial risk band, but deforestation risk is never zero—especially for tropical commodities. Use this as orientation, not a guarantee.`;
  }
  if (level === ReportRiskTier.Moderate) {
    return `${productName} has a moderate editorial risk score: certifications and company programmes may help, but there are still credible supply-chain tensions worth weighing before you buy again.`;
  }
  return `${productName} is in the higher editorial risk band in this catalogue. If you want to reduce exposure, compare the alternatives section and look for stronger traceability and independent scrutiny—not just packaging claims.`;
};

const buildAlternatives = (context: ProductContext): ReportAlternative[] => {
  const result: ReportAlternative[] = [];
  for (const altId of context.product.alternatives) {
    const alt = getProductById(altId);
    if (!alt) {
      continue;
    }
    const reason =
      alt.mitigatingFactors[0] ??
      `Listed alternative in this catalogue (editorial risk score ${alt.riskScore}/10).`;
    result.push({
      id: alt.id,
      name: alt.name,
      brand: alt.brand,
      category: alt.category,
      riskScore: alt.riskScore,
      reason,
    });
  }
  return result;
};

export const generateFallbackReport = (context: ProductContext): DeforestationReport => {
  const verdict = buildVerdict(context);
  const commodities = buildCommodities(context);
  const certifications = buildCertifications(context);
  const company = buildCompany(context);
  const bottomLine = bottomLineFromLevel(verdict.level, context.product.name);
  const alternatives = buildAlternatives(context);

  return {
    verdict,
    commodities,
    certifications,
    company,
    bottomLine,
    alternatives,
  };
};
