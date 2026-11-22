"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cartSubtotal, removeLine, setQuantity, type CartLine } from "@/lib/cart/cart";
import { updateCart, useCart } from "@/lib/cart/store";
import { formatMoney } from "@/lib/money";

export function CartView({ locale }: { locale: string }) {
  const cart = useCart();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subtotal = cartSubtotal(cart);

  async function checkout(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          lines: cart.lines.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { url?: string; message?: string };
      if (!response.ok || !result.url) {
        throw new Error(result.message ?? "We couldn't start checkout. Please try again.");
      }
      window.location.assign(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't start checkout. Please try again.");
      setPending(false);
    }
  }

  if (cart.lines.length === 0) {
    return (
      <div className="space-y-6 py-12 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Link href="/products" className="btn btn-primary">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
      <ul className="divide-border divide-y">
        {cart.lines.map((line) => (
          <CartLineRow key={`${line.productId}:${line.variantId}`} line={line} locale={locale} />
        ))}
      </ul>

      <form onSubmit={checkout} className="border-border h-fit space-y-4 rounded-[var(--radius-brand)] border p-6">
        <div className="flex justify-between text-lg">
          <span>Subtotal</span>
          <span>{subtotal ? formatMoney(subtotal.amount, subtotal.currency, locale) : "—"}</span>
        </div>
        <p className="text-muted-foreground text-sm">
          Shipping and taxes, if any, are confirmed at checkout. Prices are checked again before you pay.
        </p>
        <label className="block text-sm font-medium">
          Email for your receipt (optional)
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input mt-2"
            placeholder="you@example.com"
          />
        </label>
        {error && (
          <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary w-full" disabled={pending || !subtotal}>
          {pending ? "Redirecting to secure checkout…" : "Check out"}
        </button>
        {!subtotal && (
          <p className="text-sm text-red-700">Items in different currencies must be checked out separately.</p>
        )}
      </form>
    </div>
  );
}

function CartLineRow({ line, locale }: { line: CartLine; locale: string }) {
  return (
    <li className="flex gap-4 py-6">
      <div className="bg-muted relative h-24 w-24 shrink-0 overflow-hidden rounded-[var(--radius-brand)]">
        {line.image && <Image src={line.image} alt={line.name} fill sizes="96px" className="object-cover" unoptimized />}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-2 sm:flex-row">
        <div>
          <Link href={`/products/${line.handle}`} className="font-medium hover:underline">
            {line.name}
          </Link>
          {line.variantTitle && <p className="text-muted-foreground text-sm">{line.variantTitle}</p>}
          <p className="text-sm">{formatMoney(line.price, line.currency, locale)}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor={`qty-${line.variantId}`}>
            Quantity for {line.name}
          </label>
          <input
            id={`qty-${line.variantId}`}
            type="number"
            min={0}
            max={99}
            value={line.quantity}
            onChange={(e) => updateCart((cart) => setQuantity(cart, line, Number(e.target.value)))}
            className="input w-20"
          />
          <button
            type="button"
            className="text-muted-foreground text-sm underline"
            onClick={() => updateCart((cart) => removeLine(cart, line))}
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
