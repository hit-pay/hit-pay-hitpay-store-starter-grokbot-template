export const MAX_LINE_QUANTITY = 99;
export const MAX_CART_LINES = 50;

export type CartLine = {
  productId: string;
  variantId: string;
  quantity: number;
  /** Display snapshot taken when the item was added. Prices are re-checked on the server at checkout. */
  handle: string;
  name: string;
  variantTitle: string | null;
  price: number;
  currency: string;
  image: string | null;
};

export type Cart = { lines: CartLine[] };

export const emptyCart: Cart = { lines: [] };

const sameLine = (a: Pick<CartLine, "productId" | "variantId">, b: typeof a) =>
  a.productId === b.productId && a.variantId === b.variantId;

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(0, Math.min(MAX_LINE_QUANTITY, Math.floor(quantity)));
}

export function addLine(cart: Cart, line: CartLine): Cart {
  const existing = cart.lines.find((l) => sameLine(l, line));
  if (existing) {
    return setQuantity(cart, line, existing.quantity + line.quantity);
  }
  if (cart.lines.length >= MAX_CART_LINES) return cart;
  const quantity = clampQuantity(line.quantity);
  if (quantity === 0) return cart;
  return { lines: [...cart.lines, { ...line, quantity }] };
}

export function setQuantity(
  cart: Cart,
  key: Pick<CartLine, "productId" | "variantId">,
  quantity: number,
): Cart {
  const next = clampQuantity(quantity);
  if (next === 0) return removeLine(cart, key);
  return { lines: cart.lines.map((l) => (sameLine(l, key) ? { ...l, quantity: next } : l)) };
}

export function removeLine(cart: Cart, key: Pick<CartLine, "productId" | "variantId">): Cart {
  return { lines: cart.lines.filter((l) => !sameLine(l, key)) };
}

export function cartCount(cart: Cart): number {
  return cart.lines.reduce((sum, l) => sum + l.quantity, 0);
}

/** Display-only subtotal. Returns null when the cart mixes currencies. */
export function cartSubtotal(cart: Cart): { amount: number; currency: string } | null {
  if (cart.lines.length === 0) return null;
  const currency = cart.lines[0].currency;
  if (cart.lines.some((l) => l.currency !== currency)) return null;
  const amount = cart.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  return { amount: Math.round(amount * 100) / 100, currency };
}

/** Parses untrusted data from localStorage back into a cart. */
export function parseCart(value: unknown): Cart {
  if (!value || typeof value !== "object" || !Array.isArray((value as Cart).lines)) {
    return emptyCart;
  }
  const lines = (value as Cart).lines.filter(
    (l): l is CartLine =>
      !!l &&
      typeof l.productId === "string" &&
      typeof l.variantId === "string" &&
      typeof l.quantity === "number" &&
      typeof l.name === "string" &&
      typeof l.price === "number" &&
      typeof l.currency === "string",
  );
  return { lines: lines.slice(0, MAX_CART_LINES) };
}
