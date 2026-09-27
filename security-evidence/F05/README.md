# F05 – Vulnerable and Outdated Components

CWE-1395 (Dependency on Vulnerable Third-Party Component) · OWASP Top 10 2025 A03 (Software Supply Chain Failures)
Branch: `fix/F05-dependency-updates`

## Part 1 result (`npm audit fix`, no `--force`)

| Project  | Before                                   | After part 1          |
|----------|------------------------------------------|-----------------------|
| Backend  | 10 (1 critical, 6 high, 2 moderate, 1 low) | 1 high (nodemailer)   |
| Frontend | 18 (11 high, 6 moderate, 1 low)          | 0                     |

Key runtime packages after part 1:

| Package | Before | After | Used by |
|---|---|---|---|
| handlebars | 4.7.8 | 4.7.9 | every email (via express-handlebars ← nodemailer-express-handlebars) |
| multer | 2.0.2 | 2.4.0 | all file uploads |
| nodemailer | 8.0.1 | 8.0.11 | all emails (major upgrade pending, part 2) |
| mongoose | 9.1.6 | 9.10.2 | all data access |
| path-to-regexp / qs / body-parser | 8.3.0 / 6.15.0 / 2.2.2 | 8.4.2 / 6.16.0 / 2.3.0 | Express 5 routing and body parsing |
| lodash | 4.17.23 | 4.18.1 | cloudinary SDK |
| axios (+ follow-redirects, form-data) | 1.15.0 | 1.20.0 | all frontend API calls |
| react-router-dom / react-router | 7.14.0 | 7.18.4 | all frontend routing |
| vite / postcss | 8.0.8 / 8.5.9 | 8.3.1 / 8.5.28 | build only |
| vitest / @vitest/coverage-v8 | 4.1.4 | 4.1.11 | tests only |

## Deviations from the standard process (and why)

1. **Frontend lockfile was already out of sync on `main`.** `npm ci` failed (missing optional `@emnapi/*`
   entries used by vite 8's wasm fallback). `npm install` was run first to resync the lock; no package.json change.
2. **`npm audit fix` crashed on npm 10.9.2** (`Cannot read properties of null (reading 'edgesOut')`).
   Cause: `@tailwindcss/oxide-wasm32-wasi` declares `bundleDependencies` that are not installed on Windows,
   which trips an npm 10 arborist bug. The same command was run with npm 11 (`npx npm@11 audit fix`),
   still without `--force`. The lockfile stays `lockfileVersion: 3` and `npm ci` on npm 10 accepts it.
3. **vitest group.** `@vitest/coverage-v8` pins an exact `vitest` peer, so `audit fix` could not move them.
   Both were bumped together inside the same minor: `vitest` and `@vitest/coverage-v8` `^4.1.4` → `^4.1.11`
   (dev-only, not a major).

Full command log: `frontend-npm-audit-fix-log.txt`, `backend-npm-audit-fix-log.txt`.

## Leftover table (after part 1)

| Package | Severity | Runtime or dev-only | Decision |
|---|---|---|---|
| nodemailer 8.0.11 (`<=9.1.0`: GHSA-p6gq-j5cr-w38f, GHSA-8m3c-c648-2xjj, GHSA-wmmp-3585-3rmp, GHSA-2x7j-588g-ccc2, GHSA-cc9r-2j5m-2m83) | high | runtime (all emails) | Fix in part 2: semver-major upgrade of the direct dependency (no override needed; `nodemailer-express-handlebars@7` peer is `nodemailer >=6`) |

No frontend leftovers. No `overrides` were needed.

## Part 2 result: nodemailer major upgrade

`npm install nodemailer@^9.1.1` (backend). The parent `nodemailer-express-handlebars@7.0.0` is already the
latest version and its peer range is `nodemailer >=6.0.0`, so it dedupes to 9.1.1 with no override.

| Project  | After part 1 | After part 2 |
|----------|--------------|--------------|
| Backend  | 1 high (nodemailer 8.0.11) | **0** |
| Frontend | 0 | **0** |

Why 9.1.1 and not 10.0.10: 9.1.1 is outside every advisory range (all are `<=9.1.0`). Its only breaking change
(9.0.0) is TLS certificate validation when nodemailer fetches remote content: URL attachments, OAuth2 token
endpoints, and HTTP proxies. DonorLens uses none of these (SMTP user/pass + handlebars `compile` plugin only). 10.0.0
is a full TypeScript rewrite released in September 2026 with no additional security fixes for our advisories.

Frontend lockfile: the `"libc"` fields written by npm 11 in part 1 were dropped by npm 10 (metadata only, no package
changes). The npm 10 form is committed so teammates and CI (Node 20 / npm 10) don't generate the same diff.

## Final leftover table

| Package | Severity | Runtime or dev-only | Decision |
|---|---|---|---|
| *(none)* | — | — | Both projects report `found 0 vulnerabilities` (`after-part2-*-npm-audit.txt`) |

## Regression results

| Check | Before | After | File |
|---|---|---|---|
| Frontend unit tests (vitest) | 59/60 pass | 59/60 pass | `before-frontend-vitest.txt`, `after-part1-frontend-vitest.txt` |
| Frontend production build | — | pass | `after-part1-frontend-build.txt` |
| Backend module load + render all 9 email templates via nodemailer-express-handlebars | — | 9/9 OK | `after-part1-backend-smoke.txt` |
| Backend HTTP smoke (health, 404, multer errors, auth guards, qs body) | — | all expected codes | `after-part1-backend-http-smoke.txt` |
| Backend real-env startup: Cloudinary config, MongoDB Atlas connect (mongoose 9.10.2), SMTP verify (nodemailer 8.0.11), public campaign query | — | all OK, read-only | `after-part1-backend-real-startup.txt` |
| Part 2 (nodemailer 9.1.1): render all 9 email templates | — | 9/9 OK | `after-part2-backend-smoke.txt` |
| Part 2 (nodemailer 9.1.1): real-env startup, SMTP verify | — | OK, read-only | `after-part2-backend-real-startup.txt` |
| Backend Playwright full suite, run against merged main (F05+F08+NF3, all packages current) | — | 30 passed, 13 failed, 5 skipped -- see below | `after-playwright-full-suite.txt` |

The one failing vitest case (`DonatePage > should display validation errors when submitting Step 1 with amount < 50`,
"Found a label with the text of: /Custom Amount/i, however no form control was found") fails identically on
untouched `main`, so it is pre-existing and not caused by F05.

## Backend Playwright full suite (previously deferred)

Run after `main` had F05, F08 and NF3 all merged, against `donorlens_test` -- an isolated database created for
this purpose (see `security-evidence/NF3/`), rather than the shared database the team's `.env` originally
pointed at with no explicit name. `npm ci` was run first so `node_modules` exactly matched the merged
`package-lock.json`.

**30 passed, 13 failed, 5 skipped.** All 13 failures and all 5 skips are the same ones seen during NF3 testing,
for the same reason: `donorlens_test` is a brand-new, empty database with no seeded admin account or existing
campaigns, so every test that logs in as `admin.donorlens@gmail.com` / `buddhikadevelopment@gmail.com` or
fetches an existing campaign fails (`campaigns.spec.js`, `execution-api.spec.js`, `payment.spec.js`, and the
one admin-login test inside `ngo-registration.spec.js`). This is an environment/seed-data gap, not a
regression -- none of those spec files exercise anything F05 changed (handlebars, nodemailer, multer,
mongoose, path-to-regexp, axios, react-router-dom), and the failures are identical whether or not F05's
changes are present.

The suite exercises the actual dependency upgrades directly, and all of that passed:
- **mongoose 9.10.2**: every campaign/user read and write across all 30 passing tests
- **multer 2.4.0**: NGO registration and execution file uploads (`ngo-registration.spec.js`)
- **handlebars 4.7.9 + nodemailer 9.1.1**: the registration-confirmation email sent during
  `POSITIVE TEST 1`/`POSITIVE TEST 2` (`Email sent successfully: <...>` in the run log)
- **path-to-regexp 8.4.2**: every route with URL params (`:campaignId`, `:executionId`, etc.)

`globalTeardown` (added in NF3) ran automatically after the suite and cleaned up correctly: found and deleted
exactly the 7 users this run created, verified 0 remaining -- confirmed independently afterward with a direct
DB query. 0 background processes left running.

## Still to capture manually

- `npx playwright test --reporter=list > security-evidence/F05/after-part1-playwright.txt` (backend running with `MONGO_URI` pointed at a separate test database)
- Screenshots: received emails (NGO approval, password setup, donation), login + token refresh working, main pages loading.
