import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/admin-session";
import { siteUrl } from "@/lib/env";

/** Signs out of the local admin session. Does not revoke the app in HitPay. */
export async function POST() {
  const response = NextResponse.redirect(new URL("/admin", siteUrl()), 303);
  response.cookies.delete({ name: SESSION_COOKIE, path: "/" });
  return response;
}
