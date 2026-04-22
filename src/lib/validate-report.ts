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
