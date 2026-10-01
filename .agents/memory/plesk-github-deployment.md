---
name: Plesk GitHub deployment
description: Production deployment uses a committed dist build and a Node.js startup file relative to the application root.
---

For this project’s Plesk layout, the application root is the built `dist` directory, the startup file is `index.cjs`, and the document root is `dist/public`. The build must place a `package.json` and `pnpm-lock.yaml` beside `index.cjs` so Plesk can install runtime dependencies from that application root.

**Why:** Plesk serves static files separately from the Node process. If its application root points at `dist` but the package manifest and lockfile remain only in the repository root, Plesk cannot install the server dependencies and dynamic routes may return a generic 500 while static assets still load.

**How to apply:** Keep the built `dist` directory tracked; configure Plesk with application root `dist`, document root `dist/public`, and startup file `index.cjs`. Run pnpm installation from that root and provide `NEON_DATABASE_URL` plus `SESSION_SECRET` as server environment variables.

Plesk can serve the current static `index.html` while its Node.js process is failing; a working `/` is not proof that login or API routes work. The downloadable `plesk-deploy-bundle.zip` is separate from GitHub's tracked `dist` and can become stale. A GitHub push alone may not pull the new files or restart Node.

**Why:** The live homepage matched the current `dist/public/index.html` exactly while `/login` and `/api/health` returned Plesk 500 errors, and the archived bundle contained older build files. After the Neon pool/health fix reached GitHub, live API routes still returned Plesk-generated 500 responses.

**How to apply:** Verify `/` and a real API route independently. After updating GitHub, confirm Plesk pulled the branch and restarted Node before diagnosing the live result; keep the ZIP refreshed when it is the chosen deployment source.

Historical Plesk instructions and bundles used `SUPABASE_NEW_DATABASE_URL`, while the current runtime reads `NEON_DATABASE_URL`. Plesk has since been reported to contain the current variable name, but its value's target and successful connectivity are not verified.

**Why:** A provider-level confirmation does not prove that Plesk exposes the exact variable the build expects or that the connection succeeds. A mismatch can prevent startup; switching to another database can make production users and payment history appear missing.

**How to apply:** Preserve the production Neon database. Verify that Plesk has `NEON_DATABASE_URL` and `SESSION_SECRET`, then inspect Node.js startup logs and the deployed build. Do not change the database target or expose connection-string values in chat.

Replit's workspace Git Provider authentication is separate from its connected GitHub integration. A working GitHub connector does not prove that native `git push` credentials are valid; authentication failures should be repaired through Replit account Settings → Git Providers, not Connected Services.

**Why:** GitHub API access through the connector succeeded while the workspace's configured Git remote rejected its native push credentials.

**How to apply:** When `git push --dry-run` fails authentication against the configured upstream, reconnect the Git Provider before changing application code or asking the user to paste a token.

The production listener must start before database seeding finishes. While seeding is pending or failed, keep health checks responsive, reject application APIs with 503, and do not run financial background jobs.

**Why:** Waiting for Neon before opening the port can make Plesk/Passenger return its generic 500 page without reaching Express, even when the static homepage still loads.

**How to apply:** Keep startup independent from the seed promise; expose readiness separately from database connectivity and start earnings, cleanup, reconciliation, and other side-effecting jobs only after a successful seed.