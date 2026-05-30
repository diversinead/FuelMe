# Session handoff — 30-05-2026 (AEST)

## Status
Phases 1–5 functionally complete. The full end-to-end loop works against
the real OpenAI backend:

- Onboard → AI generates first plan → land on `/plan/[weekId]`
- Plan view: 2-band editable carb/protein targets (compact legend + modal),
  meal-cell editing with macro propagation, Regenerate dialog (current
  version — see `tasks/RegenerateDialog.md` for the next iteration),
  smart Grocery button (auto-regenerates the list when it's older than
  the plan)
- Grocery view: AI-generated list from `/api/grocery`, no Reset/Regenerate
  buttons (downstream auto-rebuild), back link points to the plan
- Check-in (`/checkin/[weekId]`): meal-completion grid with Apply-to-all
  bulk buttons, energy slider, sessions completed, free notes.
  "Get AI feedback" → POST `/api/feedback` → renders Wins / Missed /
  Actions panel below. "Apply suggested edits" patches the FuellingPlan
  in Dexie.
- Dashboard "Plan next week" → three-card chooser modal: **Copy last
  week** (clonePlan helper), **Adjust last week** (`mode: "adjust"` +
  baselinePlan + previousFeedback — preserves unchanged days verbatim),
  **Generate fresh**.

All three API routes live and verified:
- `/api/plan` — 6-step periodisation, 2-band targets (Easy/Hard),
  variance rule, override-aware. Temperature 0.2.
- `/api/grocery` — category-aggregated shopping list with macro-check
  table and item notes. Uses Appendix B logic.
- `/api/feedback` — coach review producing wins/missed/recommendations
  + optional suggestedPlanEdits.

**Working tree at handoff:** Phase 5 changes (`app/api/feedback/route.ts`,
edits to `app/checkin/[weekId]/page.tsx` and `app/dashboard/page.tsx`)
are uncommitted on `main`. Most recent commit is
`e4e6368 Refresh DESIGN.md to match the built state`.

Source-of-truth docs are current as of 30-05-2026:
- **SPEC.md** — architectural contract; Appendices A–C point to
  NUTRITION_RULES.md for nutrition logic, keep the formatting / mode /
  schema rules locally
- **NUTRITION_RULES.md** — sports-nutrition logic (6-step periodisation,
  protein dosing, female-athlete + dietary overlays, hard constraints)
- **DESIGN.md** — visual language; refreshed to match the built state
  (Targets band, Modal pattern, screen-level details for plan /
  dashboard chooser / grocery / check-in, Tailwind opacity-on-CSS-vars
  gotcha)

## Codebase orientation (for a fresh agent)

- Next.js 14 App Router · TypeScript strict · React 18 · Tailwind ·
  Dexie.js (IndexedDB) for client persistence · Framer Motion · OpenAI
  `gpt-4o-mini` @ temperature 0.2.
- `lib/db.ts` — all Dexie schemas + `clonePlan` helper.
- `lib/openai.ts` — `server-only` client; `OPENAI_MODEL`, `OPENAI_TEMPERATURE`.
- `lib/prompts.ts` — `PLAN_SYSTEM_PROMPT`, `GROCERY_SYSTEM_PROMPT`,
  `FEEDBACK_SYSTEM_PROMPT`. Derived from NUTRITION_RULES.md + SPEC.md;
  edits flow source → code, never the reverse.
- `lib/defaults.ts` — 2-band carb defaults, `SESSION_TYPE_BAND` map.
- `app/api/{plan,grocery,feedback}/route.ts` — POST handlers, all hit
  OpenAI with `response_format: { type: "json_object" }`.
- `app/{plan,grocery,checkin}/[weekId]/page.tsx` — week-scoped views.
- `app/dashboard/page.tsx` — landing + plan-next-week chooser.
- `components/ui/*` — hand-built primitives (no shadcn generator).
- `tasks/*.md` — ephemeral task briefs. Delete after the user verifies.

Tailwind gotcha worth re-reading in DESIGN.md §11: the `/opacity`
modifier silently drops on hex-string CSS-var colours. Use
`color-mix(in srgb, var(--token) N%, transparent)` inline instead.

## Pending updates

Each item below is queued. Work through one at a time, top-down. After
the user confirms an item works, delete its bullet from this list.

- **Bug:** Grocery list generation fails with "Request timed out."
- **Bug:** regenerated plan produces generic dinners like "Rice,
  vegetables, protein" every day, even though the profile has specific
  protein sources (chicken, beef, etc.) in food preferences.
- **UI tweak:** change the "RACE" session pill colour to gold/amber so
  it's visually distinct from HARD sessions.
- **Bug:** the distance input field in the training entry form caps at
  10 on some entries when using the up-arrow spinner.
- **Feature:** Read `tasks/RegenerateDialog.md`. Implement as specified.
  Delete the task file when done and verified.
- **UX:** the session-type field in the training entry form defaults
  to "Easy". Make it unfilled by default — pre-filling is misleading
  because users may submit incorrect data and it implies "Easy" is the
  system's recommendation rather than the field being blank.

Rule: do NOT spend more than 2 attempts per issue. If an issue isn't
resolved in 2 tries, rebuild the affected component from scratch using
the existing primitives in `components/ui/*` rather than patching
further.

## Known issues / deferred (don't fix unless asked)

- `PlannedMeal.note` and `PlannedMeal.isCritical` are stored but not
  rendered in the cell — notes will surface in a future tap/hover
  affordance; isCritical is currently dormant.
- Targets band state is in-memory only; each page load resets to
  defaults. Could persist to Profile or FuellingPlan if athletes want
  their custom bands sticky.
- Plan view empty state still shows "Seed mock plan" for dev
  convenience. Remove before shipping.
- Adjust mode hasn't been heavily tested end-to-end. The prompt rules
  are there but verification of "preserve unchanged days verbatim"
  behaviour in production weeks is still needed.
- Manual meal edits don't bump the plan's `generatedAt`; the smart
  Grocery freshness check only triggers regenerate after a `/api/plan`
  call. Flag if users complain.

## Next phase (after the pending-updates list is empty)

Phase 6 — Polish (SPEC.md §7):
- `next-pwa`, manifest, icons (Add to Home Screen, offline shell)
- Empty / loading / error states across the app
- Mobile QA — print views are landscape A4; the on-screen plan view's
  day-by-day tabbed mobile layout needs a swipe option too
- Onboarding empty-state copy
- Strip the dev-only "Seed mock plan" empty-state button from the plan
  view once we're confident AI generation is reliable for first-time
  users
- Sharpen the prompt's `rules` slot (only relevant if RegenerateDialog
  doesn't replace it — see `tasks/RegenerateDialog.md`)
- Mobile QA for the Targets band — likely needs to collapse or move on
  narrow viewports

# Working agreement

- Follow SPEC.md as the architectural source of truth.
- Follow NUTRITION_RULES.md as the nutrition source of truth. Prompts
  in `lib/prompts.ts` are derived; edits flow source → code, never the
  reverse.
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
