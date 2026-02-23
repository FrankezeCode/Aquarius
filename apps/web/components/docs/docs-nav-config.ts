import {
  BookOpen,
  Layers,
  Activity,
  Brain,
  HeartPulse,
  Shield,
  Database,
  Server,
  Code,
  Package,
  FlaskConical,
  Lock,
  Map,
  Target,
  type LucideIcon,
} from "lucide-react";

export interface DocsNavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  badge?: string;
}

export interface DocsNavGroup {
  title: string;
  items: DocsNavItem[];
}

export const docsNavConfig: DocsNavGroup[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs/introduction", icon: BookOpen },
      { title: "Our Mission", href: "/docs/mission", icon: Target },
    ],
  },
  {
    title: "Architecture",
    items: [
      {
        title: "System Overview",
        href: "/docs/architecture",
        icon: Layers,
      },
      {
        title: "Risk Intelligence Engine",
        href: "/docs/risk-engine",
        icon: Brain,
      },
      {
        title: "Health Score Engine",
        href: "/docs/health-engine",
        icon: HeartPulse,
      },
      { title: "Data Flow", href: "/docs/data-flow", icon: Activity },
    ],
  },
  {
    title: "Agents & Execution",
    items: [
      { title: "Aqua Agent", href: "/docs/aqua-agent", icon: Shield },
      {
        title: "BufferVault",
        href: "/docs/buffer-vault",
        icon: Database,
      },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      {
        title: "Execution & Simulation",
        href: "/docs/infrastructure",
        icon: Server,
      },
    ],
  },
  {
    title: "Developer Guide",
    items: [
      { title: "API Reference", href: "/docs/api", icon: Code },
      { title: "SDK Usage", href: "/docs/sdk", icon: Package },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        title: "Validation & Testing",
        href: "/docs/validation",
        icon: FlaskConical,
      },
      { title: "Security Model", href: "/docs/security", icon: Lock },
      { title: "Roadmap", href: "/docs/roadmap", icon: Map },
    ],
  },
];

export function flattenNavItems(): DocsNavItem[] {
  return docsNavConfig.flatMap((group) => group.items);
}

export function getAdjacentPages(currentHref: string) {
  const items = flattenNavItems();
  const idx = items.findIndex((item) => item.href === currentHref);
  return {
    prev: idx > 0 ? items[idx - 1] : null,
    next: idx < items.length - 1 ? items[idx + 1] : null,
  };
}
