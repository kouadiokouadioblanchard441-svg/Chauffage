---
name: Withdrawal privacy
description: Customer withdrawal endpoints show a minimal transaction summary while admin and provider details remain restricted.
---

For this app, customer-facing withdrawal screens and endpoints must not expose admin controls or internal/provider details; show only the amount, net amount, status, and date needed for the customer’s history.

**Why:** The user explicitly requested that manual approval, rejection, and CloudPay details stay off the user side.

**How to apply:** Whitelist both withdrawal submission and history responses, and keep admin withdrawal APIs behind `requireAdmin`.