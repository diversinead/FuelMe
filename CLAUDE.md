# Session handoff — 30-05-2026 (AEST)

## Status
Phase 3 (AI plan generation) functionally complete. Onboarding → AI plan →
plan view with inline meal editing and a Regenerate dialog all work end-to-end
against the real `/api/plan` route. Targets editor on the plan view lets the
athlete override carb and protein bands before regenerating.

What's wired:
- **`/api/plan`** route handler accepting `mode: "fresh" | "adjust"`,
  optional `baselinePlan`, optional `carbTargetsGperKg` / `proteinTargetGperKg`
  overrides, optional `previousFeedback`.
- **`lib/openai.ts`** server-only client factory (`server-only` guard).
  Model `gpt-4o-mini`, temperature `0.2` (dropped from 0.5 to keep
  periodisation deterministic).
- **`lib/prompts.ts`** holds `PLAN_SYSTEM_PROMPT` (now ~2,400 words) +
  `FEEDBACK_SYSTEM_PROMPT`. GROCERY stub still empty.
- **Onboarding step 3 submit** posts to `/api/plan` with the current band
  defaults, saves to Dexie, redirects to `/plan/[weekId]`. Failure shows an
  inline error with retry / skip-to-dashboard actions.
- **Plan view targets band** lives in the header strip:
  - Row 1: `● CARBS  Easy [_]-[_]  Hard [_]-[_]`
  - Row 2: `● PROTEIN [_]-[_]` (+ Reset link when modified)
  - Inputs at `w-11`, font `text-[11px]`. GroupLabel locked to `w-[80px]` and
    SubTarget label slot to `w-[36px]` so protein inputs align under Easy.
  - Buttons (Print · Regenerate · Grocery) sit on their own right-aligned row
    below the targets band.
- **Regenerate dialog** (top-right Regenerate button) sends the band's
  current carb/protein targets along with the request.
- **Inline meal-cell editing**: click any meal → centered modal → food /
  note / macros / isCritical. Saving propagates macros to all other meals
  with the same `food` string; day totals recompute for every affected day.

Two source-of-truth docs feeding the prompt:
- **`NUTRITION_RULES.md`** — sports-nutrition logic. Now uses a 6-step
  periodisation procedure with worksheet-mandated up-front calculation,
  minimum-variance rule (`W × 3` between lowest and highest carb day), and
  verification checklists for both carbs and protein.
- **SPEC.md** — architectural contract (food-string formatting, mode-aware
  behaviour, output schema). Pointers to NUTRITION_RULES.md replace inline
  nutrition principles in Appendices A and C.

## Carb / protein band model
Per-day-type periodisation collapsed to **2 bands** in the UI:
- **Easy band** — REST, easy, easy_double, cross-training. Default 5-7 g/kg.
- **Hard band** — tempo, intervals, threshold, long (90+ min), race. Default
  8-10 g/kg.
- **Protein** — single daily range (default 1.6-1.8 g/kg). Stays stable across
  all days; explicitly not periodised.

Smoke tests at temperature 0.2 produce clean band-uniform totals (e.g. every
Easy day = 350 g, every Hard day = 520 g for a 58 kg athlete on defaults),
protein flat at ~100 g across the week, variance ≥ W × 3.

## Next session
Polish + Phase 4 (grocery generation, per SPEC §7 step 14).

Plan-view polish queued:
- Rules content quality — currently the AI returns somewhat generic strings
  ("Prioritise carbs around hard sessions"). Rewrite the prompt's `rules` slot
  guidance with worked examples of week-specific rules to push for sharper
  output. Display already constrained to exactly 3 rules.
- Bidirectional propagation between `foodPreferences` and meal edits is not
  yet wired — only meal-to-meal propagation via exact food-string match
  exists. Per the user's call, no plan to promote `foodPreferences` to a
  macro-carrying data model.
- Re-review the 6-step prompt: produces good band-uniform output but model
  occasionally drifts back to "moderate" / category-style tags. Possible
  refactor: tighten schema-mapping section, add an anti-pattern block.

Phase 4 — Grocery generation (SPEC.md §7 step 14):
- Build `lib/prompts.ts` `GROCERY_SYSTEM_PROMPT` from SPEC Appendix B
  (which itself should be re-pointed to NUTRITION_RULES.md after the same
  pattern as Appendix A / C).
- Build `/api/grocery` route handler.
- Wire the grocery view's currently-stubbed "Generate" action to POST.

After Phase 4 → Phase 4.5 (Copy & edit flow with the §4.7 three-path chooser)
→ Phase 5 (check-in loop + real `mode: "adjust"` AI behaviour).

**Source-of-truth rule (reaffirmed):** `lib/prompts.ts` derives from
NUTRITION_RULES.md for nutrition logic and SPEC.md for architectural contract.
Edit either source first, then sync the constants. Never edit the prompt in
isolation.

## Known issues / deferred
- The Regenerate dialog has three radio reasons (training / prefs / retry)
  but they're mostly scaffolding — every regenerate currently goes out as
  `mode: "fresh"`. Proper differentiation lands in Phase 4.5 (`mode: "adjust"`
  via the §4.7 dashboard chooser) and Phase 5 (AI-side adjust logic).
- `PlannedMeal.note` and `PlannedMeal.isCritical` are stored but not rendered
  in the cell. Notes will surface in a future tap/hover affordance.
- "Reset" link only resets the in-component target state; targets aren't
  persisted to Dexie or Profile. Each page reload starts from band defaults.
- Mock data and the "Seed mock plan" empty-state button are kept but should be
  removed once we're confident AI generation is reliable enough for the demo
  paths.

## Known cosmetic issues to address before Phase 4
- none

Do NOT spend more than 2 attempts per issue. If an issue isn't resolved in
2 tries, rebuild the affected component from scratch using the existing
primitives in `components/ui/*` rather than patching further.

# Working agreement

- Follow SPEC.md as the architectural source of truth.
- Follow NUTRITION_RULES.md as the nutrition source of truth. Prompts are
  derived; edits flow source → code, never the reverse.
- Work in phases. Don't start the next phase until I confirm the current one
  works.
- Auto-accept edits and routine bash commands. Only pause for real decisions
  or errors.
- When a phase is done, give me a short summary + a verification checklist.
- Don't invent dependencies — check `package.json` before importing anything.
- TypeScript strict mode. No `any` unless I approve it.
- Keep my updates concise — one question at a time, less commentary.
