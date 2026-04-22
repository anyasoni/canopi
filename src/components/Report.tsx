"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { DeforestationReport } from "@/lib/report-types";
import { DeforestationReportSchema } from "@/lib/schemas/deforestation-report";
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
};

const REPORT_ERROR_MESSAGE = "Failed to generate report. Please try again.";

const parseReportResponse = (json: unknown): DeforestationReport | undefined => {
  const result = DeforestationReportSchema.safeParse(json);
  if (!result.success) {
    return undefined;
  }
  return result.data;
};

export const Report = ({ productId }: ReportProps) => {
  const [reportState, setReportState] = useState<ReportState>({
    state: ReportRequestState.Loading,
  });

  const fetchReport = useCallback(async (options?: { showLoadingState?: boolean }) => {
    if (options?.showLoadingState ?? true) {
      setReportState({ state: ReportRequestState.Loading });
    }
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });
      if (!response.ok) {
        throw new Error(`Report request failed with status ${response.status}`);
      }
      const json = (await response.json()) as unknown;
      const parsedReport = parseReportResponse(json);
      if (!parsedReport) {
        throw new Error("Report response shape was invalid");
      }
      setReportState({
        state: ReportRequestState.Success,
        report: parsedReport,
      });
    } catch (error) {
      console.error("Failed to fetch report", error);
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
    </section>
  );
};
