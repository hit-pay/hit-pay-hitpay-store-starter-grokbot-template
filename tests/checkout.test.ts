import { describe, expect, it } from "vitest";
import { buildCatalog } from "@/lib/catalog/normalize";
import { CheckoutError, priceCart } from "@/lib/checkout/price-cart";
import { buildPaymentRequestPayload } from "@/lib/hitpay/checkout-adapter";
import type { HitPayProduct } from "@/lib/hitpay/types";
import demo from "@root/content/demo-catalog.json";

const { products } = buildCatalog(demo.products as unknown as HitPayProduct[], [], "demo");
const mug = products.find((p) => p.handle === "ceramic-mug")!;
const tee = products.find((p) => p.handle === "organic-cotton-tee")!;
const coffee = products.find((p) => p.handle === "house-blend-coffee")!;

function expectCode(fn: () => unknown, code: CheckoutError["code"]) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(CheckoutError);
    expect((error as CheckoutError).code).toBe(code);
    return;
  }
  throw new Error(`Expected CheckoutError ${code}`);
}

describe("priceCart", () => {
  it("prices lines from the catalogue, not the client", () => {
    const kilo = coffee.variants.find((v) => v.title === "1kg")!;
    const priced = priceCart(
      [
        { productId: mug.id, variantId: mug.variants[0].id, quantity: 2 },
        { productId: coffee.id, variantId: kilo.id, quantity: 1 },
      ],
      products,
    );
    expect(priced.currency).toBe("SGD");
    expect(priced.totalMinor).toBe(24_00 * 2 + 68_00);
  });

  it("rejects empty carts, bad quantities and unknown variants", () => {
    expectCode(() => priceCart([], products), "empty_cart");
    expectCode(() => priceCart([{ productId: mug.id, variantId: mug.variants[0].id, quantity: 0 }], products), "invalid_quantity");
    expectCode(() => priceCart([{ productId: mug.id, variantId: mug.variants[0].id, quantity: 1.5 }], products), "invalid_quantity");
    expectCode(() => priceCart([{ productId: mug.id, variantId: "nope", quantity: 1 }], products), "product_unavailable");
  });

  it("rejects sold-out variants and quantities above stock", () => {
    const soldOut = tee.variants.find((v) => !v.available)!;
    expectCode(() => priceCart([{ productId: tee.id, variantId: soldOut.id, quantity: 1 }], products), "product_unavailable");
    const charcoal = mug.variants.find((v) => v.title === "Charcoal")!;
    expectCode(
      () => priceCart([{ productId: mug.id, variantId: charcoal.id, quantity: charcoal.quantity! + 1 }], products),
      "insufficient_stock",
    );
  });

  it("rejects mixed currencies", () => {
    const myr = { ...mug, id: "myr", currency: "MYR" };
    expectCode(
      () =>
        priceCart(
          [
            { productId: mug.id, variantId: mug.variants[0].id, quantity: 1 },
            { productId: "myr", variantId: mug.variants[0].id, quantity: 1 },
          ],
          [...products, myr],
        ),
      "mixed_currency",
    );
  });
});

describe("buildPaymentRequestPayload", () => {
  const input = {
    storeName: "Starter Store",
    orderReference: "WEB-ABC123",
    currency: "sgd",
    totalMinor: 4250,
    lines: [
      { name: "Ceramic Mug", variantTitle: "Sand", quantity: 1, unitMinor: 2400 },
      { name: "Notebook", variantTitle: "Default", quantity: 1, unitMinor: 1850 },
    ],
    redirectUrl: "https://shop.example/checkout/complete",
  };

  it("maps the cart to the documented payment request fields", () => {
    const payload = buildPaymentRequestPayload({
      ...input,
      webhookUrl: "https://shop.example/hook",
      customer: { email: "a@b.co", name: "Ada" },
    });
    expect(payload).toMatchObject({
      amount: "42.50",
      currency: "SGD",
      purpose: "Starter Store order WEB-ABC123",
      reference_number: "WEB-ABC123",
      redirect_url: "https://shop.example/checkout/complete",
      webhook: "https://shop.example/hook",
      email: "a@b.co",
      name: "Ada",
    });
    expect((payload.metadata as Record<string, string>).items).toBe("1 x Ceramic Mug (Sand); 1 x Notebook");
  });

  it("omits optional fields and keeps metadata values within 500 characters", () => {
    const payload = buildPaymentRequestPayload({
      ...input,
      lines: Array.from({ length: 40 }, (_, i) => ({ name: `Product number ${i}`, variantTitle: null, quantity: 1, unitMinor: 100 })),
    });
    expect(payload).not.toHaveProperty("webhook");
    expect(payload).not.toHaveProperty("email");
    for (const value of Object.values(payload.metadata as Record<string, string>)) {
      expect(value.length).toBeLessThanOrEqual(500);
    }
  });

  it("refuses totals below the documented minimum", () => {
    expect(() => buildPaymentRequestPayload({ ...input, totalMinor: 10 })).toThrow(/minimum/);
  });
});
