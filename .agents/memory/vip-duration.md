---
name: VIP duration
description: Business rule for the duration and total return of VIP products.
---

Product cycle lengths, prices, and earnings are normally managed in the admin panel; routine startup must not overwrite them. When the user explicitly authorizes new terms for future purchases, apply them with a one-time, versioned catalog migration: preserve old product rows and their price/earnings/cycle values, deactivate those rows for new sales, and create new active rows. The total return remains daily earnings multiplied by the configured cycle length.

**Why:** Existing user purchases reference product rows for their ongoing earnings, so editing old rows would change active users' terms. Product values remain admin-managed outside explicit, user-approved schedule changes.

**How to apply:** Treat database values as authoritative during normal startup. For an explicitly approved future-only change, use a migration marker so the new catalog is applied once per database, leave existing purchase rows intact, and never repeat the migration on later starts.