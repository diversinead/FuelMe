# Session handoff — 28-05-2026 (AEST)

## Status
Phase 1 complete and verified. Onboarding → IndexedDB → dashboard flow works.
Design language from DESIGN.md applied across all current screens.

## Next session
Start Phase 2 (print views). Do NOT skip ahead to AI integration.
Per SPEC.md §7, Phase 2 ports the two reference HTML files into print routes:
- /plan/[weekId]/print
- /grocery/[weekId]/print
  Use the files in /reference as the source of truth. Print routes keep their
  own visual language (editorial Fraunces) — they do NOT use the dark app shell
  from DESIGN.md.

## Known issues / deferred
- In "This week's training" section - rather than "Label" display a toggle to select AM or PM

## Known cosmetic issues to address before Phase 2
- none

Do NOT spend more than 2 attempts per issue. If an issue isn't resolved
in 2 tries, rebuild the affected component from scratch using shadcn/ui
primitives rather than patching further.

# Working agreement

- Follow SPEC.md as the source of truth.
- Work in phases. Don't start the next phase until I confirm the current one works.
- Auto-accept edits and routine bash commands. Only pause for real decisions or errors.
- When a phase is done, give me a short summary + a verification checklist.
- Don't invent dependencies — check package.json before importing anything.
- TypeScript strict mode. No `any` unless I approve it.