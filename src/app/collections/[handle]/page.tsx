import { notFound } from "next/navigation";
import { storeConfig } from "@root/store.config";
import { ProductCard } from "@/components/product-card";
import { ProgressiveGrid } from "@/components/progressive-grid";
import { getCollectionByHandle, getCollections } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";

const EMPTY_CATALOG_HANDLE = "__no-collections";

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.length > 0
    ? collections.map((collection) => ({ handle: collection.handle }))
    : [{ handle: EMPTY_CATALOG_HANDLE }];
}

export async function generateMetadata({ params }: PageProps<"/collections/[handle]">) {
  const { handle } = await params;
  const result = await getCollectionByHandle(handle);
  if (!result) return {};
  return pageMetadata({
    path: `/collections/${result.collection.handle}`,
    title: result.collection.name,
    description: result.collection.description ?? `Shop ${result.collection.name} at ${storeConfig.name}.`,
    image: result.collection.imageUrl,
  });
}

export default async function CollectionPage({ params }: PageProps<"/collections/[handle]">) {
  const { handle } = await params;
  const result = await getCollectionByHandle(handle);
  if (!result) notFound();
  const { collection, products } = result;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{collection.name}</h1>
        {collection.description && <p className="text-muted-foreground max-w-2xl">{collection.description}</p>}
      </header>
      <ProgressiveGrid pageSize={storeConfig.catalog.pageSize}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ProgressiveGrid>
    </div>
  );
}
