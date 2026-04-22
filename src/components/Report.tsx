"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import type { DeforestationReport } from "@/lib/report-types";
import { DeforestationReportSchema } from "@/lib/schemas/deforestation-report";
import type { ProductSource } from "@/lib/schemas/dataset";
import { commodityIconForId } from "@/lib/commodity-icon";
import { AlternativeCard } from "./AlternativeCard";
import { LoadingReport } from "./LoadingReport";
import { ReportSection } from "./ReportSection";
import { RiskBadge } from "./RiskBadge";
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

const MIN_LOADING_DURATION_MS = 4000;
const REPORT_FETCH_MAX_ATTEMPTS = 3;
const REPORT_FETCH_RETRY_BASE_MS = 500;

const clientReportCache = new Map<string, DeforestationReport>();

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

const initialReportState = (productId: string): ReportState => {
  const cached = clientReportCache.get(productId);
  if (cached) {
    return { state: ReportRequestState.Success, report: cached };
  }
  return { state: ReportRequestState.Loading };
};

export const Report = ({ productId, sources }: ReportProps) => {
  const [reportState, setReportState] = useState<ReportState>(() =>
    initialReportState(productId),
  );

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
      clientReportCache.set(productId, parsedReport);
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
    if (clientReportCache.has(productId)) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data request happens once on mount
    void fetchReport({ showLoadingState: false });
  }, [fetchReport, productId]);

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

  const { report } = reportState;
  const hasIncidents = report.company.incidents.length > 0;

  return (
    <section className="report-preview report-preview--loaded">
      <ReportSection title="Verdict">
        <div className="report-preview__verdict">
          <RiskBadge score={report.verdict.score} size="lg" />
          <p className="report-preview__summary">{report.verdict.summary}</p>
        </div>
      </ReportSection>

      {report.commodities.length > 0 ? (
        <ReportSection title="What's in it">
          <div className="report-preview__list">
            {report.commodities.map((commodity) => (
              <div key={commodity.id} className="report-preview__list-item">
                <div className="report-preview__item-heading">
                  <span
                    className="report-preview__item-icon"
                    role="img"
                    aria-label={`${commodity.name} icon`}
                  >
                    {commodityIconForId(commodity.id)}
                  </span>
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
        </ReportSection>
      ) : null}

      {report.certifications.length > 0 ? (
        <ReportSection title="Certifications">
          <div className="report-preview__list">
            {report.certifications.map((certification) => (
              <div key={certification.name} className="report-preview__list-item">
                <div className="report-preview__item-heading">
                  <ShieldCheck
                    className="report-preview__item-icon report-preview__item-icon--positive"
                    size={18}
                    strokeWidth={2.2}
                    aria-hidden
                  />
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
        </ReportSection>
      ) : null}

      <ReportSection title="The company">
        <p className="report-preview__item-title">{report.company.name}</p>
        <p className="report-preview__item-body">{report.company.summary}</p>
        {hasIncidents ? (
          <ul className="report-preview__incidents">
            {report.company.incidents.map((incident) => (
              <li
                key={`${incident.year}-${incident.source}-${incident.summary.slice(0, 16)}`}
                className="callout callout--warning"
              >
                <AlertTriangle
                  className="callout__icon"
                  size={18}
                  strokeWidth={2.2}
                  aria-hidden
                />
                <div className="callout__body">
                  <p className="callout__meta">
                    {incident.year} · {incident.source}
                  </p>
                  <p className="callout__text">{incident.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="callout callout--positive">
            <CheckCircle2
              className="callout__icon"
              size={18}
              strokeWidth={2.2}
              aria-hidden
            />
            <p className="callout__text">No documented deforestation incidents found.</p>
          </div>
        )}
      </ReportSection>

      <ReportSection title="Bottom line">
        <div className="callout callout--bottom-line">
          <p className="callout__text">{report.bottomLine}</p>
        </div>
      </ReportSection>

      {report.alternatives.length > 0 ? (
        <ReportSection title="Alternatives">
          <div className="report-preview__alternatives">
            {report.alternatives.map((alternative) => (
              <AlternativeCard key={alternative.id} alternative={alternative} />
            ))}
          </div>
        </ReportSection>
      ) : null}

      {sources.length > 0 ? (
        <ReportSection title="Sources">
          <ul className="report-preview__sources-list">
            {sources.map((source) => (
              <li key={source.url} className="report-preview__sources-item">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="report-preview__source-link"
                >
                  {source.label.trim().length > 0 ? source.label : source.url}
                </a>
                <p className="report-preview__source-url">{source.url}</p>
              </li>
            ))}
          </ul>
        </ReportSection>
      ) : null}
    </section>
  );
};
