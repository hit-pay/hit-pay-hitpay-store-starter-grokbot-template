export function currencyDigits(currency: string): number {
  try {
    return (
      new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase() })
        .resolvedOptions().maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/** Converts a major-unit amount (e.g. 12.5 SGD) to integer minor units (1250). */
export function toMinorUnits(amount: number, currency: string): number {
  return Math.round(amount * 10 ** currencyDigits(currency));
}

export function fromMinorUnits(minor: number, currency: string): number {
  return minor / 10 ** currencyDigits(currency);
}

/** Decimal string for APIs, e.g. 1250 SGD minor units -> "12.50". */
export function minorToDecimalString(minor: number, currency: string): string {
  return fromMinorUnits(minor, currency).toFixed(currencyDigits(currency));
}

export function formatMoney(amount: number, currency: string, locale = "en-SG"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
}
