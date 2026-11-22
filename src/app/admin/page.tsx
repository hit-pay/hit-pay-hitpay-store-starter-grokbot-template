import type { Metadata } from "next";
import { Suspense } from "react";
import { RevealToken } from "@/components/admin/reveal-token";
import { readAdminSession, tokenExpired } from "@/lib/admin-session";
import { getCatalog } from "@/lib/catalog";
import {
  catalogSource,
  hitpayEnvironment,
  oauthClient,
  oauthRedirectUri,
  sessionSecret,
  storefrontCredential,
} from "@/lib/env";
import { hitpayRequest } from "@/lib/hitpay/client";
import { OAUTH_SCOPES } from "@/lib/hitpay/oauth";
import type { HitPayPaginated, HitPayProduct } from "@/lib/hitpay/types";

export const metadata: Metadata = { title: "Store setup", robots: { index: false, follow: false } };

const ERRORS: Record<string, string> = {
  not_configured: "Set HITPAY_CLIENT_ID, HITPAY_CLIENT_SECRET and SESSION_SECRET first.",
  invalid_state: "The sign-in link expired or was opened in another browser. Please try again.",
  expired: "The sign-in took too long. Please try again.",
  access_denied: "Access was not granted in HitPay.",
  missing_code: "HitPay did not return an authorization code.",
  token_exchange_failed: "HitPay rejected the sign-in. Check the client ID, secret and redirect URI.",
  business_not_allowed: "This HitPay business is not allowed to manage this store (ADMIN_ALLOWED_BUSINESS_IDS).",
};

function Row({ label, ok, children }: { label: string; ok: boolean | null; children: React.ReactNode }) {
  return (
    <div className="border-border flex flex-col gap-1 border-b py-3 sm:flex-row sm:items-start sm:justify-between">
      <dt className="text-sm font-medium">{label}</dt>
      <dd className="text-sm sm:text-right">
        {ok !== null && (
          <span className={ok ? "text-green-700" : "text-amber-700"} aria-hidden="true">
            {ok ? "● " : "○ "}
          </span>
        )}
        {children}
      </dd>
    </div>
  );
}

async function StoreStatus() {
  const catalog = await getCatalog();
  const credential = storefrontCredential();
  const source = catalogSource();
  return (
    <dl>
      <Row label="HitPay environment" ok={null}>
        {hitpayEnvironment()}
      </Row>
      <Row label="OAuth app (HITPAY_CLIENT_ID / SECRET)" ok={Boolean(oauthClient())}>
        {oauthClient() ? "Configured" : "Not set"}
      </Row>
      <Row label="SESSION_SECRET" ok={Boolean(sessionSecret())}>
        {sessionSecret() ? "Configured" : "Missing or shorter than 32 characters"}
      </Row>
      <Row label="OAuth redirect URI to register in HitPay" ok={null}>
        <code className="break-all">{oauthRedirectUri()}</code>
      </Row>
      <Row label="Storefront credential" ok={Boolean(credential)}>
        {credential?.kind === "oauth"
          ? "HITPAY_ACCESS_TOKEN (OAuth)"
          : credential?.kind === "api-key"
            ? "HITPAY_API_KEY"
            : "None – showing demo products"}
      </Row>
      <Row label="Catalogue" ok={source === "hitpay" && !catalog.error}>
        {source === "demo" ? "Demo data" : catalog.error ? `Error: ${catalog.error}` : "HitPay"} ·{" "}
        {catalog.products.length} products · {catalog.collections.length} collections
      </Row>
      <Row label="Checkout" ok={source === "hitpay" && Boolean(credential)}>
        {source === "hitpay" && credential
          ? credential.kind === "oauth"
            ? "Enabled (token needs the payments:create scope)"
            : "Enabled"
          : "Disabled until HitPay is connected"}
      </Row>
    </dl>
  );
}

async function Connection({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : null;
  const session = await readAdminSession();

  let preview: string;
  if (session) {
    preview = await hitpayRequest<HitPayPaginated<HitPayProduct>>(
      "/v1/products",
      { kind: "oauth", token: session.accessToken },
      { query: { per_page: 1 } },
    )
      .then((r) => `Read access OK · ${r.meta?.total ?? r.data.length} products visible to this token`)
      .catch((error: Error) => `Could not read products: ${error.message}`);
  } else {
    preview = "";
  }

  return (
    <div className="space-y-6">
      {errorCode && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">
          {ERRORS[errorCode] ?? `Sign-in failed (${errorCode}).`}
        </p>
      )}
      {session ? (
        <>
          <dl>
            <Row label="Business" ok={true}>
              {session.business.name ?? "Connected"}
              {session.business.id && <span className="text-muted-foreground"> · {session.business.id}</span>}
            </Row>
            {(session.business.country || session.business.currency) && (
              <Row label="Country / currency" ok={null}>
                {[session.business.country, session.business.currency].filter(Boolean).join(" / ")}
              </Row>
            )}
            <Row label="Token expires" ok={!tokenExpired(session)}>
              {new Date(session.expiresAt).toISOString().slice(0, 10)}
            </Row>
            <Row label="Catalogue API" ok={preview.startsWith("Read access OK")}>
              {preview}
            </Row>
          </dl>
          <RevealToken />
          <form action="/api/auth/hitpay/logout" method="post">
            <button type="submit" className="text-muted-foreground text-sm underline">
              Sign out of this setup page
            </button>
          </form>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Sign in with your HitPay owner or admin account. The store requests these permissions:{" "}
            {OAUTH_SCOPES.map((scope) => (
              <code key={scope} className="mr-1">
                {scope}
              </code>
            ))}
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- route handler redirect, not a page */}
          <a href="/api/auth/hitpay/login" className="btn btn-primary">
            Connect HitPay account
          </a>
        </div>
      )}
    </div>
  );
}

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <div className="mx-auto max-w-3xl space-y-12 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Store setup</h1>
        <p className="text-muted-foreground">
          Connect the merchant&apos;s HitPay account and check the store configuration. This page is not linked
          from the storefront and is hidden from search engines.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">HitPay connection</h2>
        <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
          <Connection searchParams={searchParams} />
        </Suspense>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Configuration</h2>
        <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
          <StoreStatus />
        </Suspense>
      </section>
    </div>
  );
}
