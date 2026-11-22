import { NextResponse, type NextRequest } from "next/server";
import { storeConfig } from "@root/store.config";
import { getProductsForCheckout } from "@/lib/catalog";
import { CheckoutError, parseCheckoutLines, priceCart } from "@/lib/checkout/price-cart";
import { randomToken } from "@/lib/crypto";
import { catalogSource, siteUrl, storefrontCredential, webhookUrl } from "@/lib/env";
import { HitPayApiError } from "@/lib/hitpay/client";
import { createHostedCheckout } from "@/lib/hitpay/checkout-adapter";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function error(status: number, code: string, message: string) {
  return NextResponse.json({ error: code, message }, { status });
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin || origin === new URL(siteUrl()).origin;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return error(403, "forbidden", "Cross-origin checkout is not allowed.");

  const credential = storefrontCredential();
  if (catalogSource() === "demo" || !credential) {
    return error(
      503,
      "checkout_not_configured",
      "Checkout is not connected to HitPay yet. This store is showing demo products.",
    );
  }

  const body = (await request.json().catch(() => null)) as {
    lines?: unknown;
    email?: unknown;
    name?: unknown;
  } | null;

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (email && !EMAIL.test(email)) return error(400, "invalid_email", "Enter a valid email address.");
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 255) : "";

  try {
    const lines = parseCheckoutLines(body?.lines);
    const products = await getProductsForCheckout(lines.map((l) => l.productId));
    const priced = priceCart(lines, products);
    const orderReference = `WEB-${randomToken(6).toUpperCase().replace(/[^A-Z0-9]/g, "X")}`;

    const checkout = await createHostedCheckout(
      {
        storeName: storeConfig.name,
        orderReference,
        currency: priced.currency,
        totalMinor: priced.totalMinor,
        lines: priced.lines.map((l) => ({
          name: l.product.name,
          variantTitle: l.variant.title,
          quantity: l.quantity,
          unitMinor: l.unitMinor,
        })),
        redirectUrl: `${siteUrl()}/checkout/complete`,
        webhookUrl: webhookUrl(),
        customer: { email: email || undefined, name: name || undefined },
      },
      credential,
    );

    return NextResponse.json({ url: checkout.url, orderReference });
  } catch (err) {
    if (err instanceof CheckoutError) return error(409, err.code, err.message);
    if (err instanceof HitPayApiError) {
      console.error(`[checkout] HitPay API error ${err.status}: ${err.message}`);
      return error(
        502,
        err.status === 401 || err.status === 403 ? "checkout_unauthorized" : "checkout_failed",
        "We couldn't start checkout. Please try again in a moment.",
      );
    }
    console.error("[checkout] Unexpected error:", err);
    return error(500, "checkout_failed", "We couldn't start checkout. Please try again in a moment.");
  }
}
