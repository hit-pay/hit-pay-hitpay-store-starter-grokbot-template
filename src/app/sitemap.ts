import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";
import { getPages, getPosts, getSeoOverride } from "@/lib/content";
import { siteUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const catalog = await getCatalog();
  const entry = (path: string, lastModified?: string | null, priority?: number) => ({
    url: `${base}${path}`,
    lastModified: lastModified ?? undefined,
    priority,
  });

  const entries = [
    entry("/", null, 1),
    entry("/products", null, 0.9),
    entry("/collections", null, 0.7),
    entry("/blog", null, 0.6),
    ...catalog.products.map((p) => entry(`/products/${p.handle}`, p.updatedAt, 0.8)),
    ...catalog.collections.map((c) => entry(`/collections/${c.handle}`, null, 0.7)),
    ...getPages()
      .filter((page) => !page.noindex)
      .map((page) => entry(page.path, page.updated, 0.5)),
    ...getPosts().map((post) => entry(post.path, post.date, 0.5)),
  ];

  return entries.filter((e) => !getSeoOverride(e.url.slice(base.length) || "/")?.noindex);
}
