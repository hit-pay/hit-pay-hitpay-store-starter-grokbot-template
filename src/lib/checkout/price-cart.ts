import { MAX_CART_LINES, MAX_LINE_QUANTITY } from "@/lib/cart/cart";
import type { Product, ProductVariant } from "@/lib/catalog/types";
import { toMinorUnits } from "@/lib/money";

export type CheckoutLineInput = { productId: string; variantId: string; quantity: number };

export type PricedLine = {
  product: Product;
  variant: ProductVariant;
  quantity: number;
  unitMinor: number;
  totalMinor: number;
};

export type PricedCart = { currency: string; lines: PricedLine[]; totalMinor: number };

export class CheckoutError extends Error {
  constructor(
    readonly code:
      | "empty_cart"
      | "too_many_lines"
      | "invalid_quantity"
      | "product_unavailable"
      | "insufficient_stock"
      | "mixed_currency",
    message: string,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

export function parseCheckoutLines(value: unknown): CheckoutLineInput[] {
  if (!Array.isArray(value)) throw new CheckoutError("empty_cart", "Your cart is empty.");
  return value.map((line) => ({
    productId: String(line?.productId ?? ""),
    variantId: String(line?.variantId ?? ""),
    quantity: Number(line?.quantity),
  }));
}

/**
 * Re-prices a cart against the current catalogue. Never trust prices sent by
 * the browser: only product/variant ids and quantities are taken from the client.
 */
export function priceCart(lines: CheckoutLineInput[], products: Product[]): PricedCart {
  if (lines.length === 0) throw new CheckoutError("empty_cart", "Your cart is empty.");
  if (lines.length > MAX_CART_LINES) {
    throw new CheckoutError("too_many_lines", `A cart can hold up to ${MAX_CART_LINES} items.`);
  }

  const byId = new Map(products.map((p) => [p.id, p]));
  const priced = lines.map((line): PricedLine => {
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > MAX_LINE_QUANTITY
    ) {
      throw new CheckoutError("invalid_quantity", "One of the quantities in your cart is invalid.");
    }
    const product = byId.get(line.productId);
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (!product || !variant || !variant.available) {
      throw new CheckoutError(
        "product_unavailable",
        `${product?.name ?? "An item in your cart"} is no longer available.`,
      );
    }
    if (variant.quantity !== null && line.quantity > variant.quantity) {
      throw new CheckoutError(
        "insufficient_stock",
        `Only ${variant.quantity} of ${product.name} left in stock.`,
      );
    }
    const unitMinor = toMinorUnits(variant.price, product.currency);
    return { product, variant, quantity: line.quantity, unitMinor, totalMinor: unitMinor * line.quantity };
  });

  const currency = priced[0].product.currency;
  if (priced.some((l) => l.product.currency !== currency)) {
    throw new CheckoutError(
      "mixed_currency",
      "Items priced in different currencies can't be checked out together.",
    );
  }

  return {
    currency,
    lines: priced,
    totalMinor: priced.reduce((sum, l) => sum + l.totalMinor, 0),
  };
}
