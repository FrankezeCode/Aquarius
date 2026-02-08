import { cn } from "@/lib/utils";

interface ProtocolBadgeProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const protocolColors: Record<string, string> = {
  aave: "bg-gradient-to-r from-[#B6509E] to-[#2EBAC6]",
  compound: "bg-[#00D395]",
  uniswap: "bg-[#FF007A]",
  lido: "bg-[#00A3FF]",
};

const ProtocolBadge = ({ name, size = "md", className }: ProtocolBadgeProps) => {
  const sizes = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  const colorClass = protocolColors[name.toLowerCase()] || "bg-primary";

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-primary-foreground",
        sizes[size],
        colorClass,
        className
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

export default ProtocolBadge;
