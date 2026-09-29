---
name: CloudPay live-activation gate
description: Merchant confirmations and credential rotation required before CloudPay/Galaxy live calls.
---

Do not make live CloudPay/Galaxy requests using the credential exposed in chat. Require a newly issued signing secret stored through Replit Secrets first. The provider documentation describes dollar-denominated amounts while this app displays PHP, so confirm the merchant account accepts PHP and obtain the exact approved `payment_type` before enabling requests. Confirm any required production egress-IP allowlisting with the provider.

**Why:** A live money movement request with an exposed key, wrong currency, unsupported payment type, or unapproved egress IP can create a financial loss or an unreconciled transaction.

**How to apply:** Keep CloudPay disabled until the replacement secret and merchant confirmations are present. Use sandbox/merchant-approved verification first; do not infer currency or payment type from the screenshots.