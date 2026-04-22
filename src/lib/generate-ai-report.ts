import Anthropic from "@anthropic-ai/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ProductContext } from "./types";
import type { DeforestationReport } from "./report-types";
import { DeforestationReportSchema } from "./schemas/deforestation-report";
import { reportRiskTierFromScore } from "./risk-tier";
import { parseDeforestationReport } from "./validate-report";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const AI_MAX_ATTEMPTS = 3;
const AI_REQUEST_TIMEOUT_MS = 30000;
const AI_RETRY_BASE_MS = 400;
const AI_MAX_TOKENS = 2048;
const REPORT_TOOL_NAME = "emit_deforestation_report";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const resolveModelId = (): string => {
  const override = process.env.ANTHROPIC_MODEL?.trim();
  if (override && override.length > 0) {
    return override;
  }
  return DEFAULT_MODEL;
};

const isToolInputSchema = (value: unknown): value is Anthropic.Tool.InputSchema => {
  if (!isRecord(value)) {
    return false;
  }
  if (value.type !== "object") {
    return false;
  }
  if ("required" in value) {
    const required = value.required;
    if (
      required !== undefined &&
      required !== null &&
      (!Array.isArray(required) || required.some((item) => typeof item !== "string"))
    ) {
      return false;
    }
  }
  return true;
};

const REPORT_TOOL_INPUT_SCHEMA = (() => {
  const raw = zodToJsonSchema(DeforestationReportSchema);
  if (!isRecord(raw)) {
    throw new Error("Deforestation report tool schema must be an object");
  }
  const { $schema, ...rest } = raw;
  void $schema;
  if (!isToolInputSchema(rest)) {
    throw new Error("Deforestation report tool schema must be a JSON object schema");
  }
  return rest;
})();

const REPORT_TOOL: Anthropic.Tool = {
  name: REPORT_TOOL_NAME,
  description:
    "Emit the deforestation-risk report for the product in the user message. " +
    "Populate every required field. verdict.score must equal the product's " +
    "riskScore and verdict.level must reflect its tier (low: 1-3, moderate: 4-6, high: 7-10). " +
    "Only include alternatives whose id appears in the product's alternatives array.",
  input_schema: REPORT_TOOL_INPUT_SCHEMA,
};

const ANALYST_SYSTEM_PROMPT =
  "You are a deforestation risk analyst writing for consumers.\n" +
  "\n" +
  "You receive structured JSON about a product, its parent company, and its " +
  "commodities. Analyse it and emit the report by calling the " +
  `\`${REPORT_TOOL_NAME}\` tool. Do not produce any plain-text output.\n` +
  "\n" +
  "Rules:\n" +
  "- Write in plain English for a non-expert.\n" +
  "- Be honest about uncertainty: distinguish company claims from independent evidence.\n" +
  "- Where claims conflict with NGO findings, highlight the tension.\n" +
  "- Never invent facts beyond the input JSON.\n" +
  "- Keep verdict.summary to 1-2 sentences; each commodity explanation 1-2 sentences; " +
  "each certification verdict 1-2 sentences; company.summary 2-3 sentences; bottomLine 2-3 sentences.";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Anthropic request timed out"));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });

const extractToolUseInput = (message: { content: unknown }): unknown => {
  if (!Array.isArray(message.content)) {
    return null;
  }
  for (const block of message.content) {
    if (!isRecord(block)) {
      continue;
    }
    if (block.type !== "tool_use") {
      continue;
    }
    if (block.name !== REPORT_TOOL_NAME) {
      continue;
    }
    return block.input ?? null;
  }
  return null;
};

const reportMatchesProductContext = (
  report: DeforestationReport,
  context: ProductContext,
): boolean => {
  if (report.verdict.score !== context.product.riskScore) {
    return false;
  }
  const expected = reportRiskTierFromScore(context.product.riskScore);
  if (report.verdict.level !== expected) {
    return false;
  }
  const allowedIds = new Set(context.product.alternatives);
  for (const alt of report.alternatives) {
    if (!allowedIds.has(alt.id)) {
      return false;
    }
  }
  return true;
};

const fetchReportFromModel = async (
  client: Anthropic,
  context: ProductContext,
  model: string,
): Promise<DeforestationReport | null> => {
  const userPayload = {
    product: context.product,
    company: context.company ?? null,
    commodities: context.commodities,
  };

  try {
    const message = await withTimeout(
      client.messages.create({
        model,
        max_tokens: AI_MAX_TOKENS,
        system: [
          {
            type: "text",
            text: ANALYST_SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        tools: [{ ...REPORT_TOOL, cache_control: { type: "ephemeral" } }],
        tool_choice: { type: "tool", name: REPORT_TOOL_NAME },
        messages: [
          {
            role: "user",
            content: JSON.stringify(userPayload),
          },
        ],
      }),
      AI_REQUEST_TIMEOUT_MS,
    );

    const toolInput = extractToolUseInput(message);
    if (toolInput === null) {
      console.warn("generateAIReport: model did not call the report tool");
      return null;
    }

    const report = parseDeforestationReport(toolInput);
    if (!report) {
      console.warn("generateAIReport: tool input did not match report schema");
      return null;
    }
    if (!reportMatchesProductContext(report, context)) {
      console.warn(
        "generateAIReport: tool input did not match product context (score or alternatives)",
      );
      return null;
    }
    return report;
  } catch (err) {
    console.warn("generateAIReport: model request failed", err);
    return null;
  }
};

export const generateAIReport = async (
  params: Readonly<{ apiKey: string; context: ProductContext }>,
): Promise<DeforestationReport | null> => {
  const { apiKey, context } = params;
  const productId = context.product.id;
  const model = resolveModelId();
  const client = new Anthropic({ apiKey });

  for (let attempt = 0; attempt < AI_MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await sleep(AI_RETRY_BASE_MS * attempt);
    }
    console.info(
      `[generateAIReport] ${productId}: attempt ${attempt + 1}/${AI_MAX_ATTEMPTS} to ${model}`,
    );
    const report = await fetchReportFromModel(client, context, model);
    if (report) {
      console.info(
        `[generateAIReport] ${productId}: attempt ${attempt + 1} produced a valid report`,
      );
      return report;
    }
  }
  console.warn(`[generateAIReport] ${productId}: exhausted ${AI_MAX_ATTEMPTS} attempts`);

  return null;
};
