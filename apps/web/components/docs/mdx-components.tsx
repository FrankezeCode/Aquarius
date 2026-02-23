import type { MDXComponents } from "mdx/types";
import { isValidElement, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Callout } from "./callout";
import { ApiEndpoint } from "./api-endpoint";
import { MermaidDiagram } from "./mermaid-diagram";

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (isValidElement(node) && node.props) {
    return extractText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

function isMermaidCodeBlock(children: ReactNode): string | null {
  if (!isValidElement(children)) return null;
  const props = children.props as Record<string, unknown>;
  const className = typeof props.className === "string" ? props.className : "";
  const dataLang = typeof props["data-language"] === "string" ? props["data-language"] : "";
  if (className.includes("language-mermaid") || dataLang === "mermaid") {
    return extractText(children);
  }
  return null;
}

function createHeading(level: 1 | 2 | 3 | 4) {
  const Tag = `h${level}` as const;
  const sizes: Record<number, string> = {
    1: "text-3xl font-bold tracking-tight mt-2 mb-6",
    2: "text-2xl font-semibold tracking-tight mt-10 mb-4 scroll-mt-20 border-b border-border pb-2",
    3: "text-xl font-semibold tracking-tight mt-8 mb-3 scroll-mt-20",
    4: "text-lg font-medium tracking-tight mt-6 mb-2 scroll-mt-20",
  };

  return function HeadingComponent({
    children,
    id,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
      <Tag id={id} className={sizes[level]} {...props}>
        {id ? (
          <a
            href={`#${id}`}
            className="no-underline hover:underline hover:underline-offset-4"
          >
            {children}
          </a>
        ) : (
          children
        )}
      </Tag>
    );
  };
}

export const mdxComponents: MDXComponents = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),

  p: ({ children, ...props }) => (
    <p className="mb-4 leading-7 text-muted-foreground" {...props}>
      {children}
    </p>
  ),

  a: ({ href, children, ...props }) => {
    const isExternal = href?.startsWith("http");
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          {...props}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href ?? "#"}
        className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
        {...props}
      >
        {children}
      </Link>
    );
  },

  ul: ({ children, ...props }) => (
    <ul className="mb-4 ml-6 list-disc space-y-1 text-muted-foreground" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-1 text-muted-foreground" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-7" {...props}>
      {children}
    </li>
  ),

  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-6 border-l-2 border-primary/40 pl-4 italic text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),

  code: ({ children, className, ...props }) => {
    if (className) return <code className={className} {...props}>{children}</code>;
    return (
      <code
        className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-sm font-mono text-foreground"
        {...props}
      >
        {children}
      </code>
    );
  },

  pre: ({ children, ...props }) => {
    const mermaidChart = isMermaidCodeBlock(children);
    if (mermaidChart) {
      return <MermaidDiagram chart={mermaidChart} />;
    }
    return (
      <pre
        className={cn(
          "my-6 overflow-x-auto rounded-lg border border-border bg-[#0a0a0a] p-4",
          "[&>code]:block [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-sm [&>code]:leading-relaxed",
        )}
        {...props}
      >
        {children}
      </pre>
    );
  },

  table: ({ children, ...props }) => (
    <div className="my-6 w-full overflow-auto">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="border-b border-border" {...props}>
      {children}
    </thead>
  ),
  tr: ({ children, ...props }) => (
    <tr className="border-b border-border/50" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-2 text-left font-semibold text-foreground"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-2 text-muted-foreground" {...props}>
      {children}
    </td>
  ),

  hr: () => <hr className="my-8 border-border" />,

  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),

  Callout,
  ApiEndpoint,
  MermaidDiagram,
};
