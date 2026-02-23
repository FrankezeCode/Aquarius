import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content", "docs");

export interface DocFrontmatter {
  title: string;
  description: string;
  section?: string;
}

export interface DocMeta {
  slug: string;
  frontmatter: DocFrontmatter;
}

export interface TocEntry {
  depth: number;
  text: string;
  id: string;
}

export function getDocBySlug(slug: string): {
  content: string;
  frontmatter: DocFrontmatter;
} {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Doc not found: ${slug}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    content,
    frontmatter: data as DocFrontmatter,
  };
}

export function getAllDocSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function extractToc(raw: string): TocEntry[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const entries: TocEntry[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(raw)) !== null) {
    const depth = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    entries.push({ depth, text, id });
  }

  return entries;
}
