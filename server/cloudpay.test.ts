import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  cloudPayAmountMatches,
  cloudPayCreateDeposit,
  cloudPayCreatePayout,
  formatCloudPayAmount,
  getCloudPayPaymentType,
  isCloudPayConfigured,
  mapCloudPayStatus,
  signCloudPayFields,
  verifyCloudPaySignature,
} from "./cloudpay";
import { resolveCloudPayBankCode } from "@shared/cloudpay-banks";

const secret = "test-signing-secret";
const fields = { merchant: "merchant-1", amount: "3500.00", order_id: "CPD-1-2" };
const canonical = "amount=3500.00&merchant=merchant-1&order_id=CPD-1-2";
const expected = createHash("md5").update(`${canonical}&${secret}`).digest("hex");

assert.equal(signCloudPayFields(fields, secret), expected);
assert.equal(signCloudPayFields({ order_id: fields.order_id, merchant: fields.merchant, amount: fields.amount }, secret), expected);
assert.equal(verifyCloudPaySignature({ ...fields, sign: expected }, expected, secret), true);
assert.equal(verifyCloudPaySignature(fields, "00000000000000000000000000000000", secret), false);

assert.equal(mapCloudPayStatus("5"), "approved");
assert.equal(mapCloudPayStatus(3), "rejected");
assert.equal(mapCloudPayStatus("1"), "pending");
assert.equal(formatCloudPayAmount(3500), "3500.00");
assert.equal(cloudPayAmountMatches("3500.00", 3500), true);
assert.equal(cloudPayAmountMatches("3500.01", 3500), false);
assert.equal(resolveCloudPayBankCode("PayMaya"), "PMP");
assert.equal(resolveCloudPayBankCode("GCash"), "gcash");
assert.equal(resolveCloudPayBankCode("not a bank"), undefined);

const configKeys = [
  "CLOUDPAY_MERCHANT_ID",
  "CLOUDPAY_SIGNING_SECRET",
  "CLOUDPAY_PAYMENT_TYPE",
  "CLOUDPAY_AMOUNT_CURRENCY",
  "CLOUDPAY_API_BASE_URL",
  "CLOUDPAY_DEPOSIT_PATH",
  "CLOUDPAY_LIVE_ACTIVATION_CONFIRMED",
] as const;
const savedConfig = Object.fromEntries(configKeys.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
const requests: Array<{ url: URL; fields: URLSearchParams }> = [];
const responses = [
  { status: 1, redirect_url: "https://checkout.example/pay", qrcode_url: "https://checkout.example/qr.png" },
  { status: 1, gcashqr: "https://checkout.example/gcash-qr.png" },
  { status: 1 },
];

for (const [key, value] of Object.entries({
  CLOUDPAY_MERCHANT_ID: "merchant-test",
  CLOUDPAY_SIGNING_SECRET: "test-signing-secret",
  CLOUDPAY_PAYMENT_TYPE: "2",
  CLOUDPAY_AMOUNT_CURRENCY: "PHP",
  CLOUDPAY_API_BASE_URL: "https://gateway.example",
  CLOUDPAY_LIVE_ACTIVATION_CONFIRMED: "true",
})) {
  process.env[key] = value;
}

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
  await cloudPayCreateDeposit({
    orderId: "CPD-test-web",
    amount: 3500,
    bankCode: "PMP",
    callbackUrl: "https://merchant.example/api/webhooks/cloudpay",
    returnUrl: "https://merchant.example/robotpay",
  });
  const webDeposit = requests[0];
  assert.equal(webDeposit.url.toString(), "https://gateway.example/api/transfer");
  assert.equal(webDeposit.fields.get("merchant"), "merchant-test");
  assert.equal(webDeposit.fields.get("payment_type"), "2");
  assert.equal(webDeposit.fields.get("amount"), "3500.00");
  assert.equal(webDeposit.fields.get("bank_code"), "PMP");
  assert.equal(webDeposit.fields.get("callback_url"), "https://merchant.example/api/webhooks/cloudpay");
  assert.equal(webDeposit.fields.get("notify_url"), null);
  assert.equal(webDeposit.fields.get("customer_bank_card_account"), null);
  const webSignFields = Object.fromEntries(
    [...webDeposit.fields.entries()].filter(([key]) => key !== "sign"),
  );
  assert.equal(webDeposit.fields.get("sign"), signCloudPayFields(webSignFields, "test-signing-secret"));

  process.env.CLOUDPAY_DEPOSIT_PATH = "/api/pay/transfer";
  process.env.CLOUDPAY_PAYMENT_TYPE = "1";
  const qrResult = await cloudPayCreateDeposit({
    orderId: "CPD-test-qr",
    amount: 250,
    bankCode: "gcash",
    customerAccount: "+639171234567",
    callbackUrl: "https://merchant.example/api/webhooks/cloudpay",
    returnUrl: "https://merchant.example/robotpay",
  });
  const qrDeposit = requests[1];
  assert.equal(qrDeposit.url.toString(), "https://gateway.example/api/pay/transfer");
  assert.equal(qrDeposit.fields.get("payment_type"), "1");
  assert.equal(qrDeposit.fields.get("bank_code"), "gcash");
  assert.equal(qrDeposit.fields.get("customer_bank_card_account"), "+639171234567");
  assert.equal(qrResult.qrCode, "https://checkout.example/gcash-qr.png");

  await assert.rejects(
    () => cloudPayCreateDeposit({
      orderId: "CPD-test-invalid-qr",
      amount: 250,
      bankCode: "PMP",
      customerAccount: "+639171234567",
      callbackUrl: "https://merchant.example/api/webhooks/cloudpay",
      returnUrl: "https://merchant.example/robotpay",
    }),
    /GCash/,
  );
  assert.equal(requests.length, 2);

  process.env.CLOUDPAY_DEPOSIT_PATH = "/api/invalid";
  await assert.rejects(
    () => cloudPayCreateDeposit({
      orderId: "CPD-test-invalid-path",
      amount: 250,
      bankCode: "gcash",
      customerAccount: "+639171234567",
      callbackUrl: "https://merchant.example/api/webhooks/cloudpay",
      returnUrl: "https://merchant.example/robotpay",
    }),
    /CLOUDPAY_DEPOSIT_PATH/,
  );
  assert.equal(requests.length, 2);

  await cloudPayCreatePayout({
    orderId: "CPW-test",
    amount: 100.25,
    bankCode: "gcash",
    accountNumber: "09171234567",
    accountName: "Test Account",
    callbackUrl: "https://merchant.example/api/webhooks/cloudpay",
  });
  const payout = requests[2];
  assert.equal(payout.url.toString(), "https://gateway.example/api/daifu");
  assert.equal(payout.fields.get("total_amount"), "100.25");
  assert.equal(payout.fields.get("callback_url"), "https://merchant.example/api/webhooks/cloudpay");
  assert.equal(payout.fields.get("bank"), "gcash");
  assert.equal(payout.fields.get("bank_card_account"), "09171234567");
  assert.equal(payout.fields.get("bank_card_name"), "Test Account");
  assert.equal(payout.fields.get("bank_card_remark"), "no");
  assert.equal(payout.fields.get("amount"), null);
  assert.equal(payout.fields.get("bank_code"), null);

  process.env.CLOUDPAY_LIVE_ACTIVATION_CONFIRMED = "false";
  assert.equal(isCloudPayConfigured(), false);
  assert.throws(() => getCloudPayPaymentType(), /CLOUDPAY_LIVE_ACTIVATION_CONFIRMED/);
} finally {
  globalThis.fetch = originalFetch;
  for (const key of configKeys) {
    const value = savedConfig[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

console.log("CloudPay contract tests passed.");