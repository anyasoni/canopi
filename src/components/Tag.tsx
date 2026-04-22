import { CertificationStrength, CommodityAmount } from "@/lib/enums";

export enum TagVariant {
  Positive = "positive",
  Caution = "caution",
  Negative = "negative",
  Neutral = "neutral",
}

type TagProps = {
  variant: TagVariant;
  label: string;
};

export const Tag = ({ variant, label }: TagProps) => (
  <span className={`tag tag--${variant}`}>{label}</span>
);

export const tagVariantForCommodityAmount = (amount: CommodityAmount): TagVariant => {
  switch (amount) {
    case CommodityAmount.High:
      return TagVariant.Negative;
    case CommodityAmount.Moderate:
      return TagVariant.Caution;
    case CommodityAmount.Low:
      return TagVariant.Positive;
    case CommodityAmount.Trace:
      return TagVariant.Neutral;
  }
};

export const tagVariantForCertificationStrength = (
  strength: CertificationStrength,
): TagVariant => {
  switch (strength) {
    case CertificationStrength.VeryStrong:
    case CertificationStrength.Strong:
      return TagVariant.Positive;
    case CertificationStrength.Moderate:
      return TagVariant.Caution;
    case CertificationStrength.Weak:
      return TagVariant.Negative;
  }
};
