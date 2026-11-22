import { describe, expect, it } from "vitest";
import {
  addLine,
  cartCount,
  cartSubtotal,
  emptyCart,
  MAX_LINE_QUANTITY,
  parseCart,
  removeLine,
  setQuantity,
  type CartLine,
} from "@/lib/cart/cart";

const line = (overrides: Partial<CartLine> = {}): CartLine => ({
  productId: "p1",
  variantId: "v1",
  quantity: 1,
  handle: "mug",
  name: "Mug",
  variantTitle: null,
  price: 12.5,
  currency: "SGD",
  image: null,
  ...overrides,
});

describe("cart", () => {
  it("merges quantities for the same variant", () => {
    const cart = addLine(addLine(emptyCart, line()), line({ quantity: 2 }));
    expect(cart.lines).toHaveLength(1);
    expect(cartCount(cart)).toBe(3);
  });

  it("keeps different variants on separate lines", () => {
    const cart = addLine(addLine(emptyCart, line()), line({ variantId: "v2" }));
    expect(cart.lines).toHaveLength(2);
  });

  it("clamps quantities and removes lines set to zero", () => {
    let cart = addLine(emptyCart, line());
    cart = setQuantity(cart, line(), 1000);
    expect(cart.lines[0].quantity).toBe(MAX_LINE_QUANTITY);
    cart = setQuantity(cart, line(), 0);
    expect(cart.lines).toHaveLength(0);
  });

  it("removes lines", () => {
    const cart = removeLine(addLine(emptyCart, line()), line());
    expect(cart.lines).toEqual([]);
  });

  it("computes a subtotal only for single-currency carts", () => {
    const cart = addLine(addLine(emptyCart, line({ quantity: 2 })), line({ variantId: "v2", price: 0.1 }));
    expect(cartSubtotal(cart)).toEqual({ amount: 25.1, currency: "SGD" });
    expect(cartSubtotal(addLine(cart, line({ productId: "p2", currency: "MYR" })))).toBeNull();
  });

  it("discards malformed stored data", () => {
    expect(parseCart("nope")).toEqual(emptyCart);
    expect(parseCart({ lines: [line(), { productId: 1 }] }).lines).toHaveLength(1);
  });
});
