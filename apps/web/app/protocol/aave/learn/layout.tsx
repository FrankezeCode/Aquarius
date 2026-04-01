import {
  LearnBreadcrumb,
  LearnMobileJumpNav,
  LearnSidebar,
} from "@/components/learn";

export default function AaveLearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <LearnBreadcrumb
        protocolName="Aave"
        protocolHref="/protocol/aave"
        currentLabel="AQUA LEARN"
      />
      <LearnMobileJumpNav className="mb-6" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <LearnSidebar className="hidden lg:block" />
        <div className="min-w-0 space-y-10 pb-8 lg:pb-12">{children}</div>
      </div>
    </div>
  );
}
