---
name: Withdrawal balance policy
description: Business rule for separating the total wallet balance from the amount eligible for withdrawal.
---

The total wallet balance may include approved deposits, but the withdrawal balance must exclude the remaining deposit principal. Product and staking purchases consume protected deposit principal first; earnings, commissions, bonuses, and other non-deposit credits remain withdrawable.

**Why:** The user explicitly requires deposited money to remain visible in the total balance but never be withdrawable.

**How to apply:** Keep the withdrawal page and server-side withdrawal validation based on the withdrawable balance, not the raw user balance. Rejected withdrawals restore the amount to the same calculation.

Manual approval is a bookkeeping action only after an administrator confirms the external transfer has already been sent. It must never initiate a provider payout and must be limited atomically to pending requests without a payout-provider reference.

**Why:** Marking a request paid before a transfer, or after a provider already accepted it, can leave the user unpaid or cause a duplicate payout.

**How to apply:** Show a confirmation that clearly states no money is sent by the app, require explicit confirmation, and enforce the pending/no-provider-reference condition in storage.