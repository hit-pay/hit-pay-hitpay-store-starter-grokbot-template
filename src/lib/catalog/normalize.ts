import { htmlToText, sanitizeHtml } from "@/lib/html";
import { assignHandles } from "@/lib/slug";
import type { HitPayCategory, HitPayProduct, HitPayVariation } from "@/lib/hitpay/types";
import type { Catalog, Collection, Product, ProductVariant } from "./types";

function isVisible(product: HitPayProduct): boolean {
  if (product.status && product.status !== "published") return false;
  if (product.is_published === false) return false;
  return true;
}

function variationOptionValues(variation: HitPayVariation, optionCount: number): string[] {
  return [variation.variation_value_1, variation.variation_value_2, variation.variation_value_3]
    .slice(0, optionCount)
    .map((value) => value ?? "");
}

function normalizeVariants(product: HitPayProduct, optionCount: number): ProductVariant[] {
  const variations = product.variations ?? [];
  if (variations.length === 0) {
    return [
      {
        id: product.id,
        title: "Default",
        sku: null,
        price: Number(product.price),
        quantity: null,
        available: true,
        optionValues: [],
      },
    ];
  }
  return variations.map((variation) => {
    const optionValues = variationOptionValues(variation, optionCount);
    const quantity = typeof variation.quantity === "number" ? variation.quantity : null;
    return {
      id: variation.id,
      title:
        optionValues.filter(Boolean).join(" / ") ||
        variation.description ||
        (product.has_variations ? "Option" : "Default"),
      sku: variation.stock_keeping_unit,
      price: Number(variation.price ?? product.price),
      quantity,
      available: quantity === null || quantity > 0,
      optionValues,
    };
  });
}

export function normalizeProduct(product: HitPayProduct): Omit<Product, "handle"> {
  const optionNames = product.has_variations
    ? [product.variation_key_1, product.variation_key_2, product.variation_key_3].filter(
        (key): key is string => Boolean(key),
      )
    : [];
  const variants = normalizeVariants(product, optionNames.length);
  const options = optionNames.map((name, index) => ({
    name,
    values: Array.from(new Set(variants.map((v) => v.optionValues[index]).filter(Boolean))),
  }));
  const prices = variants.map((v) => v.price);
  const descriptionHtml = sanitizeHtml(product.description ?? "");

  return {
    id: product.id,
    name: product.name,
    headline: product.headline,
    descriptionHtml,
    descriptionText: htmlToText(descriptionHtml),
    currency: (product.currency || "SGD").toUpperCase(),
    price: Math.min(...prices),
    maxPrice: Math.max(...prices),
    images: (product.images ?? [])
      .filter((image) => image.url)
      .map((image) => ({ url: image.url, alt: image.caption || product.name })),
    categoryIds: product.category_id ?? [],
    options,
    variants,
    available: variants.some((v) => v.available),
    pinned: Boolean(product.is_pinned),
    createdAt: product.created_at ?? null,
    updatedAt: product.updated_at ?? null,
  };
}

function flattenCategories(categories: HitPayCategory[]): HitPayCategory[] {
  return categories.flatMap((category) => [
    category,
    ...flattenCategories(category.children ?? []),
  ]);
}

/**
 * Turns raw HitPay products and categories into the storefront catalogue.
 * Handles are derived from names; the oldest item keeps the clean handle when
 * two names collide, so URLs stay stable as new products are added.
 */
export function buildCatalog(
  rawProducts: HitPayProduct[],
  rawCategories: HitPayCategory[],
  source: Catalog["source"],
): Catalog {
  const byAge = <T extends { id: string; created_at?: string }>(a: T, b: T) =>
    (a.created_at ?? "").localeCompare(b.created_at ?? "") || a.id.localeCompare(b.id);

  const visible = rawProducts.filter(isVisible).sort(byAge);
  const products = assignHandles(visible.map(normalizeProduct));

  const seen = new Set<string>();
  const categories = flattenCategories(rawCategories)
    .filter((category) => category.is_active !== false)
    .filter((category) => (seen.has(category.id) ? false : (seen.add(category.id), true)))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));

  const collections: Collection[] = assignHandles(
    categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      imageUrl: category.image?.urls?.large ?? category.image?.url ?? null,
      productIds: products.filter((p) => p.categoryIds.includes(category.id)).map((p) => p.id),
    })),
  ).filter((collection) => collection.productIds.length > 0);

  return { source, products, collections };
}
