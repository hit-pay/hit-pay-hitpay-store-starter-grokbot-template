import Image from "next/image";
import Link from "next/link";
import { storeConfig } from "@root/store.config";
import { CatalogNotice } from "@/components/catalog-notice";
import { ProductGrid } from "@/components/product-card";
import { getCatalog, sortProducts } from "@/lib/catalog";
import { getPosts } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ path: "/", title: null });

export default async function HomePage() {
  const { home } = storeConfig;
  const catalog = await getCatalog();
  const featured = sortProducts(catalog.products).slice(0, home.featuredProductsCount);
  const posts = getPosts().slice(0, 3);

  return (
    <>
      <section className="bg-muted relative overflow-hidden">
        {home.heroImage && (
          <Image src={home.heroImage} alt="" fill priority className="object-cover opacity-40" unoptimized />
        )}
        <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-32">
          <h1 className="max-w-2xl text-4xl leading-tight font-semibold md:text-6xl">{home.heroTitle}</h1>
          <p className="text-muted-foreground mt-6 max-w-xl text-lg">{home.heroSubtitle}</p>
          <Link href={home.heroCta.href} className="btn btn-primary mt-8">
            {home.heroCta.label}
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-20 px-4 py-16">
        <CatalogNotice catalog={catalog} />

        <section>
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-2xl font-semibold">{home.featuredProductsTitle}</h2>
            <Link href="/products" className="text-sm underline">
              View all
            </Link>
          </div>
          <ProductGrid products={featured} />
        </section>

        {catalog.collections.length > 0 && (
          <section>
            <h2 className="mb-8 text-2xl font-semibold">Shop by collection</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {catalog.collections.map((collection) => (
                <li key={collection.id}>
                  <Link
                    href={`/collections/${collection.handle}`}
                    className="border-border hover:bg-muted block rounded-[var(--radius-brand)] border p-6"
                  >
                    <p className="font-heading text-lg font-semibold">{collection.name}</p>
                    {collection.description && (
                      <p className="text-muted-foreground mt-1 text-sm">{collection.description}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {posts.length > 0 && (
          <section>
            <div className="mb-8 flex items-end justify-between">
              <h2 className="text-2xl font-semibold">From the blog</h2>
              <Link href="/blog" className="text-sm underline">
                All posts
              </Link>
            </div>
            <ul className="grid gap-8 md:grid-cols-3">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link href={post.path} className="group block space-y-2">
                    <p className="text-muted-foreground text-xs">{post.date}</p>
                    <p className="font-heading text-lg font-semibold group-hover:underline">{post.title}</p>
                    {post.description && <p className="text-muted-foreground text-sm">{post.description}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
