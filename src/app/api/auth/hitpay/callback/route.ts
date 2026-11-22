import { connection, NextResponse, type NextRequest } from "next/server";
import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  sealSession,
  sessionCookieOptions,
  type OAuthState,
} from "@/lib/admin-session";
import { unseal } from "@/lib/crypto";
import {
  allowedAdminBusinessIds,
  hitpayEnvironment,
  oauthClient,
  oauthRedirectUri,
  sessionSecret,
  siteUrl,
} from "@/lib/env";
import { hitpayRequest } from "@/lib/hitpay/client";
import { exchangeCode, parseBusinessInfo } from "@/lib/hitpay/oauth";

const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function backToAdmin(error?: string) {
  const url = new URL("/admin", siteUrl());
  if (error) url.searchParams.set("error", error);
  else url.searchParams.set("connected", "1");
  const response = NextResponse.redirect(url, 303);
  response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/api/auth/hitpay" });
  return response;
}

export async function GET(request: NextRequest) {
  await connection();
  const client = oauthClient();
  const secret = sessionSecret();
  if (!client || !secret) return backToAdmin("not_configured");

  const params = request.nextUrl.searchParams;
  const rawState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const saved = rawState ? unseal<OAuthState>(rawState, secret) : null;

  if (!saved || !params.get("state") || params.get("state") !== saved.state) {
    return backToAdmin("invalid_state");
  }
  if (Date.now() - saved.createdAt > STATE_MAX_AGE_MS) return backToAdmin("expired");
  if (params.get("error")) return backToAdmin(params.get("error") ?? "access_denied");

  const code = params.get("code");
  if (!code) return backToAdmin("missing_code");

  try {
    const tokens = await exchangeCode({
      ...client,
      redirectUri: oauthRedirectUri(),
      code,
      codeVerifier: saved.codeVerifier,
    });
    const info = await hitpayRequest<unknown>("/v1/info", {
      kind: "oauth",
      token: tokens.access_token,
    }).catch(() => null);
    const business = parseBusinessInfo(info);

    const allowed = allowedAdminBusinessIds();
    if (allowed.length > 0 && (!business.id || !allowed.includes(business.id))) {
      return backToAdmin("business_not_allowed");
    }

    const response = backToAdmin();
    response.cookies.set(
      SESSION_COOKIE,
      sealSession({
        environment: hitpayEnvironment(),
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        business,
      }),
      sessionCookieOptions(),
    );
    return response;
  } catch (error) {
    console.error("[oauth] Token exchange failed:", error instanceof Error ? error.message : error);
    return backToAdmin("token_exchange_failed");
  }
}
