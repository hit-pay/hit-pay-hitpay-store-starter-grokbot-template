import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * Local content for pages and the blog. Files live in /content:
 *
 *   content/pages/about.mdx                     -> /about
 *   content/pages/policies/refund-policy.mdx    -> /policies/refund-policy
 *   content/blog/hello-world.mdx                -> /blog/hello-world
 *
 * Each entry can be MDX/Markdown with YAML front matter, or JSON with an
 * `html` field (handy when migrating HTML from an existing site; the HTML is
 * sanitised before rendering).
 */

export const CONTENT_DIR = path.join(process.cwd(), "content");

/** First URL segments owned by app routes; content pages cannot use them. */
export const RESERVED_SEGMENTS = new Set([
  "admin",
  "api",
  "blog",
  "cart",
  "checkout",
  "collections",
  "products",
  "robots.txt",
  "sitemap.xml",
  "_next",
]);

const EXTENSIONS = [".mdx", ".md", ".json"] as const;

export type ContentBody = { format: "mdx"; source: string } | { format: "html"; html: string };

export type ContentPage = {
  slug: string[];
  path: string;
  title: string;
  description: string | null;
  seoTitle: string | null;
  noindex: boolean;
  updated: string | null;
  body: ContentBody;
};

export type BlogPost = {
  slug: string;
  path: string;
  title: string;
  description: string | null;
  seoTitle: string | null;
  date: string;
  author: string | null;
  image: string | null;
  tags: string[];
  draft: boolean;
  body: ContentBody;
};

type RawEntry = { data: Record<string, unknown>; body: ContentBody };

function readEntry(file: string): RawEntry {
  const raw = fs.readFileSync(file, "utf8");
  if (file.endsWith(".json")) {
    const json = JSON.parse(raw) as Record<string, unknown>;
    const { html, ...data } = json;
    return { data, body: { format: "html", html: typeof html === "string" ? html : "" } };
  }
  const parsed = matter(raw);
  return { data: parsed.data, body: { format: "mdx", source: parsed.content } };
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return EXTENSIONS.some((ext) => entry.name.endsWith(ext)) ? [full] : [];
  });
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

function toDateString(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  return str(v);
}

function slugFromFile(root: string, file: string): string[] {
  const relative = path.relative(root, file).replace(/\.(mdx|md|json)$/, "");
  return relative.split(path.sep).filter(Boolean);
}

export function getPages(contentDir = CONTENT_DIR): ContentPage[] {
  const root = path.join(contentDir, "pages");
  return walk(root)
    .map((file) => {
      const slug = slugFromFile(root, file);
      const { data, body } = readEntry(file);
      return {
        slug,
        path: `/${slug.join("/")}`,
        title: str(data.title) ?? slug[slug.length - 1],
        description: str(data.description),
        seoTitle: str(data.seoTitle),
        noindex: data.noindex === true,
        updated: toDateString(data.updated),
        body,
      };
    })
    .filter((page) => !RESERVED_SEGMENTS.has(page.slug[0]))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function getPage(slug: string[], contentDir = CONTENT_DIR): ContentPage | undefined {
  const target = slug.join("/");
  return getPages(contentDir).find((page) => page.slug.join("/") === target);
}

export function getPosts(
  { includeDrafts = false } = {},
  contentDir = CONTENT_DIR,
): BlogPost[] {
  const root = path.join(contentDir, "blog");
  return walk(root)
    .map((file) => {
      const slug = slugFromFile(root, file).join("-");
      const { data, body } = readEntry(file);
      return {
        slug,
        path: `/blog/${slug}`,
        title: str(data.title) ?? slug,
        description: str(data.description),
        seoTitle: str(data.seoTitle),
        date: toDateString(data.date) ?? "1970-01-01",
        author: str(data.author),
        image: str(data.image),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        draft: data.draft === true,
        body,
      };
    })
    .filter((post) => includeDrafts || !post.draft)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function getPost(slug: string, contentDir = CONTENT_DIR): BlogPost | undefined {
  return getPosts({}, contentDir).find((post) => post.slug === slug);
}

type SeoOverride = { title?: string; description?: string; noindex?: boolean };

/**
 * Per-URL SEO overrides from content/seo.json, keyed by path. Lets the store
 * builder carry over titles and descriptions from a merchant's old site for
 * routes that don't have their own content file (products, collections, home).
 */
export function getSeoOverride(pathname: string, contentDir = CONTENT_DIR): SeoOverride | undefined {
  const file = path.join(contentDir, "seo.json");
  if (!fs.existsSync(file)) return undefined;
  const overrides = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, SeoOverride>;
  return overrides[pathname];
}
