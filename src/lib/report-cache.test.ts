import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearReportCache,
  getCachedReport,
  setCachedReport,
} from "./report-cache";
import { getProductContext } from "./data";
import { generateFallbackReport } from "./generate-report";
import type { DeforestationReport } from "./report-types";

const reportForProduct = (productId: string): DeforestationReport => {
  const context = getProductContext(productId);
  if (!context) {
    throw new Error(`Missing context for ${productId} in fixture data`);
  }
  return generateFallbackReport(context);
};

describe("report-cache", () => {
  const originalTtl = process.env.REPORT_CACHE_TTL_MS;

  beforeEach(() => {
    clearReportCache();
    delete process.env.REPORT_CACHE_TTL_MS;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalTtl === undefined) {
      delete process.env.REPORT_CACHE_TTL_MS;
    } else {
      process.env.REPORT_CACHE_TTL_MS = originalTtl;
    }
  });

  it("returns undefined when no report has been cached for the id", () => {
    expect(getCachedReport("nutella-750g")).toBeUndefined();
  });

  it("returns the stored report while the entry is still fresh", () => {
    const report = reportForProduct("nutella-750g");
    setCachedReport("nutella-750g", report);

    expect(getCachedReport("nutella-750g")).toEqual(report);
  });

  it("expires and evicts entries after the configured TTL elapses", () => {
    process.env.REPORT_CACHE_TTL_MS = "5000";
    const report = reportForProduct("nutella-750g");

    setCachedReport("nutella-750g", report);
    vi.advanceTimersByTime(4999);
    expect(getCachedReport("nutella-750g")).toEqual(report);

    vi.advanceTimersByTime(2);
    expect(getCachedReport("nutella-750g")).toBeUndefined();
  });

  it("clearReportCache removes every stored entry", () => {
    setCachedReport("nutella-750g", reportForProduct("nutella-750g"));
    setCachedReport("cadbury-dairy-milk", reportForProduct("cadbury-dairy-milk"));

    clearReportCache();

    expect(getCachedReport("nutella-750g")).toBeUndefined();
    expect(getCachedReport("cadbury-dairy-milk")).toBeUndefined();
  });
});
