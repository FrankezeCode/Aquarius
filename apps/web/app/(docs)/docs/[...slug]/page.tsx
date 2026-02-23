import { notFound } from "next/navigation";
import { Suspense } from "react";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import { getDocBySlug, getAllDocSlugs, extractToc } from "@/lib/docs";
import type { DocFrontmatter } from "@/lib/docs";
import { mdxComponents } from "@/components/docs/mdx-components";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsToc } from "@/components/docs/docs-toc";
import { DocsPager } from "@/components/docs/docs-pager";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  return getAllDocSlugs().map((slug) => ({ slug: [slug] }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const slugStr = slug.join("/");
  try {
    const { frontmatter } = getDocBySlug(slugStr);
    return {
      title: `${frontmatter.title} — Aquarius Docs`,
      description: frontmatter.description,
    };
  } catch {
    return { title: "Not Found — Aquarius Docs" };
  }
}

async function renderMDX(source: string) {
  "use cache";
  const { content } = await compileMDX<DocFrontmatter>({
    source,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypePrettyCode,
            {
              theme: "github-dark-default",
              keepBackground: true,
            },
          ],
        ],
      },
    },
  });
  return content;
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const slugStr = slug.join("/");

  let doc;
  try {
    doc = getDocBySlug(slugStr);
  } catch {
    notFound();
  }

  const toc = extractToc(doc.content);

  return (
    <div className="flex gap-10 px-6 py-8 md:px-10 lg:px-16">
      <article className="min-w-0 max-w-3xl flex-1">
        <DocsBreadcrumb slug={slugStr} />

        <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
          {doc.frontmatter.title}
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          {doc.frontmatter.description}
        </p>

        <Suspense
          fallback={
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
            </div>
          }
        >
          <div className="prose-docs">{renderMDX(doc.content)}</div>
        </Suspense>

        <DocsPager currentHref={`/docs/${slugStr}`} />
      </article>

      <aside className="hidden w-56 shrink-0 xl:block">
        <DocsToc entries={toc} />
      </aside>
    </div>
  );
}
