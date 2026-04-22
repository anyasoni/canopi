import { z } from "zod";
import { CertificationStrength, CommodityAmount } from "../enums";

const ProductSourceSchema = z
  .object({
    label: z.string(),
    url: z.string().url(),
  })
  .strict();

const CommoditySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    deforestationLink: z.string(),
    keyRegions: z.array(z.string()),
    scale: z.string(),
  })
  .strict();

const CompanyIncidentSchema = z
  .object({
    year: z.number().int(),
    source: z.string(),
    summary: z.string(),
  })
  .strict();

const CompanySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    deforestationPolicy: z.string().nullable(),
    traceabilitySummary: z.string(),
    sourcingRegions: z.array(z.string()),
    certifications: z.array(z.string()),
    incidents: z.array(CompanyIncidentSchema),
    ngosScore: z.string().nullable().default(null),
  })
  .strict();

const ProductCommoditySchema = z
  .object({
    commodityId: z.string(),
    isPrimary: z.boolean(),
    amount: z.nativeEnum(CommodityAmount),
  })
  .strict();

const ProductCertificationSchema = z
  .object({
    name: z.string(),
    scope: z.string(),
    strength: z.nativeEnum(CertificationStrength),
  })
  .strict();

const ProductSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    brand: z.string(),
    companyId: z.string(),
    category: z.string(),
    barcode: z.string().optional(),
    imageUrl: z.string(),
    commodities: z.array(ProductCommoditySchema),
    certifications: z.array(ProductCertificationSchema),
    riskScore: z.number().int().min(1).max(10),
    riskFactors: z.array(z.string()),
    mitigatingFactors: z.array(z.string()),
    alternatives: z.array(z.string()),
    sources: z.array(ProductSourceSchema),
  })
  .strict();

export const DatasetSchema = z
  .object({
    commodities: z.array(CommoditySchema),
    companies: z.array(CompanySchema),
    products: z.array(ProductSchema),
  })
  .strict();

export type Commodity = z.infer<typeof CommoditySchema>;
export type CompanyIncident = z.infer<typeof CompanyIncidentSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type ProductCommodity = z.infer<typeof ProductCommoditySchema>;
export type ProductCertification = z.infer<typeof ProductCertificationSchema>;
export type ProductSource = z.infer<typeof ProductSourceSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Dataset = z.infer<typeof DatasetSchema>;

const formatZodError = (error: z.ZodError): string =>
  error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ");

export const parseDataset = (input: unknown): Dataset => {
  const result = DatasetSchema.safeParse(input);
  if (!result.success) {
    throw new Error(`Invalid dataset: ${formatZodError(result.error)}`);
  }
  return result.data;
};
