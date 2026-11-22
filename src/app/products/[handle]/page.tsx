import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { storeConfig } from "@root/store.config";
import { AddToCart } from "@/components/add-to-cart";
import { getCatalog, getProductByHandle } from "@/lib/catalog";
import { siteUrl } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";

/** Placeholder so the route still builds when the catalogue is empty. */
const EMPTY_CATALOG_HANDLE = "__no-products";

export async function generateStaticParams() {
  const { products } = await getCatalog();
  return products.length > 0
    ? products.map((product) => ({ handle: product.handle }))
    : [{ handle: EMPTY_CATALOG_HANDLE }];
}

export async function generateMetadata({ params }: PageProps<"/products/[handle]">) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return {};
  return pageMetadata({
    path: `/products/${product.handle}`,
    title: product.name,
    description: product.headline || product.descriptionText,
    image: product.images[0]?.url,
  });
}

export default async function ProductPage({ params }: PageProps<"/products/[handle]">) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const catalog = await getCatalog();
  const collections = catalog.collections.filter((c) => product.categoryIds.includes(c.id));
  const url = `${siteUrl()}/products/${product.handle}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.descriptionText || undefined,
    image: product.images.map((image) => new URL(image.url, siteUrl()).toString()),
    sku: product.variants[0]?.sku ?? undefined,
    brand: { "@type": "Brand", name: storeConfig.name },
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      url,
      priceCurrency: product.currency,
      price: variant.price.toFixed(2),
      availability: variant.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      name: variant.title,
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="Breadcrumb" className="text-muted-foreground mb-8 text-sm">
        <Link href="/products" className="hover:underline">
          Products
        </Link>
        {collections[0] && (
          <>
            {" / "}
            <Link href={`/collections/${collections[0].handle}`} className="hover:underline">
              {collections[0].name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-12 md:grid-cols-2">
        <div className="space-y-4">
          {product.images.length === 0 && <div className="bg-muted aspect-square rounded-[var(--radius-brand)]" />}
          {product.images.map((image, index) => (
            <div key={image.url} className="bg-muted relative aspect-square overflow-hidden rounded-[var(--radius-brand)]">
              <Image
                src={image.url}
                alt={image.alt}
                fill
                priority={index === 0}
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>

        <div className="space-y-8 md:sticky md:top-8 md:self-start">
          <div>
            <h1 className="text-3xl font-semibold md:text-4xl">{product.name}</h1>
            {product.headline && <p className="text-muted-foreground mt-2">{product.headline}</p>}
          </div>
          <AddToCart
            locale={storeConfig.locale}
            product={{
              id: product.id,
              handle: product.handle,
              name: product.name,
              currency: product.currency,
              options: product.options,
              variants: product.variants,
              images: product.images.slice(0, 1),
            }}
          />
          {product.descriptionHtml && (
            <div className="prose" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
          )}
        </div>
      </div>
    </div>
  );
}
