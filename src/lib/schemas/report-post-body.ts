import { z } from "zod";

export const ReportPostBodySchema = z
  .object({
    productId: z.string().trim().min(1),
  })
  .strict();

export type ReportPostBody = z.infer<typeof ReportPostBodySchema>;
