# Fuel — Weekly Endurance Fuelling Planner

A web app that generates a personalised weekly fuelling plan and grocery list for endurance athletes, then learns from weekly check-ins.

This document is the complete brief. Build it in the order given. Do not skip ahead — each phase produces a working app.

---

## 1. Stack & key decisions

- **Framework:** Next.js 14 (App Router), TypeScript, React 18
- **Styling:** Tailwind CSS + hand-built UI primitives in `components/ui/*` (same API surface as shadcn — Button, Card, Input, Textarea, RadioGroup, Checkbox, Select, Label, NumberInput, ChipInput — but no generator dependency). See DESIGN.md for the full app-shell language.
- **Fonts:** Manrope (display) + Inter (body) + JetBrains Mono (mono) — used across both the app shell and the print routes. Loaded via `<link>` in `app/layout.tsx` (not `next/font/google` — see DESIGN.md §3 for rationale).
- **Local data:** Dexie.js (IndexedDB wrapper). All user data lives on-device for now.
- **AI:** OpenAI GPT-4o-mini via Next.js Route Handlers (`/api/*`). Key in `OPENAI_API_KEY` env var, **never exposed to client**.
- **PDF/print:** Native `window.print()` against client-rendered print-styled routes (`/plan/[weekId]/print`, `/grocery/[weekId]/print`). These pages share the in-app minimal visual language, scoped under `.sheet` to override the dark shell and print on white paper.
- **PWA:** Add `next-pwa` so users can "Add to Home Screen" and use offline.
- **Deployment target:** Vercel.

**Architecture rule:** all OpenAI calls go through `/api/*` Route Handlers. The client never sees the API key. This makes the future "user supplies own key" migration trivial — you'll just read the key from headers or user record instead of `process.env`.

---

## 2. Design language

The in-app shell uses the dark visual language defined in **DESIGN.md** — Whoop/Linear-adjacent, dark by default, teal accent.

Both **print routes** (`/plan/[weekId]/print`, `/grocery/[weekId]/print`) share the same minimal language as the in-app views, rendered on white paper: Manrope + JetBrains Mono fonts, hairline borders, light-tinted session pills, amber/green inline macro numbers. The CSS lives in `styles/print-plan.ts` and `styles/print-grocery.ts`, scoped under `.sheet` so its overrides (white background, light-mode tokens, A4 `@page` rules) don't leak into the dark app shell.

**Historical:** the `/reference/fueling-plan-print.html` and `/reference/weekly-grocery-list.html` files were the original editorial-Fraunces direction (cream paper, dense serif tables). They are retained for reference only — the live print routes no longer mirror them and have moved to the minimal in-app language.

**Print-route CSS variables** (light-mode only; print is always white paper, declared inside `.sheet`):

```css
--ink: #18181b;
--ink-secondary: #52525b;
--ink-tertiary: #71717a;
--paper: #ffffff;
--border: #d4d4d8;

/* Macros — amber for carbs, forest for protein. Print well in colour and B&W. */
--macro-carbs: #BA7517;
--macro-protein: #0F6E56;

/* Session pills — light tints, dark text */
--session-pill-neutral-bg: #f4f4f5;
--session-pill-neutral-fg: #52525b;
--session-pill-hard-bg:    #FCEBEB;
--session-pill-hard-fg:    #791F1F;
--session-pill-long-bg:    #E6F1FB;
--session-pill-long-fg:    #0C447C;
```

**Print-route type:**
- Headings & body: Manrope (500, 600), Inter (400, 500) — same as app shell
- Labels, tags, numbers (macros, quantities, slot labels): JetBrains Mono (400, 500, 600)

**Print-route component patterns (mirror the in-app):**
- Header strip: tiny `Week of [date]` mono-uppercase label + 20px title + macro legend with 8px coloured dots
- Plan grid: 88px label column + 7 day columns, 0.5px hairline borders, no vertical column dividers in the rules footer; meal cells render food top, macros bottom-right (amber + green numbers, no units)
- Grocery list: 2-column layout (CSS columns), mono uppercase category headers with a 0.5px underline, checkbox squares (filled black when `checked`), item name + amber qty + italic tertiary note
- Session pills: light-tinted bg + dark text, `JetBrains Mono` 8.5px uppercase
- Macro check / notes: simple tables and labelled bullet rows, no card backgrounds

For the in-app shell — dark surfaces, teal accent, layered grey tokens — see **DESIGN.md**.

---

## 3. Data model (Dexie / IndexedDB)

Create `lib/db.ts` with these tables:

```ts
// Profile — one record, the user themself
interface Profile {
  id: 'me';                 // singleton
  name?: string;
  gender: 'female' | 'male' | 'other' | 'prefer_not';
  age: number;
  weightKg: number;
  heightCm?: number;
  goal: 'performance' | 'maintenance' | 'lean_out' | 'gain';
  dietaryNotes?: string;    // free text: "vegetarian", "no dairy", etc.
  allergies?: string;
  cycleTracking?: boolean;  // surface luteal-phase fuelling notes
}

// FoodPreferences — the "easily accessible foods" list
interface FoodPreferences {
  id: 'me';
  breakfastOptions: string[];   // ["rolled oats", "toast", "Greek yoghurt"...]
  proteinSources: string[];
  carbSources: string[];
  fruits: string[];
  vegetables: string[];
  snacks: string[];
  drinks: string[];             // ["Up&Go", "Rokeby Farms", "milk"]
  avoid: string[];              // foods to exclude
  budget: 'tight' | 'moderate' | 'generous';
  cookingTime: 'minimal' | 'some' | 'enjoy';
}

// TrainingWeek — the inputs for a week's plan
interface TrainingWeek {
  id: string;                   // weekStartISO, e.g. "2026-06-01"
  weekStart: string;            // Monday ISO date
  sessions: DaySession[];       // 7 entries Mon→Sun
  weekNotes?: string;           // free-text week-level context (focus, fatigue, taper,
                                // travel, race week). The only prose the athlete supplies
                                // about the week — feeds the /api/plan prompt.
}

type SessionType =
  | 'rest' | 'easy' | 'easy_double'
  | 'intervals' | 'threshold' | 'tempo'
  | 'long' | 'race' | 'cross';

// A single sub-session within a day (AM run, PM gym, etc.). This is the
// SOURCE OF TRUTH — DaySession's type/description/totals are derived from
// the sub-sessions via reconcileDaySession() in lib/defaults.ts.
interface SubSession {
  id: string;
  label?: string;               // "AM" | "PM" | undefined
  type: SessionType;            // intensity bucket — drives colour + fuelling
  customType?: string;          // free-text override ("Gym chest day", "Pilates").
                                // When set, displayed in place of SESSION_LABELS[type].
                                // Underlying type defaults to "cross" so fuelling
                                // intensity still classifies correctly.
  distanceKm?: number;
  durationMin?: number;
}

interface DaySession {
  day: 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun';
  sessions?: SubSession[];      // SOURCE OF TRUTH — empty/undefined = rest day
  // --- everything below is DERIVED via reconcileDaySession(); never edit directly ---
  type: SessionType;            // highest-priority type across sub-sessions
  description: string;          // concatenation of describeSub() per sub-session
  distanceKm?: number;          // total
  durationMin?: number;         // total
}

// FuellingPlan — generated output for a given week
interface FuellingPlan {
  id: string;                   // == weekId
  weekId: string;
  generatedAt: string;
  rules: string[];              // 3-4 short rules shown in header (see ref HTML)
  targets: { carbsRangeG: string; proteinRangeG: string };
  meals: PlannedMeal[];         // 5 meals × 7 days = 35 entries
  dayTotals: DayTotal[];        // 7 entries
  manuallyEdited?: boolean;
}

interface PlannedMeal {
  day: DaySession['day'];
  slot: 'breakfast'|'post_am'|'lunch'|'afternoon'|'dinner';
  food: string;                 // "Oats + banana + yoghurt + honey"
  note?: string;                // "Pre-interval fuel"
  carbsG: number;
  proteinG: number;
  isCritical?: boolean;         // highlights cell in red, like the ref HTML
}

interface DayTotal {
  day: DaySession['day'];
  carbsG: number;
  proteinG: number;
  tag: 'easy'|'easy+'|'hard'|'long'|'rest';
}

// GroceryList — generated from a FuellingPlan
interface GroceryList {
  id: string;                   // == weekId
  weekId: string;
  generatedAt: string;
  includeDinner: boolean;
  categories: GroceryCategory[];
  macroCheck: DayTotal[];       // optional summary table
  notes: { label: string; text: string }[];   // the "Note 01" rules box
}

interface GroceryCategory {
  name: string;                 // "Carbs & Grains", "Dairy", etc.
  items: GroceryItem[];
}

interface GroceryItem {
  id: string;
  name: string;                 // "Rolled oats"
  qty: string;                  // "500 g", "×10"
  note?: string;                // "Breakfast Mon, Wed, Fri..."
  checked: boolean;
}

// CheckIn — end-of-week review
interface CheckIn {
  id: string;                   // == weekId
  weekId: string;
  submittedAt: string;
  mealCompletions: { day: string; slot: string; status: 'done'|'partial'|'missed'|'swapped'; note?: string }[];
  energyRating: 1|2|3|4|5;
  sessionsCompleted: number;
  freeNotes?: string;
  aiFeedback?: AIFeedback;      // populated after analysis
}

interface AIFeedback {
  wins: string[];               // 2-4 bullets
  missed: string[];
  recommendations: string[];
  suggestedPlanEdits?: PlannedMeal[];  // optional patch the user can apply
  generatedAt: string;
}
```

Use `Dexie` with version 1 schema. Add a `lib/db.ts` exporting a singleton.

---

## 4. Page-by-page UI

Routes (App Router):

```
/                       Onboarding gate → redirects to /dashboard if profile exists
/onboarding             3-step wizard: profile → food prefs → first week's training
/dashboard              Current week overview + CTAs
/plan/[weekId]          View/edit the fuelling plan
/plan/[weekId]/print    Print-styled, minimal language on white paper (§4.3)
/grocery/[weekId]       Interactive grocery list with checkboxes
/grocery/[weekId]/print Print-styled, minimal language on white paper (§4.4)
/checkin/[weekId]       Week-end check-in form + AI feedback
/settings               Edit profile, food prefs
```

### 4.1 Onboarding (`/onboarding`)

Three-step wizard. Full-screen layout per **DESIGN.md §8** (centered 560px column, 3-step horizontal progress bar — not a card with dots).

**Step 1 — Profile**
- Name (optional)
- Gender (radio: female/male/other/prefer not)
- Age (number)
- Weight in kg (number, allow 0.5 increments)
- Height in cm (optional)
- Primary goal (radio: performance / maintenance / lean out / gain muscle)
- Cycle-aware fuelling? (checkbox, only shown if gender=female)
- Dietary notes (textarea: "vegetarian, no dairy, IBS-friendly...")
- Allergies (textarea)

**Step 2 — Food preferences**
- Multi-input chip fields (shadcn `Input` + tag pattern) for each:
  - Breakfast staples
  - Protein sources
  - Carb sources
  - Fruits I usually have
  - Vegetables I'll actually eat
  - Snacks
  - Drinks (incl. recovery drinks like Up&Go, Rokeby)
  - Foods to avoid
- Budget (radio: tight / moderate / generous)
- Cooking time (radio: minimal / some / I enjoy cooking)
- Provide sensible default suggestions next to each field

**Step 3 — This week's training**
- Quick presets at top: "5-day runner", "Marathon block", "Rest week"
- Vertical list of 7 day cards (Mon→Sun). Each card shows the day name + one coloured **tile per sub-session** (so a Mon with AM Easy + PM Gym renders as two stacked tiles in that card) + a small "Add session" button. Empty card = rest day.
- Tapping a tile (or Add) opens an inline sub-session editor with:
  - **AM/PM** — compact toggle for the `label` field. Tap a selected pill to clear it (single-session days can leave both off).
  - **Type** — free-text input backed by a `<datalist>` of presets (Easy, Intervals, Threshold, Tempo, Long, Race, Cross-train). Typing a preset label sets `SubSession.type` for colour/intensity bucketing. Typing anything else (e.g. "Gym", "Pilates", "Bouldering") stores the string as `customType` and falls back to `type: 'cross'` for fuelling intensity.
  - **Distance** (km) and **Time** (min) — number inputs with stacked chevron-up/down steppers on the right edge; field remains directly editable.
- A single **week-level notes** textarea below the day cards (`TrainingWeek.weekNotes`). This is the only prose the athlete supplies about the week — focus, fatigue, taper, travel, race-week context. The `/api/plan` prompt reads this in place of per-session descriptions.
- Submit → generate plan → redirect to `/plan/[weekId]`

### 4.2 Dashboard (`/dashboard`)

Layout per **DESIGN.md §8** — 2/3 + 1/3 asymmetric grid on desktop, stacked on mobile.

- **Hero "This week" card** (2/3 width): week-of date, session count, action buttons (View plan, Grocery list), inline "Edit training" link (deep-links to `/settings?tab=training`), and a grid of 7 day columns (Mon–Sun). Each day column shows **one tile per sub-session** — a Mon with AM Easy + PM Gym renders as two stacked tiles in that column. Each tile carries the AM/PM label (when set) and the session's coloured tag (or the free-text `customType` for non-preset sessions). Tapping a tile jumps to that day's meals in the plan view.
- **Quick stats row** (3 cards under the hero): Sessions this week / Plan completion % / Energy avg — populated from the current week's check-in when present, "—" otherwise.
- **Right column** (1/3 width):
  - **Last week's wins** card — top 1–2 bullets from the previous week's AI feedback (with empty-state fallback copy when there's no prior check-in)
  - **Up next** CTA card — flips between "Do this week's check-in" and "Plan next week" based on whether the current week has been checked in
- **History feed** at the bottom: list of past weeks with status badges (plan done / shopping done / checked in)

### 4.3 Plan view (`/plan/[weekId]`)

Minimal, scannable. The visual hierarchy is: food at the top of each cell, macros at the bottom, with everything else stripped back to thin labels and hairline borders.

**Layout (desktop, ≥768px):**

- **Top utility row:** "← Dashboard" back link left, action buttons right (Print · Regenerate · Grocery).
- **Header strip:** tiny `Week of [Mon 2 Jun]` mono-uppercase label, then `Fuelling plan` title in 20px weight-500 ink. On the right side of the same row, two 8px coloured dots followed by `Carbs 190–325 g` and `Protein 1.6–1.8 g/kg`. Carb dot = `--macro-carbs`, protein dot = `--macro-protein`. A 0.5px `--border-default` bottom border separates the header from the grid.
- **The grid** (CSS Grid, `gridTemplateColumns: 88px repeat(7, minmax(0, 1fr))`):
  - **Header row:** each day cell shows the day abbreviation (`MON`, `TUE`, …) in mono uppercase tertiary grey, then a small **session pill** below it. Pill variants:
    - Easy / Easy+ / Rest → neutral (`--session-pill-neutral-bg/-fg`)
    - Hard / Intervals / Threshold → hard variant (light red bg, dark red text)
    - Long → long variant (light blue bg, dark blue text)
  - **Meal rows:** leftmost column shows the slot name (`Breakfast`, `Post-AM`, `Lunch`, `Afternoon`, `Dinner`) in mono uppercase tertiary grey — no "Pre-AM / Within 30 min" subtitle. Each meal cell is `flex flex-col justify-between` with `min-height: 88px`. Food string sits at the top in 13px ink, line-height 1.45. Macros pinned to the bottom right, `font-mono` 11px, just two coloured numbers (`--macro-carbs` then `--macro-protein`) — no `C` / `P` letters, no `g` units, no chip backgrounds.
  - **Totals row:** `Total` label in the leftmost column. Each day cell shows two coloured numbers (carbs then protein) in 13px font-medium mono, right-aligned. No `EASY/HARD/LONG` tag suffix (already in the header pill).
  - **Borders:** horizontal hairlines (`0.5px --border-default`) between every row and below the header. Vertical hairlines on each day column's left edge (label column has no left border). Totals row has no bottom border.
- **Rules footer:** below the grid with ~28px gap and a 0.5px top border. 3-column equal grid showing the three rules. Each rule: tiny mono uppercase tertiary `RULE 01` / `RULE 02` / `RULE 03` label, then the rule text in 12px secondary, line-height 1.5. No box, no background, no card around them.

**Layout (mobile, <768px):**

- Same top utility + header strip.
- Day-by-day swipeable / tabbed view. One day at a time. 7 day-buttons across the top (`MON … SUN`), tapping selects. Below that, 5 stacked `MealCard`s for the selected day, then a `DayTotalRow`.
- Each `MealCard`: slot label tiny mono tertiary, food line at 15px, coloured macro numbers right-aligned. Same hierarchy as desktop, just stacked.

**Removed from visual rendering (data still in model):**

- `PlannedMeal.note` — no longer surfaced in the cell. Reserved for a future tap/hover popover.
- `PlannedMeal.isCritical` — left-accent border removed. Field preserved on the model.
- The old "Carbs target / Protein target" headline block and the boxed Rule 01/02/03 cards above the grid are gone — both functions absorbed by the header legend and rules footer.

**Inline editing (Phase 3+):** clicking any meal cell opens a popover (`shadcn Popover` pattern) with form fields for food / note / macros / isCritical. On mobile this becomes a bottom sheet. Saves directly to `FuellingPlan.meals` in Dexie, flips `manuallyEdited: true`.

**Print route `/plan/[weekId]/print`:** ports the same minimal layout to A4 landscape via `@page` rules. White paper background, `.sheet`-scoped tokens override the dark shell. Triggers `window.print()` on mount if `?auto=1`.

### 4.4 Grocery list (`/grocery/[weekId]`)

Same minimal language as the plan view — single-column scannable list, no card chrome around items.

**Layout:**

- **Top utility row:** "← Dashboard" back link left, actions right (Reset · Print · Regenerate (Phase 4) · Toggle "include dinner items" — Phase 4).
- **Header strip:** `Groceries` title, `Week of [date]` mono tertiary, and a `X of Y` progress count. Below it a thin progress bar (`--accent` fill on `--surface-2` track).
- **Category sections:** vertical list, single column on mobile, can become two columns on wide desktop. Each section header is mono uppercase tracking-widest, sticky on scroll (`--surface-2/95` backdrop blur in the in-app view).
- **Items:** each row is checkbox left, item name in body text, quantity right-aligned in `font-mono` `--accent` (teal in app), optional note below in italic tertiary. Tapping the checkbox toggles `checked` in Dexie immediately. Checked rows fade to 40% opacity, name gets strikethrough.
- **Macro check section** at the bottom: simple table — Day · Carbs · Protein. Carbs in `--macro-carbs`, protein in `--macro-protein`.
- **Notes section** at the bottom: `Note 01` / `Note 02` mono labels + secondary text bullets.

**Print route `/grocery/[weekId]/print`:** ports the same layout to A4 portrait via `@page` rules. White paper, two-column CSS columns for categories so the page packs efficiently, macro check section forced onto a new page via `page-break-before: always`. Filled black checkbox squares with a tick when `it.checked === true`. Triggers `window.print()` on mount if `?auto=1`.

### 4.5 Check-in (`/checkin/[weekId]`)

- Compact recap of the plan
- For each meal slot × day: 4-way toggle (done / partial / missed / swapped) + optional one-line note
- Energy rating slider (1–5)
- Sessions completed (number / total scheduled)
- Free notes textarea
- Submit → POST to `/api/feedback` → show feedback panel below

**Feedback panel:**
- Three columns: Wins · Missed · Recommendations
- Below: "Apply suggested edits to plan" button (if AI returned `suggestedPlanEdits`)
- "Regenerate next week incorporating this feedback" button → goes to next week's training input pre-populated with carry-over advice

### 4.6 Settings

Plain forms with three tabs:
- **Profile** — reuses `ProfileStep` from onboarding
- **Food preferences** — reuses `FoodPrefsStep`
- **Training** — reuses `TrainingStep`, scoped to the **current week's** `TrainingWeek`. Loads existing or initializes an empty week. Save commits to `db.trainingWeeks`.

Honors a `?tab=profile|food|training` query param so the dashboard's "Edit training" link deep-links straight to the right tab.

### 4.7 Planning the next week

When the dashboard's "Up next" CTA is "Plan next week" (i.e. the current week has been checked in), tapping it opens a sheet/modal offering three paths. Each lands the athlete on the next-week plan view ready to confirm or edit.

**Three paths:**

1. **Copy last week** — Duplicates the most recent `FuellingPlan` *and* `TrainingWeek` with new IDs and dates via `clonePlan(srcWeekId, destWeekId)` in `lib/db.ts`. No AI call. The athlete lands on the editable plan view with the cloned data and can edit any meal inline before confirming. Best when last week worked and the training is similar.

2. **Adjust last week** — Clones last week as a base, then POSTs to `/api/plan` with `mode: "adjust"`, the cloned `baselinePlan`, the new `trainingWeek`, and any prior `aiFeedback.recommendations`. The AI only modifies meals on days whose training has changed or meals flagged by feedback; meals on unchanged days are returned verbatim from the baseline. Best when last week mostly worked but a few sessions or recommendations need accommodating.

3. **Generate fresh** — Full AI generation from scratch (`mode: "fresh"`), factoring in profile, food preferences, training, and previous feedback if any. Best when training has changed substantially or last week's plan missed.

**Modal UX:**

- Three options stacked vertically as cards, each with title + one-line explanation. Disabled cards (e.g. "Adjust last week" before Phase 5) show a tooltip explaining why.
- Default selection: **"Copy last week"** if a prior `FuellingPlan` exists in Dexie; otherwise **"Generate fresh"** (post-onboarding always falls here).
- Confirm button at the bottom; cancel returns to the dashboard.

**`clonePlan(srcWeekId, destWeekId)` in `lib/db.ts`:**

- Reads the source `FuellingPlan` and `TrainingWeek` from their tables.
- Writes new records with `id = destWeekId`, `weekId = destWeekId`, `weekStart = destWeekId`, `generatedAt = now`.
- Sets `FuellingPlan.manuallyEdited = true` so downstream regenerate suggestions know this is athlete-curated, not AI-fresh.
- No-op if no source records exist; caller falls back to "Generate fresh".

**Failure modes:**

- "Copy last week" with no prior plan → button disabled with explanatory tooltip; default selection flips to "Generate fresh".
- "Adjust last week" before Phase 5 → disabled with "Coming in Phase 5" tooltip (plumbing exists in `/api/plan` but routes internally to fresh generation until check-in integration lands).

---

## 5. API routes

Three Route Handlers under `app/api/`. All use the OpenAI Node SDK and return JSON.

### 5.1 `POST /api/plan`

**Body:** `{ mode, profile, foodPreferences, trainingWeek, previousFeedback?, baselinePlan? }` — where:
- `mode: "fresh" | "adjust"` (required) — selects generation behaviour. See §4.7.
- `baselinePlan: FuellingPlan` (required when `mode === "adjust"`) — last week's plan, used as the verbatim baseline the AI selectively modifies.
- `previousFeedback?: string` — optional carry-forward of `aiFeedback.recommendations` from the previous check-in.

**Server prompt:** see Appendix A. Returns a structured `FuellingPlan` (without id/weekId — client adds those).

Model: `gpt-4o-mini`, `response_format: { type: 'json_object' }`, temperature 0.5.

### 5.2 `POST /api/grocery`

**Body:** `{ fuellingPlan, foodPreferences, includeDinner }`

**Server prompt:** see Appendix B. Returns a structured `GroceryList`.

### 5.3 `POST /api/feedback`

**Body:** `{ fuellingPlan, checkIn, profile }`

**Server prompt:** see Appendix C. Returns `AIFeedback`.

### Future migration (option 3, BYO key)

When you're ready to support user-supplied keys, change each route to:
1. Read `Authorization: Bearer <key>` header
2. Fall back to `process.env.OPENAI_API_KEY` (your key) if user is on free tier
3. Track a `freeGenerationsUsed` counter in the Profile

That's the entire change. The client UI gets a "Settings → Use my own OpenAI key" toggle.

---

## 6. File structure

```
/app
  /api
    /plan/route.ts             # Phase 3
    /grocery/route.ts          # Phase 4
    /feedback/route.ts         # Phase 5
  /onboarding/page.tsx
  /dashboard/page.tsx
  /plan/[weekId]/page.tsx
  /plan/[weekId]/print/page.tsx
  /grocery/[weekId]/page.tsx
  /grocery/[weekId]/print/page.tsx
  /checkin/[weekId]/page.tsx   # Phase 5
  /settings/page.tsx
  page.tsx                     # onboarding gate
  layout.tsx                   # root layout + AppBar + font <link>s
  globals.css                  # app-shell tokens (DESIGN.md) + Tailwind directives
  fonts.ts                     # comment-only file documenting the <link> decision
                               # (next/font/google hangs dev when fonts.gstatic.com is slow)

/components
  /ui/                         # hand-built primitives, shadcn-compatible API
    button.tsx, card.tsx, input.tsx, textarea.tsx,
    radio-group.tsx, checkbox.tsx, select.tsx, label.tsx, number-input.tsx
  /onboarding/
    ProfileStep.tsx
    FoodPrefsStep.tsx
    TrainingStep.tsx           # includes AmPmToggle + free-text TypeInput w/ datalist
    ChipInput.tsx
  /shared/
    AppBar.tsx                 # sticky top bar; hides itself on /*/print routes
    ThemeScript.tsx            # SSR-safe early theme application (no FOUC)
    ThemeToggle.tsx            # sun/moon, persists to localStorage
    SectionHeader.tsx
    SessionTag.tsx
    MacroPill.tsx
  /plan/, /grocery/, /checkin/   # Phase 3+ — extract from page files when complexity demands

/lib
  db.ts                        # Dexie instance + table types
  date.ts                      # weekId helpers (Monday-aligned ISO)
  defaults.ts                  # FOOD_SUGGESTIONS, SESSION_LABELS, TRAINING_PRESETS,
                               # newSubSession, reconcileDaySession, describeSub
  motion.ts                    # framer-motion easings + stagger variants
  utils.ts                     # cn() — clsx + tailwind-merge
  mock.ts                      # seed FuellingPlan / GroceryList for Phase 1 click-through
  openai.ts                    # Phase 3 — server-only OpenAI client factory
  prompts.ts                   # Phase 3 — the three prompts as exported strings

/styles
  print-plan.ts                # CSS string injected via <style> in /plan/[weekId]/print
  print-grocery.ts             # CSS string injected via <style> in /grocery/[weekId]/print
                               # (.ts not .css — lets the AppBar conditional + clean
                               # unmount on client-side nav work seamlessly. Both files
                               # use the minimal in-app language, not the editorial direction
                               # in /reference/.)

/reference
  fueling-plan-print.html      # HISTORICAL — original editorial Fraunces direction.
  weekly-grocery-list.html     # The live print routes have moved to the minimal in-app
                               # language. These files are retained only as design history.
```

---

## 7. Build order

Do **not** try to build everything at once. Phases:

### Phase 1 — Skeleton (no AI yet)
1. `create-next-app` with TS + Tailwind + App Router
2. Hand-build the `components/ui/*` primitives; load Manrope / Inter / JetBrains Mono via `<link>` in `app/layout.tsx`
3. Set up Dexie with the schema in §3
4. Build onboarding (§4.1) — saves to Dexie, redirects to dashboard
5. Build dashboard (§4.2) reading from Dexie
6. Stub the plan/grocery/checkin pages with mock data (`lib/mock.ts`)

✅ **Milestone:** you can onboard, see a fake plan, click through everything.

### Phase 2 — Print views
7. Build `/plan/[weekId]/print/page.tsx` — client component reading from Dexie, CSS injected from `styles/print-plan.ts`, A4 landscape `@page`
8. Build `/grocery/[weekId]/print/page.tsx` — same pattern, A4 portrait
9. Hook up "Print" buttons → open the print route in a new tab with `?auto=1` to auto-fire `window.print()`

Both print sheets share the in-app minimal visual language (Manrope + JetBrains Mono, hairline borders, light-tinted session pills, amber/green inline macro numbers). The `/reference/*.html` editorial direction is now historical.

✅ **Milestone:** printable plan + grocery sheets on white paper, matching the in-app language.

### Phase 3 — AI plan generation
10. Add OpenAI SDK, `.env.local` with `OPENAI_API_KEY`
11. Build `/api/plan` route with prompt from Appendix A
12. Wire onboarding step 3 submit → call `/api/plan` → save to Dexie → redirect
13. Build the editable plan view (§4.3) with inline editing

✅ **Milestone:** real AI-generated plans, editable.

### Phase 4 — Grocery generation
14. Build `/api/grocery` with prompt from Appendix B
15. Build interactive grocery list view (§4.4) with checkbox persistence

✅ **Milestone:** complete week-in-week-out flow without check-ins.

### Phase 4.5 — Copy and edit flow

Sits between grocery generation (Phase 4) and the check-in loop (Phase 5). Lets the athlete plan a follow-on week before the AI feedback loop exists.

14.5a. Add `clonePlan(srcWeekId, destWeekId)` helper to `lib/db.ts` — duplicates `FuellingPlan` + `TrainingWeek` with new IDs/dates. No network call.
14.5b. Build the three-option chooser sheet on the dashboard (§4.7).
14.5c. Wire "Generate fresh" → existing `/api/plan` POST with `mode: "fresh"`.
14.5d. Wire "Copy last week" → `clonePlan()` + redirect to `/plan/[nextWeekId]`.
14.5e. Stub `mode: "adjust"` plumbing in `/api/plan/route.ts` — accept the flag + `baselinePlan` body field, but route internally to the same fresh-generation logic for now (the adjust-mode AI behaviour ships in Phase 5 alongside check-in integration).
14.5f. Disable the "Adjust last week" card with a "Coming in Phase 5" tooltip.

✅ **Milestone:** athlete can plan a follow-on week with one tap (copy + edit) or full AI (generate fresh). Adjust-mode is plumbed but not yet smart.

### Phase 5 — Check-in loop
16. Build check-in form (§4.5)
17. Build `/api/feedback` with prompt from Appendix C
18. Build "Apply suggested edits" → patches PlannedMeals in Dexie
19. Light up the "Adjust last week" path from §4.7 — implement the real `mode: "adjust"` AI behaviour in `/api/plan` (preserve unchanged meals verbatim, modify only meals affected by training diff or `previousFeedback`)
20. Pass `aiFeedback.recommendations` from the latest check-in into the chooser's "Adjust" / "Generate fresh" calls as `previousFeedback`

✅ **Milestone:** full feedback loop. Ship.

### Phase 6 — Polish
20. Add `next-pwa`, manifest, icons
21. Empty states, loading states, error toasts
22. Mobile QA — the print views are landscape A4, but the on-screen plan view needs a horizontally-scrollable variant on narrow viewports
23. Light onboarding empty-state copy

### Phase 7 (later) — Cloud sync + BYO key
- Add Supabase (auth + Postgres tables mirroring Dexie schema)
- Sync layer: Dexie remains local cache, Supabase is source of truth
- Settings → BYO OpenAI key

---

## 8. Mobile / responsive notes

- Onboarding, dashboard, check-in, settings: standard responsive single-column on mobile, multi-column on desktop.
- **Plan view on mobile:** the 7-day × 5-meal grid won't fit. Options:
  - (Default) Switch to a **day-by-day swipeable view** on viewports < 768px — one day per screen, swipe left/right between days. Each day shows 5 meal cards stacked vertically.
  - "View full week" button → opens the print route in landscape orientation.
- **Grocery list on mobile:** single column, fully interactive checkboxes, sticky category headers.

---

# Appendices — OpenAI prompts

These three prompts are the heart of the app. Iterate on them after you ship Phase 5 — the structure is more important than the exact wording.

All three prompts share these conventions:
- System message sets the role and rules
- User message contains the structured input as JSON
- `response_format: { type: 'json_object' }` is set
- The system message ends with the exact JSON schema the model must return

## Appendix A — `/api/plan` prompt

The runtime system prompt lives in `lib/prompts.ts` as `PLAN_SYSTEM_PROMPT`. Two sources of truth feed it:

- **Nutrition logic derives from `NUTRITION_RULES.md`** — see that file for carb periodisation, protein dosing, timing rules, sport-specific overlays, female-athlete logic, dietary pattern overlays, and hard constraints. When the rules document changes, ask Claude Code to re-read it and resync `lib/prompts.ts`. SPEC.md should not need editing for nutrition changes.

- **The architectural contract** lives here in SPEC.md (below): food-string formatting, mode-aware behaviour, output schema, JSON examples. These shape downstream rendering, API contracts, and the data model — they belong with the spec, not the nutrition rules.

**Food string formatting** (applied to every `meals[i].food` in the output):

- Use commas as the only separator between ingredients. Correct: `"Oats, banana, yoghurt, honey"`. Never use `+`, `w/`, `&` (as a connector), `and`, or mixed connectors.
- For quantities of branded items, use `× N` with the multiplication sign and a leading space, never parentheses or `x` or `*`. Correct: `"Rokeby × 2"`, `"Up&Go × 2"`, `"Toast × 2"`. Wrong: `"1× Rokeby"`, `"Rokeby (2)"`, `"2 Rokeby"`, `"x2 toast"`.
- When the quantity is one, omit the multiplier entirely. Correct: `"Rokeby"`. Wrong: `"1× Rokeby"`, `"Rokeby × 1"`.
- Use `/` to indicate substitution choices, with no spaces around it. Correct: `"Rokeby/Up&Go"`, `"rice/pasta"`, `"eggs/chicken"`. Wrong: `"Rokeby or Up&Go"`, `"Rokeby and Up&Go"`, `"rice or pasta"`, `"Rokeby / Up&Go"`.
- Sentence case. First word capitalised, rest lowercase unless proper noun.
- Maximum 60 characters per food string. If a meal needs more detail, shorten the ingredient list rather than abbreviating words.
- `&` inside a brand name (`"Up&Go"`) is fine — the ban is only on `&` as an ingredient connector.

**Mode-aware behaviour.** The user message includes a `mode` field of `"fresh"` or `"adjust"`.

- `"fresh"` (default): generate the full week from scratch using profile, food preferences, training week, and any previous feedback. This is the standard behaviour for onboarding and "Generate fresh" from the §4.7 chooser.
- `"adjust"`: a `baselinePlan` field is also provided — last week's plan verbatim. Treat the baseline as the starting point. Identify which days' training has changed between the baseline's implied training and the new `trainingWeek`, plus which meals are flagged by `previousFeedback`. Modify ONLY those meals. Meals on unchanged days with no feedback flag MUST be returned verbatim from the baseline — same `food` string, same `carbsG`, same `proteinG`, same `note`, same `isCritical`. This preserves the athlete's accumulated tuning while accommodating the specific changes that warrant a fuel shift.

**Output schema.** The model outputs ONLY valid JSON matching this exact schema — no prose, no markdown, no code fences:

```
{
  "rules": [3-4 short string rules to print at top, max 80 chars each],
  "targets": { "carbsRangeG": "190-325", "proteinRangeG": "1.6-1.8 g/kg" },
  "meals": [
    {
      "day": "Mon" | "Tue" | ... | "Sun",
      "slot": "breakfast" | "post_am" | "lunch" | "afternoon" | "dinner",
      "food": "concise food description, max 60 chars",
      "note": "optional context, max 50 chars",
      "carbsG": number,
      "proteinG": number,
      "isCritical": boolean
    }
    // exactly 35 entries: 5 slots × 7 days, ordered by day then slot
  ],
  "dayTotals": [
    { "day": "Mon", "carbsG": number, "proteinG": number, "tag": "easy" | "easy+" | "hard" | "long" | "rest" }
    // 7 entries
  ]
}
```

`isCritical` = true for meals immediately before or after a hard/long session, or pre-load dinners. These get visually flagged in the UI.

**User message (JSON):**

```json
{
  "mode": "fresh",
  "profile": { ...Profile },
  "foodPreferences": { ...FoodPreferences },
  "trainingWeek": {
    "id": "2026-06-01",
    "weekStart": "2026-06-01",
    "weekNotes": "Race week — tapering. Travel Thu PM, race Sat AM.",
    "sessions": [
      {
        "day": "Mon",
        "sessions": [
          { "label": "AM", "type": "easy", "distanceKm": 8, "durationMin": 45 },
          { "label": "PM", "type": "cross", "customType": "Gym", "durationMin": 40 }
        ]
      }
      // ... 6 more days
    ]
  },
  "previousFeedback": "optional string carrying forward last week's AI recommendations",
  "baselinePlan": { ...FuellingPlan }
}
```

- `mode` is required, one of `"fresh"` or `"adjust"`.
- `baselinePlan` is **required when** `mode === "adjust"` and **omitted otherwise**. It is last week's `FuellingPlan` verbatim, used as the baseline the model selectively modifies under principle #9.
- `previousFeedback` is optional in both modes — carries forward `aiFeedback.recommendations` from the previous check-in when one exists.
- Only `SubSession` fields are sent in `trainingWeek.sessions[].sessions`; the derived `DaySession.type`/`description`/`distanceKm`/`durationMin` are recomputed server-side if needed, but the prompt should drive off the raw sub-sessions plus `weekNotes`.

## Appendix B — `/api/grocery` prompt

**System:**

```
You are a practical grocery planner. Given a 7-day fuelling plan, produce a shopping list grouped into supermarket-aisle categories.

Rules:
1. Use these categories in order: "Carbs & Grains", "Protein Drinks", "Fruit", "Dairy", "Eggs & Lean Protein", "Vegetables" (only if includeDinner=true), "Spreads, Sweeteners & Extras". Skip any category with no items.
2. Aggregate quantities across the week. Round up to realistic purchase sizes (e.g. "500 g" oats, "1 dozen" eggs, "×10" bananas).
3. For each item include a one-line note showing which meals it covers, e.g. "Breakfast Mon, Wed, Fri".
4. Add a "macroCheck" table summarising each day's pre-dinner carbs and protein contribution (or full-day if includeDinner=true).
5. Add 3–5 short "notes" — practical tips like brand suggestions, batch-cook advice, fresh-vs-frozen tradeoffs.
6. If includeDinner=false, exclude raw meats, vegetables, and dinner-only items entirely.

Output ONLY valid JSON matching this schema:

{
  "includeDinner": boolean,
  "categories": [
    {
      "name": "Carbs & Grains",
      "items": [
        { "id": "uuid-or-slug", "name": "Rolled oats", "qty": "500 g", "note": "Breakfast Mon, Wed, Fri, Sat, Sun", "checked": false }
      ]
    }
  ],
  "macroCheck": [
    { "day": "Mon", "carbsG": 190, "proteinG": 80, "tag": "easy" }
  ],
  "notes": [
    { "label": "Note 01", "text": "..." }
  ]
}
```

**User message:** `{ fuellingPlan, foodPreferences, includeDinner }`

## Appendix C — `/api/feedback` prompt

The runtime system prompt lives in `lib/prompts.ts` as `FEEDBACK_SYSTEM_PROMPT`. Two sources of truth feed it:

- **Pattern-detection and feedback logic derives from `NUTRITION_RULES.md`** — see that file for under-fuelling signals, LEA / RED-S monitoring, female-athlete considerations, iron-deficiency signs, and hard constraints. When the rules document changes, ask Claude Code to re-read it and resync `lib/prompts.ts`. SPEC.md should not need editing for nutrition changes.

- **The architectural contract** lives here in SPEC.md (below): tone, output sections, food-string formatting for `suggestedPlanEdits`, output schema. These shape downstream rendering and the data model.

**Tone.** Warm, specific, direct. No fluff, no excessive caveats. Write like someone who actually trains.

**Output sections:**

- WINS — 2 to 4 specific bullets.
- MISSED — 2 to 4 specific patterns, not individual misses.
- RECOMMENDATIONS — 2 to 4 actionable suggestions for next week. Tie each to evidence in the check-in.
- SUGGESTED PLAN EDITS (optional) — concrete replacements for specific meal slots when a clear pattern emerges (e.g. consistently swapped Thursday dinners for takeaway). Omit the field entirely if no specific edits warranted.

**Food string formatting** for any `suggestedPlanEdits[].food` — same rules as Appendix A:

- Commas as the only separator between ingredients.
- `× N` with the multiplication sign and a leading space for branded quantities; omit when `N = 1`.
- `/` with no spaces for substitution choices.
- Sentence case. Maximum 60 characters.
- (Full rules in Appendix A above.)

**Output schema.** The model outputs ONLY valid JSON:

```
{
  "wins": [string, ...],
  "missed": [string, ...],
  "recommendations": [string, ...],
  "suggestedPlanEdits": [
    { "day": "Wed", "slot": "dinner", "food": "...", "note": "...", "carbsG": ..., "proteinG": ..., "isCritical": false }
  ]
}
```

`suggestedPlanEdits` is optional — omit the field entirely if no specific edits warranted.

**User message:** `{ fuellingPlan, checkIn, profile }`

---

## 9. Environment variables

`.env.local`:

```
OPENAI_API_KEY=sk-...
```

That's it. Add `.env.local` to `.gitignore` (Next.js does this by default).

On Vercel, add the same as a Project Environment Variable.

---

## 10. First commands

```bash
npx create-next-app@latest fuel --typescript --tailwind --app --src-dir=false --import-alias="@/*"
cd fuel
npm install dexie dexie-react-hooks openai date-fns framer-motion lucide-react clsx tailwind-merge
npm install -D @types/node
```

UI primitives are hand-built in `components/ui/*` — same API as shadcn but no generator run. Add new primitives there as needed; copy patterns from existing components for consistency.

Then start with Phase 1.
