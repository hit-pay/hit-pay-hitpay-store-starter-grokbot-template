import "server-only";
import { cookies } from "next/headers";
import { seal, unseal } from "@/lib/crypto";
import { hitpayEnvironment, oauthClient, sessionSecret, type HitPayEnvironment } from "@/lib/env";
import { refreshAccessToken, type BusinessInfo } from "@/lib/hitpay/oauth";

export const SESSION_COOKIE = "hp_admin";
export const OAUTH_STATE_COOKIE = "hp_oauth";
const SESSION_MAX_AGE = 60 * 60 * 8;
const REFRESH_MARGIN_MS = 24 * 60 * 60 * 1000;

export type AdminSession = {
  environment: HitPayEnvironment;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  business: BusinessInfo;
};

export type OAuthState = { state: string; codeVerifier: string; createdAt: number };

export const secureCookies = () => process.env.NODE_ENV === "production";

export async function readAdminSession(): Promise<AdminSession | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const session = unseal<AdminSession>(raw, secret);
  if (!session || session.environment !== hitpayEnvironment()) return null;
  return session;
}

export function sealSession(session: AdminSession): string {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET must be set (at least 32 characters).");
  return seal(session, secret);
}

export const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: secureCookies(),
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
});

export function tokenExpired(session: AdminSession): boolean {
  return session.expiresAt <= Date.now();
}

/** Refreshes the session's access token if it is close to expiry. */
export async function ensureFreshSession(session: AdminSession): Promise<AdminSession> {
  if (session.expiresAt - Date.now() > REFRESH_MARGIN_MS) return session;
  const client = oauthClient();
  if (!client) return session;
  const tokens = await refreshAccessToken({ ...client, refreshToken: session.refreshToken });
  return {
    ...session,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? session.refreshToken,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  };
}
