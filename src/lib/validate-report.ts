import {
  DeforestationReportSchema,
  type DeforestationReport,
} from "./schemas/deforestation-report";

export const parseDeforestationReport = (value: unknown): DeforestationReport | null => {
  const result = DeforestationReportSchema.safeParse(value);
  if (!result.success) {
    return null;
  }
  return result.data;
};

const fencedBodyIfWholeStringIsBlock = (s: string): string | null => {
  const m = s.match(/^```(?:json)?\s*\r?\n([\s\S]*?)\r?\n```\s*$/i);
  return m ? m[1].trim() : null;
};

const fencedBodyFromFirstBlock = (s: string): string | null => {
  const open = s.match(/```(?:json)?\s*\r?\n/i);
  if (open?.index === undefined) {
    return null;
  }
  const innerStart = open.index + open[0].length;
  const closeIdx = s.lastIndexOf("```");
  if (closeIdx < innerStart) {
    return null;
  }
  return s.slice(innerStart, closeIdx).trim();
};

export const stripJsonFromMarkdownFences = (text: string): string => {
  const s = text.trim();
  return fencedBodyIfWholeStringIsBlock(s) ?? fencedBodyFromFirstBlock(s) ?? s;
};
