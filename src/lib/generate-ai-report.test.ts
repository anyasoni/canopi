import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProductContext } from "./data";
import { generateAIReport } from "./generate-ai-report";
import { generateFallbackReport } from "./generate-report";
import type { DeforestationReport } from "./report-types";
import type { ProductContext } from "./types";

const { anthropicCreate, anthropicConstructor } = vi.hoisted(() => {
  const create = vi.fn();
  const constructor = vi.fn(() => ({ messages: { create } }));
  return { anthropicCreate: create, anthropicConstructor: constructor };
});

vi.mock("@anthropic-ai/sdk", () => ({
  default: anthropicConstructor,
}));

const REPORT_TOOL_NAME = "emit_deforestation_report";

const loadContext = (id: string): ProductContext => {
  const ctx = getProductContext(id);
  if (!ctx) {
    throw new Error(`Missing product context for ${id} in fixture data`);
  }
  return ctx;
};

const toolUseResponse = (
  input: unknown,
  options: Readonly<{ name?: string; includePreamble?: boolean }> = {},
) => {
  const { name = REPORT_TOOL_NAME, includePreamble = true } = options;
  const content: Array<Record<string, unknown>> = [];
  if (includePreamble) {
    content.push({ type: "text", text: "Calling the report tool." });
  }
  content.push({ type: "tool_use", id: "toolu_123", name, input });
  return { content };
};

const validReportFor = (context: ProductContext): DeforestationReport =>
  generateFallbackReport(context);

const runGenerateAIReport = async (
  args: Parameters<typeof generateAIReport>[0],
): Promise<DeforestationReport | null> => {
  const pending = generateAIReport(args);
  for (let i = 0; i < 10; i += 1) {
    await vi.runAllTimersAsync();
  }
  return pending;
};

describe("generateAIReport", () => {
  beforeEach(() => {
    anthropicCreate.mockReset();
    anthropicConstructor.mockClear();
    vi.useFakeTimers();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("constructs the Anthropic client with the provided API key", async () => {
    const context = loadContext("nutella-750g");
    anthropicCreate.mockResolvedValueOnce(toolUseResponse(validReportFor(context)));

    await runGenerateAIReport({ apiKey: "sk-test-123", context });

    expect(anthropicConstructor).toHaveBeenCalledWith({ apiKey: "sk-test-123" });
  });

  it("forces the model to call the report tool and caches the analyst prompt + tool", async () => {
    const context = loadContext("nutella-750g");
    anthropicCreate.mockResolvedValueOnce(toolUseResponse(validReportFor(context)));

    await runGenerateAIReport({ apiKey: "sk-test", context });

    const request = anthropicCreate.mock.calls[0][0];
    expect(request.tool_choice).toEqual({ type: "tool", name: REPORT_TOOL_NAME });
    expect(request.tools).toHaveLength(1);
    expect(request.tools[0].name).toBe(REPORT_TOOL_NAME);
    expect(request.tools[0].cache_control).toEqual({ type: "ephemeral" });
    expect(request.tools[0].input_schema.type).toBe("object");
    expect(Array.isArray(request.system)).toBe(true);
    expect(request.system[0].cache_control).toEqual({ type: "ephemeral" });
  });

  it("returns the parsed report from the tool_use block", async () => {
    const context = loadContext("nutella-750g");
    const expected = validReportFor(context);
    anthropicCreate.mockResolvedValueOnce(toolUseResponse(expected));

    const result = await runGenerateAIReport({ apiKey: "sk-test", context });

    expect(result).toEqual(expected);
    expect(anthropicCreate).toHaveBeenCalledTimes(1);
  });

  it("retries when the model responds without calling the tool", async () => {
    const context = loadContext("nutella-750g");
    const expected = validReportFor(context);
    anthropicCreate
      .mockResolvedValueOnce({ content: [{ type: "text", text: "I refuse." }] })
      .mockResolvedValueOnce(toolUseResponse(expected));

    const result = await runGenerateAIReport({ apiKey: "sk-test", context });

    expect(result).toEqual(expected);
    expect(anthropicCreate).toHaveBeenCalledTimes(2);
  });

  it("returns null and warns when every attempt fails to call the tool", async () => {
    const context = loadContext("nutella-750g");
    anthropicCreate.mockResolvedValue({ content: [{ type: "text", text: "still no tool" }] });
    const warnSpy = vi.spyOn(console, "warn");

    const result = await runGenerateAIReport({ apiKey: "sk-test", context });

    expect(result).toBeNull();
    expect(anthropicCreate.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("rejects a tool input whose verdict score does not match the product", async () => {
    const context = loadContext("nutella-750g");
    const base = validReportFor(context);
    const mismatched = {
      ...base,
      verdict: {
        ...base.verdict,
        score: context.product.riskScore === 10 ? 1 : context.product.riskScore + 1,
      },
    };
    anthropicCreate.mockResolvedValue(toolUseResponse(mismatched));

    const result = await runGenerateAIReport({ apiKey: "sk-test", context });

    expect(result).toBeNull();
  });

  it("rejects alternatives that are not in the product's allowed list", async () => {
    const context = loadContext("nutella-750g");
    const base = validReportFor(context);
    const tampered = {
      ...base,
      alternatives: [
        {
          id: "not-a-real-alternative",
          name: "Fake",
          brand: "Nowhere",
          category: "Spreads",
          riskScore: 2,
          reason: "Invented alternative, should be rejected.",
        },
      ],
    };
    anthropicCreate.mockResolvedValue(toolUseResponse(tampered));

    const result = await runGenerateAIReport({ apiKey: "sk-test", context });

    expect(result).toBeNull();
  });

  it("rejects a tool input that does not satisfy the report schema", async () => {
    const context = loadContext("nutella-750g");
    anthropicCreate.mockResolvedValue(
      toolUseResponse({ verdict: { score: 5 }, not: "a report" }),
    );

    const result = await runGenerateAIReport({ apiKey: "sk-test", context });

    expect(result).toBeNull();
  });

  it("returns null and swallows thrown errors so the caller can fall back", async () => {
    const context = loadContext("nutella-750g");
    anthropicCreate.mockRejectedValue(new Error("rate limited"));

    const result = await runGenerateAIReport({ apiKey: "sk-test", context });

    expect(result).toBeNull();
  });
});
