import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  direction: "up" | "down" | "neutral";
  value?: string;
  className?: string;
}

const TrendIndicator = ({ direction, value, className }: TrendIndicatorProps) => {
  const colors = {
    up: "text-success",
    down: "text-destructive",
    neutral: "text-muted-foreground",
  };

  const icons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };

  const Icon = icons[direction];

  return (
    <span className={cn("inline-flex items-center gap-1", colors[direction], className)}>
      <Icon className="h-4 w-4" />
      {value && <span className="text-sm font-medium">{value}</span>}
    </span>
  );
};

export default TrendIndicator;
