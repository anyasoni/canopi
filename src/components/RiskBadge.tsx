import { ReportRiskTier } from "@/lib/enums";
import { reportRiskTierFromScore } from "@/lib/risk-tier";

const riskBadgeLabel = (tier: ReportRiskTier): string => {
  switch (tier) {
    case ReportRiskTier.Low:
      return "Low";
    case ReportRiskTier.Moderate:
      return "Moderate";
    case ReportRiskTier.High:
      return "High";
  }
};

const riskBadgeStyles: Record<
  ReportRiskTier,
  { pill: string; }
> = {
  [ReportRiskTier.Low]: {
    pill: "risk-badge--low",
  },
  [ReportRiskTier.Moderate]: {
    pill: "risk-badge--moderate",
  },
  [ReportRiskTier.High]: {
    pill: "risk-badge--high",
  },
};

type RiskBadgeProps = {
  score: number;
};

export const RiskBadge = ({ score }: RiskBadgeProps) => {
  const tier = reportRiskTierFromScore(score);
  const label = riskBadgeLabel(tier);
  const { pill } = riskBadgeStyles[tier];

  return (
    <span className={`risk-badge ${pill}`}>
      <span className={`risk-badge__dot`} aria-hidden />
      <span className="risk-badge__score">{score} </span>
      <span>{label}</span>
    </span>
  );
};
