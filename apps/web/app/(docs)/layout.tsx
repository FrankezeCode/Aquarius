import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DocsSidebar } from "@/components/docs/docs-sidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      <DocsSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm md:hidden">
          <SidebarTrigger />
          <span className="text-sm font-medium text-muted-foreground">
            Aquarius Docs
          </span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
