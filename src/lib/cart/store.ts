"use client";

import { useSyncExternalStore } from "react";
import { emptyCart, parseCart, type Cart } from "./cart";

/** Client-side cart persisted to localStorage. No server state, no cookies. */
const STORAGE_KEY = "store-cart-v1";

let snapshot: Cart = emptyCart;
let loaded = false;
const listeners = new Set<() => void>();

function load(): Cart {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try {
      snapshot = parseCart(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null"));
    } catch {
      snapshot = emptyCart;
    }
  }
  return snapshot;
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    loaded = false;
    load();
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function updateCart(update: (cart: Cart) => Cart) {
  snapshot = update(load());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage can be unavailable (private mode, quota); the cart still works for this tab.
  }
  emit();
}

export function useCart(): Cart {
  return useSyncExternalStore(subscribe, load, () => emptyCart);
}
