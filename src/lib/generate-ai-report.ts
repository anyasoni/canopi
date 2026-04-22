import Anthropic from "@anthropic-ai/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ProductContext } from "./types";
import type { DeforestationReport } from "./report-types";
import { DeforestationReportSchema } from "./schemas/deforestation-report";
import { reportRiskTierFromScore } from "./risk-tier";
import { parseDeforestationReport, stripJsonFromMarkdownFences } from "./validate-report";

const MODEL = "claude-sonnet-4-20250514";
const AI_MAX_ATTEMPTS = 3;
const AI_REQUEST_TIMEOUT_MS = 9000;
const AI_RETRY_BASE_MS = 400;

const DEFORESTATION_REPORT_JSON_SCHEMA = JSON.stringify(
  zodToJsonSchema(DeforestationReportSchema, { name: "DeforestationReport" }),
  null,
  2,
);

const ANALYST_SYSTEM_PROMPT = [
  "You are a deforestation risk analyst writing for consumers.",
  "",
  "You receive structured JSON about a product, its parent company, and its commodities.",
  "",
  "Respond with a single JSON object only (no markdown fences). The object MUST conform to this JSON Schema:",
  DEFORESTATION_REPORT_JSON_SCHEMA,
  "",
  "Rules:",
  "- Write in plain English for a non-expert.",
  "- Be honest about uncertainty - distinguish company claims from independent evidence.",
  "- Where claims conflict with NGO findings, highlight the tension.",
  "- Never invent facts beyond the input JSON.",
  "- Keep verdict summary to 1-2 sentences; commodity explanations 1-2 sentences each; certification verdicts 1-2 sentences; company summary 2-3 sentences; bottomLine 2-3 sentences.",
  "- verdict.score must match the product riskScore from the input.",
  "- verdict.level must be \"low\" for scores 1-3, \"moderate\" for 4-6, \"high\" for 7-10.",
  '- Every alternatives[].id must appear in the input product\'s "alternatives" array; if that array is empty, return an empty alternatives array.',
].join("\n");

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const extractTextContent = (message: { content: unknown }): string => {
  if (!Array.isArray(message.content)) {
    return "";
  }
  const parts: string[] = [];
  for (const block of message.content) {
    if (!isRecord(block)) {
      continue;
    }
    if (block.type !== "text") {
      continue;
    }
    const text = block.text;
    if (typeof text !== "string") {
      continue;
    }
    parts.push(text);
  }
  return parts.join("\n").trim();
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
): Promise<DeforestationReport | null> => {
  const userPayload = {
    product: context.product,
    company: context.company ?? null,
    commodities: context.commodities,
  };

  try {
    const message = await withTimeout(
      client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: ANALYST_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: JSON.stringify(userPayload),
          },
        ],
      }),
      AI_REQUEST_TIMEOUT_MS,
    );

    const rawText = extractTextContent(message);
    const jsonText = stripJsonFromMarkdownFences(rawText);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return null;
    }

    const report = parseDeforestationReport(parsed);
    if (!report) {
      return null;
    }
    if (!reportMatchesProductContext(report, context)) {
      return null;
    }
    return report;
  } catch {
    return null;
  }
};

export const generateAIReport = async (
  params: Readonly<{ apiKey: string; context: ProductContext }>,
): Promise<DeforestationReport | null> => {
  const { apiKey, context } = params;
  const client = new Anthropic({ apiKey });

  for (let attempt = 0; attempt < AI_MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await sleep(AI_RETRY_BASE_MS * attempt);
    }
    const report = await fetchReportFromModel(client, context);
    if (report) {
      return report;
    }
  }

  return null;
};
