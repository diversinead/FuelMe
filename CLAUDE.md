# Session handoff — 31-05-2026 (AEST)

## Status
Phases 1–7 **and Phase 6 (polish)** complete and pushed to `origin/main`
(HEAD `ecd5594`). The post-Phase-5 pending-updates queue (#1–#6) is cleared,
the Phase 7 admin page is live, and Phase 6 polish is done (hybrid grocery,
consistent states, mobile swipe, onboarding copy, dev-seed removed, PWA).
**Only Phase 8 (plan accuracy) remains.** The full end-to-end loop runs
against the real OpenAI backend.

- Onboard → AI generates first plan → land on `/plan/[weekId]`
- Plan view: 2-band editable carb/protein targets (compact legend + modal),
  meal-cell editing with macro propagation, Regenerate dialog (now the
  coaching-criteria chooser — chips drive AI emphasis and render a
  "Coaching rules" footer; replaced the old `plan.rules` footer),
  smart Grocery button.
- Grocery view: hybrid generation (SPEC §4.4.1) — built locally from the plan
  (`lib/grocery.ts` + `lib/foodMetadata.ts`, instant/offline), `/api/grocery`
  only enriches unknown foods + notes (graceful fallback). No Reset/Regenerate.
- Check-in (`/checkin/[weekId]`): completion grid + Apply-to-all, energy,
  sessions, notes → `/api/feedback` → Wins / Missed / Actions.
- Dashboard "Plan next week" → three-card chooser (Copy / Adjust / Fresh).
- Training editor: session type is blank by default ("Set type"); RACE
  pill is gold; the distance stepper steps from the visible value.
- `/admin` (Phase 7): password-gated nutrition-rules editor. Saves write
  `config/nutritionRules.json` and regenerate NUTRITION_RULES.md + prompts.

API routes:
- `/api/plan` — 6-step periodisation, 2-band targets, variance rule,
  override-aware, + coaching-criteria emphasis. Temperature 0.2.
- `/api/grocery` — enrich-only (categorise unknown foods + notes; the list
  itself is built client-side). maxDuration 60.
- `/api/feedback` — coach review (wins/missed/recommendations + edits).
- `/api/admin/{login,logout,rules}` — HMAC session cookie + GET/PUT config.

**Working tree:** clean on `main` apart from your in-progress SPEC.md edit.
Most recent commit `ecd5594` (Phase 6 PWA), pushed to origin/main. PWA is
installable (`app/manifest.ts`, `app/icon.svg`, `npm run gen:icons`).

Source-of-truth docs — **on session start, read these after this file, in
order:** SPEC.md → config/nutritionRules.json (+ lib/nutritionRulesSchema.ts)
→ NUTRITION_RULES.md → DESIGN.md.
- **SPEC.md** — architectural contract + phase plan (§7: Phase 6 = polish +
  hybrid grocery refactor; Phase 7 = admin [done]; Phase 8 = plan accuracy).
- **config/nutritionRules.json** — THE nutrition source of truth (Phase 7).
  Edit via `/admin` or directly, then `npm run regenerate:rules`.
- **NUTRITION_RULES.md** — GENERATED artifact of the JSON (do-not-edit
  banner). Never hand-edit.
- **DESIGN.md** — visual language (Targets band, Modal pattern, gold RACE
  pill token, Tailwind opacity-on-CSS-vars gotcha §11).

## Codebase orientation (for a fresh agent)

- Next.js 14 App Router · TypeScript strict · React 18 · Tailwind ·
  Dexie.js (IndexedDB) for client persistence · Framer Motion · OpenAI
  `gpt-4o-mini` @ temperature 0.2.
- `lib/db.ts` — all Dexie schemas + `clonePlan` helper (`SubSession.typeUnset`).
- `lib/openai.ts` — `server-only` client; `OPENAI_MODEL`, `OPENAI_TEMPERATURE`.
- `lib/prompts.ts` — `buildPlanSystemPrompt()` / `buildGrocerySystemPrompt()`
  / `buildFeedbackSystemPrompt()`. GENERATED: they read
  `config/nutritionRules.json` at request time and interpolate values.
- `config/nutritionRules.json` — nutrition source of truth (Phase 7).
- `lib/nutritionRulesSchema.ts` — config types + dependency-free validator.
- `lib/rulesRegenerator.ts` (server-only fs) + `lib/rulesMarkdown.mjs` (pure
  template) — regenerate NUTRITION_RULES.md; `npm run regenerate:rules`.
- `lib/adminAuth.ts` — HMAC-signed admin session cookie (node:crypto).
- `lib/coachingCriteria.ts` — Regenerate-dialog criteria (id/label/rule/guidance).
- `lib/grocery.ts` + `lib/foodMetadata.ts` + `lib/groceryClient.ts` — hybrid
  grocery (SPEC §4.4.1): local parse/aggregate/size via the metadata table +
  client orchestrator (build → best-effort enrich → save).
- `components/shared/states.tsx` — LoadingState / EmptyState / ErrorBanner.
- `app/manifest.ts` + `app/icon.svg` + `/public/icon-*.png` — PWA
  (`npm run gen:icons` regenerates the PNGs via a no-dep encoder).
- `lib/defaults.ts` — 2-band carb defaults, `SESSION_TYPE_BAND` map.
- `app/api/{plan,grocery,feedback}/route.ts` — OpenAI POST handlers.
- `app/api/admin/{login,logout,rules}/route.ts` — admin auth + config CRUD.
- `app/{plan,grocery,checkin}/[weekId]/page.tsx` — week-scoped views.
- `app/dashboard/page.tsx` — landing + plan-next-week chooser.
- `app/admin/page.tsx` + `components/admin/*` — nutrition-rules editor.
- `components/plan/*` — RegenerateDialog, CoachingRules, chip.
- `components/ui/*` — hand-built primitives (no shadcn generator).
- `tasks/*.md` — ephemeral task briefs. Delete after the user verifies.
  (`tasks/RegenerateDialog.md` shipped — safe to delete once you've verified.)

Tailwind gotcha worth re-reading in DESIGN.md §11: the `/opacity`
modifier silently drops on hex-string CSS-var colours. Use
`color-mix(in srgb, var(--token) N%, transparent)` inline instead.

## Run / env quickstart

- `npm run dev` — Next dev server (Windows). It picks the first free port, so
  it often lands on 3001/3002 if 3000 is busy — read the printed URL.
- `npm run typecheck` (tsc) · `npm run lint` (next lint) — both must stay green.
- `.env` (gitignored) holds `OPENAI_API_KEY` and `ADMIN_PASSWORD` (the `/admin`
  password; currently `fuel-admin-dev`). `.env.example` documents both.
- `npm run regenerate:rules` — rebuild NUTRITION_RULES.md from the JSON.
- `npm run gen:icons` — rebuild the PWA icons (no-dep encoder).
- `/admin` is a hidden URL (no nav link); local-dev only (read-only FS in prod).

## Pending updates

**Workflow:** work the list below one at a time, top-down. After each item,
give a short summary + a verification checklist and WAIT for confirmation
before moving on; once confirmed, delete that bullet. Max 2 attempts per
issue — if it isn't resolved in 2 tries, rebuild the affected component from
the primitives in `components/ui/*` rather than patching further.

<!-- Add fix-list items here as bullets. -->

Previous queue (#1–#6) CLEARED — shipped in `35961b6` and pushed. Optional
live-backend sanity-checks if not yet done: #1 (a real grocery generation
completes), #2 (regenerated dinners name specific proteins and vary across
the week), #5 (selected criteria visibly shape the plan).

## Known issues / deferred (don't fix unless asked)

- Plan-accuracy nuance is its own phase (SPEC §7 Phase 8) — within-day carb
  distribution, periodisation nuance, post-session recovery, preload. The
  plan prompt still uses the 2-band model from `lib/defaults.ts`; reconciling
  it with the 7-day-type JSON table is Phase 8 work.

## Phase 6 (Polish) — COMPLETE (SPEC §7 items 20–24)

Shipped & pushed: hybrid grocery (§4.4.1, `2c8fb70`), consistent
empty/loading/error states (`de987a3`), mobile swipe between days (`7890122`),
onboarding copy + dev-seed removal (`5133e36`), PWA manifest + icons
(`ecd5594`). The "sharpen prompt rules slot" item was dropped (obsolete — the
RegenerateDialog coaching-rules footer replaced `plan.rules`).

## Next phase — Phase 8 (Plan accuracy)

The athlete's flagged top priority; budget real time. The plan prompt still
uses the 2-band model from `lib/defaults.ts` — reconcile it with the
7-day-type table in `config/nutritionRules.json`, and address: within-day carb
distribution (one meal shouldn't carry the whole day), periodisation nuance,
elevated post-session recovery meals, and preload-the-night-before. Fixes flow
source → code: edit the JSON (via `/admin` or directly) → it drives the prompt
builders. See "Known issues / deferred" above.

# Working agreement

- Follow SPEC.md as the architectural source of truth.
- `config/nutritionRules.json` is the nutrition source of truth (Phase 7).
  `NUTRITION_RULES.md` and the prompt builders in `lib/prompts.ts` are
  GENERATED from it — edit the JSON via the `/admin` page (or directly,
  then `npm run regenerate:rules`); never hand-edit the generated MD, and
  never change prompt numbers without changing the JSON.
- Follow DESIGN.md as the visual source of truth.
- Work in phases. Don't start the next phase until I confirm the
  current one works.
- Auto-accept edits and routine bash commands. Only pause for real
  decisions or errors.
- When a phase is done, give me a short summary + a verification
  checklist.
- Don't invent dependencies — check `package.json` before importing
  anything.
- TypeScript strict mode. No `any` unless I approve it.
- Keep updates concise — one question at a time, less commentary.
