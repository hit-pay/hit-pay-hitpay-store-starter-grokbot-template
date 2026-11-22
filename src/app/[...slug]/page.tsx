import { notFound } from "next/navigation";
import { RichContent } from "@/components/rich-content";
import { getPage, getPages } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

/** Content pages from content/pages/**: about, contact, policies, and anything migrated. */
export async function generateStaticParams() {
  const pages = getPages();
  return pages.length > 0 ? pages.map((page) => ({ slug: page.slug })) : [{ slug: ["__no-pages"] }];
}

export async function generateMetadata({ params }: PageProps<"/[...slug]">) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) return {};
  return pageMetadata({
    path: page.path,
    title: page.seoTitle ?? page.title,
    description: page.description,
    noindex: page.noindex,
  });
}

export default async function ContentPage({ params }: PageProps<"/[...slug]">) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-semibold">{page.title}</h1>
      <RichContent body={page.body} />
      {page.updated && <p className="text-muted-foreground mt-12 text-sm">Last updated {page.updated}</p>}
    </article>
  );
}
