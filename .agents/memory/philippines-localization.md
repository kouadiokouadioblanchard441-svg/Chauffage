---
name: Philippines currency and localization
description: Rules for PHP display and translating built-in copy while preserving stored financial values and custom content
---

Display Philippine peso labels for the Philippines without converting existing numeric amounts.

**Why:** The requested change is a currency display/localization change, not a balance, reward, or transaction conversion. Changing persisted numbers would alter financial meaning.

**How to apply:** Keep stored amounts and thresholds unchanged. Update currency labels and formatting to PHP. Translate only known built-in defaults through exact-match migrations; preserve administrator-customized settings, product text, and provider responses unless separately reviewed.