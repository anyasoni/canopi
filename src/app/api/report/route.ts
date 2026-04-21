import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { getProductContext } from "@/lib/data";
import { generateAIReport } from "@/lib/generate-ai-report";
import { generateFallbackReport } from "@/lib/generate-report";
import type { DeforestationReport } from "@/lib/report-types";
import { ReportPostBodySchema } from "@/lib/schemas/report-post-body";
import type { ProductContext } from "@/lib/types";

const readJsonRequestBody = async (
  req: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; response: NextResponse }> => {
  try {
    return { ok: true, value: await req.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }
};

const reportPostBodyErrorResponse = (error: ZodError): NextResponse => {
  const issues = error.issues;
  if (issues.some((issue) => issue.code === "unrecognized_keys")) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const missingProductId = issues.some(
    (issue) =>
      (issue.path.length === 0 &&
        issue.code === "invalid_type" &&
        (issue.received === "null" || issue.received === "array")) ||
      (issue.path[0] === "productId" &&
        issue.code === "invalid_type" &&
        issue.received === "undefined"),
  );
  return NextResponse.json(
    { error: missingProductId ? "Missing productId" : "Invalid productId" },
    { status: 400 },
  );
};

const parseReportPostBody = (
  json: unknown,
): { ok: true; productId: string } | { ok: false; response: NextResponse } => {
  const result = ReportPostBodySchema.safeParse(json);
  if (!result.success) {
    return { ok: false, response: reportPostBodyErrorResponse(result.error) };
  }
  return { ok: true, productId: result.data.productId };
};

const resolveReportForContext = async (
  context: ProductContext,
): Promise<DeforestationReport> => {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
  if (apiKey.length === 0) {
    return generateFallbackReport(context);
  }
  try {
    const aiReport = await generateAIReport({ apiKey, context });
    return aiReport ?? generateFallbackReport(context);
  } catch (err) {
    console.error("generateAIReport failed", err);
    return generateFallbackReport(context);
  }
};

export const POST = async (req: Request) => {
  const jsonResult = await readJsonRequestBody(req);
  if (!jsonResult.ok) {
    return jsonResult.response;
  }

  const bodyResult = parseReportPostBody(jsonResult.value);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const context = getProductContext(bodyResult.productId);
  if (!context) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const report = await resolveReportForContext(context);
  return NextResponse.json(report);
};
