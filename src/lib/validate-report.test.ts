import { describe, expect, it } from "vitest";
import { ReportRiskTier } from "./enums";
import { parseDeforestationReport, stripJsonFromMarkdownFences } from "./validate-report";

const minimalValidReport = () => {
  return {
    verdict: {
      score: 5,
      level: ReportRiskTier.Moderate,
      summary: "Moderate overall risk.",
    },
    commodities: [
      {
        id: "cocoa",
        name: "Cocoa",
        amount: "high",
        riskTier: ReportRiskTier.Moderate,
        explanation: "Cocoa can drive deforestation when poorly sourced.",
      },
    ],
    certifications: [
      {
        name: "Example",
        scope: "Cocoa",
        strength: "moderate",
        verdict: "Helps but is not a guarantee.",
      },
    ],
    company: {
      name: "Example Co",
      summary: "Mixed public record.",
      incidents: [],
    },
    bottomLine: "Worth comparing alternatives when available.",
    alternatives: [],
  };
};

describe("stripJsonFromMarkdownFences", () => {
  it("trims plain JSON", () => {
    expect(stripJsonFromMarkdownFences('  {"a":1}  ')).toBe('{"a":1}');
  });

  it("removes json-markdown fences", () => {
    const inner = '{"ok":true}';
    expect(stripJsonFromMarkdownFences("```json\n" + inner + "\n```")).toBe(inner);
  });

  it("removes generic code fences", () => {
    const inner = '{"ok":true}';
    expect(stripJsonFromMarkdownFences("```\n" + inner + "\n```")).toBe(inner);
  });

  it("handles CRLF line endings in fences", () => {
    const inner = '{"ok":true}';
    expect(stripJsonFromMarkdownFences("```json\r\n" + inner + "\r\n```")).toBe(inner);
  });

  it("strips a leading preamble before the fenced block", () => {
    const inner = '{"ok":true}';
    expect(
      stripJsonFromMarkdownFences("Here is the JSON:\n\n```json\n" + inner + "\n```"),
    ).toBe(inner);
  });
});

describe("parseDeforestationReport", () => {
  it("accepts a minimal valid report", () => {
    const parsed = parseDeforestationReport(minimalValidReport());
    expect(parsed).not.toBeNull();
    expect(parsed?.verdict.score).toBe(5);
  });

  it("rejects unknown top-level keys (strict schema)", () => {
    const bad = { ...minimalValidReport(), extra: 1 };
    expect(parseDeforestationReport(bad)).toBeNull();
  });

  it("rejects verdict score outside 1-10", () => {
    const bad = {
      ...minimalValidReport(),
      verdict: { ...minimalValidReport().verdict, score: 11 },
    };
    expect(parseDeforestationReport(bad)).toBeNull();
  });
});
