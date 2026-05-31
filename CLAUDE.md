# Session handoff — updated end of UX-polish session (post-Phase-7)

## Status
Phases 1–7 complete. The **entire pending-updates queue is cleared**, plus a
follow-on round of UX work this session (details below). **Only Phase 8 (plan
accuracy) remains.** The full end-to-end loop runs against the real OpenAI
backend.

- Onboard → AI generates first plan → land on `/plan/[weekId]`
- Plan view: 2-band editable carb/protein targets (compact legend + modal),
  meal-cell editing with macro propagation, Regenerate dialog (coaching-criteria
  chips **+ a free-text "Things to focus on" textarea** — both shape AI
  generation; chips render the "Coaching rules" footer). Smart Grocery button.
  The "No plan" empty-state can **Start a blank plan** when training exists; a
  blank plan opens with the generate dialog (`?generate=1`) and the action reads
  "Generate" until meals exist. A **Food prefs** link (top utility row)
  deep-links to Settings → food and back.
- Grocery view: hybrid generation (SPEC §4.4.1), built locally; `/api/grocery`
  enrich-only. Print opens a **unique URL per click** (cache-bust — never a
  stale snapshot). Same fix on the plan print.
- **Check-in (`/checkin/[weekId]`) — draft/submitted state machine:** every edit
  **autosaves as a draft** (500ms debounce; "Draft · saved HH:MM" line + helper
  copy; unmount-flush so nothing is lost). **"Submit for AI feedback"** is the
  only AI call → flips status to `submitted`, shows Wins/Missed/Actions. Editing
  a submitted check-in reverts to draft, clears feedback, shows a "re-submit to
  refresh" notice. Feedback route now also receives `foodPreferences`.
- **Dashboard:** This-week hero (View plan + Grocery list only). Right column: a
  **context-aware "This week's check-in" card** (Track as you go / Keep going +
  progress / Wrap up / This week's coaching — by day-of-week & status) above an
  **always-shown "Up next — Plan next week"** card (Training → `/training/next`,
  Fuelling → chooser). "Plan completion" stat card is tappable → check-in.
  **History** is a merged week list (Training / Plan / Check-in links per week,
  no pills). Plan-next-week chooser is now **two non-AI options: Copy last week /
  Blank template** (+ a "set training first" reminder when next week has none) —
  AI generation happens only on the fuelling page.
- **Training editing has dedicated routes** (was a Settings tab): see §Training.
- Training editor: session type blank by default ("Set type"); **RACE pill is
  amber** (matches the check-in "Partial" pill — was gold); distance stepper
  steps from the visible value.
- `/admin` (Phase 7): password-gated nutrition-rules editor.

API routes:
- `/api/plan` — 6-step periodisation, 2-band targets, variance rule,
  override-aware, coaching-criteria emphasis **+ free-text `focusNotes`**. Temp 0.2.
- `/api/grocery` — enrich-only. maxDuration 60.
- `/api/feedback` — coach review; body now includes `foodPreferences`.
- `/api/admin/{login,logout,rules}` — HMAC session cookie + GET/PUT config.

**Working tree:** this session's work is committed on branch
`ux-polish-checkin-autosave` (branched off `main` at `ecd5594`), not yet pushed
or merged. typecheck + lint green. `tsconfig.tsbuildinfo` is intentionally left
uncommitted (build artifact). Push/open a PR when ready.

## Training editing (dedicated routes — replaced the Settings "Training" tab)
- `/training/[weekId]/edit` — edit one week (date read-only; sessions editable).
  Past weeks render view-only. Has a **"Save & fuelling plan →"** button.
- `/training/next` — edit next Monday's week, pre-seeded from this week's
  sessions (`cloneWeekSessions`), persisted only on save.
- Settings now has Profile + Food preferences only; old `?tab=training`
  deep-links redirect to `/training/[currentWeekId]/edit`. (SPEC §4.6 / DESIGN
  §8 still describe the old tab — superseded by these routes.)

## Data model changes this session (`lib/db.ts`)
- **Dexie v2 migration:** `dietaryNotes` + `allergies` moved Profile →
  FoodPreferences (constraints belong with food info). Onboarding step 2 +
  Settings food tab hold them now (allergies has a "safety" hint). Prompts read
  `foodPreferences.dietaryNotes/.allergies/.avoid`.
- **Dexie v3 migration:** `CheckIn.status: 'draft' | 'submitted'` added;
  existing records migrated to `submitted`.
- New helpers: `blankPlanRecord(weekId)` (empty 35-meal plan),
  `cloneWeekSessions` (re-id sub-sessions), `daysIntoWeek` (in `lib/date.ts`).

Source-of-truth docs — **on session start, read these after this file, in
order:** SPEC.md → config/nutritionRules.json (+ lib/nutritionRulesSchema.ts)
→ NUTRITION_RULES.md → DESIGN.md.
- **SPEC.md** — architectural contract + phase plan (Phase 7 = admin [done];
  Phase 8 = plan accuracy). Updated this session: Profile/FoodPreferences
  interfaces + §4.1 onboarding steps (dietary/allergies moved).
- **config/nutritionRules.json** — THE nutrition source of truth (Phase 7).
  Edit via `/admin` or directly, then `npm run regenerate:rules`.
- **NUTRITION_RULES.md** — GENERATED artifact of the JSON (do-not-edit
  banner). Never hand-edit.
- **DESIGN.md** — visual language (Targets band, Modal pattern, **amber RACE
  pill token**, Tailwind opacity-on-CSS-vars gotcha §11).

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
- `app/training/[weekId]/edit/page.tsx` + `app/training/next/page.tsx` +
  `components/training/TrainingWeekEditor.tsx` — dedicated training editing.
- `app/dashboard/page.tsx` — landing, context-aware check-in card, Up-next,
  merged history, Copy/Blank chooser.
- `app/admin/page.tsx` + `components/admin/*` — nutrition-rules editor.
- `components/plan/*` — RegenerateDialog (chips + focus textarea), CoachingRules, chip.
- `components/ui/*` — hand-built primitives (no shadcn generator).
- `tasks/*.md` — ephemeral task briefs. Delete after the user verifies.
  (Only `AdminPage.md` + `RegenerateDialog.md` remain, both shipped/verified —
  safe to delete. `context-aware-dashboard-card.md` + `TrainingPage.md` were
  deleted this session after verification.)

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

![img_2.png](img_2.png)
Once queue is clear suggest progressing to Phase 8 (Plan accuracy) below.

**Workflow when new items land:** work the list one at a time, top-down. After
each item, give a short summary + verification checklist and WAIT for
confirmation before moving on; once confirmed, delete that bullet. Max 2
attempts per issue — if not resolved in 2 tries, rebuild the affected component
from the primitives in `components/ui/*` rather than patching further.
**Don't remove/hide/gate existing UI unless asked — flag redundancy as a
question first** (see memory `dont-remove-ui-without-asking`).

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
