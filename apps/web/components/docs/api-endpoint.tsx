import { cn } from "@/lib/utils";

const methodColors: Record<string, string> = {
  GET: "bg-green-500/15 text-green-400 border-green-500/30",
  POST: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  PUT: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  DELETE: "bg-red-500/15 text-red-400 border-red-500/30",
  PATCH: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

interface ApiEndpointProps {
  method: string;
  path: string;
  description?: string;
  children?: React.ReactNode;
}

export function ApiEndpoint({
  method,
  path,
  description,
  children,
}: ApiEndpointProps) {
  const color = methodColors[method.toUpperCase()] ?? methodColors.GET;

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-border">
      <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
            color,
          )}
        >
          {method}
        </span>
        <code className="text-sm font-medium text-foreground">{path}</code>
      </div>
      {description && (
        <p className="border-b border-border px-4 py-2 text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {children && <div className="p-4 text-sm">{children}</div>}
    </div>
  );
}
