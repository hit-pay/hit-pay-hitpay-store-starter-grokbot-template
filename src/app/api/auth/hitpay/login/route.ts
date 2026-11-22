import { connection, NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE, secureCookies, type OAuthState } from "@/lib/admin-session";
import { randomToken, seal } from "@/lib/crypto";
import { hitpayHosts, oauthClient, oauthRedirectUri, sessionSecret, siteUrl } from "@/lib/env";
import { buildAuthorizeUrl } from "@/lib/hitpay/oauth";

export async function GET() {
  await connection();
  const client = oauthClient();
  const secret = sessionSecret();
  if (!client || !secret) {
    return NextResponse.redirect(new URL("/admin?error=not_configured", siteUrl()), 303);
  }

  const state: OAuthState = {
    state: randomToken(24),
    codeVerifier: randomToken(48),
    createdAt: Date.now(),
  };
  const authorizeUrl = buildAuthorizeUrl({
    dashboardHost: hitpayHosts().dashboard,
    clientId: client.clientId,
    redirectUri: oauthRedirectUri(),
    state: state.state,
    codeVerifier: state.codeVerifier,
  });

  const response = NextResponse.redirect(authorizeUrl, 303);
  response.cookies.set(OAUTH_STATE_COOKIE, seal(state, secret), {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: "lax",
    path: "/api/auth/hitpay",
    maxAge: 600,
  });
  return response;
}
