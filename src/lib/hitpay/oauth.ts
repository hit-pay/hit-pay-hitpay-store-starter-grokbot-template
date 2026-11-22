import "server-only";
import { pkceChallenge } from "@/lib/crypto";
import { hitpayHosts } from "@/lib/env";
import { HitPayApiError } from "./client";
import type { HitPayTokenResponse } from "./types";

/**
 * Scopes requested by the merchant/admin sign-in. These match the HitPay Store
 * Builder permissions. No delete, refund or cancel scopes are ever requested.
 */
export const OAUTH_SCOPES = [
  "commerce:read",
  "commerce:create",
  "commerce:update",
  "customer:read",
] as const;

export function buildAuthorizeUrl(params: {
  dashboardHost: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeVerifier: string;
  scopes?: readonly string[];
}): string {
  const url = new URL("/oauth/authorize", params.dashboardHost);
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", (params.scopes ?? OAUTH_SCOPES).join(" "));
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", pkceChallenge(params.codeVerifier));
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

async function tokenRequest(body: Record<string, string>): Promise<HitPayTokenResponse> {
  const response = await fetch(`${hitpayHosts().api}/v1/open/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(body),
    cache: "no-store",
  });
  const json = (await response.json().catch(() => ({}))) as Partial<HitPayTokenResponse> & {
    message?: string;
    error_description?: string;
  };
  if (!response.ok || !json.access_token) {
    throw new HitPayApiError(
      json.error_description || json.message || `Token request failed with ${response.status}`,
      response.status,
      json,
    );
  }
  return json as HitPayTokenResponse;
}

export function exchangeCode(params: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}) {
  return tokenRequest({
    grant_type: "authorization_code",
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    code: params.code,
    code_verifier: params.codeVerifier,
  });
}

export function refreshAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}) {
  return tokenRequest({
    grant_type: "refresh_token",
    client_id: params.clientId,
    client_secret: params.clientSecret,
    refresh_token: params.refreshToken,
  });
}

export type BusinessInfo = {
  id: string | null;
  name: string | null;
  country: string | null;
  currency: string | null;
};

/**
 * Parses `GET /v1/info`. The docs describe it as returning the business name,
 * country and currency, but do not publish the exact schema, so this accepts a
 * few plausible field names and an optional `data` wrapper.
 */
export function parseBusinessInfo(value: unknown): BusinessInfo {
  const root = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const data = (
    root.data && typeof root.data === "object" ? root.data : root
  ) as Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const v = data[key];
      if (typeof v === "string" && v) return v;
      if (typeof v === "number") return String(v);
    }
    return null;
  };
  return {
    id: pick("id", "business_id"),
    name: pick("name", "business_name", "display_name"),
    country: pick("country", "country_code"),
    currency: pick("currency", "default_currency"),
  };
}
