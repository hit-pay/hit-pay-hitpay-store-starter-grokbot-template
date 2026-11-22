/**
 * Checkout adapter: the ONLY place the storefront talks to HitPay to start a
 * payment. Swap the implementation here when HitPay ships a storefront API.
 *
 * TODO(hitpay-product): Confirm the storefront checkout API.
 * HitPay's public docs (docs.hitpayapp.com) do not document a cart or
 * checkout-session endpoint. Until one is confirmed, checkout uses the
 * documented Payment Request API:
 *
 *   POST /v1/payment-requests  (JSON body)
 *     amount            decimal string, e.g. "42.00" (docs: > 0.3)
 *     currency          ISO code, e.g. "SGD"
 *     purpose           <= 255 chars, shown on the HitPay checkout page
 *     reference_number  <= 255 chars, our order reference
 *     redirect_url      HitPay appends ?reference=<payment request id>&status=<status>
 *     webhook           optional server-to-server notification URL
 *     email, name       optional buyer details
 *     metadata          optional, string values <= 500 chars, <= 50 keys
 *   -> 200 { id, url, status, amount, currency, ... }; we redirect the buyer to `url`.
 *
 * Assumptions to confirm with HitPay product:
 * 1. Scope: with OAuth, this endpoint needs `payments:create`. The Store Builder
 *    scope set (commerce:read/create/update, customer:read) does not include it,
 *    so checkout currently needs either that extra scope on the OAuth token or a
 *    business API key (HITPAY_API_KEY).
 * 2. Line items: the response includes `line_items: null`, but there is no
 *    documented request field for line items, so items are summarised in
 *    `purpose` and `metadata` instead and no HitPay Order is created.
 * 3. Shipping, tax and discounts are not calculated; the amount is the sum of
 *    current catalogue prices.
 * 4. Inventory is not decremented by this flow.
 */
import "server-only";
import type { StorefrontCredential } from "@/lib/env";
import { minorToDecimalString } from "@/lib/money";
import { hitpayRequest } from "./client";
import type { HitPayPaymentRequest } from "./types";

export type HostedCheckoutLine = {
  name: string;
  variantTitle: string | null;
  quantity: number;
  unitMinor: number;
};

export type HostedCheckoutInput = {
  storeName: string;
  orderReference: string;
  currency: string;
  totalMinor: number;
  lines: HostedCheckoutLine[];
  redirectUrl: string;
  webhookUrl?: string;
  customer?: { email?: string; name?: string };
};

export type HostedCheckout = { id: string; url: string };

const MIN_AMOUNT = 0.3;

function clip(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function describeLine(line: HostedCheckoutLine): string {
  const variant = line.variantTitle && line.variantTitle !== "Default" ? ` (${line.variantTitle})` : "";
  return `${line.quantity} x ${line.name}${variant}`;
}

export function buildPaymentRequestPayload(input: HostedCheckoutInput) {
  const amount = minorToDecimalString(input.totalMinor, input.currency);
  if (Number(amount) < MIN_AMOUNT) {
    throw new Error(`Order total ${amount} ${input.currency} is below the payment request minimum.`);
  }

  const summary = input.lines.map(describeLine).join("; ");
  const payload: Record<string, unknown> = {
    amount,
    currency: input.currency.toUpperCase(),
    purpose: clip(`${input.storeName} order ${input.orderReference}`, 255),
    reference_number: clip(input.orderReference, 255),
    redirect_url: input.redirectUrl,
    metadata: {
      source: "hitpay-store-starter",
      order_reference: input.orderReference,
      items: clip(summary, 500),
      item_count: String(input.lines.reduce((n, l) => n + l.quantity, 0)),
    },
  };
  if (input.webhookUrl) payload.webhook = input.webhookUrl;
  if (input.customer?.email) payload.email = input.customer.email;
  if (input.customer?.name) payload.name = clip(input.customer.name, 255);
  return payload;
}

export async function createHostedCheckout(
  input: HostedCheckoutInput,
  credential: StorefrontCredential,
): Promise<HostedCheckout> {
  const response = await hitpayRequest<HitPayPaymentRequest>(
    "/v1/payment-requests",
    credential,
    { method: "POST", body: buildPaymentRequestPayload(input) },
  );
  if (!response?.url || !response.id) {
    throw new Error("HitPay did not return a checkout URL for the payment request.");
  }
  return { id: response.id, url: response.url };
}
