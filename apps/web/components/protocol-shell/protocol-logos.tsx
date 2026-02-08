import type { LucideProps } from "lucide-react";

/**
 * Aave logo — stylized geometric "a" mark
 */
export function AaveLogo({ className, ...props }: LucideProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.5v-5.5H8.5L12 5.5l3.5 6.5H13v5.5h-2z" />
    </svg>
  );
}
