import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  ensureFreshSession,
  readAdminSession,
  sealSession,
  sessionCookieOptions,
} from "@/lib/admin-session";

/**
 * Returns the signed-in merchant's OAuth access token so they can store it as
 * HITPAY_ACCESS_TOKEN in their hosting provider. POST-only and never cached so
 * the token is not embedded in any rendered page.
 */
export async function POST() {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  const fresh = await ensureFreshSession(session).catch(() => session);
  const response = NextResponse.json(
    { accessToken: fresh.accessToken, expiresAt: new Date(fresh.expiresAt).toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
  if (fresh !== session) {
    response.cookies.set(SESSION_COOKIE, sealSession(fresh), sessionCookieOptions());
  }
  return response;
}
