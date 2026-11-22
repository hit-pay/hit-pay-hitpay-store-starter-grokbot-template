import type { Catalog } from "@/lib/catalog/types";

/** Shown only while the store runs on demo data or the HitPay catalogue failed to load. */
export function CatalogNotice({ catalog }: { catalog: Catalog }) {
  if (catalog.source === "demo") {
    return (
      <p className="border-border bg-muted rounded-[var(--radius-brand)] border p-4 text-sm">
        <strong>Preview mode:</strong> these are sample products. Connect HitPay (see the README) to show your
        catalogue and enable checkout.
      </p>
    );
  }
  if (catalog.error) {
    return (
      <p role="status" className="rounded-[var(--radius-brand)] border border-amber-300 bg-amber-50 p-4 text-sm">
        Products are temporarily unavailable. Please check back soon.
      </p>
    );
  }
  return null;
}
