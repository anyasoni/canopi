import Link from "next/link";
import type { ReportAlternative } from "@/lib/report-types";
import { RiskBadge } from "./RiskBadge";

type AlternativeCardProps = {
  alternative: ReportAlternative;
};

export const AlternativeCard = ({ alternative }: AlternativeCardProps) => (
  <Link href={`/product/${alternative.id}`} className="alternative-card">
    <div className="alternative-card__heading">
      <p className="alternative-card__name">{alternative.name}</p>
      <RiskBadge score={alternative.riskScore} />
    </div>
    <p className="alternative-card__brand">{alternative.brand}</p>
    <p className="alternative-card__reason">{alternative.reason}</p>
  </Link>
);
