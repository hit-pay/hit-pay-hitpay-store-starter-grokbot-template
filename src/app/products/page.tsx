import { storeConfig } from "@root/store.config";
import { CatalogNotice } from "@/components/catalog-notice";
import { ProductCard } from "@/components/product-card";
import { ProgressiveGrid } from "@/components/progressive-grid";
import { getCatalog, sortProducts } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  path: "/products",
  title: "All products",
  description: `Browse every product from ${storeConfig.name}.`,
});

export default async function ProductsPage() {
  const catalog = await getCatalog();
  const products = sortProducts(catalog.products);
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <h1 className="text-3xl font-semibold">All products</h1>
      <CatalogNotice catalog={catalog} />
      {products.length === 0 ? (
        <p className="text-muted-foreground">No products to show yet.</p>
      ) : (
        <ProgressiveGrid pageSize={storeConfig.catalog.pageSize}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ProgressiveGrid>
      )}
    </div>
  );
}
