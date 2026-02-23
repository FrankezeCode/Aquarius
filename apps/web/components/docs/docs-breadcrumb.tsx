import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { docsNavConfig } from "./docs-nav-config";

interface DocsBreadcrumbProps {
  slug: string;
}

export function DocsBreadcrumb({ slug }: DocsBreadcrumbProps) {
  const href = `/docs/${slug}`;
  let groupTitle: string | null = null;
  let pageTitle: string | null = null;

  for (const group of docsNavConfig) {
    const item = group.items.find((i) => i.href === href);
    if (item) {
      groupTitle = group.title;
      pageTitle = item.title;
      break;
    }
  }

  return (
    <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link
        href="/docs/introduction"
        className="transition-colors hover:text-foreground"
      >
        Docs
      </Link>
      {groupTitle && (
        <>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{groupTitle}</span>
        </>
      )}
      {pageTitle && (
        <>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{pageTitle}</span>
        </>
      )}
    </nav>
  );
}
