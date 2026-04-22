import type { ReactNode } from "react";

type ReportSectionProps = {
  title: string;
  children: ReactNode;
};

export const ReportSection = ({ title, children }: ReportSectionProps) => (
  <article className="report-preview__section">
    <h2 className="report-preview__title">{title}</h2>
    <div className="report-preview__section-body">{children}</div>
  </article>
);
