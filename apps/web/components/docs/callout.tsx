import { cn } from "@/lib/utils";
import { AlertTriangle, Info, AlertCircle, CheckCircle } from "lucide-react";

const variants = {
  info: {
    container: "border-blue-500/30 bg-blue-500/5",
    icon: Info,
    iconClass: "text-blue-400",
  },
  warning: {
    container: "border-yellow-500/30 bg-yellow-500/5",
    icon: AlertTriangle,
    iconClass: "text-yellow-400",
  },
  danger: {
    container: "border-red-500/30 bg-red-500/5",
    icon: AlertCircle,
    iconClass: "text-red-400",
  },
  success: {
    container: "border-green-500/30 bg-green-500/5",
    icon: CheckCircle,
    iconClass: "text-green-400",
  },
} as const;

interface CalloutProps {
  type?: keyof typeof variants;
  title?: string;
  children: React.ReactNode;
}

export function Callout({ type = "info", title, children }: CalloutProps) {
  const v = variants[type];
  const Icon = v.icon;

  return (
    <div
      className={cn(
        "my-6 flex gap-3 rounded-lg border p-4",
        v.container,
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", v.iconClass)} />
      <div className="min-w-0">
        {title && (
          <p className="mb-1 text-sm font-semibold text-foreground">
            {title}
          </p>
        )}
        <div className="text-sm text-muted-foreground [&>p]:m-0">
          {children}
        </div>
      </div>
    </div>
  );
}
