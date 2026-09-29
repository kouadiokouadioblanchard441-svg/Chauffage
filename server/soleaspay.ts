function getSoleaspayApiBaseUrl(): string {
  const configuredUrl = process.env.SOLEASPAY_API_BASE_URL?.trim();
  if (!configuredUrl) {
    throw new Error("SOLEASPAY_API_BASE_URL must be configured in the Plesk environment variables.");
  }
  const parsedUrl = new URL(configuredUrl);
  if (parsedUrl.protocol !== "https:") {
    throw new Error("SOLEASPAY_API_BASE_URL must use HTTPS.");
  }
  return parsedUrl.toString().replace(/\/+$/, "");
}

function getApiKey(): string {
  const key = process.env.SOLEASPAY_API_KEY;
  if (!key) throw new Error("SOLEASPAY_API_KEY must be configured in the Plesk environment variables.");
  return key;
}

export function validateSoleaspayConfig(): void {
  getSoleaspayApiBaseUrl();
  getApiKey();
}

export const SOLEASPAY_SERVICE_MAP: Record<string, Record<string, number>> = {
  CM: {
    "MTN": 1,
    "Orange Money": 2,
  },
  BF: {
    "Moov Money": 33,
    "Orange Money": 34,
  },
  TG: {
    "Moov Money": 38,
    "T-Money": 37,
    "Mixx by Yas": 37,
  },
  BJ: {
    "MTN": 35,
    "Moov Money": 36,
  },
  CI: {
    "Orange Money": 29,
    "MTN": 30,
    "Moov Money": 31,
    "Wave": 32,
  },
  CG: {
    "MTN": 56,
  },
  CD: {
    "Vodacom": 52,
    "Airtel Money": 53,
    "Orange Money": 54,
  },
};

export const CURRENCY_MAP: Record<string, string> = {
  CM: "XAF",
  BF: "XOF",
  TG: "XOF",
  BJ: "XOF",
  CI: "XOF",
  CG: "XAF",
  CD: "CDF",
};

interface SoleaspayPaymentRequest {
  wallet: string;
  amount: number;
  currency: string;
  order_id: string;
  description: string;
  payer: string;
  payerEmail: string;
  successUrl: string;
  failureUrl: string;
}

interface SoleaspayPaymentResponse {
  success: boolean;
  code?: number;
  status?: string;
  created_at?: string;
  data?: {
    operation: string;
    reference: string;
    external_reference: string;
    transaction_reference: string | null;
    transaction_category: string;
    transaction_channel: string;
    amount: string;
    currency: string;
  };
  message?: string;
}

interface SoleaspayVerifyResponse {
  success: boolean;
  code?: number;
  status?: string;
  created_at?: string;
  data?: {
    operation: string;
    reference: string;
    external_reference: string;
    transaction_reference: string;
    amount: number;
    currency: string;
  };
  message?: string;
}

export function getServiceId(country: string, paymentMethod: string): number | null {
  const countryServices = SOLEASPAY_SERVICE_MAP[country];
  if (!countryServices) return null;
  return countryServices[paymentMethod] || null;
}

export function getCurrency(country: string): string {
  return CURRENCY_MAP[country] || "XAF";
}

export function isSoleaspaySupported(country: string, paymentMethod: string): boolean {
  return getServiceId(country, paymentMethod) !== null;
}

const PHONE_PREFIX_MAP: Record<string, string> = {
  CM: "237",
  BF: "226",
  TG: "228",
  BJ: "229",
  CI: "225",
  CG: "242",
  CD: "243",
};

export function formatWallet(phone: string, country: string): string {
  const cleaned = phone.replace(/[\s\-\+]/g, "");
  const prefix = PHONE_PREFIX_MAP[country];
  if (!prefix) return cleaned;
  if (cleaned.startsWith(prefix)) return cleaned;
  if (cleaned.startsWith("0")) return prefix + cleaned.substring(1);
  return prefix + cleaned;
}

function getPublicBaseUrl(): string {
  const configuredUrl = process.env.PUBLIC_APP_URL?.trim();
  if (configuredUrl) {
    const parsedUrl = new URL(configuredUrl);
    if (process.env.NODE_ENV === "production" && parsedUrl.protocol !== "https:") {
      throw new Error("PUBLIC_APP_URL must use HTTPS in production.");
    }
    return parsedUrl.origin;
  }

  const devDomain = process.env.REPLIT_DEV_DOMAIN?.trim();
  if (process.env.NODE_ENV !== "production" && devDomain) {
    return `https://${devDomain}`;
  }

  throw new Error("PUBLIC_APP_URL must be configured to receive SoleaPay returns.");
}

function buildReturnUrl(baseUrl: string, result: "success" | "failure", orderId: string): string {
  const url = new URL("/deposit", baseUrl);
  url.searchParams.set("soleaspayReturn", result);
  url.searchParams.set("orderId", orderId);
  return url.toString();
}

export async function initiatePayment(
  wallet: string,
  amount: number,
  country: string,
  paymentMethod: string,
  orderId: string,
  payerName: string,
  payerEmail: string = "customer@intel.com"
): Promise<SoleaspayPaymentResponse> {
  const serviceId = getServiceId(country, paymentMethod);
  if (!serviceId) {
    throw new Error(`Service is not supported for ${country} - ${paymentMethod}`);
  }

  const currency = getCurrency(country);
  const baseUrl = getPublicBaseUrl();

  const requestBody: SoleaspayPaymentRequest = {
    wallet: formatWallet(wallet, country),
    amount,
    currency,
    order_id: orderId,
    description: `Intel deposit #${orderId}`,
    payer: payerName,
    payerEmail,
    successUrl: buildReturnUrl(baseUrl, "success", orderId),
    failureUrl: buildReturnUrl(baseUrl, "failure", orderId),
  };

  const response = await fetch(`${getSoleaspayApiBaseUrl()}/api/agent/bills/v3`, {
    method: "POST",
    headers: {
      "x-api-key": getApiKey(),
      "operation": "2",
      "service": serviceId.toString(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const result = await response.json() as SoleaspayPaymentResponse;
  return result;
}

export async function verifyPayment(orderId: string, payId: string): Promise<SoleaspayVerifyResponse> {
  const response = await fetch(
    `${getSoleaspayApiBaseUrl()}/api/agent/verif-pay?orderId=${encodeURIComponent(orderId)}&payId=${encodeURIComponent(payId)}`,
    {
      method: "GET",
      headers: {
        "x-api-key": getApiKey(),
        "Content-Type": "application/json",
      },
    }
  );

  const result = await response.json() as SoleaspayVerifyResponse;
  return result;
}

export function mapSoleaspayStatus(status: string | undefined): "pending" | "approved" | "rejected" {
  if (!status) return "pending";
  
  const upperStatus = status.toUpperCase();
  
  if (upperStatus === "SUCCESS" || upperStatus === "COMPLETED") {
    return "approved";
  }
  if (upperStatus === "FAILURE" || upperStatus === "FAILED" || upperStatus === "REFUND") {
    return "rejected";
  }
  return "pending";
}
