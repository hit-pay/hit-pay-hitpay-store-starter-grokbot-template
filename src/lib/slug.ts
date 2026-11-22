export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/**
 * Assigns a unique, URL-safe handle to each item. When two items slugify to the
 * same handle, the one listed first keeps the clean handle and later ones get a
 * short id suffix, so callers should pass items in a stable order.
 */
export function assignHandles<T extends { id: string; name: string }>(
  items: T[],
): Array<T & { handle: string }> {
  const used = new Set<string>();
  return items.map((item) => {
    const base = slugify(item.name) || "item";
    let handle = base;
    if (used.has(handle)) {
      handle = `${base}-${item.id.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase()}`;
    }
    let n = 2;
    while (used.has(handle)) handle = `${base}-${n++}`;
    used.add(handle);
    return { ...item, handle };
  });
}
