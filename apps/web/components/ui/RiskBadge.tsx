import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level: "low" | "medium" | "high";
  className?: string;
}

const RiskBadge = ({ level, className }: RiskBadgeProps) => {
  const variants = {
    low: "aquarius-badge-low",
    medium: "aquarius-badge-medium",
    high: "aquarius-badge-high",
  };

  const labels = {
    low: "Low Risk",
    medium: "Medium",
    high: "High Risk",
  };

  return (
    <span className={cn(variants[level], className)}>
      {labels[level]}
    </span>
  );
};

export default RiskBadge;
