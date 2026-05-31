# Session handoff — 31-05-2026 (AEST)

## Status
Phases 1–7 complete and pushed to `origin/main` (HEAD `e199e7f`). The
post-Phase-5 pending-updates queue (#1–#6) is cleared, and the Phase 7
admin page is live. The full end-to-end loop runs against the real OpenAI
backend.

- Onboard → AI generates first plan → land on `/plan/[weekId]`
- Plan view: 2-band editable carb/protein targets (compact legend + modal),
  meal-cell editing with macro propagation, Regenerate dialog (now the
  coaching-criteria chooser — chips drive AI emphasis and render a
  "Coaching rules" footer; replaced the old `plan.rules` footer),
  smart Grocery button.
- Grocery view: AI-generated list from `/api/grocery` (timeout-bounded),
  no Reset/Regenerate buttons, back link points to the plan.
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
- `/api/grocery` — category-aggregated AI list (maxDuration 60, 50s timeout).
- `/api/feedback` — coach review (wins/missed/recommendations + edits).
- `/api/admin/{login,logout,rules}` — HMAC session cookie + GET/PUT config.

**Working tree:** clean on `main` apart from your in-progress SPEC.md edit.
Most recent commit `e199e7f` (Phase 7, 3/3), pushed to origin/main.

Source-of-truth docs:
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

## Pending updates

Queue CLEARED — all shipped in commit `35961b6` and pushed:
#1 grocery timeout, #2 generic dinners, #3 gold RACE pill, #4 distance
stepper, #5 RegenerateDialog (coaching criteria), #6 blank session type.

To sanity-check against the live OpenAI backend when convenient: #1 (a real
grocery generation completes), #2 (regenerated dinners name specific proteins
and vary across the week), #5 (selected criteria visibly shape the plan).

## Known issues / deferred (don't fix unless asked)

- Plan-accuracy nuance is its own phase (SPEC §7 Phase 8) — within-day carb
  distribution, periodisation nuance, post-session recovery, preload. The
  plan prompt still uses the 2-band model from `lib/defaults.ts`; reconciling
  it with the 7-day-type JSON table is Phase 8 work.

## Next phase — Phase 6 (Polish), per SPEC §7 items 20–24

We did Phase 7 (admin) before Phase 6, so Phase 6 is the active phase now.
SPEC §7 is authoritative; this list mirrors it:

- **PWA** — `next-pwa`, manifest, icons (Add to Home Screen / offline).
- **Empty / loading / error states** across the app.
- **Mobile QA** — horizontally-scrollable / swipeable plan view on narrow
  viewports; Targets band collapse on narrow viewports.
- **Onboarding empty-state copy.**
- **Hybrid grocery refactor (SPEC §4.4.1, item 24)** — local-first
  aggregation + `lib/foodMetadata.ts`, AI only for unknown foods + notes,
  graceful degradation. The biggest item; not pure polish.
- (CLAUDE extra) strip the dev-only "Seed mock plan" button from the plan
  empty state; replace with a real "plan this week" CTA.

Phase 8 (after 6) = plan accuracy — see "Known issues / deferred" above.

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
