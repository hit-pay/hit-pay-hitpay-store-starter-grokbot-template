import { storeConfig } from "@root/store.config";
import { formatMoney } from "@/lib/money";

export function Price({
  amount,
  maxAmount,
  currency,
  className,
}: {
  amount: number;
  maxAmount?: number;
  currency: string;
  className?: string;
}) {
  const from = maxAmount !== undefined && maxAmount > amount;
  return (
    <span className={className}>
      {from && <span className="text-muted-foreground mr-1 text-sm">From</span>}
      {formatMoney(amount, currency, storeConfig.locale)}
    </span>
  );
}
