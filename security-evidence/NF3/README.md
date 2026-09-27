# NF3 – Test Cleanup Routes Left in the App

CWE-489 (Active Debug Code) · OWASP Top 10 2025 A02 (Security Misconfiguration)
Branch: `fix/NF3-remove-test-routes`

## What was there

[src/routes/test/test.route.js](../../donorlens-backend/src/routes/test/test.route.js) exposed two
**unauthenticated** routes -- `DELETE /api/test/cleanup/user/:email` and `DELETE /api/test/cleanup/all` --
mounted in [app.js](../../donorlens-backend/src/app.js) whenever `NODE_ENV !== "production"`. The only thing
standing between "development mode" and this being reachable in production was that one environment variable
being set correctly everywhere the app runs.

`render.yaml` sets `NODE_ENV=production`, but the README documents the live backend as being on **Railway**,
not Render -- `render.yaml` may not even be the config actually in use. Whether Railway's `NODE_ENV` is
correctly set to `production` should be checked by the team; this fix removes the risk either way rather than
depending on that one variable being right everywhere.

## What used it

- `tests/ngo-registration.spec.js`'s `afterAll` called `DELETE /api/test/cleanup/user/:email` for each NGO it
  registered.
- Nothing else. A full-repo grep (backend, frontend, CI config, `package.json` scripts, README, all specs) for
  `test/cleanup`, `test.route`, `TestCleanupController`, `testRoutes` found no other reference, before or
  after this change (`after-repo-grep.txt`).
- The controller's own safety check was broken anyway: `deleteTestUserByEmail` checked
  `!email.includes("test") && !email.includes("test")` (the same condition twice), so it silently rejected
  any of the spec's own test emails that don't literally contain the substring "test" --
  `completengo…`, `duplicate…`, `edgecase…`. This was already flagged during F05/NF3 planning and confirmed
  again live during F08 testing: the spec's own cleanup call logged "Deleted test user" for these emails, but
  they were still in the database afterward, because a 400 response still satisfies Playwright's loose
  `response.ok` check path in that spec's error handling.
- `deleteAllTestUsers` (`/cleanup/all`) had no such check at all -- any live user whose email happens to
  contain "test" (`latest@…`, `contest@…`, `attestation@…`) would have matched.

## What changed

1. Deleted `src/routes/test/test.route.js` and `src/controllers/test/TestCleanupController.js`; removed the
   import and the `NODE_ENV !== "production"` mount block from `app.js`.
2. Moved `cleanup-test-data.js` → `scripts/cleanupTestData.js` (kept as a `git mv` rename). Refactored to
   `export const cleanupTestData = async () => {...}` (throws on failure instead of calling `process.exit()`),
   so it's safe to import and call from a long-lived process, not just run as a one-off CLI script.
3. **Added a safety guard**: refuses to connect at all unless `MONGO_URI`'s database name contains "test".
   Fails closed -- no `MONGO_URI`, or a URI with no database name (the exact shape of the team's current
   `.env`, which defaults to Mongo's implicit `test` database), is refused rather than assumed safe.
4. **Tightened the email match.** The old filter was a loose substring regex over 8 words
   (`duplicate`, `nocert`, etc.) that could match a real user's email containing any of those words. Replaced
   with an exact anchored pattern matching only what the three spec files (`ngo-registration.spec.js`,
   `auth.spec.js`, `campaigns.spec.js`) actually generate:
   `^(testngo|completengo|nocert|duplicate|edgecase|pwsetup|testuser|campaign\.user\.)\d+@example\.com$`.
5. `package.json`'s `"cleanup"` script now points at `scripts/cleanupTestData.js`.
6. Added `tests/global-teardown.js`: imports and calls `cleanupTestData()` once after the whole Playwright
   suite finishes, wired in via `globalTeardown` in `playwright.config.js`. Catches and warns rather than
   rethrows, so a misconfigured `MONGO_URI` in CI fails loud in the log without failing the whole test run
   over leftover data.
7. `tests/ngo-registration.spec.js`'s `afterAll` no longer calls the deleted route; it just logs which NGOs
   this run registered (informational only -- cleanup is now handled once, suite-wide, by `globalTeardown`).
8. `README.md`: replaced the "Test Cleanup Endpoints" table (which documented the routes as a public API
   surface) with a "Test Data Cleanup" section describing the script; updated the file tree and the Testing
   Notes bullet that referenced the routes.

## Why option 2b (script), not 2a (delete outright)

The Playwright suite's `afterAll` did use the route, so simply deleting it without a replacement would have
broken `ngo-registration.spec.js`. Moving the logic into a script that Playwright calls automatically via
`globalTeardown` keeps automated cleanup working without any network-reachable delete endpoint existing at
all -- the script only runs as a local/CI process with direct database access, never over HTTP.

## Testing

**Routes are gone**, tested against a live server (`after-route-404.txt`):
```
DELETE /api/test/cleanup/all              -> 404 Not Found
DELETE /api/test/cleanup/user/nobody@...  -> 404 Not Found
```

**Full Playwright suite**, run against a fresh, empty `donorlens_test` database (deliberately isolated from
whatever database the app/team currently uses, so test runs never touch real or shared data) --
`after-playwright-full-suite.txt`:

- **30 passed, 13 failed, 5 skipped.**
- All 13 failures and all 5 skips are **pre-existing and unrelated to NF3**: `donorlens_test` is a brand-new
  database with no seeded admin account or campaigns, so every test that logs in as
  `admin.donorlens@gmail.com` / `buddhikadevelopment@gmail.com` or fetches an existing campaign fails --
  `campaigns.spec.js`, `execution-api.spec.js`, `payment.spec.js`, and the one admin-login test inside
  `ngo-registration.spec.js`. None of those spec files reference the deleted route at all (confirmed by the
  repo-wide grep above).
- **All 5 tests in `ngo-registration.spec.js` that matter for NF3 passed**, including the two that create and
  clean up NGOs (POSITIVE TEST 1, POSITIVE TEST 2, NEGATIVE TEST 2 duplicate-email, EDGE CASE).
- **`globalTeardown` ran automatically** after the suite finished -- confirmed in the same log:
  ```
  🔄 Connecting to MongoDB (database: donorlens_test)...
  ✅ Connected to MongoDB
  🗑️  Finding test users matching: /^(testngo|completengo|...)\d+@example\.com$/i
  📊 Found 7 test users to delete
  ✅ Successfully deleted 7 test users from database!
  ✔️  Verification: 0 test users remaining
  ```
  The 7 matched are exactly the 7 the run actually created (`testuser…`, `campaign.user….` x2, `testngo…`,
  `duplicate…`, `edgecase…`, `completengo…`) -- no over- or under-matching.
- **Verified independently by direct DB query** after the server was stopped: `0` users remaining in
  `donorlens_test`.

**Guard tested in isolation** (`after-guard-test.txt`) against: no `MONGO_URI`, a realistic non-test URI, and
the exact shape of the team's current `.env` (no database name) -- all three correctly refused before
attempting to connect. A URI with an explicit `..._test` database name correctly passed the guard.

## Not yet done / open items for the team

1. **Whether Railway's `NODE_ENV` is actually `production`.** This was already an open question from the
   original F05/F08/NF3 planning; removing the routes entirely makes it moot for this specific risk, but the
   team should still confirm it, since other `NODE_ENV`-gated behavior may exist elsewhere.
2. This exposed a bigger fact worth raising with the team separately: **the shared `MONGO_URI` has no
   explicit database name**, meaning it (and possibly the deployed app) defaults to Mongo's implicit
   database literally named `test`. If that's the same database production traffic writes to, real user data
   has been living in a database called "test" -- which is exactly the kind of ambiguity that made the now-
   deleted `/cleanup/all` route dangerous in the first place. Worth an explicit, named database for
   production, separate from anyone's local test runs.
