"use client";

import Link from "next/link";
import { cartCount } from "@/lib/cart/cart";
import { useCart } from "@/lib/cart/store";

export function CartLink() {
  const count = cartCount(useCart());
  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center gap-2 text-sm font-medium"
      aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M6 7h12l-1 13H7L6 7Z" strokeLinejoin="round" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      <span>Cart</span>
      {count > 0 && (
        <span className="bg-primary text-primary-foreground min-w-5 rounded-full px-1.5 text-center text-xs leading-5">
          {count}
        </span>
      )}
    </Link>
  );
}
