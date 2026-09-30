---
name: CloudPay live-activation gate
description: Merchant confirmations and credential rotation required before CloudPay/Galaxy live calls.
---

Do not make live CloudPay/Galaxy requests using the credential exposed in chat. Require a newly issued signing secret stored through Replit Secrets first. The user confirmed the merchant account uses PHP and that payment types 1, 2, 3, and 7 are authorized. The merchant supplied these specific deposit mappings: type 1 + `bank_code=got` = GoTyme QRPH; type 3 + `bank_code=PMP` = PayMaya Direct; type 7 + `bank_code=mya` = GCash H5 QRPH. Type 2 has no supplied bank-code mapping and must remain unavailable until Galaxy provides it. These merchant-specific mappings supersede generic documentation descriptions that conflict with them. Confirm any required production egress-IP allowlisting with the provider.

The merchant-specific connection sheet gives the deposit path `/api/transfer`, while the earlier protocol screenshots show `/api/pay/transfer`. Keep only these documented paths selectable, default to the merchant-specific path, and confirm the production path with Galaxy before live activation.

For deposits, derive `payment_type` from the selected merchant-confirmed bank code rather than a single global payment-type setting. Keep deposit mappings separate from the broader bank-code list used for withdrawals.

**Why:** `payment_type` and `bank_code` form a merchant-specific API pair; guessing one can reject a deposit or send the user through the wrong payment flow.

**How to apply:** Offer only the confirmed pairs (1/`got`, 3/`PMP`, 7/`mya`). Keep type 2 unavailable until Galaxy supplies its exact bank-code mapping.

**Why:** A path-version mismatch can route deposits to an unsupported endpoint or leave them unreconciled.

**How to apply:** Do not treat the two paths as interchangeable. Change the selected path only after Galaxy confirms which one is enabled for this merchant.

**Why:** A live money movement request with an exposed key, wrong currency, unsupported payment type, or unapproved egress IP can create a financial loss or an unreconciled transaction.

**How to apply:** Keep CloudPay disabled until the replacement secret, active deposit path, and any required egress allowlisting are confirmed. Use sandbox/merchant-approved verification first. Do not expose type 2 without its exact merchant bank-code mapping.