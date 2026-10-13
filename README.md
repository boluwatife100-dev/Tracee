# Tracee

**Scan. Trace. Know.**

Tracee is a next-generation consumer safeguards app for the Nigerian market. Point your phone at a
product or a plant and it tells you what you're actually dealing with:

- **Product scans** — photograph a product label and get an ingredient-level report: GMO likelihood,
  fluoride strength, allergen matches against *your* saved allergy profile, dietary conflicts, and a
  plain-language explanation of every ingredient.
- **Plant diagnosis** — photograph a houseplant and get a species identification, an assessment of any
  visible problems, and a personalised care plan with dated, recurring tasks on a dashboard checklist.
- **Authenticity checks** — photograph product packaging (plus barcode) and compare the printed NAFDAC
  registration details against the live NAFDAC registry to see whether the product checks out.

The guiding principle throughout is **evidence before risk**: the app never turns an unreadable label
into a "safe" verdict. Every rating is paired with the confidence in the input it was built from, and
anything that cannot be assessed confidently is routed to a human admin review queue.

---

## Tech stack

| Layer        | Technology                                                              |
| ------------ | ----------------------------------------------------------------------- |
| Framework    | **Next.js 16** (App Router, React 19, TypeScript)                        |
| Styling      | Tailwind CSS 4, `lucide-react` icons, `next/font` (Geist)                 |
| Auth         | **Clerk** (middleware-gated dashboard routes, per-user identity)          |
| Database     | **PostgreSQL** via **Prisma** ORM (see `prisma/schema.prisma`)            |
| Image storage| **Cloudinary** — authenticated uploads via server-signed requests,        |
|              | content-hash deduplication, short-lived signed delivery URLs               |
| AI providers | **Google Gemini** (via `@google/genai`) and **Plant.id v3**                |
| Client OCR   | **tesseract.js** (runs in the browser)                                    |
| Barcodes     | **@zxing/browser** + **@zxing/library** (runs in the browser)             |
| Data sources | **NAFDAC** Greenbook + food-products database, **OpenFoodFacts**          |
| Tests        | `node:test` (see `tests/` and `scripts/test-engines.ts`)                  |

---

## How the app works

There are three independent scan flows. All of them share the same shape:

1. **Capture** happens in the browser (camera/photos).
2. **Upload** goes straight from the browser to Cloudinary using a server-signed upload request.
   Photos are hashed first so the same image is never uploaded twice and every upload is tied to the
   owner's account.
3. **Analysis** happens on the server (Next.js route handlers / server functions).
4. **Results** are stored per user, and unconfident results are surfaced to an **admin review queue**.

A `Scan` row is created immediately when a user submits photos, so every request is traceable and
retryable. Long analysis is fronted by idempotency keys and content-hash deduplication.

---

### 1. Product scan (label analysis)

Flow: `components/scan/ScanCapture.tsx` → `POST /api/scans` → `GET /api/scans/[id]/result`

1. **Browser OCR.** The user uploads a back-of-label photo. `tesseract.js` reads the label text and a
   confidence score in the browser, so no raw image text ever has to travel for this step.
2. **Upload.** The image is compressed and SHA‑256 hashed, then uploaded to Cloudinary with a signature
   minted by `POST /api/cloudinary/signature`. The signature route reuses an existing `ScanImage` when
   the content hash is already known.
3. **Record scan.** `POST /api/scans` validates the payload (photo ownership, media consent, hashes)
   and creates a `Scan` in `awaiting_catalog` state.
4. **Structured extraction — AI.** `lib/extraction.ts::extractFromPhotos` sends the label photo to
   **Gemini** with a JSON output schema (`temperature: 0`). Gemini is prompted to *transcribe, not
   interpret*, and must report `null` plus a 0–1 legibility score for anything it cannot read. Output:
   product name, brand, manufacturer, country, product type, full ingredient text, may-contain
   statements, expiry/manufacture dates, batch number, NAFDAC number, barcode digits, marketing
   claims. Extraction is saved on the `Scan` for audit and re-scoring.
5. **Deterministic analysis engines (no AI).** `lib/product-analysis.ts` turns the extraction into
   verdicts using pure rule code so every verdict is explainable:
   - `normalizeIngredients` splits/cleans the ingredient list.
   - `scoreGmo` matches ingredients against `data/product-catalog/gmo_reference_lookup.csv`, applies
     per-crop policy weights, accounts for "non-GMO"/"organic" claims, and emits a
     `{ evidence, confidence, risk, reasons }` verdict.
   - `assessFluoride` finds fluoride terms, parsed ppm strength, and grades it against an age band.
   - `detectAllergens` / `matchUserAllergens` match a curated allergen dictionary against the label and
     the user's saved allergies at read time (never stored on the product).
   - Dietary preferences are assessed the same way.
6. **Plain-language explanations — AI.** `explainIngredients` calls **Gemini** (structured output) to
   explain each ingredient in everyday terms and assess each saved dietary preference. If Gemini is
   unavailable the report degrades gracefully with a warning, never with made-up text.
7. **Caching.** The *shareable* report (verdicts + ingredient explanations) is cached on `Scan.analysis`
   so repeat visits do not re-spend AI calls. Per-user allergen/dietary results are always recomputed
   at read time.
8. **Guardrails.** If the ingredient list cannot be read at `≥ 0.6` confidence, the engines return
   `insufficient` evidence with `risk: null` (the core invariant in `lib/evidence.ts`), the scan is
   flagged `needs_review`, and a `ClearanceRequest` opens in the admin queue. Users can proactively
   request a clearance review from the UI too.

### 2. Plant diagnosis

Flow: `components/scan/ScanCapture.tsx` → `POST /api/scans` → `POST /api/scans/[id]/diagnosis` →
`lib/plant-diagnosis.ts`

1. **Capture + context.** The user uploads a whole-plant photo, a close-up, and optionally an underside
   shot, then answers watering/light questions. They may optionally supply a plant name and a leaf
   description.
2. **Identification — AI (Plant.id v3).** `diagnosePlant` loads the photos from Cloudinary and calls
   the Plant.id identification API (`health: "all"`), producing species candidates, disease/health
   candidates, and `is_plant` / `is_healthy` probabilities.
3. **Care plan — AI (Gemini).** The photos, candidates, and owner-provided context are sent to Gemini
   as a multimodal request with a strict JSON schema and `temperature: 0.2`. Gemini is instructed to:
   - judge whether the photos are usable at all,
   - list only symptoms actually visible in the photos,
   - annotate each disease candidate as `visible / weak / not_visible` with photo-based evidence,
   - write 2–4 actionable care tasks with `dueInDays` and optional recurrence,
   - resolve the owner's plant-name hint (treated as an untrusted string, never as instructions) to a
     botanical name and whether it matches the photos.
4. **Deterministic post-processing.** The owner hint only competes with photo identification when
   image confidence is below `0.30`; disease evidence is merged back onto the candidates. A summary
   and tasks are produced even when Plant.id fails *if* the owner supplied a name, so the flow degrades
   gracefully.
5. **Persistence.** Results are stored on `PlantDiagnosis`, and care tasks become `CareTask` rows with
   real due dates. They appear in the dashboard `CareChecklist` and can be ticked off via
   `PATCH /api/care-tasks/[id]`.
6. **Guardrails.** If photos are unusable or no identification is possible, the scan is marked
   `needs_review` and a clearance request is opened.

### 3. Authenticity check (NAFDAC)

Flow: `components/scan/AuthenticityCapture.tsx` → `POST /api/authenticity/check` (GET
`/api/authenticity/check/[id]`, `/api/authenticity/history`)

1. **Capture.** Up to three photos (front, back, barcode). The barcode is read with **ZXing** and the
   printed label with **tesseract.js** in the browser. The user can optionally key in the NAFDAC
   registration number manually.
2. **Idempotent pipeline.** `POST /api/authenticity/check` is keyed by the content hashes + manual
   registration number, so a repeated submit from a flaky network never double-runs. Statuses:
   `queued → extracting → looking_up → completed` (or `review_failed`).
3. **Field extraction — AI (Gemini).** The package photos are sent to Gemini with a strict JSON schema
   requesting the NAFDAC registration number, product/brand/company, batch number, manufacture/expiry
   dates and category, a per-field 0–1 confidence, and a list of `unreadableFields`. Gemini is told to
   return `null` rather than invent anything and to ignore any instructions printed on the package.
4. **Normalization (deterministic).** `lib/authenticity/normalization.ts` cleans registration numbers
   for standard and state-office NAFDAC formats, repairs common OCR confusions (`O`/`0`, `I`/`1`), and
   provides fuzzy name similarity (Levenshtein + token overlap) for companies and products.
5. **Registry lookup.** `lib/authenticity/nafdac-lookup.ts` queries the live NAFDAC Greenbook and the
   food-products database. Because these sites have no public API, the lookup scrapes their endpoints:
   parsing CSRF tokens and DataTables/`data_request_url` parameters from the pages. Requests are
   rate-limited to ~1/s, retried on transient failures, and cached in `NafdacLookup` for 7 days.
6. **Scoring (deterministic).** `scoreAuthenticity` compares the printed registration number, product
   name, manufacturer/importer, and category against the registry record to emit one of
   `VERIFIED_REGISTRATION`, `MISMATCH`, `NOT_FOUND`, or `INSUFFICIENT_EVIDENCE`, plus packaging
   sanity checks (dates in the future, expiry before manufacture, already expired). A company-name
   match is deliberately treated as context, never as proof.
7. **Plain-language review — AI (Gemini).** `generateAuthenticityReview` turns the structured findings
   into a calm, user-facing summary: what the check found, what it means, a 0–100 confidence in the
   *assessment itself*, and up to 4 recommended next steps. Gemini is explicitly instructed never to
   claim the product is genuine or fake.
8. **User reports.** `POST /api/authenticity/report` lets a user file a report (note + optional extra
   photo) against a check, which records `ProductReport` rows for investigation.

---

### Human-in-the-loop (admin review)

Anything the engines cannot assess confidently ends up in a `ClearanceRequest`:

- `app/admin/review` lists pending clearance requests. Access is gated by the Clerk `publicMetadata.role
  = "admin"`, checked again inside the server action (`lib/admin.ts`, `lib/admin-role.ts`).
- `app/admin/review/actions.ts::reviewClearance` lets an admin approve, reject, or ask for more
  information, attaching a note. Decisions are stored on the request and shown back in the UI.
- Confident AI/engine results can also be overridden by an admin (`Product.source = "admin"`), so a
  reviewed fact is distinguishable from an engine-produced one.

---

## The role of AI, summed up

| Flow step                                  | Provider   | What AI does                                                              | Guardrails                                                              |
| ------------------------------------------ | ---------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Label OCR                                  | tesseract.js | Raw text + confidence (in-browser)                                        | Confidence stored with the scan, used to block ratings                  |
| Label text cleaning                        | Gemini     | Fix obvious OCR misspellings                                              | Falls back to raw text on failure                                       |
| Product field extraction                   | Gemini     | Vision transcription of the label into structured JSON                    | 0-temperature, JSON schema, `null` instead of guessing, legibility scores |
| Ingredient / dietary explanations           | Gemini     | Plain-language explanations + dietary assessment                          | Structured schema, graceful fallback with warning                       |
| GMO / fluoride / allergen / dietary verdicts | none      | Pure rule engines — explainable, reproducible                             | Evidence-before-risk invariant enforces `risk: null` on low confidence  |
| Plant species & health identification       | Plant.id v3| Computer-vision identification + disease/health candidates                | Confidence thresholds; owner hint used only as fallback                 |
| Plant care plan                             | Gemini     | Symptoms, disease evidence, care tasks, hint resolution from photos+context | JSON schema, explicit "only what's visible", photo usability check     |
| Authenticity field extraction               | Gemini     | Reads NAFDAC reg number, details, dates                                   | JSON schema, per-field confidence, unreadable-fields list               |
| NAFDAC registry search                      | none       | Deterministic scraping + fuzzy matching                                   | Rate-limited, cached, retried                                          |
| Authenticity scoring                        | none       | Deterministic comparison of printed vs registered details                 | Evidence-before-risk; never claims "genuine/fake"                      |
| Authenticity plain-language review          | Gemini     | Explains findings + recommended actions                                   | Explicitly instructed not to draw authenticity conclusions             |

Everywhere an AI model produces data, its output is **schema-validated, treated as untrusted input,
and audited** (raw extraction is stored on the scan). The actual safety verdicts — the GMO/fluoride/
allergen/dietary/category checks — are deliberately built from deterministic code so a user can always
see *why* an answer was reached.

---

## Project structure

```
app/
  page.tsx, layout.tsx          Landing page + root layout
  login/ signup/ auth/          Clerk auth + user sync pages
  onboarding/ preferences/      Allergy/dietary profile capture
  dashboard/                    Dashboard home, scan, results, history, my-plant, authenticity, profile
  admin/review/                 Admin clearance review (server actions)
  processing/ review/           Placeholder flow pages
  api/                          Route handlers (see below)
  generated/                    Generated Prisma client output
components/
  scan/                         ScanCapture (product/plant), AuthenticityCapture (barcode + OCR)
  dashboard/                    ActionCards, LatestInsights, CareChecklist, history
  admin/ auth/ ui/ landing/ ... Presentation + chrome
lib/
  extraction.ts                 Gemini vision → structured label extraction (product + authenticity)
  plant-diagnosis.ts            Plant.id + Gemini care-plan pipeline
  product-analysis.ts           Product report assembly + caching
  evidence.ts                   Evidence-before-risk invariant shared by all engines
  engines/                      Deterministic verdict engines (gmo, fluoride, allergen, dietary,
                                ingredient-explanations, ocr-inference, openfoodfacts, normalize)
  nafdac/                      * (folder currently empty)
  authenticity/                 scoring, normalization, nafdac-lookup, ai-review
  clearance.ts  scan-image.ts  scan-history.ts  admin.ts  admin-role.ts  db.ts  prisma.ts
data/product-catalog/           CSV reference data (GMO crop→ingredient aliases, working datasets)
prisma/schema.prisma            Full data model (see below)
tests/  scripts/                node:test unit tests + engine smoke tests
proxy.ts                        Clerk middleware protecting /dashboard
```

### API routes (`app/api`)

| Route                                  | Purpose                                                    |
| -------------------------------------- | ---------------------------------------------------------- |
| `POST /api/scans`                      | Create a product/plant scan (validated, hashed photos)     |
| `GET /api/scans/[id]/result`           | Build/return a cached product analysis report              |
| `PATCH /api/scans/[id]`                | User-corrected label text (marks OCR as reviewed)          |
| `POST /api/scans/[id]/diagnosis`       | Run the plant diagnosis pipeline                           |
| `POST /api/scans/[id]/clearance`       | Request a human review of a scan                           |
| `PUT /api/me/preferences`              | Save allergy/dietary preferences                           |
| `GET /api/care-tasks` / `PATCH /api/care-tasks/[id]` | Plant care checklist                          |
| `GET /api/activity`                    | Merged recent activity feed for the dashboard              |
| `POST /api/cloudinary/signature`       | Mint signed, deduplicated upload credentials               |
| `POST /api/authenticity/check`         | Run the NAFDAC authenticity pipeline (idempotent)          |
| `GET /api/authenticity/check/[id]`     | Poll a running/completed check                             |
| `GET /api/authenticity/history`        | Authenticity check history                                 |
| `POST /api/authenticity/report`        | File a user report against a check                         |

---

## Data model (`prisma/schema.prisma`)

- **User** — Clerk-synced profile, allergy/dietary arrays, onboarding flag. Passwords stay in Clerk.
- **Product** — *cacheable, shared* product facts; verdicts are stored here; per-user results are not.
  `source` distinguishes `ai`-produced from `admin`-overridden records.
- **Scan** — every product/plant submission; raw OCR, extraction, cached analysis, plant context, and a
  status that drives the UI. `idempotencyKey` prevents duplicates.
- **ScanImage** — dedupes Cloudinary uploads by `(userId, contentHash)`.
- **AllergenProfile** — per-user allergy keys.
- **PlantDiagnosis / CareTask** — diagnosis output and the dated care checklist.
- **ClearanceRequest** — admin review queue entries for scans.
- **NafdacLookup** — 7-day cache of registry lookups by normalized query key.
- **AuthenticityCheck / ProductReport** — the full authenticity pipeline with raw extracted fields,
  matched records, AI review, and user reports.

---

## Getting started

Prerequisites: Node.js 20+, PostgreSQL, and accounts for Cloudinary, Clerk, Google Gemini, and
Plant.id.

1. Install dependencies and generate the Prisma client:

   ```bash
   npm install
   ```

2. Create `.env.local` with:

   ```env
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/tracee?schema=public

   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
   CLERK_SECRET_KEY=...

   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...

   PLANT_ID_API_KEY=...
   GEMINI_API_KEY=...
   GEMINI_MODEL=your-current-gemini-flash-model
   ```

   None of these except `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are safe to expose; never prefix them with
   `NEXT_PUBLIC_` and never commit them.

3. Apply the database schema:

   ```bash
   npm run db:migrate
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). In the Clerk dashboard, set
   `publicMetadata.role = "admin"` on an account to unlock `/admin/review`.

### Scripts

| Command              | Purpose                                  |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start the dev server                     |
| `npm run build`      | Generate Prisma client + production build|
| `npm run lint`       | ESLint                                   |
| `npm run db:generate`| Regenerate the Prisma client             |
| `npm run db:migrate` | Apply schema migrations                  |
| `npm run db:studio`  | Open Prisma Studio                       |
| `node --test tests/` | Run the unit tests                       |

### Tests

- `tests/authenticity.test.ts` — unit tests for registration-number parsing, fuzzy name matching, and
  authenticity scoring.
- `scripts/test-engines.ts` — assertion-based smoke tests for the GMO/fluoride/allergen engines
  (run with `node --test scripts/` or `npx tsx scripts/test-engines.ts`).

> **Note.** Thresholds in the GMO weights and fluoride ppm grading (in `lib/engines/gmo.ts` and
> `lib/engines/flouride.ts`) are documented as editable policy, not facts. Review them with a
> food-science or dental source before launch and cite it in the UI.