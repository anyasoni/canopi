import { z } from "zod";
import { CertificationStrength, CommodityAmount, ReportRiskTier } from "../enums";

const ReportVerdictSchema = z
  .object({
    score: z.number().int().min(1).max(10),
    level: z.nativeEnum(ReportRiskTier),
    summary: z.string(),
  })
  .strict();

const ReportCommoditySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    amount: z.nativeEnum(CommodityAmount),
    riskTier: z.nativeEnum(ReportRiskTier),
    explanation: z.string(),
  })
  .strict();

const ReportCertificationSchema = z
  .object({
    name: z.string(),
    scope: z.string(),
    strength: z.nativeEnum(CertificationStrength),
    verdict: z.string(),
  })
  .strict();

const ReportCompanyIncidentSchema = z
  .object({
    year: z.number().int(),
    source: z.string(),
    summary: z.string(),
  })
  .strict();

const ReportCompanySchema = z
  .object({
    name: z.string(),
    summary: z.string(),
    incidents: z.array(ReportCompanyIncidentSchema),
  })
  .strict();

const ReportAlternativeSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    brand: z.string(),
    category: z.string(),
    riskScore: z.number().int().min(1).max(10),
    reason: z.string(),
  })
  .strict();

export const DeforestationReportSchema = z
  .object({
    verdict: ReportVerdictSchema,
    commodities: z.array(ReportCommoditySchema),
    certifications: z.array(ReportCertificationSchema),
    company: ReportCompanySchema,
    bottomLine: z.string(),
    alternatives: z.array(ReportAlternativeSchema),
  })
  .strict();

export type ReportVerdict = z.infer<typeof ReportVerdictSchema>;
export type ReportCommodity = z.infer<typeof ReportCommoditySchema>;
export type ReportCertification = z.infer<typeof ReportCertificationSchema>;
export type ReportCompanyIncident = z.infer<typeof ReportCompanyIncidentSchema>;
export type ReportCompany = z.infer<typeof ReportCompanySchema>;
export type ReportAlternative = z.infer<typeof ReportAlternativeSchema>;
export type DeforestationReport = z.infer<typeof DeforestationReportSchema>;
