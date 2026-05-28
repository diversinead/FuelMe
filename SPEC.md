# Fuel — Weekly Endurance Fuelling Planner

A web app that generates a personalised weekly fuelling plan and grocery list for endurance athletes, then learns from weekly check-ins.

This document is the complete brief. Build it in the order given. Do not skip ahead — each phase produces a working app.

---

## 1. Stack & key decisions

- **Framework:** Next.js 14 (App Router), TypeScript, React 18
- **Styling:** Tailwind CSS + shadcn/ui components
- **Fonts:** Fraunces (serif) + JetBrains Mono — already used in the reference HTML, keep them
- **Local data:** Dexie.js (IndexedDB wrapper). All user data lives on-device for now.
- **AI:** OpenAI GPT-4o-mini via Next.js Route Handlers (`/api/*`). Key in `OPENAI_API_KEY` env var, **never exposed to client**.
- **PDF/print:** Native `window.print()` against print-styled routes — the reference HTML files already print beautifully, just replicate that approach.
- **PWA:** Add `next-pwa` so users can "Add to Home Screen" and use offline.
- **Deployment target:** Vercel.

**Architecture rule:** all OpenAI calls go through `/api/*` Route Handlers. The client never sees the API key. This makes the future "user supplies own key" migration trivial — you'll just read the key from headers or user record instead of `process.env`.

---

## 2. Design language (non-negotiable)

The two reference HTML files (`fueling-plan-print.html`, `weekly-grocery-list.html`) define the visual identity. Match it exactly for the printable views, and extend the same language to the rest of the app.

**CSS variables to define globally:**

```css
--ink: #000;
--ink-soft: #444;
--paper: #fff;
--bg-warm: #f0e9da;
--bg-soft: #f1eee7;
--accent-easy: #4a7a2e;    /* easy session — green */
--accent-hard: #9c3815;    /* hard/interval/threshold — rust */
--accent-long: #2e5285;    /* long run — blue */
--divider: #999;
```

**Type:**
- Headings & body: Fraunces (400, 600, 800 + italic)
- Labels, tags, monospace numbers (macros, quantities): JetBrains Mono (400, 500, 700)

**Components that must look exactly like the reference:**
- Section headers — black bar, white uppercase JetBrains Mono text, tight letter-spacing
- Session tags — small uppercase pills in `--accent-*` colours
- Macro "pills" — small monospace numbers with carbs/protein labels
- Checkbox lists with warm cream background and ruled dividers
- "Notes" boxes — cream background, numbered rules in rust monospace

For the rest of the app (forms, dashboard, AI feedback view), use shadcn/ui defaults themed to match: cream backgrounds, ink text, JetBrains Mono for labels and numeric input, Fraunces for any prose.

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
}

interface DaySession {
  day: 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun';
  type: 'rest'|'easy'|'easy_double'|'intervals'|'threshold'|'tempo'|'long'|'race'|'cross';
  description: string;          // "AM 1hr easy + PM 35 min"
  durationMin?: number;
  intensity?: 1|2|3|4|5;
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
/plan/[weekId]/print    Print-styled, identical to fueling-plan-print.html
/grocery/[weekId]       Interactive grocery list with checkboxes
/grocery/[weekId]/print Print-styled, identical to weekly-grocery-list.html
/checkin/[weekId]       Week-end check-in form + AI feedback
/settings               Edit profile, food prefs
```

### 4.1 Onboarding (`/onboarding`)

Three-step wizard. Use a shadcn `Card` with progress dots at top.

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
- Grid of 7 day cards (Mon→Sun)
- Each card: session type dropdown, description input, optional duration
- Quick presets at top: "5-day runner", "Marathon block", "Rest week"
- Submit → generate plan → redirect to `/plan/[weekId]`

### 4.2 Dashboard (`/dashboard`)

- Big card top: **This week** — week start date, session summary, "View plan", "View grocery list", "Do check-in"
- Card: **Last week's check-in feedback** (if exists) — wins/missed/recommendations summary
- Card: **Next week** — "Plan next week's training →"
- Sidebar/footer: list of past weeks with status badges (plan done / shopping done / checked in)

### 4.3 Plan view (`/plan/[weekId]`)

On-screen this should be a **rich, editable** version of the print sheet.

- Header: "Weekly Fuelling Plan" + subtitle + targets (right side, monospace)
- 3-rule box ("Rule 01 — Eat for the work" etc.)
- Main table: rows = meals (Breakfast, Post-AM, Lunch, Afternoon, Dinner) × cols = days
- Each cell shows: food string, optional note, carbs pill, protein pill
- **Inline editing**: click a cell → edit food/note/macros in a popover (shadcn `Popover` + form)
- Day totals row at bottom
- Top-right actions: "Print", "Regenerate", "Generate grocery list", "Edit"
- On regenerate: open dialog asking what changed (training, prefs, or "just retry")

**Print route `/plan/[weekId]/print`:** render the exact HTML/CSS structure from `fueling-plan-print.html`, populated from the FuellingPlan. Use a print-only layout (no app chrome). Trigger `window.print()` on mount if `?auto=1`.

### 4.4 Grocery list (`/grocery/[weekId]`)

On-screen:
- Header matches reference HTML
- Two-column layout on desktop, single column on mobile
- Each category section: black bar header, cream items list with checkboxes
- Tapping a checkbox toggles `checked` in Dexie (so progress persists across devices once cloud is added)
- "Reset all" button
- Bottom: macro check table + notes box
- Top actions: "Print", "Regenerate", "Toggle: include dinner items"

**Print route `/grocery/[weekId]/print`:** exact replica of `weekly-grocery-list.html`.

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

Plain forms to edit profile and food prefs. Tabs for each section.

---

## 5. API routes

Three Route Handlers under `app/api/`. All use the OpenAI Node SDK and return JSON.

### 5.1 `POST /api/plan`

**Body:** `{ profile, foodPreferences, trainingWeek }`

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
    /plan/route.ts
    /grocery/route.ts
    /feedback/route.ts
  /onboarding/page.tsx
  /dashboard/page.tsx
  /plan/[weekId]/page.tsx
  /plan/[weekId]/print/page.tsx
  /grocery/[weekId]/page.tsx
  /grocery/[weekId]/print/page.tsx
  /checkin/[weekId]/page.tsx
  /settings/page.tsx
  layout.tsx
  globals.css           # CSS vars + Tailwind directives
  fonts.ts              # Next.js font loaders for Fraunces + JetBrains Mono

/components
  /ui/                  # shadcn components
  /plan/
    PlanTable.tsx
    MealCell.tsx
    EditMealPopover.tsx
    RulesBox.tsx
    DayTotalsRow.tsx
  /grocery/
    GroceryCategory.tsx
    GroceryItem.tsx
    NotesBox.tsx
    MacroCheckTable.tsx
  /onboarding/
    ProfileStep.tsx
    FoodPrefsStep.tsx
    TrainingStep.tsx
    ChipInput.tsx
  /checkin/
    MealCompletionGrid.tsx
    FeedbackPanel.tsx
  /shared/
    SectionHeader.tsx
    SessionTag.tsx
    MacroPill.tsx
    PrintLayout.tsx

/lib
  db.ts                 # Dexie instance + table types
  openai.ts             # server-only OpenAI client factory
  prompts.ts            # the three prompts as exported strings
  date.ts               # weekId helpers (Monday-aligned ISO)
  defaults.ts           # default food suggestions for onboarding

/styles
  print-plan.css        # extracted from fueling-plan-print.html
  print-grocery.css     # extracted from weekly-grocery-list.html
```

---

## 7. Build order

Do **not** try to build everything at once. Phases:

### Phase 1 — Skeleton (no AI yet)
1. `create-next-app` with TS + Tailwind + App Router
2. Add shadcn/ui, Fraunces + JetBrains Mono via `next/font`
3. Set up Dexie with the schema in §3
4. Build onboarding (§4.1) — saves to Dexie, redirects to dashboard
5. Build dashboard (§4.2) reading from Dexie
6. Stub the plan/grocery/checkin pages with mock data

✅ **Milestone:** you can onboard, see a fake plan, click through everything.

### Phase 2 — Print views (the visual win)
7. Port `fueling-plan-print.html` to `/plan/[weekId]/print/page.tsx` — server-rendered, reads from Dexie via a client wrapper
8. Port `weekly-grocery-list.html` to `/grocery/[weekId]/print/page.tsx`
9. Hook up "Print" buttons → `window.print()`

✅ **Milestone:** beautiful printable plans from mock data.

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

### Phase 5 — Check-in loop
16. Build check-in form (§4.5)
17. Build `/api/feedback` with prompt from Appendix C
18. Build "Apply suggested edits" → patches PlannedMeals in Dexie
19. Build "Generate next week with feedback" hand-off

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

**System:**

```
You are an experienced sports dietitian specialising in endurance athletes (runners, cyclists, triathletes). You write practical, food-first weekly fuelling plans — not calorie spreadsheets.

Principles you always apply:
1. Eat for the work — carbs scale with session demands. Easy days are not low-carb days; they're slightly lower than hard days.
2. Endurance protein target is 1.6–1.8 g per kg bodyweight per day, distributed across 4–5 meals.
3. Pre-load the day before a long run or hard double — dinner is part of tomorrow's fuel.
4. Recovery window matters most after hard or long sessions: get 20+ g protein and 40–60 g carbs within 30 minutes.
5. Use the athlete's stated food preferences. Never suggest foods on their "avoid" list. Repeat staples — variety is overrated, consistency wins.
6. For female athletes with cycle-aware tracking enabled, mention a luteal-phase note (slightly higher carbs, supports sleep) for one dinner.

You output ONLY valid JSON matching this exact schema — no prose, no markdown, no code fences:

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

isCritical = true for meals immediately before or after a hard/long session, or pre-load dinners. These get visually flagged in the UI.
```

**User message (JSON):**

```json
{
  "profile": { ...Profile },
  "foodPreferences": { ...FoodPreferences },
  "trainingWeek": { ...TrainingWeek },
  "previousFeedback": "optional string carrying forward last week's AI recommendations"
}
```

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

**System:**

```
You are the athlete's fuelling coach reviewing their week. You are warm, specific, and direct. No fluff, no excessive caveats. You write like someone who actually trains.

Given the original fuelling plan and the athlete's check-in (which meals they hit, missed, swapped, plus energy rating and free notes), produce structured feedback.

Rules:
1. WINS — 2 to 4 bullets. Specific. "You nailed every pre-long-run breakfast" beats "good consistency".
2. MISSED — 2 to 4 bullets. Specific patterns, not individual misses. "Wednesday post-AM recovery drink was skipped twice — that's the gap that matters" beats "you missed some meals".
3. RECOMMENDATIONS — 2 to 4 actionable suggestions for next week. Tie each to evidence in the check-in.
4. If a clear pattern emerges (e.g. they consistently swap dinners for takeaway on Thursday), output SUGGESTED PLAN EDITS — concrete replacements for specific meal slots that would have worked better.
5. Energy rating low (1-2) + missed recovery meals → flag under-fuelling explicitly.
6. Energy rating high (4-5) + most meals hit → reinforce what's working, suggest a small progression for next week.
7. Never moralise about food choices. Swapping a planned meal for something equivalent = success, not failure.

Output ONLY valid JSON:

{
  "wins": [string, ...],
  "missed": [string, ...],
  "recommendations": [string, ...],
  "suggestedPlanEdits": [
    { "day": "Wed", "slot": "dinner", "food": "...", "note": "...", "carbsG": ..., "proteinG": ..., "isCritical": false }
  ]
}

suggestedPlanEdits is optional — omit the field entirely if no specific edits warranted.
```

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
npx shadcn@latest init
npx shadcn@latest add button card input textarea label radio-group checkbox dialog popover tabs select slider toast
npm install dexie dexie-react-hooks openai date-fns
npm install -D @types/node
```

Then start with Phase 1.
