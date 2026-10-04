---
name: Telegram bot polling
description: Avoid competing getUpdates pollers when development and production share one Telegram bot token.
---

Only one server should poll Telegram `getUpdates` for a bot token at a time. Keep polling and scheduled Telegram summaries in the production process when development and Plesk production share credentials.

For this product, Telegram business notifications are for the Plesk production site only. Preserve the existing bot commands and external support links; new business notifications should use short event summaries, not full request bodies or sensitive account/payment details.

**Why:** Telegram terminates or conflicts concurrent long-poll requests for the same bot token, making command delivery unreliable. The user selected Plesk production and clarified that they want notifications while keeping the previous bot and support behavior.

**How to apply:** Keep polling production-only. Allow outbound notifications on Plesk even if `NODE_ENV` is unset; keep Replit development silent and configure credentials only on Plesk.