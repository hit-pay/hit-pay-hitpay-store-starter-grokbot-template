import "server-only";
import { hitpayHosts, type StorefrontCredential } from "@/lib/env";

export class HitPayApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "HitPayApiError";
  }
}

type Query = Record<string, string | number | boolean | Array<string | number> | undefined>;

/** Laravel-style query string: arrays become `key[]=a&key[]=b`. */
export function toQueryString(query: Query = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(`${key}[]`, String(item));
    } else {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function authHeaders(credential: StorefrontCredential): Record<string, string> {
  return credential.kind === "oauth"
    ? { Authorization: `Bearer ${credential.token}` }
    : { "X-BUSINESS-API-KEY": credential.token };
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH";
  query?: Query;
  body?: unknown;
};

/**
 * Minimal HitPay API client. Deliberately has no DELETE support: this starter
 * never deletes, refunds or cancels anything on the merchant's account.
 */
export async function hitpayRequest<T>(
  path: string,
  credential: StorefrontCredential,
  { method = "GET", query, body }: RequestOptions = {},
): Promise<T> {
  const url = `${hitpayHosts().api}${path}${toQueryString(query)}`;
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(credential),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  let parsed: unknown = undefined;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = text;
  }

  if (!response.ok) {
    const apiMessage =
      parsed && typeof parsed === "object" && "message" in parsed ? String(parsed.message) : "";
    const message = apiMessage || `HitPay API ${method} ${path} failed with ${response.status}`;
    throw new HitPayApiError(message, response.status, parsed);
  }
  return parsed as T;
}
