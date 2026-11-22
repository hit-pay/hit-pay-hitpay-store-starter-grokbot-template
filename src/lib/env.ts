import "server-only";

export type HitPayEnvironment = "sandbox" | "production";

const HOSTS: Record<HitPayEnvironment, { api: string; dashboard: string }> = {
  sandbox: {
    api: "https://api.sandbox.hit-pay.com",
    dashboard: "https://dashboard.sandbox.hit-pay.com",
  },
  production: {
    api: "https://api.hit-pay.com",
    dashboard: "https://dashboard.hit-pay.com",
  },
};

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function hitpayEnvironment(): HitPayEnvironment {
  return read("HITPAY_ENV") === "production" ? "production" : "sandbox";
}

/** HITPAY_API_BASE_URL / HITPAY_DASHBOARD_URL override the hosts, e.g. to point at a local mock. */
export function hitpayHosts() {
  const defaults = HOSTS[hitpayEnvironment()];
  return {
    api: (read("HITPAY_API_BASE_URL") ?? defaults.api).replace(/\/+$/, ""),
    dashboard: (read("HITPAY_DASHBOARD_URL") ?? defaults.dashboard).replace(/\/+$/, ""),
  };
}

export function oauthClient() {
  const clientId = read("HITPAY_CLIENT_ID");
  const clientSecret = read("HITPAY_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function sessionSecret(): string | undefined {
  const secret = read("SESSION_SECRET");
  return secret && secret.length >= 32 ? secret : undefined;
}

/** Business IDs allowed to sign in to /admin. Empty means any HitPay business owner/admin. */
export function allowedAdminBusinessIds(): string[] {
  return (read("ADMIN_ALLOWED_BUSINESS_IDS") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export type StorefrontCredential =
  | { kind: "oauth"; token: string }
  | { kind: "api-key"; token: string };

/**
 * Server-side credential the public storefront uses for catalogue reads and
 * checkout. Visitors never see it. An OAuth access token (from the /admin
 * connect flow) takes precedence over a classic business API key.
 */
export function storefrontCredential(): StorefrontCredential | null {
  const accessToken = read("HITPAY_ACCESS_TOKEN");
  if (accessToken) return { kind: "oauth", token: accessToken };
  const apiKey = read("HITPAY_API_KEY");
  if (apiKey) return { kind: "api-key", token: apiKey };
  return null;
}

export type CatalogSource = "hitpay" | "demo";

export function catalogSource(): CatalogSource {
  const configured = read("CATALOG_SOURCE");
  if (configured === "demo") return "demo";
  if (configured === "hitpay") return "hitpay";
  return storefrontCredential() ? "hitpay" : "demo";
}

export function webhookUrl(): string | undefined {
  return read("HITPAY_WEBHOOK_URL");
}

export function siteUrl(): string {
  const explicit = read("NEXT_PUBLIC_SITE_URL");
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercelProduction = read("VERCEL_PROJECT_PRODUCTION_URL");
  if (read("VERCEL_ENV") === "production" && vercelProduction) {
    return `https://${vercelProduction}`;
  }
  const vercelUrl = read("VERCEL_URL");
  if (vercelUrl) return `https://${vercelUrl}`;
  return "http://localhost:3000";
}

/** Search engines should only index the production deployment. */
export function allowIndexing(): boolean {
  const vercelEnv = read("VERCEL_ENV");
  if (vercelEnv) return vercelEnv === "production";
  return read("ALLOW_INDEXING") !== "false";
}

export function oauthRedirectUri(): string {
  return read("HITPAY_OAUTH_REDIRECT_URI") ?? `${siteUrl()}/api/auth/hitpay/callback`;
}
