const AGGREGATOR_NAMES = /clapay|ashtechpay|sendavapay|soleapay|westpay|inpay|omnipay|robotpay/gi;

export function sanitizeDepositDisplayText(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const sanitized = value.replace(AGGREGATOR_NAMES, "the payment service").trim();
  return sanitized || fallback;
}