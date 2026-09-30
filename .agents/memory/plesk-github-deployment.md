---
name: Plesk GitHub deployment
description: Production deployment uses a committed dist build and a Node.js startup file relative to the application root.
---

For this project, Plesk must pull the versioned `dist` directory from GitHub; the production server starts `dist/index.cjs` and serves static files from `dist/public`.

**Why:** Plesk does not automatically see the Replit workspace build, and a missing or incorrect document root causes either “startup file not found” or a 403 response.

**How to apply:** Keep `dist` tracked for Plesk pulls, use `/dist/public` as the document root relative to the application root, use `dist/index.cjs` as the startup file, and provide `SUPABASE_NEW_DATABASE_URL` plus `SESSION_SECRET` as server environment variables.

Plesk can serve the current static `index.html` while its Node.js process is failing; a working `/` is not proof that login or API routes work. The downloadable `plesk-deploy-bundle.zip` is separate from GitHub's tracked `dist` and can become stale.

**Why:** The live homepage matched the current `dist/public/index.html` exactly while `/login` and `/api/health` returned Plesk 500 errors, and the archived bundle contained older build files.

**How to apply:** Verify `/` and a real API route independently. Confirm whether Plesk deploys from GitHub or from the ZIP before changing either artifact; keep the ZIP refreshed when it is the chosen deployment source.

The historical Plesk environment was recorded with `SUPABASE_NEW_DATABASE_URL`, while the current workspace runtime reads `NEON_DATABASE_URL`. The live Plesk variable and deployed build must be verified together before changing databases.

**Why:** A runtime/database-variable mismatch can prevent startup, and switching to a database that has not received the production users and payment history can make records appear missing.

**How to apply:** Preserve the currently working Plesk database until the user-account and payment-history migration is verified. Then deploy the matching current build and configure its `NEON_DATABASE_URL`; do not point the app at an empty target.

Replit's workspace Git Provider authentication is separate from its connected GitHub integration. A working GitHub connector does not prove that native `git push` credentials are valid; authentication failures should be repaired through Replit account Settings → Git Providers, not Connected Services.

**Why:** GitHub API access through the connector succeeded while the workspace's configured Git remote rejected its native push credentials.

**How to apply:** When `git push --dry-run` fails authentication against the configured upstream, reconnect the Git Provider before changing application code or asking the user to paste a token.