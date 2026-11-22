import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { Price } from "./price";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  return (
    <Link href={`/products/${product.handle}`} className="group block">
      <div className="bg-muted relative aspect-square overflow-hidden rounded-[var(--radius-brand)]">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">No image</div>
        )}
        {!product.available && (
          <span className="bg-background absolute top-2 left-2 rounded px-2 py-1 text-xs font-medium">Sold out</span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="font-sans text-sm font-medium group-hover:underline">{product.name}</h3>
        <Price amount={product.price} maxAmount={product.maxPrice} currency={product.currency} className="text-sm" />
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return <p className="text-muted-foreground">No products to show yet.</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
