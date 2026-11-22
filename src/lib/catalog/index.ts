import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { storeConfig } from "@root/store.config";
import demoCatalog from "@root/content/demo-catalog.json";
import { catalogSource, storefrontCredential } from "@/lib/env";
import { hitpayRequest } from "@/lib/hitpay/client";
import type { HitPayCategory, HitPayPaginated, HitPayProduct } from "@/lib/hitpay/types";
import { buildCatalog } from "./normalize";
import type { Catalog, Collection, Product } from "./types";

const PRODUCTS_PER_REQUEST = 50;
const MAX_PAGES = 40;

async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<HitPayPaginated<T>>,
  perPage: number,
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await fetchPage(page);
    items.push(...(result.data ?? []));
    const lastPage = result.meta?.last_page;
    if (lastPage ? page >= lastPage : (result.data ?? []).length < perPage) break;
  }
  return items;
}

async function fetchHitPayCatalog(): Promise<Catalog> {
  const credential = storefrontCredential();
  if (!credential) {
    return {
      source: "hitpay",
      products: [],
      collections: [],
      error: "CATALOG_SOURCE is 'hitpay' but no HITPAY_ACCESS_TOKEN or HITPAY_API_KEY is set.",
    };
  }
  try {
    const channels = storeConfig.catalog.channels;
    const [products, categories] = await Promise.all([
      fetchAllPages(
        (page) =>
          hitpayRequest<HitPayPaginated<HitPayProduct>>("/v1/products", credential, {
            query: {
              statuses: ["published"],
              channels: channels.length ? channels : undefined,
              page,
              per_page: PRODUCTS_PER_REQUEST,
            },
          }),
        PRODUCTS_PER_REQUEST,
      ),
      fetchAllPages(
        (page) =>
          hitpayRequest<HitPayPaginated<HitPayCategory>>("/v1/product-category", credential, {
            query: { active: true, page, perPage: 100 },
          }),
        100,
      ),
    ]);
    return buildCatalog(products, categories, "hitpay");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[catalog] Failed to load the HitPay catalogue: ${message}`);
    return { source: "hitpay", products: [], collections: [], error: message };
  }
}

/** The full storefront catalogue, cached and revalidated in the background. */
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");

  if (catalogSource() === "demo") {
    return buildCatalog(
      demoCatalog.products as unknown as HitPayProduct[],
      demoCatalog.categories as unknown as HitPayCategory[],
      "demo",
    );
  }
  return fetchHitPayCatalog();
}

/**
 * Uncached product lookup used at checkout so prices and stock are current.
 * Products that no longer exist are omitted.
 */
export async function getProductsForCheckout(ids: string[]): Promise<Product[]> {
  const unique = Array.from(new Set(ids)).slice(0, 50);
  if (catalogSource() === "demo") {
    const catalog = buildCatalog(
      demoCatalog.products as unknown as HitPayProduct[],
      [],
      "demo",
    );
    return catalog.products.filter((p) => unique.includes(p.id));
  }
  const credential = storefrontCredential();
  if (!credential) return [];
  const raw = await Promise.all(
    unique.map((id) =>
      hitpayRequest<HitPayProduct | { data: HitPayProduct }>(
        `/v1/products/${encodeURIComponent(id)}`,
        credential,
      )
        .then((r) => ("data" in r ? r.data : r))
        .catch(() => null),
    ),
  );
  return buildCatalog(
    raw.filter((p): p is HitPayProduct => p !== null),
    [],
    "hitpay",
  ).products;
}

export function sortProducts(products: Product[]): Product[] {
  return [...products].sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      Number(b.available) - Number(a.available) ||
      (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
  );
}

export async function getProducts(): Promise<Product[]> {
  return sortProducts((await getCatalog()).products);
}

export async function getProductByHandle(handle: string): Promise<Product | undefined> {
  return (await getCatalog()).products.find((product) => product.handle === handle);
}

export async function getCollections(): Promise<Collection[]> {
  return (await getCatalog()).collections;
}

export async function getCollectionByHandle(
  handle: string,
): Promise<{ collection: Collection; products: Product[] } | undefined> {
  const catalog = await getCatalog();
  const collection = catalog.collections.find((c) => c.handle === handle);
  if (!collection) return undefined;
  const ids = new Set(collection.productIds);
  return { collection, products: sortProducts(catalog.products.filter((p) => ids.has(p.id))) };
}
