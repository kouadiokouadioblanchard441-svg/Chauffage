---
name: Imported database setup
description: Fresh imported projects may have only Replit's session table before the checked-in application schema is applied.
---

When setting up an imported app that uses Drizzle and connect-pg-simple, preserve the existing `session` table and treat application tables as new, even if Drizzle presents an ambiguous rename prompt.

**Why:** Drizzle can misidentify a pre-existing session table as a rename candidate for the first application table during an interactive schema push. A broad force push can also remove database-only tables that the ORM schema does not model.

**How to apply:** Inspect `information_schema` first. Scope the initial push to application tables with an explicit `tablesFilter`, then verify that `session` remains. When Drizzle receives `--config`, put the filter in that config rather than passing additional CLI flags; avoid broad force pushes.