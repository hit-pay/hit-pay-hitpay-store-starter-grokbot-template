"use client";

import Link from "next/link";
import { useEffect } from "react";
import { emptyCart } from "@/lib/cart/cart";
import { updateCart } from "@/lib/cart/store";

export function CheckoutResult({ status, reference }: { status: string | null; reference: string | null }) {
  const completed = status === "completed";

  useEffect(() => {
    if (completed) updateCart(() => emptyCart);
  }, [completed]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{completed ? "Thank you for your order" : "Payment not completed"}</h1>
      <p className="text-muted-foreground">
        {completed
          ? "Your payment has been submitted. Please keep the reference below for your records."
          : "Your payment wasn't completed. Your cart has been kept so you can try again."}
      </p>
      {reference && (
        <p className="text-muted-foreground text-sm">
          Payment reference: <code className="break-all">{reference}</code>
        </p>
      )}
      <Link href={completed ? "/products" : "/cart"} className="btn btn-primary">
        {completed ? "Continue shopping" : "Return to cart"}
      </Link>
    </div>
  );
}
