import { storeConfig } from "@root/store.config";
import { CartView } from "@/components/cart-view";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ path: "/cart", title: "Your cart", noindex: true });

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <h1 className="text-3xl font-semibold">Your cart</h1>
      <CartView locale={storeConfig.locale} />
    </div>
  );
}
