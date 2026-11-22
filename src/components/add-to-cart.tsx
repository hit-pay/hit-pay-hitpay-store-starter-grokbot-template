"use client";

import { useState } from "react";
import { addLine, MAX_LINE_QUANTITY } from "@/lib/cart/cart";
import { updateCart } from "@/lib/cart/store";
import type { Product } from "@/lib/catalog/types";
import { formatMoney } from "@/lib/money";

type Props = {
  product: Pick<Product, "id" | "handle" | "name" | "currency" | "options" | "variants" | "images">;
  locale: string;
};

export function AddToCart({ product, locale }: Props) {
  const firstAvailable = product.variants.find((v) => v.available) ?? product.variants[0];
  const [selected, setSelected] = useState<string[]>(firstAvailable.optionValues);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const variant =
    product.options.length === 0
      ? product.variants[0]
      : product.variants.find((v) => v.optionValues.every((value, i) => value === selected[i]));

  const maxQuantity = Math.min(MAX_LINE_QUANTITY, variant?.quantity ?? MAX_LINE_QUANTITY);
  const canAdd = Boolean(variant?.available) && quantity >= 1;

  function handleAdd() {
    if (!variant || !canAdd) return;
    updateCart((cart) =>
      addLine(cart, {
        productId: product.id,
        variantId: variant.id,
        quantity,
        handle: product.handle,
        name: product.name,
        variantTitle: product.options.length ? variant.title : null,
        price: variant.price,
        currency: product.currency,
        image: product.images[0]?.url ?? null,
      }),
    );
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-6">
      <p className="text-2xl">
        {variant ? formatMoney(variant.price, product.currency, locale) : "Unavailable"}
      </p>

      {product.options.map((option, index) => (
        <fieldset key={option.name}>
          <legend className="mb-2 text-sm font-medium">{option.name}</legend>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const active = selected[index] === value;
              const exists = product.variants.some(
                (v) =>
                  v.available &&
                  v.optionValues[index] === value &&
                  v.optionValues.every((other, i) => i === index || other === selected[i]),
              );
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected((prev) => prev.map((v, i) => (i === index ? value : v)))}
                  className={`btn px-4 py-2 text-sm ${active ? "btn-primary" : "btn-outline"} ${exists ? "" : "line-through opacity-60"}`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex items-end gap-3">
        <label className="text-sm font-medium">
          Quantity
          <input
            type="number"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, Number(e.target.value) || 1)))}
            className="input mt-2 w-24"
          />
        </label>
        <button type="button" className="btn btn-primary flex-1" disabled={!canAdd} onClick={handleAdd}>
          {!variant?.available ? "Sold out" : added ? "Added to cart" : "Add to cart"}
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {added ? `${product.name} added to cart` : ""}
      </p>
    </div>
  );
}
