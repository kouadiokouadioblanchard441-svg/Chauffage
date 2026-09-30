---
name: CloudPay live-activation gate
description: Merchant confirmations and credential rotation required before CloudPay/Galaxy live calls.
---

Do not make live CloudPay/Galaxy requests using the credential exposed in chat. Require a newly issued signing secret stored through Replit Secrets first. The provider documentation describes dollar-denominated amounts while this app displays PHP, so confirm the merchant account accepts PHP and obtain the exact approved `payment_type` before enabling requests. Confirm any required production egress-IP allowlisting with the provider.

The merchant-specific connection sheet gives the deposit path `/api/transfer`, while the earlier protocol screenshots show `/api/pay/transfer`. Keep only these documented paths selectable, default to the merchant-specific path, and confirm the production path with Galaxy before live activation.

**Why:** A path-version mismatch can route deposits to an unsupported endpoint or leave them unreconciled.

**How to apply:** Do not treat the two paths as interchangeable. Change the selected path only after Galaxy confirms which one is enabled for this merchant.

**Why:** A live money movement request with an exposed key, wrong currency, unsupported payment type, or unapproved egress IP can create a financial loss or an unreconciled transaction.

**How to apply:** Keep CloudPay disabled until the replacement secret and merchant confirmations are present. Use sandbox/merchant-approved verification first; do not infer currency or payment type from the screenshots.