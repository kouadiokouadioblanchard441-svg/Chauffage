---
name: Plesk GitHub deployment
description: Production deployment uses a committed dist build and a Node.js startup file relative to the application root.
---

For this project, Plesk must pull the versioned `dist` directory from GitHub; the production server starts `dist/index.cjs` and serves static files from `dist/public`.

**Why:** Plesk does not automatically see the Replit workspace build, and a missing or incorrect document root causes either “startup file not found” or a 403 response.

**How to apply:** Keep `dist` tracked for Plesk pulls, use `/dist/public` as the document root relative to the application root, use `dist/index.cjs` as the startup file, and provide `NEON_DATABASE_URL` plus `SESSION_SECRET` as server environment variables.

Plesk can serve the current static `index.html` while its Node.js process is failing; a working `/` is not proof that login or API routes work. The downloadable `plesk-deploy-bundle.zip` is separate from GitHub's tracked `dist` and can become stale. A GitHub push alone may not pull the new files or restart Node.

**Why:** The live homepage matched the current `dist/public/index.html` exactly while `/login` and `/api/health` returned Plesk 500 errors, and the archived bundle contained older build files. After the Neon pool/health fix reached GitHub, live API routes still returned Plesk-generated 500 responses.

**How to apply:** Verify `/` and a real API route independently. After updating GitHub, confirm Plesk pulled the branch and restarted Node before diagnosing the live result; keep the ZIP refreshed when it is the chosen deployment source.

The historical Plesk environment was recorded with `SUPABASE_NEW_DATABASE_URL`, while the current workspace runtime reads `NEON_DATABASE_URL`. The user later reported that Plesk is connected to Neon, but the exact environment-variable name and runtime health have not been verified.

**Why:** A provider-level confirmation does not prove that Plesk exposes the exact variable the build expects or that the connection succeeds. A mismatch can prevent startup; switching to another database can make production users and payment history appear missing.

**How to apply:** Preserve the production Neon database. Verify that Plesk has `NEON_DATABASE_URL` and `SESSION_SECRET`, then inspect Node.js startup logs and the deployed build. Do not change the database target or expose connection-string values in chat.

Replit's workspace Git Provider authentication is separate from its connected GitHub integration. A working GitHub connector does not prove that native `git push` credentials are valid; authentication failures should be repaired through Replit account Settings → Git Providers, not Connected Services.

**Why:** GitHub API access through the connector succeeded while the workspace's configured Git remote rejected its native push credentials.

**How to apply:** When `git push --dry-run` fails authentication against the configured upstream, reconnect the Git Provider before changing application code or asking the user to paste a token.

The production listener must start before database seeding finishes. While seeding is pending or failed, keep health checks responsive, reject application APIs with 503, and do not run financial background jobs.

**Why:** Waiting for Neon before opening the port can make Plesk/Passenger return its generic 500 page without reaching Express, even when the static homepage still loads.

**How to apply:** Keep startup independent from the seed promise; expose readiness separately from database connectivity and start earnings, cleanup, reconciliation, and other side-effecting jobs only after a successful seed.