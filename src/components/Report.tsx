"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { DeforestationReport } from "@/lib/report-types";
import { DeforestationReportSchema } from "@/lib/schemas/deforestation-report";
import type { ProductSource } from "@/lib/schemas/dataset";
import { LoadingReport } from "./LoadingReport";
import {
  Tag,
  tagVariantForCertificationStrength,
  tagVariantForCommodityAmount,
} from "./Tag";

enum ReportRequestState {
  Loading = "loading",
  Error = "error",
  Success = "success",
}

type ReportState =
  | {
      state: ReportRequestState.Loading;
    }
  | {
      state: ReportRequestState.Error;
      message: string;
    }
  | {
      state: ReportRequestState.Success;
      report: DeforestationReport;
    };

type ReportProps = {
  productId: string;
  sources: ProductSource[];
};

const REPORT_ERROR_MESSAGE = "Failed to generate report. Please try again.";

// Keep the loading state on screen long enough for the rotating status messages
// in <LoadingReport /> to cycle through at least once, even when the API
// responds instantly (e.g. deterministic fallback, cached fetch).
const MIN_LOADING_DURATION_MS = 4000;

// /api/report is designed to always return a report (AI or deterministic
// fallback). A failure here means the route itself was unreachable, so we
// retry a couple of times to ride out transient network / dev-server blips
// before surfacing the error UI.
const REPORT_FETCH_MAX_ATTEMPTS = 3;
const REPORT_FETCH_RETRY_BASE_MS = 500;

const parseReportResponse = (json: unknown): DeforestationReport | undefined => {
  const result = DeforestationReportSchema.safeParse(json);
  if (!result.success) {
    return undefined;
  }
  return result.data;
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const waitForMinimumDuration = async <T,>(
  work: Promise<T>,
  minMs: number,
): Promise<T> => {
  const started = Date.now();
  const result = await work;
  const remaining = minMs - (Date.now() - started);
  if (remaining > 0) {
    await delay(remaining);
  }
  return result;
};

const requestReportOnce = async (productId: string): Promise<DeforestationReport> => {
  const response = await fetch("/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  });
  if (!response.ok) {
    throw new Error(`Report request failed with status ${response.status}`);
  }
  const parsed = parseReportResponse((await response.json()) as unknown);
  if (!parsed) {
    throw new Error("Report response shape was invalid");
  }
  return parsed;
};

const requestReportWithRetries = async (
  productId: string,
): Promise<DeforestationReport> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= REPORT_FETCH_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await requestReportOnce(productId);
    } catch (error) {
      lastError = error;
      console.warn(
        `[Report] ${productId}: attempt ${attempt}/${REPORT_FETCH_MAX_ATTEMPTS} failed`,
        error,
      );
      if (attempt < REPORT_FETCH_MAX_ATTEMPTS) {
        await delay(REPORT_FETCH_RETRY_BASE_MS * attempt);
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Report request failed after retries");
};

export const Report = ({ productId, sources }: ReportProps) => {
  const [reportState, setReportState] = useState<ReportState>({
    state: ReportRequestState.Loading,
  });

  const fetchReport = useCallback(async (options?: { showLoadingState?: boolean }) => {
    if (options?.showLoadingState ?? true) {
      setReportState({ state: ReportRequestState.Loading });
    }
    console.info(`[Report] ${productId}: requesting report from /api/report`);
    const startedAt = Date.now();
    try {
      const parsedReport = await waitForMinimumDuration(
        requestReportWithRetries(productId),
        MIN_LOADING_DURATION_MS,
      );
      console.info(
        `[Report] ${productId}: report ready in ${Date.now() - startedAt}ms (incl. min loading delay)`,
      );
      setReportState({
        state: ReportRequestState.Success,
        report: parsedReport,
      });
    } catch (error) {
      console.error(`[Report] ${productId}: failed to fetch report`, error);
      setReportState({
        state: ReportRequestState.Error,
        message: REPORT_ERROR_MESSAGE,
      });
    }
  }, [productId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data request happens once on mount
    void fetchReport({ showLoadingState: false });
  }, [fetchReport]);

  if (reportState.state === ReportRequestState.Loading) {
    return <LoadingReport />;
  }

  if (reportState.state === ReportRequestState.Error) {
    return (
      <section className="report-error">
        <p className="report-error__message">{reportState.message}</p>
        <button type="button" className="report-error__retry" onClick={() => void fetchReport()}>
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="report-preview">
      <article className="report-preview__section">
        <h2 className="report-preview__title">Verdict</h2>
        <p className="report-preview__summary">{reportState.report.verdict.summary}</p>
      </article>

      {reportState.report.commodities.length > 0 ? (
        <article className="report-preview__section">
          <h2 className="report-preview__title">What&apos;s in it</h2>
          <div className="report-preview__list">
            {reportState.report.commodities.map((commodity) => (
              <div key={commodity.id} className="report-preview__list-item">
                <div className="report-preview__item-heading">
                  <p className="report-preview__item-title">{commodity.name}</p>
                  <Tag
                    variant={tagVariantForCommodityAmount(commodity.amount)}
                    label={commodity.amount}
                  />
                </div>
                <p className="report-preview__item-body">{commodity.explanation}</p>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {reportState.report.certifications.length > 0 ? (
        <article className="report-preview__section">
          <h2 className="report-preview__title">Certifications</h2>
          <div className="report-preview__list">
            {reportState.report.certifications.map((certification) => (
              <div key={certification.name} className="report-preview__list-item">
                <div className="report-preview__item-heading">
                  <p className="report-preview__item-title">{certification.name}</p>
                  <Tag
                    variant={tagVariantForCertificationStrength(certification.strength)}
                    label={certification.strength}
                  />
                </div>
                <p className="report-preview__item-body">{certification.verdict}</p>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      <article className="report-preview__section">
        <h2 className="report-preview__title">The company</h2>
        <p className="report-preview__item-title">{reportState.report.company.name}</p>
        <p className="report-preview__item-body">{reportState.report.company.summary}</p>
      </article>

      <article className="report-preview__section">
        <h2 className="report-preview__title">Bottom line</h2>
        <p className="report-preview__summary">{reportState.report.bottomLine}</p>
      </article>

      {reportState.report.alternatives.length > 0 ? (
        <article className="report-preview__section">
          <h2 className="report-preview__title">Alternatives</h2>
          <div className="report-preview__alternatives">
            {reportState.report.alternatives.map((alternative) => (
              <Link
                key={alternative.id}
                href={`/product/${alternative.id}`}
                className="report-preview__alternative-card"
              >
                <p className="report-preview__item-title">{alternative.name}</p>
                <p className="report-preview__item-body">{alternative.reason}</p>
              </Link>
            ))}
          </div>
        </article>
      ) : null}

      {sources.length > 0 ? (
        <section className="product-page__sources" aria-label="Product information sources">
          <h2 className="product-page__sources-title">Sources</h2>
          <ul className="product-page__sources-list">
            {sources.map((source) => (
              <li key={source.url} className="product-page__sources-item">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="product-page__source-link"
                >
                  {source.label.trim().length > 0 ? source.label : source.url}
                </a>
                <p className="product-page__source-url">{source.url}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
};
