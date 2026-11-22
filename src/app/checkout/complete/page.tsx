import { Suspense } from "react";
import { CheckoutResult } from "@/components/checkout-result";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ path: "/checkout/complete", title: "Order status", noindex: true });

/**
 * HitPay redirects buyers here after checkout with `?reference=<payment request id>&status=<status>`.
 * These query values can be edited by anyone, so this page is informational
 * only; confirm payment with a webhook (HITPAY_WEBHOOK_URL) or the HitPay
 * dashboard before fulfilling an order.
 */
export default function CheckoutCompletePage({ searchParams }: PageProps<"/checkout/complete">) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <Suspense fallback={<p className="text-muted-foreground">Checking your order…</p>}>
        <Result searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Result({ searchParams }: Pick<PageProps<"/checkout/complete">, "searchParams">) {
  const params = await searchParams;
  const value = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : null);
  return <CheckoutResult status={value("status")} reference={value("reference")} />;
}
