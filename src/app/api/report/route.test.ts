import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { getProductContext } from "@/lib/data";
import { generateFallbackReport } from "@/lib/generate-report";
import type { DeforestationReport } from "@/lib/report-types";

const { generateAIReportMock } = vi.hoisted(() => ({
  generateAIReportMock: vi.fn(),
}));

vi.mock("@/lib/generate-ai-report", () => ({
  generateAIReport: generateAIReportMock,
}));

const makeRequest = (body: unknown, init?: { bodyOverride?: string }): Request =>
  new Request("http://localhost/api/report", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: init?.bodyOverride ?? JSON.stringify(body),
  });

const readJson = async (response: Response): Promise<unknown> => response.json();

const originalApiKey = process.env.ANTHROPIC_API_KEY;

const fallbackReport = (id: string): DeforestationReport => {
  const ctx = getProductContext(id);
  if (!ctx) {
    throw new Error(`Missing context for ${id} in fixture data`);
  }
  return generateFallbackReport(ctx);
};

describe("POST /api/report", () => {
  beforeEach(() => {
    generateAIReportMock.mockReset();
    delete process.env.ANTHROPIC_API_KEY;
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalApiKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalApiKey;
    }
  });

  it("returns the deterministic fallback report when no API key is set", async () => {
    const response = await POST(makeRequest({ productId: "nutella-750g" }));

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual(fallbackReport("nutella-750g"));
    expect(generateAIReportMock).not.toHaveBeenCalled();
  });

  it("calls the AI generator and returns its report when an API key is set", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    const aiReport = fallbackReport("nutella-750g");
    generateAIReportMock.mockResolvedValue(aiReport);

    const response = await POST(makeRequest({ productId: "nutella-750g" }));

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual(aiReport);
    expect(generateAIReportMock).toHaveBeenCalledTimes(1);
    expect(generateAIReportMock).toHaveBeenCalledWith({
      apiKey: "sk-test",
      context: getProductContext("nutella-750g"),
    });
  });

  it("falls back to the deterministic report when the AI generator returns null", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    generateAIReportMock.mockResolvedValue(null);

    const response = await POST(makeRequest({ productId: "nutella-750g" }));

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual(fallbackReport("nutella-750g"));
  });

  it("falls back to the deterministic report when the AI generator throws", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    generateAIReportMock.mockRejectedValue(new Error("boom"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(makeRequest({ productId: "nutella-750g" }));

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual(fallbackReport("nutella-750g"));
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("ignores an empty / whitespace-only API key and uses the fallback", async () => {
    process.env.ANTHROPIC_API_KEY = "   ";

    const response = await POST(makeRequest({ productId: "nutella-750g" }));

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual(fallbackReport("nutella-750g"));
    expect(generateAIReportMock).not.toHaveBeenCalled();
  });

  it("returns 404 for unknown product IDs", async () => {
    const response = await POST(makeRequest({ productId: "does-not-exist" }));

    expect(response.status).toBe(404);
    expect(await readJson(response)).toEqual({ error: "Product not found" });
  });

  it("returns 400 when the request body is not JSON", async () => {
    const response = await POST(
      makeRequest(null, { bodyOverride: "not-json" }),
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ error: "Invalid JSON" });
  });

  it("returns 400 when productId is missing", async () => {
    const response = await POST(makeRequest({}));

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ error: "Missing productId" });
  });

  it("returns 400 when productId is the wrong type", async () => {
    const response = await POST(makeRequest({ productId: 42 }));

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ error: "Invalid productId" });
  });

  it("returns 400 for unrecognized keys in the body", async () => {
    const response = await POST(makeRequest({ productId: "nutella-750g", rogue: 1 }));

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ error: "Invalid request body" });
  });
});
