/**
 * Aave Risk Monitor Layout
 * 
 * Clean, focused layout without navigation tabs.
 * The page follows a single user journey — no forks, no alternative paths.
 */
export function AaveLayout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}
