import type { DeforestationReport } from "./report-types";

const DEFAULT_TTL_MS = 60 * 60 * 1000;
const MIN_TTL_MS = 1000;
const MAX_TTL_MS = 24 * 60 * 60 * 1000;

const resolveTtlMs = (): number => {
  const raw = process.env.REPORT_CACHE_TTL_MS
  if (!raw) {
    return DEFAULT_TTL_MS;
  }
  if (!/^\d+$/.test(raw)) {
    console.warn(`[report-cache] ignoring REPORT_CACHE_TTL_MS=${raw}; expected a positive integer`);
    return DEFAULT_TTL_MS;
  }
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < MIN_TTL_MS || parsed > MAX_TTL_MS) {
    console.warn(
      `[report-cache] ignoring REPORT_CACHE_TTL_MS=${raw}; expected integer in [${MIN_TTL_MS}, ${MAX_TTL_MS}]`,
    );
    return DEFAULT_TTL_MS;
  }
  return parsed;
};

type CacheEntry = Readonly<{
  report: DeforestationReport;
  expiresAt: number;
}>;

const cache = new Map<string, CacheEntry>();

export const getCachedReport = (productId: string): DeforestationReport | undefined => {
  const entry = cache.get(productId);
  if (!entry) {
    return undefined;
  }
  if (entry.expiresAt <= Date.now()) {
    cache.delete(productId);
    return undefined;
  }
  return entry.report;
};

export const setCachedReport = (productId: string, report: DeforestationReport): void => {
  cache.set(productId, {
    report,
    expiresAt: Date.now() + resolveTtlMs(),
  });
};

export const clearReportCache = (): void => {
  cache.clear();
};
