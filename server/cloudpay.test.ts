import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  cloudPayAmountMatches,
  formatCloudPayAmount,
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

console.log("CloudPay contract tests passed.");