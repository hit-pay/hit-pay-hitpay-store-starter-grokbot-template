/**
 * Loads redirects.json (old URL -> new URL) for next.config.ts.
 *
 * Every entry becomes a 301 redirect unless it sets `"permanent": false`
 * (which becomes a 302). `source` and `destination` use Next.js path matching,
 * e.g. "/blogs/news/:slug" -> "/blog/:slug". Destinations may be absolute URLs.
 */

export type RedirectEntry = {
  source: string;
  destination: string;
  permanent?: boolean;
};

export type NextRedirect = {
  source: string;
  destination: string;
  statusCode: 301 | 302;
};

export function validateRedirects(entries: unknown): string[] {
  if (!Array.isArray(entries)) return ["redirects.json must contain a JSON array."];
  const problems: string[] = [];
  const sources = new Map<string, number>();

  entries.forEach((entry, index) => {
    const where = `redirects.json[${index}]`;
    if (!entry || typeof entry !== "object") {
      problems.push(`${where} must be an object.`);
      return;
    }
    const { source, destination, permanent } = entry as Record<string, unknown>;
    if (typeof source !== "string" || !source.startsWith("/")) {
      problems.push(`${where}.source must be a path starting with "/".`);
    }
    if (
      typeof destination !== "string" ||
      !(destination.startsWith("/") || /^https?:\/\//.test(destination))
    ) {
      problems.push(`${where}.destination must be a path starting with "/" or an http(s) URL.`);
    }
    if (permanent !== undefined && typeof permanent !== "boolean") {
      problems.push(`${where}.permanent must be true or false when set.`);
    }
    if (typeof source === "string" && typeof destination === "string") {
      if (source.includes("?")) {
        problems.push(`${where}.source must not contain a query string ("?"); Next.js matches paths only.`);
      }
      if (source === destination) problems.push(`${where} redirects to itself.`);
      const key = source.replace(/\/+$/, "") || "/";
      if (sources.has(key)) {
        problems.push(`${where}.source duplicates redirects.json[${sources.get(key)}].`);
      } else {
        sources.set(key, index);
      }
    }
  });

  return problems;
}

export function toNextRedirects(entries: RedirectEntry[]): NextRedirect[] {
  const problems = validateRedirects(entries);
  if (problems.length > 0) {
    throw new Error(`Invalid redirects.json:\n- ${problems.join("\n- ")}`);
  }
  return entries.map(({ source, destination, permanent }) => ({
    source: source.length > 1 ? source.replace(/\/+$/, "") : source,
    destination,
    statusCode: permanent === false ? 302 : 301,
  }));
}
