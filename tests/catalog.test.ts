import { describe, expect, it } from "vitest";
import demo from "@root/content/demo-catalog.json";
import { buildCatalog, normalizeProduct } from "@/lib/catalog/normalize";
import type { HitPayCategory, HitPayProduct } from "@/lib/hitpay/types";

const products = demo.products as unknown as HitPayProduct[];
const categories = demo.categories as unknown as HitPayCategory[];

const base: HitPayProduct = {
  id: "p1",
  category_id: [],
  name: "Beanie",
  headline: null,
  description: '<p>Warm <script>alert(1)</script><a href="javascript:x">hat</a></p>',
  currency: "sgd",
  price: 15,
  status: "published",
  has_variations: false,
  variations: [],
  variation_key_1: null,
  variation_key_2: null,
  variation_key_3: null,
  images: [],
};

describe("normalizeProduct", () => {
  it("sanitises descriptions and uppercases currency", () => {
    const product = normalizeProduct(base);
    expect(product.descriptionHtml).not.toContain("<script");
    expect(product.descriptionHtml).not.toContain("javascript:");
    expect(product.descriptionText).toBe("Warm hat");
    expect(product.currency).toBe("SGD");
  });

  it("creates a default variant when HitPay returns no variations", () => {
    const product = normalizeProduct(base);
    expect(product.variants).toHaveLength(1);
    expect(product.variants[0]).toMatchObject({ id: "p1", price: 15, available: true });
    expect(product.options).toEqual([]);
  });

  it("maps variation keys to options and tracks stock", () => {
    const product = normalizeProduct({
      ...base,
      has_variations: true,
      variation_key_1: "Size",
      variations: [
        { id: "v1", stock_keeping_unit: null, description: "M", price: 18, quantity: 0, variation_value_1: "M", variation_value_2: null, variation_value_3: null },
        { id: "v2", stock_keeping_unit: "SKU-L", description: "L", price: 20, quantity: 3, variation_value_1: "L", variation_value_2: null, variation_value_3: null },
      ],
    });
    expect(product.options).toEqual([{ name: "Size", values: ["M", "L"] }]);
    expect(product.price).toBe(18);
    expect(product.maxPrice).toBe(20);
    expect(product.variants.map((v) => v.available)).toEqual([false, true]);
    expect(product.available).toBe(true);
  });
});

describe("buildCatalog", () => {
  it("builds the demo catalogue with unique handles and non-empty collections", () => {
    const catalog = buildCatalog(products, categories, "demo");
    expect(catalog.products.length).toBe(products.length);
    const handles = catalog.products.map((p) => p.handle);
    expect(new Set(handles).size).toBe(handles.length);
    expect(handles).toContain("ceramic-mug");
    expect(catalog.collections.map((c) => c.handle)).toEqual(["home", "apparel", "pantry"]);
    expect(catalog.collections.every((c) => c.productIds.length > 0)).toBe(true);
  });

  it("hides unpublished products and keeps the older product's handle on collisions", () => {
    const catalog = buildCatalog(
      [
        { ...base, id: "new", created_at: "2026-02-01" },
        { ...base, id: "old", created_at: "2026-01-01" },
        { ...base, id: "draft", status: "draft" },
      ],
      [],
      "hitpay",
    );
    expect(catalog.products.map((p) => [p.id, p.handle])).toEqual([
      ["old", "beanie"],
      ["new", "beanie-new"],
    ]);
  });

  it("flattens nested categories and drops inactive ones", () => {
    const catalog = buildCatalog(
      [{ ...base, category_id: ["child"] }],
      [
        { id: "parent", name: "Hats", description: null, children: [{ id: "child", name: "Winter Hats", description: null }] },
        { id: "off", name: "Old", description: null, is_active: false },
      ],
      "hitpay",
    );
    expect(catalog.collections.map((c) => c.handle)).toEqual(["winter-hats"]);
  });
});
