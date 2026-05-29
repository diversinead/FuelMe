# Session handoff — 29-05-2026 (AEST)

## Status
Phase 2 complete and verified. SPEC.md + DESIGN.md fully synchronised with the
current visual language. The app can onboard, edit training (incl. multi-session
days and custom session types), seed/re-seed mock plans, view the editable plan
grid, view the interactive grocery list, and produce A4 print sheets for both.

Key direction changes this phase:
- Print routes pivoted from editorial Fraunces to the **minimal in-app
  language** (Manrope + JetBrains Mono, hairline borders, light-tinted session
  pills, amber/green inline macro numbers). `/reference/*.html` files are now
  historical artefacts (header comment added to each).
- Accent colour: orange → **teal** (`#14b8a6` dark, `#0d9488` light).
- New `--macro-carbs` / `--macro-protein` tokens for in-grid macro numbers.
- New `--session-pill-{hard,long,neutral}-{bg,fg}` tokens for the plan-grid
  day header.
- Food-formatting rules locked: comma separators, "× N" branded quantities,
  omit ×1, "/" for substitution choices, max 60 chars. See SPEC Appendix A
  principle #8.
- Custom session types ("Gym", "Pilates" …) supported via
  `SubSession.customType` + orange `--session-custom` tag.
- Settings now has a **Training** tab editing the current week's `TrainingWeek`.
- `DaySession.intensity` field dropped (redundant with `type`'s colour bucket).

## Next session
Phase 3 — AI plan generation. Per SPEC.md §7:
- Add OpenAI SDK + `.env.local` `OPENAI_API_KEY`
- Build `lib/openai.ts` (server-only client factory) and `lib/prompts.ts`
  (prompt constants lifted **verbatim** from SPEC.md Appendices A–C)
- Build `/api/plan` route handler — accepts `mode: "fresh" | "adjust"` and
  optional `baselinePlan` per SPEC §5.1
- Wire onboarding step 3 submit → POST `/api/plan` → save to Dexie → redirect
- Replace the dev-only "Re-seed mock" button with the real Regenerate dialog
- Build inline meal-cell editing (popover on desktop, bottom sheet on mobile)
  per SPEC §4.3

**Source-of-truth rule:** SPEC.md Appendix A is the canonical prompt text.
`lib/prompts.ts` is a verbatim lift. Changes flow spec → code, never the
reverse — if a prompt needs editing, edit the spec first, then sync the code.

## Known issues / deferred
- Inline editing of meal cells is described in SPEC §4.3 but not implemented
  yet — lands in Phase 3.
- `PlannedMeal.note` and `PlannedMeal.isCritical` are in the data model but
  not rendered in the cell. `note` will surface in the future tap/hover
  popover; `isCritical` is currently dormant.
- **Phase 4.5** (Copy & edit flow with the three-path chooser sheet on the
  dashboard) is queued — see SPEC §4.7 and §7 Phase 4.5. Builds after Phase 4
  (grocery generation).
- `mode: "adjust"` plumbing in `/api/plan` is spec'd but only smart from
  Phase 5 onwards. Phase 4.5 stubs it to route internally to fresh generation.

## Known cosmetic issues to address before Phase 3
- none

Do NOT spend more than 2 attempts per issue. If an issue isn't resolved
in 2 tries, rebuild the affected component from scratch using the existing
primitives in `components/ui/*` rather than patching further.

# Working agreement

- Follow SPEC.md as the source of truth.
- Work in phases. Don't start the next phase until I confirm the current one works.
- Auto-accept edits and routine bash commands. Only pause for real decisions or errors.
- When a phase is done, give me a short summary + a verification checklist.
- Don't invent dependencies — check package.json before importing anything.
- TypeScript strict mode. No `any` unless I approve it.
