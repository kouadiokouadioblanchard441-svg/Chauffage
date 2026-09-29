---
name: Deposit checkout routing
description: Client deposit checkout must not expose aggregator selection.
---

CloudPay / Galaxy is the sole provider for new deposits and supported withdrawals, and it is limited to Philippines accounts. Customers choose only a bank or e-wallet destination, not a gateway. Disable manual and other-aggregator initiation paths. Keep provider controls internal/admin-only.

**Why:** The user explicitly chose CloudPay only and confirmed manual deposits should be removed. Existing transaction records still need their callbacks and status reconciliation.

**How to apply:** Route all new PH payment activity through CloudPay when enabled and configured. Preserve historical records and legacy callback/status handling, but do not allow old providers or manual channels to initiate new transactions.