---
name: CloudPay live-activation gate
description: Merchant confirmations and credential rotation required before CloudPay/Galaxy live calls.
---

Do not make live CloudPay/Galaxy requests using the credential exposed in chat. Require a newly issued signing secret stored through Replit Secrets first. The user confirmed the merchant account uses PHP and that payment types 1, 2, 3, and 7 are authorized. The merchant supplied these specific deposit mappings: type 1 + `bank_code=got` = GoTyme QRPH; type 3 + `bank_code=PMP` = PayMaya Direct; type 7 + `bank_code=mya` = GCash H5 QRPH. Type 2 has no supplied bank-code mapping and must remain unavailable until Galaxy provides it. These merchant-specific mappings supersede generic documentation descriptions that conflict with them. Confirm any required production egress-IP allowlisting with the provider.

The merchant-specific connection sheet gives the deposit path `/api/transfer`, while the earlier protocol screenshots show `/api/pay/transfer`. Keep only these documented paths selectable, default to the merchant-specific path, and confirm the production path with Galaxy before live activation.

The user supplied `dmxping.online` as the Plesk production hostname. CloudPay callbacks require HTTPS; configure `PUBLIC_APP_URL=https://dmxping.online` in Plesk only, not in Replit's shared development environment.

**Why:** An insecure callback URL fails the app's CloudPay checks, and pointing shared development settings at production can send test flows to the live site.

**How to apply:** Keep the Plesk callback and return URLs on the HTTPS domain, and leave Replit development URLs separate.

For deposits, derive `payment_type` from the selected merchant-confirmed bank code rather than a single global payment-type setting. Keep deposit mappings separate from the broader bank-code list used for withdrawals.

**Why:** `payment_type` and `bank_code` form a merchant-specific API pair; guessing one can reject a deposit or send the user through the wrong payment flow. The Galaxy QR contract also marks the payer account as required, so omitting it can reject GoTyme QR even when the pair is correct.

**How to apply:** Offer only the confirmed pairs (1/`got`, 3/`PMP`, 7/`mya`). For type 1/`got`, collect the payer's Philippines phone/account and send it as `customer_bank_card_account`; keep types 3/`PMP` and 7/`mya` unchanged. Keep type 2 unavailable until Galaxy supplies its exact bank-code mapping.

**Why:** A path-version mismatch can route deposits to an unsupported endpoint or leave them unreconciled.

**How to apply:** Do not treat the two paths as interchangeable. Change the selected path only after Galaxy confirms which one is enabled for this merchant.

**Why:** A live money movement request with an exposed key, wrong currency, unsupported payment type, or unapproved egress IP can create a financial loss or an unreconciled transaction.

**How to apply:** Keep CloudPay disabled until the replacement secret, active deposit path, and any required egress allowlisting are confirmed. Use sandbox/merchant-approved verification first. Do not expose type 2 without its exact merchant bank-code mapping.

For Replit preview live testing, keep any override limited to `NODE_ENV=development`; do not turn on the database-wide `cloudpayEnabled` flag just to expose CloudPay in preview. On 2026-09-30, the user confirmed Galaxy's `/api/transfer` and egress-allowlist confirmations and chose live testing in Replit preview. The agent must not initiate a live payment as a verification step.

**Why:** The app setting is stored in Neon and may also affect Plesk users if both runtimes share that database; Plesk's exact Neon configuration has not been verified.

**How to apply:** Require explicit approval, a newly issued signing secret, and provider confirmation before using live mode. Keep preview-only behavior behind a development environment flag, leave production unchanged, and never create a real deposit as an agent-side verification.

Treat an explicit provider `status: 0` during initiation as a provider rejection, not proof that the selected bank mapping is wrong. Preserve only a sanitized provider status and reason; do not change merchant-confirmed paths or payment-type/bank-code pairs without evidence.

**Why:** Blindly changing a confirmed contract or retrying a live request can create duplicate or misrouted payments, while the provider's rejection reason distinguishes payload, merchant, signature, and allowlist issues.

**How to apply:** Capture the provider's safe error detail, verify it against the merchant contract and account configuration, and only then change the request or settings. Do not issue another live initiation as an agent-side test.

On 2026-10-01, the user explicitly authorized enabling real CloudPay deposits for Philippines accounts on Plesk. This does not authorize creating a real test payment.

**Why:** Production checkout activation was explicitly approved, but live financial transactions remain unsuitable as agent-side verification.

**How to apply:** Enable production checkout only after the Plesk runtime validates its required CloudPay configuration; do not use Replit preview settings as evidence of Plesk configuration.

The user confirmed that customers choose a deposit channel in the app and then continue to Galaxy's hosted checkout. They also require the app's channel list to come directly from CloudPay. Galaxy System API 3.0.5 documents `POST /api/transfer` with required `payment_type` and `bank_code`, returning `redirect_url` for the payment page, but no channel-catalog endpoint.

**Why:** The documented flow creates a hosted payment session, while a live channel catalog is a separate capability absent from the supplied API contract.

**How to apply:** Keep app-side selection and use the returned hosted checkout URL with merchant-confirmed mappings. Do not claim the list is dynamic or invent a catalog endpoint; ask Galaxy for the documented channel-list API before implementing provider-sourced options. Never call `/api/transfer` as a discovery request.

Before asking the user for CloudPay URLs or documentation, inspect the already supplied Galaxy API document and endpoint list; do not request the same information again.

**Why:** Repeating requests for URLs and documentation the user had already provided caused frustration.

**How to apply:** Search current uploads and conversation context first, then ask only for a specific contract detail that is genuinely absent.

Complete CloudPay validation in Replit development before moving the change to production.

**Why:** The user specified that development testing in Replit comes first and production follows only after everything is verified.

**How to apply:** Keep changes in Replit while checking the build, automated tests, authenticated customer flow, and provider callback/reconciliation. Do not claim live end-to-end readiness from mocked tests; a real payment, if required, must be initiated by the merchant, not by the agent.