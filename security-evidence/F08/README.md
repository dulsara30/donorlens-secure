# F08 – Upload Validation Trusts the Client MIME Type

CWE-434 (Unrestricted Upload of File with Dangerous Type) · OWASP Top 10 2025 A06 (Software Supply Chain / File-Handling Failures)
Branch: `fix/F08-upload-content-check`

## What changed

1. **`src/utils/fileHelpers.js`** – dropped `application/msword` and DOCX from `ALLOWED_FILE_TYPES`
   (no route/frontend form sends either; legacy `.doc` can't be told apart from other OLE-compound-file
   formats by magic bytes). Added `normalizeMimetype()` (`image/jpg` → `image/jpeg`, matching what
   `file-type` actually reports).
2. **`src/middleware/fileValidation.middleware.js`** – rewritten as `async`. For every uploaded file it now:
   sniffs the real type from its magic bytes (`file-type`'s `fileTypeFromBuffer`), rejects if undetectable,
   rejects if the detected type isn't on the allowlist for that field (`fieldRules[fieldname]` or
   `allowedTypes`), rejects if the detected type doesn't match the client-declared `file.mimetype`, and
   picks the size limit from the **detected** category, not the declared one.
3. **`src/middleware/upload.middleware.js`** – multer's `fileSize` ceiling raised from 5MB to
   `FILE_SIZE_LIMITS.document` (10MB) so a legitimate 10MB document can reach the (stricter) per-category
   check in `validateFiles`; multer's own `fileFilter` error message updated (doc/docx removed).
4. **`src/routes/campaigns/campaign.routes.js`** – `validateFiles({ allowedTypes: images })` added after
   `uploadImageOnly.single("coverImage")` on both add-campaign and update-campaign (previously had no
   content validation at all past multer's mimetype-only filter).
5. **`src/routes/campaigns/executions/executions.routes.js`** – added `fieldRules`: `evidencePhotos` must be
   images, `receipts` may be an image or a PDF.
6. **`src/routes/ngoAdmin/ngoRegister.route.js`** – **not touched**. It already calls
   `validateFiles({ allowedTypes: ALLOWED_FILE_TYPES.all, ... })`, so trimming `ALLOWED_FILE_TYPES.all` in
   `fileHelpers.js` was enough. Left alone per the team's request (a teammate is adding a rate limiter here).
7. `npm install file-type@^21` (ESM-only, Node ≥20 — matches CI's Node 20 and local Node 22).

## Decisions (confirmed with Viduni before implementing)

- **Document allowlist:** PDF + JPG/PNG/WEBP only. Matches what the frontend actually offers
  (`accept=".pdf,.jpg,.jpeg,.png"`); DOCX/.doc dropped entirely.
- **Execution fields:** `evidencePhotos` restricted to images only; `receipts` accepts images + PDF.

## Test matrix: `register-ngo` (before vs after)

Run against a live server with real Cloudinary/MongoDB credentials. Each run's server PID was confirmed via
`netstat` before sending requests (an earlier attempt found that a killed Git-Bash background job doesn't
reliably kill the underlying Windows `node.exe` — `$!` is not trustworthy for this on Windows; `taskkill //F //PID <netstat-confirmed-pid>` was used instead). All files created (DB users + Cloudinary assets) were
deleted after each run via a one-off script using the app's own `deleteFromCloudinary` and an exact-email-match
Mongo query — never a broad regex delete.

| # | Case | Before (`before-register-ngo-cases.txt`) | After (`after-register-ngo-cases.txt`) |
|---|---|---|---|
| 1 | Plain text renamed `.pdf`, declared `application/pdf` | **500** — reached Cloudinary, which itself rejected it (`Invalid image file`) | **400** — `could not be verified` |
| 2 | Real PDF, declared `application/pdf` | 201 | 201 (unchanged happy path) |
| 3 | JPG renamed to `.pdf`, declared `application/pdf` | **201** — uploaded and stored on Cloudinary as if it were a PDF | **400** — `content does not match its declared type (declared: application/pdf, detected: image/jpeg)` |
| 4 | JPG renamed to `.pdf`, declared `image/jpeg` (wrong extension, but declared mimetype matches real content) | 201 | 201 — correct: images are an allowed document type for this field, and content matches what was declared |
| 5 | Real JPG, declared `image/jpeg` | 201 | 201 (unchanged) |
| 6 | Real PDF padded to 11MB | 400 `LIMIT_FILE_SIZE` (old 5MB multer cap) | 400 `LIMIT_FILE_SIZE` (new 10MB multer cap — still rejected) |
| 7 | Real PDF, declared `application/msword` | **201** — legacy doc mimetype was on the old allowlist | **400** — `application/msword` no longer allowed at all (multer's own fileFilter now rejects it before `validateFiles` even runs) |
| 8 | Real PNG, declared `image/png` | not tested | 201 |
| 9 | Real PDF padded to ~7MB (between the old 5MB cap and the new 10MB document cap) | not tested (would have hit the old 5MB multer ceiling) | **201** — proves the new *document*-category limit is real, not just a raised multer ceiling |

Confirmed via server logs that cases 1, 3, 6, 7 (after fix) never reached `AdminRegisterController`
(0 of those 4 in the controller-invocation log), i.e. **nothing reached Cloudinary** for any rejected file —
`validateFiles` runs strictly before the controller in the middleware chain.

## Isolated middleware tests: campaign & execution field rules

`after-middleware-unit-tests.txt` — calls `validateFiles()` directly with mock `req` objects built from the
same real byte buffers (no DB, no auth, no Cloudinary, no server). 9/9 passed:

- coverImage (`campaign.routes.js`): real JPG accepted; PDF-content-as-.jpg rejected (mismatch); real PDF
  rejected (not on the images allowlist); plain text rejected (undetectable).
- `evidencePhotos` (`executions.routes.js`): real JPG accepted; real PDF rejected (photos must be images).
- `receipts`: real PDF accepted; real JPG accepted (both on the field's allowlist).
- Mixed request: a genuine JPG plus a PDF-disguised-as-`.jpg` both sent as `evidencePhotos` — the smuggled
  file alone is caught and the whole request is rejected.

This route pair wasn't hit end-to-end (would require a full register → admin-approve → password-setup →
login chain to get an authenticated `NGO_ADMIN` token — out of scope for isolated middleware verification,
and avoided writing that much state into the shared database for this task).

## Regression: existing Playwright NGO registration suite

`after-playwright-ngo-registration.txt` — `npx playwright test tests/ngo-registration.spec.js`: **7/7 passed**
on the F08 code, including the real `test-cert.pdf` fixture (genuine `%PDF-1.4` header) uploading successfully.

Found (and cleaned up, not fixed — out of scope for F08): 3 of the spec's own test users
(`completengo…`, `duplicate…`, `edgecase…`) were left behind because the test-cleanup route's safety check
(`email.includes("test")`, checked twice) rejects any email that doesn't literally contain the substring
`"test"` — this is the exact same pre-existing bug flagged during F05/NF3 planning. Not caused by F08.

## Confirming nothing reaches Cloudinary on rejection

- Code path: every upload route is `multer → validateFiles → controller`. `validateFiles` calls `next(error)`
  on any rejection, which skips straight to the global error handler — the controller (the only place that
  calls `uploadToCloudinary`) is never invoked.
- Verified empirically: server logs show 0 `AdminRegisterController called` lines for rejected cases 1/3/6/7.
- Verified empirically: Cloudinary Media Library only ever received assets for the cases that returned 201
  (2, 4, 5, 8, 9) — all of which were deleted again after the test run via `deleteFromCloudinary`.

## Cleanup performed after testing

All test artifacts were deleted, not left for manual cleanup:
- 12 Cloudinary assets deleted (`donorlens/ngo-registrations/certificates/...` and `.../additional-docs/...`)
- 14 test DB users deleted, by exact email match only (never `email: /test/i`)
- Final verification query: `0` stray test users remaining under any of the `f08*`, `testngo*`,
  `completengo*`, `duplicate*`, `edgecase*`, `pwsetup*`, `nocert*` patterns
- All background `node.exe` processes force-killed; confirmed 0 running and no ports left listening

## Not yet done

- No route currently issues an authenticated `NGO_ADMIN` token easily enough to run a true end-to-end test
  against `campaign.routes.js` / `executions.routes.js` without writing significant state (full approval
  workflow) into the shared database. The isolated middleware tests above cover the same validation logic
  those routes call.
- Screenshots of the Cloudinary Media Library before/after (the empirical proof above is from the API
  responses, DB queries and server logs instead).
