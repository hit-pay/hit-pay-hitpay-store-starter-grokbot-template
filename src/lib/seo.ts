import type { Metadata } from "next";
import { storeConfig } from "@root/store.config";
import { getSeoOverride } from "@/lib/content";
import { truncate } from "@/lib/html";

type PageSeo = {
  /** Canonical path, e.g. "/products/ceramic-mug". */
  path: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  noindex?: boolean;
  type?: "website" | "article";
};

/**
 * Builds page metadata from per-page values, falling back to the SEO defaults
 * in store.config.ts. Entries in content/seo.json override both.
 */
export function pageMetadata({ path, title, description, image, noindex, type }: PageSeo): Metadata {
  const override = getSeoOverride(path);
  const finalTitle = override?.title ?? title ?? undefined;
  const finalDescription = truncate(
    override?.description ?? description ?? storeConfig.seo.description,
    160,
  );
  const images = [image ?? storeConfig.seo.ogImage].filter(Boolean) as string[];

  return {
    title: path === "/" && finalTitle ? { absolute: finalTitle } : finalTitle,
    description: finalDescription,
    alternates: { canonical: path },
    robots: override?.noindex ?? noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: type ?? "website",
      siteName: storeConfig.name,
      title: finalTitle ?? storeConfig.seo.defaultTitle,
      description: finalDescription,
      url: path,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle ?? storeConfig.seo.defaultTitle,
      description: finalDescription,
      images,
    },
  };
}
