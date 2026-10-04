import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  CloudPayError,
  cloudPayAmountMatches,
  cloudPayCreateDeposit,
  cloudPayCreatePayout,
  cloudPayQuery,
  formatCloudPayAmount,
  getCloudPayRuntimeDiagnostics,
  isCloudPayConfigured,
  isCloudPayDepositEnabled,
  mapCloudPayStatus,
  signCloudPayFields,
  verifyCloudPaySignature,
} from "./cloudpay";
import {
  resolveCloudPayBankCode,
  resolveCloudPayDepositMethod,
} from "@shared/cloudpay-banks";
import {
  getWithdrawalMethods,
  isAllowedWithdrawalMethod,
} from "@shared/withdrawal-methods";

const secret = "test-signing-secret";
const fields = { merchant: "merchant-1", amount: "3500.00", order_id: "CPD-1-2" };
const canonical = "amount=3500.00&merchant=merchant-1&order_id=CPD-1-2";
const expected = createHash("md5").update(`${canonical}&key=${secret}`).digest("hex");

assert.equal(signCloudPayFields(fields, secret), expected);
assert.equal(signCloudPayFields({ order_id: fields.order_id, merchant: fields.merchant, amount: fields.amount }, secret), expected);
assert.equal(verifyCloudPaySignature({ ...fields, sign: expected }, expected, secret), true);
assert.equal(verifyCloudPaySignature(fields, "00000000000000000000000000000000", secret), false);

assert.equal(mapCloudPayStatus("5"), "approved");
assert.equal(mapCloudPayStatus(3), "rejected");
assert.equal(mapCloudPayStatus("1"), "pending");
assert.equal(mapCloudPayStatus("2"), "pending");
assert.equal(mapCloudPayStatus("6"), "pending");
assert.equal(mapCloudPayStatus("10"), "pending");
assert.throws(() => mapCloudPayStatus("0"), /error or unknown transaction status/);
assert.equal(formatCloudPayAmount(3500), "3500.00");
assert.equal(cloudPayAmountMatches("3500.00", 3500), true);
assert.equal(cloudPayAmountMatches("3500.01", 3500), false);
assert.equal(resolveCloudPayBankCode("PayMaya"), "PMP");
assert.equal(resolveCloudPayBankCode("GCash"), "gcash");
assert.equal(resolveCloudPayBankCode("GoTyme QRPH"), "GOT");
assert.equal(resolveCloudPayBankCode("PayMaya Direct"), "PMP");
assert.equal(resolveCloudPayBankCode("GCash H5 QRPH"), "gcash");
assert.equal(resolveCloudPayBankCode("not a bank"), undefined);
for (const method of ["GoTyme QRPH", "PayMaya Direct", "GCash H5 QRPH"]) {
  assert.ok(getWithdrawalMethods("PH").includes(method));
  assert.equal(isAllowedWithdrawalMethod("PH", method), true);
}
assert.equal(getWithdrawalMethods("US").length, 0);
assert.equal(resolveCloudPayDepositMethod("GoTyme QR")?.code, "got");
assert.equal(resolveCloudPayDepositMethod("got")?.paymentType, "1");
assert.equal(resolveCloudPayDepositMethod("PayMaya Direct")?.paymentType, "3");
assert.equal(resolveCloudPayDepositMethod("PMP")?.paymentType, "3");
assert.equal(resolveCloudPayDepositMethod("GCash")?.code, "mya");
assert.equal(resolveCloudPayDepositMethod("mya")?.paymentType, "7");
assert.equal(resolveCloudPayDepositMethod("bpi"), undefined);

const configKeys = [
  "CLOUDPAY_MERCHANT_ID",
  "CLOUDPAY_SIGNING_SECRET",
  "CLOUDPAY_AMOUNT_CURRENCY",
  "CLOUDPAY_API_BASE_URL",
  "CLOUDPAY_DEPOSIT_PATH",
  "PUBLIC_APP_URL",
  "CLOUDPAY_DEV_PREVIEW_ENABLED",
  "CLOUDPAY_LIVE_ACTIVATION_CONFIRMED",
] as const;
const savedConfig = Object.fromEntries(configKeys.map((key) => [key, process.env[key]]));
const savedNodeEnv = process.env.NODE_ENV;
const originalFetch = globalThis.fetch;
const requests: Array<{ url: URL; fields: URLSearchParams }> = [];
const responses = [
  { status: 1, redirect_url: "https://checkout.example/pay", qrcode_url: "https://checkout.example/qr.png" },
  { status: 1, qrcode_url: "https://checkout.example/gotyme-qr.png" },
  { status: 1, gcashqr: "https://checkout.example/gcash-qr.png" },
  { status: 1 },
  { status: 1, message: "Request accepted; account=09171234567" },
  {
    status: 0,
    message: "Invalid payment; signature=01234567890123456789012345678901; phone=09171234567; https://gateway.example/trace",
  },
  {
    status: 1,
    data: {
      status: 5,
      order_id: "CPD-test-query",
      amount: "250.00",
      message: "Payout approved; phone=09171234567; https://gateway.example/trace",
    },
  },
  { status: 1, data: { status: 1, order_id: "CPD-test-query-pending", amount: "250.00" } },
];

for (const [key, value] of Object.entries({
  CLOUDPAY_MERCHANT_ID: "merchant-test",
  CLOUDPAY_SIGNING_SECRET: "test-signing-secret",
  CLOUDPAY_AMOUNT_CURRENCY: "PHP",
  CLOUDPAY_API_BASE_URL: "https://gateway.example",
  CLOUDPAY_DEPOSIT_PATH: "/api/transfer",
  CLOUDPAY_DEV_PREVIEW_ENABLED: "true",
  CLOUDPAY_LIVE_ACTIVATION_CONFIRMED: "true",
  PUBLIC_APP_URL: "https://merchant.example",
})) {
  process.env[key] = value;
}

const runtimeDiagnostics = getCloudPayRuntimeDiagnostics();
assert.equal(runtimeDiagnostics.merchantId, "merchant-test");
assert.equal(runtimeDiagnostics.signingSecretConfigured, true);
assert.equal(runtimeDiagnostics.amountCurrency, "PHP");
assert.equal(runtimeDiagnostics.gatewayHost, "gateway.example");
assert.equal(runtimeDiagnostics.depositPath, "/api/transfer");
assert.equal(runtimeDiagnostics.publicAppHost, "merchant.example");
assert.equal(runtimeDiagnostics.configured, true);
assert.equal(JSON.stringify(runtimeDiagnostics).includes(secret), false);

globalThis.fetch = (async (input, init) => {
  requests.push({
    url: new URL(String(input)),
    fields: new URLSearchParams(String(init?.body ?? "")),
  });
  const payload = responses.shift();
  if (!payload) throw new Error("Unexpected CloudPay test request");
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}) as typeof fetch;

try {
  process.env.NODE_ENV = "development";
  assert.equal(isCloudPayDepositEnabled(undefined), true);
  process.env.NODE_ENV = "production";
  assert.equal(isCloudPayDepositEnabled(undefined), false);
  assert.equal(isCloudPayDepositEnabled("true"), true);
  process.env.NODE_ENV = "development";
  process.env.CLOUDPAY_DEV_PREVIEW_ENABLED = "false";
  assert.equal(isCloudPayDepositEnabled(undefined), false);
  process.env.CLOUDPAY_DEV_PREVIEW_ENABLED = "true";

  const webResult = await cloudPayCreateDeposit({
    orderId: "CPD-test-web",
    amount: 3500,
    bankCode: "PMP",
    callbackUrl: "https://merchant.example/api/webhooks/cloudpay",
    returnUrl: "https://merchant.example/robotpay",
  });
  assert.equal(webResult.redirectUrl, "https://checkout.example/pay");
  const webDeposit = requests[0];
  assert.equal(webDeposit.url.toString(), "https://gateway.example/api/transfer");
  assert.equal(webDeposit.fields.get("merchant"), "merchant-test");
  assert.equal(webDeposit.fields.get("payment_type"), "3");
  assert.equal(webDeposit.fields.get("amount"), "3500.00");
  assert.equal(webDeposit.fields.get("bank_code"), "PMP");
  assert.equal(webDeposit.fields.get("callback_url"), "https://merchant.example/api/webhooks/cloudpay");
  assert.equal(webDeposit.fields.get("notify_url"), null);
  assert.equal(webDeposit.fields.get("customer_bank_card_account"), null);
  const webSignFields = Object.fromEntries(
    [...webDeposit.fields.entries()].filter(([key]) => key !== "sign"),
  );
  assert.equal(webDeposit.fields.get("sign"), signCloudPayFields(webSignFields, "test-signing-secret"));

  assert.equal(resolveCloudPayDepositMethod("got")?.requiresPayerPhone, true);
  await assert.rejects(
    () => cloudPayCreateDeposit({
      orderId: "CPD-test-qr-missing-account",
      amount: 250,
      bankCode: "got",
      callbackUrl: "https://merchant.example/api/webhooks/cloudpay",
      returnUrl: "https://merchant.example/robotpay",
    }),
    /requires the payer's phone number/,
  );
  assert.equal(requests.length, 1);

  const qrResult = await cloudPayCreateDeposit({
    orderId: "CPD-test-qr",
    amount: 250,
    bankCode: "got",
    customerAccount: "09171234567",
    callbackUrl: "https://merchant.example/api/webhooks/cloudpay",
    returnUrl: "https://merchant.example/robotpay",
  });
  const qrDeposit = requests[1];
  assert.equal(qrDeposit.url.toString(), "https://gateway.example/api/transfer");
  assert.equal(qrDeposit.fields.get("payment_type"), "1");
  assert.equal(qrDeposit.fields.get("bank_code"), "got");
  assert.equal(qrDeposit.fields.get("customer_bank_card_account"), "09171234567");
  assert.equal(qrResult.qrCode, "https://checkout.example/gotyme-qr.png");

  process.env.CLOUDPAY_DEPOSIT_PATH = "/api/transfer";
  const gcashQrResult = await cloudPayCreateDeposit({
    orderId: "CPD-test-gcash-qrph",
    amount: 300,
    bankCode: "mya",
    callbackUrl: "https://merchant.example/api/webhooks/cloudpay",
    returnUrl: "https://merchant.example/robotpay",
  });
  const gcashQrDeposit = requests[2];
  assert.equal(gcashQrDeposit.url.toString(), "https://gateway.example/api/transfer");
  assert.equal(gcashQrDeposit.fields.get("payment_type"), "7");
  assert.equal(gcashQrDeposit.fields.get("bank_code"), "mya");
  assert.equal(gcashQrDeposit.fields.get("customer_bank_card_account"), null);
  assert.equal(gcashQrResult.qrCode, "https://checkout.example/gcash-qr.png");

  await assert.rejects(
    () => cloudPayCreateDeposit({
      orderId: "CPD-test-unmapped-bank",
      amount: 250,
      bankCode: "bpi",
      callbackUrl: "https://merchant.example/api/webhooks/cloudpay",
      returnUrl: "https://merchant.example/robotpay",
    }),
    /Unsupported CloudPay deposit method/,
  );
  assert.equal(requests.length, 3);

  process.env.CLOUDPAY_DEPOSIT_PATH = "/api/invalid";
  assert.equal(isCloudPayConfigured(), false);
  await assert.rejects(
    () => cloudPayCreateDeposit({
      orderId: "CPD-test-invalid-path",
      amount: 250,
      bankCode: "PMP",
      callbackUrl: "https://merchant.example/api/webhooks/cloudpay",
      returnUrl: "https://merchant.example/robotpay",
    }),
    /CLOUDPAY_DEPOSIT_PATH/,
  );
  assert.equal(requests.length, 3);

  process.env.CLOUDPAY_DEPOSIT_PATH = "/api/pay/transfer";
  await cloudPayCreateDeposit({
    orderId: "CPD-test-alternative-path",
    amount: 500,
    bankCode: "PMP",
    callbackUrl: "https://merchant.example/api/webhooks/cloudpay",
    returnUrl: "https://merchant.example/robotpay",
  });
  assert.equal(requests[3].url.toString(), "https://gateway.example/api/pay/transfer");
  assert.equal(requests[3].fields.get("customer_bank_card_account"), null);

  process.env.CLOUDPAY_DEPOSIT_PATH = "/api/transfer";
  const payoutResult = await cloudPayCreatePayout({
    orderId: "CPW-test",
    amount: 100.25,
    bankCode: "gcash",
    accountNumber: "09171234567",
    accountName: "Test Account",
    callbackUrl: "https://merchant.example/api/webhooks/cloudpay",
  });
  assert.deepEqual(payoutResult, {
    providerStatus: "1",
    message: "Request accepted; account=[redacted]",
  });
  const payout = requests[4];
  assert.equal(payout.url.toString(), "https://gateway.example/api/daifu");
  assert.equal(payout.fields.get("total_amount"), "100.25");
  assert.equal(payout.fields.get("callback_url"), "https://merchant.example/api/webhooks/cloudpay");
  assert.equal(payout.fields.get("bank"), "gcash");
  assert.equal(payout.fields.get("bank_card_account"), "09171234567");
  assert.equal(payout.fields.get("bank_card_name"), "Test Account");
  assert.equal(payout.fields.get("bank_card_remark"), "no");
  assert.equal(payout.fields.get("amount"), null);
  assert.equal(payout.fields.get("bank_code"), null);

  process.env.CLOUDPAY_DEPOSIT_PATH = "/api/transfer";
  let providerRejection: unknown;
  try {
    await cloudPayCreateDeposit({
      orderId: "CPD-test-provider-rejection",
      amount: 250,
      bankCode: "PMP",
      callbackUrl: "https://merchant.example/api/webhooks/cloudpay",
      returnUrl: "https://merchant.example/robotpay",
    });
  } catch (error) {
    providerRejection = error;
  }
  assert.ok(
    providerRejection instanceof CloudPayError,
    `Expected a CloudPayError, received: ${providerRejection instanceof Error ? providerRejection.message : String(providerRejection)}`,
  );
  assert.equal(providerRejection.providerStatus, "0");
  assert.match(providerRejection.providerMessage || "", /Invalid payment/);
  assert.doesNotMatch(providerRejection.providerMessage || "", /01234567890123456789012345678901|09171234567|gateway\.example/);

  process.env.CLOUDPAY_LIVE_ACTIVATION_CONFIRMED = "false";
  assert.equal(isCloudPayConfigured(), false);
  await assert.rejects(
    () => cloudPayCreateDeposit({
      orderId: "CPD-test-disabled",
      amount: 200,
      bankCode: "PMP",
      callbackUrl: "https://merchant.example/api/webhooks/cloudpay",
      returnUrl: "https://merchant.example/robotpay",
    }),
    /CLOUDPAY_LIVE_ACTIVATION_CONFIRMED/,
  );
  assert.equal(requests.length, 6);

  process.env.CLOUDPAY_LIVE_ACTIVATION_CONFIRMED = "true";
  process.env.NODE_ENV = "production";
  delete process.env.PUBLIC_APP_URL;
  assert.equal(isCloudPayConfigured(), false);
  process.env.PUBLIC_APP_URL = "http://merchant.example";
  assert.equal(isCloudPayConfigured(), false);
  process.env.PUBLIC_APP_URL = "https://merchant.example";
  assert.equal(isCloudPayConfigured(), true);

  const successfulQuery = await cloudPayQuery("CPD-test-query");
  assert.deepEqual(successfulQuery, {
    orderId: "CPD-test-query",
    status: "approved",
    providerStatus: "5",
    amount: "250.00",
    message: "Payout approved; phone=[redacted]; [redacted URL]",
  });
  assert.equal(requests[6].url.toString(), "https://gateway.example/api/query");
  assert.equal(requests[6].fields.get("order_id"), "CPD-test-query");
  const querySignFields = Object.fromEntries(
    [...requests[6].fields.entries()].filter(([key]) => key !== "sign"),
  );
  assert.equal(requests[6].fields.get("sign"), signCloudPayFields(querySignFields, "test-signing-secret"));

  const pendingQuery = await cloudPayQuery("CPD-test-query-pending");
  assert.equal(pendingQuery.status, "pending");
  assert.equal(pendingQuery.providerStatus, "1");
  assert.equal(requests[7].url.toString(), "https://gateway.example/api/query");
} finally {
  globalThis.fetch = originalFetch;
  for (const key of configKeys) {
    const value = savedConfig[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  if (savedNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = savedNodeEnv;
}

console.log("CloudPay contract tests passed.");