import { createHash, timingSafeEqual } from "node:crypto";
import { resolveCloudPayBankCode } from "@shared/cloudpay-banks";

export type CloudPayStatus = "pending" | "approved" | "rejected";
export type CloudPayFields = Record<string, string | number | null | undefined>;

type CloudPayConfig = {
  baseUrl: URL;
  merchantId: string;
  signingSecret: string;
  paymentType: string;
  depositPath: string;
};

const DOCUMENTED_PAYMENT_TYPES = new Set(["1", "2", "3", "7"]);
const DOCUMENTED_DEPOSIT_PATHS = new Set(["/api/transfer", "/api/pay/transfer"]);
const DEFAULT_DEPOSIT_PATH = "/api/transfer";

export class CloudPayError extends Error {
  requestMayHaveReachedProvider: boolean;

  constructor(message: string, requestMayHaveReachedProvider = false) {
    super(message);
    this.name = "CloudPayError";
    this.requestMayHaveReachedProvider = requestMayHaveReachedProvider;
  }
}

function getCloudPayConfig(): CloudPayConfig {
  const missing: string[] = [];
  const merchantId = process.env.CLOUDPAY_MERCHANT_ID?.trim() || "";
  const signingSecret = process.env.CLOUDPAY_SIGNING_SECRET?.trim() || "";
  const paymentType = process.env.CLOUDPAY_PAYMENT_TYPE?.trim() || "";
  const amountCurrency = process.env.CLOUDPAY_AMOUNT_CURRENCY?.trim().toUpperCase() || "";
  const rawBaseUrl = process.env.CLOUDPAY_API_BASE_URL?.trim() || "";
  const depositPath = process.env.CLOUDPAY_DEPOSIT_PATH?.trim() || DEFAULT_DEPOSIT_PATH;

  if (!merchantId) missing.push("CLOUDPAY_MERCHANT_ID");
  if (!signingSecret) missing.push("CLOUDPAY_SIGNING_SECRET");
  if (!paymentType) missing.push("CLOUDPAY_PAYMENT_TYPE");
  if (!amountCurrency) missing.push("CLOUDPAY_AMOUNT_CURRENCY");
  if (!rawBaseUrl) missing.push("CLOUDPAY_API_BASE_URL");
  if (process.env.CLOUDPAY_LIVE_ACTIVATION_CONFIRMED?.trim().toLowerCase() !== "true") {
    missing.push("CLOUDPAY_LIVE_ACTIVATION_CONFIRMED");
  }
  if (missing.length) {
    throw new Error(`CloudPay configuration is incomplete: ${missing.join(", ")}`);
  }
  if (amountCurrency !== "PHP") {
    throw new Error("CloudPay is disabled until CLOUDPAY_AMOUNT_CURRENCY is confirmed as PHP");
  }
  if (!DOCUMENTED_PAYMENT_TYPES.has(paymentType)) {
    throw new Error("CLOUDPAY_PAYMENT_TYPE must be one of the documented Galaxy values: 1, 2, 3, or 7");
  }
  if (!DOCUMENTED_DEPOSIT_PATHS.has(depositPath)) {
    throw new Error("CLOUDPAY_DEPOSIT_PATH must be /api/transfer or /api/pay/transfer");
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(rawBaseUrl);
  } catch {
    throw new Error("CLOUDPAY_API_BASE_URL must be a valid HTTPS URL");
  }
  if (baseUrl.protocol !== "https:" || baseUrl.username || baseUrl.password) {
    throw new Error("CLOUDPAY_API_BASE_URL must be an HTTPS URL without embedded credentials");
  }
  baseUrl.pathname = "/";
  baseUrl.search = "";
  baseUrl.hash = "";

  return { baseUrl, merchantId, signingSecret, paymentType, depositPath };
}

export function validateCloudPayConfig(): void {
  getCloudPayConfig();
}

export function getCloudPayPaymentType(): string {
  return getCloudPayConfig().paymentType;
}

export function isCloudPayConfigured(): boolean {
  try {
    getCloudPayConfig();
    return true;
  } catch {
    return false;
  }
}

function compareAscii(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function signCloudPayFields(fields: CloudPayFields, signingSecret: string): string {
  const canonical = Object.entries(fields)
    .filter(([key, value]) => key !== "sign" && value !== undefined && value !== null)
    .map(([key, value]) => [key, String(value)] as const)
    .sort(([left], [right]) => compareAscii(left, right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("md5").update(`${canonical}&${signingSecret}`, "utf8").digest("hex");
}

export function verifyCloudPaySignature(fields: CloudPayFields, signature: string, signingSecret: string): boolean {
  if (!signature || !/^[a-f\d]{32}$/i.test(signature)) return false;
  const expected = signCloudPayFields(fields, signingSecret);
  const expectedBytes = Buffer.from(expected.toLowerCase(), "ascii");
  const receivedBytes = Buffer.from(signature.toLowerCase(), "ascii");
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}

export function mapCloudPayStatus(rawStatus: unknown): CloudPayStatus {
  const status = String(rawStatus ?? "").trim();
  if (status === "5") return "approved";
  if (status === "3") return "rejected";
  return "pending";
}

export function formatCloudPayAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("CloudPay amount must be a positive number");
  }
  return amount.toFixed(2);
}

export function cloudPayAmountMatches(providerAmount: unknown, expectedAmount: number): boolean {
  const raw = String(providerAmount ?? "").trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return false;
  const [whole, fractional = ""] = raw.split(".");
  const cents = Number(whole) * 100 + Number(fractional.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents === Math.round(expectedAmount * 100);
}

function getResponsePayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new CloudPayError("CloudPay returned an invalid response", true);
  }
  const body = value as Record<string, unknown>;
  const nested = body.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...body, ...(nested as Record<string, unknown>) };
  }
  return body;
}

async function postCloudPay(path: string, fields: CloudPayFields): Promise<Record<string, unknown>> {
  const config = getCloudPayConfig();
  const signedFields: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) signedFields[key] = String(value);
  }
  signedFields.merchant = config.merchantId;
  signedFields.sign = signCloudPayFields(signedFields, config.signingSecret);

  const body = new URLSearchParams(signedFields);
  const url = new URL(path, config.baseUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body,
      signal: controller.signal,
    });
  } catch {
    throw new CloudPayError("CloudPay did not return a response; check the transaction status before retrying", true);
  } finally {
    clearTimeout(timeout);
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    throw new CloudPayError("CloudPay returned an unreadable response; check the transaction status before retrying", true);
  }
  const payload = getResponsePayload(parsed);
  if (!response.ok) {
    throw new CloudPayError(`CloudPay request failed with HTTP ${response.status}`, true);
  }
  if (String(payload.status ?? "") !== "1" && path !== "/api/query") {
    throw new CloudPayError(`CloudPay rejected the request (status ${String(payload.status ?? "missing")})`);
  }
  return payload;
}

export type CloudPayDepositResult = {
  orderId: string;
  redirectUrl?: string;
  qrCode?: string;
  message?: string;
};

export async function cloudPayCreateDeposit(input: {
  orderId: string;
  amount: number;
  bankCode: string;
  customerAccount?: string;
  callbackUrl: string;
  returnUrl: string;
}): Promise<CloudPayDepositResult> {
  const config = getCloudPayConfig();
  const bankCode = resolveCloudPayBankCode(input.bankCode);
  if (!bankCode) throw new Error("Unsupported CloudPay bank or e-wallet");
  const fields: CloudPayFields = {
    order_id: input.orderId,
    amount: formatCloudPayAmount(input.amount),
    payment_type: config.paymentType,
    bank_code: bankCode,
    callback_url: input.callbackUrl,
    return_url: input.returnUrl,
  };
  if (config.paymentType === "1") {
    if (bankCode !== "gcash") {
      throw new Error("Galaxy QR payments require the GCash payment method");
    }
    if (!input.customerAccount?.trim()) {
      throw new Error("Galaxy QR payments require the payer's GCash account");
    }
    fields.customer_bank_card_account = input.customerAccount.trim();
  }
  const payload = await postCloudPay(config.depositPath, fields);
  const redirectUrl = typeof payload.redirect_url === "string" ? payload.redirect_url : undefined;
  const qrCandidates = [payload.qrcode_url, payload.gcashqr, payload.gcash_qr_url, payload.qr_code];
  const rawQr = qrCandidates.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim();
  let qrCode: string | undefined;
  if (rawQr?.startsWith("data:image/")) {
    if (!/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(rawQr)) {
      throw new CloudPayError("CloudPay returned an invalid QR image", true);
    }
    qrCode = rawQr;
  } else if (rawQr && /^[A-Za-z0-9+/]+={0,2}$/.test(rawQr) && rawQr.length > 40) {
    qrCode = `data:image/png;base64,${rawQr}`;
  } else if (rawQr) {
    let qrUrl: URL;
    try {
      qrUrl = new URL(rawQr);
    } catch {
      throw new CloudPayError("CloudPay returned an invalid QR image URL", true);
    }
    if (qrUrl.protocol !== "https:") throw new CloudPayError("CloudPay returned an insecure QR image URL", true);
    qrCode = qrUrl.toString();
  }
  if (redirectUrl) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(redirectUrl);
    } catch {
      throw new CloudPayError("CloudPay returned an invalid checkout URL", true);
    }
    if (parsedUrl.protocol !== "https:") throw new CloudPayError("CloudPay returned an insecure checkout URL", true);
  }
  return {
    orderId: input.orderId,
    redirectUrl,
    qrCode,
    message: typeof payload.message === "string" ? payload.message.slice(0, 200) : undefined,
  };
}

export async function cloudPayCreatePayout(input: {
  orderId: string;
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  callbackUrl: string;
}): Promise<void> {
  const bankCode = resolveCloudPayBankCode(input.bankCode);
  if (!bankCode) throw new Error("Unsupported CloudPay bank or e-wallet");
  await postCloudPay("/api/daifu", {
    order_id: input.orderId,
    total_amount: formatCloudPayAmount(input.amount),
    callback_url: input.callbackUrl,
    bank: bankCode,
    bank_card_account: input.accountNumber,
    bank_card_name: input.accountName,
    bank_card_remark: "no",
  });
}

export type CloudPayQueryResult = {
  orderId: string;
  status: CloudPayStatus;
  providerStatus: string;
  amount?: string;
};

export async function cloudPayQuery(orderId: string): Promise<CloudPayQueryResult> {
  const payload = await postCloudPay("/api/query", { order_id: orderId });
  const returnedOrderId = String(payload.order_id ?? orderId);
  if (returnedOrderId !== orderId) {
    throw new CloudPayError("CloudPay returned a different order reference", true);
  }
  return {
    orderId,
    status: mapCloudPayStatus(payload.status),
    providerStatus: String(payload.status ?? ""),
    amount: payload.amount === undefined && payload.total_amount === undefined && payload.order_amount === undefined
      ? undefined
      : String(payload.amount ?? payload.total_amount ?? payload.order_amount),
  };
}

export function getCloudPayMerchantId(): string {
  return getCloudPayConfig().merchantId;
}

export function getCloudPaySigningSecret(): string {
  return getCloudPayConfig().signingSecret;
}