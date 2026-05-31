# DESIGN ADDENDUM — In-App Visual Language

**This document amends SPEC.md. It is the source of truth for the visual language across the in-app screens (onboarding, dashboard, plan editor, grocery list interactive view, check-in, settings) AND the print routes (`/plan/[weekId]/print`, `/grocery/[weekId]/print`).**

One visual language, two surfaces:
- **App shell** — dark by default, sporty, premium. The athlete's daily tool.
- **Print routes** — same minimal language on white paper. Light-mode tokens scoped under `.sheet`, A4 `@page` rules. The editorial Fraunces direction from the original `/reference/*.html` files has been retired; those files are kept only as design history.

---

## 1. Direction

Reference points for the in-app feel: **Whoop**, **Strava Premium**, **Nike Training Club**, **Linear** (for typography rigour), **Apple Fitness+** (for depth).

Core principles:
- **Dark by default, light toggle available.** Dark mode is the hero state — design everything dark-first, then derive light.
- **Depth via layering, not skeuomorphism.** Subtle elevation, soft shadows, gradient washes — never glassmorphism overload or fake bevels.
- **Data is the hero.** Numbers, charts, and macros use a distinctive monospace and get visual prominence. Decorative elements stay quiet.
- **Motion is felt, not seen.** Springs over linear easing. Page transitions use shared-element fades. Nothing bounces, nothing wobbles.
- **Athletic restraint.** No purple gradients. No glassmorphism for its own sake. No "AI app" aesthetics.

---

## 2. Color tokens

Add these to `globals.css`. Replace any existing CSS variables for the app shell (the print routes keep their own scoped variables).

### Dark mode (default)

```css
:root {
  /* Surfaces — layered grays with warm undertone */
  --surface-0: #0a0a0b;        /* page background */
  --surface-1: #131316;        /* cards */
  --surface-2: #1c1c20;        /* elevated cards, popovers */
  --surface-3: #26262c;        /* inputs, hover states */
  --surface-4: #34343c;        /* borders on dark surfaces */

  /* Ink */
  --ink-primary: #f4f4f5;       /* primary text */
  --ink-secondary: #a1a1aa;     /* secondary text, labels */
  --ink-tertiary: #71717a;      /* muted, captions */
  --ink-inverse: #0a0a0b;       /* text on accent surfaces */

  /* Brand accent — a single confident colour. Teal — reads as data/precision
     without the running-app orange overlap (Strava et al.). */
  --accent: #14b8a6;            /* primary CTA, focus rings, key data */
  --accent-hover: #2dd4bf;
  --accent-muted: #14b8a61a;    /* 10% accent for backgrounds, badges */
  --accent-ring: #14b8a640;     /* 25% for focus rings */

  /* Session tag colours — used by SessionTag, dashboard chips, training editor */
  --session-easy: #65a30d;       /* lime-700 — easy days */
  --session-hard: #dc2626;       /* red-600 — intervals/threshold */
  --session-long: #2563eb;       /* blue-600 — long runs */
  --session-rest: #6b7280;       /* gray-500 — rest days */
  --session-custom: #f97316;     /* orange — free-text customType (Gym, Pilates, …) */
  --session-race: #eab308;       /* gold — race days, distinct from hard red */

  /* Macro accents — used inline in the plan grid (no chip background) */
  --macro-carbs: #FAC775;        /* warm amber */
  --macro-protein: #5DCAA5;      /* forest mint */

  /* Session pills (plan grid day header) — light-tinted bg + bright text for dark mode */
  --session-pill-neutral-bg: var(--surface-3);
  --session-pill-neutral-fg: var(--ink-secondary);
  --session-pill-hard-bg: rgba(220, 38, 38, 0.15);
  --session-pill-hard-fg: #fca5a5;
  --session-pill-long-bg: rgba(37, 99, 235, 0.18);
  --session-pill-long-fg: #93c5fd;
  --session-pill-race-bg: rgba(234, 179, 8, 0.18);
  --session-pill-race-fg: #fde047;

  /* Functional */
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;

  /* Effects */
  --border-subtle: #ffffff0a;    /* 4% white — hairline borders */
  --border-default: #ffffff14;   /* 8% white — card borders */
  --border-strong: #ffffff24;    /* 14% white — hover/focus */
  --shadow-card: 0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.2);
  --shadow-elevated: 0 4px 8px rgba(0,0,0,0.4), 0 16px 48px rgba(0,0,0,0.3);
  --noise-opacity: 0.015;        /* very subtle grain on surface-0 */
}
```

### Light mode (toggle)

```css
[data-theme="light"] {
  --surface-0: #fafaf9;          /* warm off-white */
  --surface-1: #ffffff;
  --surface-2: #f5f5f4;
  --surface-3: #e7e5e4;
  --surface-4: #d6d3d1;

  --ink-primary: #18181b;
  --ink-secondary: #52525b;
  --ink-tertiary: #71717a;
  --ink-inverse: #fafaf9;

  --accent: #0d9488;             /* deeper teal for light bg contrast */
  --accent-hover: #0f766e;
  --accent-muted: #0d948814;
  --accent-ring: #0d948840;

  --session-easy: #4d7c0f;
  --session-hard: #b91c1c;
  --session-long: #1d4ed8;
  --session-rest: #57534e;
  --session-custom: #ea580c;
  --session-race: #a16207;

  --macro-carbs: #BA7517;
  --macro-protein: #0F6E56;

  --session-pill-neutral-bg: var(--surface-3);
  --session-pill-neutral-fg: var(--ink-secondary);
  --session-pill-hard-bg:    #FCEBEB;
  --session-pill-hard-fg:    #791F1F;
  --session-pill-long-bg:    #E6F1FB;
  --session-pill-long-fg:    #0C447C;
  --session-pill-race-bg:    #FBF1CC;
  --session-pill-race-fg:    #6B4E00;

  --border-subtle: #00000008;
  --border-default: #00000010;
  --border-strong: #00000018;
  --shadow-card: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06);
  --shadow-elevated: 0 4px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08);
  --noise-opacity: 0;
}
```

---

## 3. Typography

Three families, each with a specific job. Used across both app shell and print routes.

```css
/* Display & headings — strong, slightly condensed, athletic */
--font-display: 'Manrope', system-ui, sans-serif;

/* Body */
--font-body: 'Inter', system-ui, sans-serif;

/* Numbers, labels, monospace data */
--font-mono: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
```

Söhne is paid (Klim Type Foundry); **Manrope** is the free substitute — same compact, slightly geometric athletic feel.

**Fraunces is no longer loaded.** It powered the original editorial-Fraunces direction in `/reference/*.html`; that direction was retired when the print routes pivoted to the minimal in-app language. Remove the `&family=Fraunces:…` segment from the `<link>` URL in `app/layout.tsx`.

**Practical setup — `<link>` tag, not `next/font/google`:**

`next/font/google` fetches at compile time and **hangs the dev server when `fonts.gstatic.com` is slow or unreachable**. We load the font stylesheets via `<link>` in `app/layout.tsx` instead — async, browser-side, with system-font fallbacks (declared in `globals.css`) so the page never blocks:

```tsx
// app/layout.tsx <head>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link
  href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap"
  rel="stylesheet"
/>
```

The font-family CSS variables (`--font-display`, `--font-body`, `--font-mono`) are declared in `globals.css` with system-font fallbacks. `app/fonts.ts` is a comment-only file documenting this decision.

**Type scale** (Tailwind extends in `tailwind.config.ts`):

```ts
fontSize: {
  'display-xl': ['56px', { lineHeight: '1.02', letterSpacing: '-0.03em', fontWeight: '700' }],
  'display-lg': ['40px', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '700' }],
  'display-md': ['28px', { lineHeight: '1.1',  letterSpacing: '-0.02em',  fontWeight: '700' }],
  'display-sm': ['20px', { lineHeight: '1.2',  letterSpacing: '-0.015em', fontWeight: '600' }],
  'body-lg':    ['17px', { lineHeight: '1.5' }],
  'body':       ['15px', { lineHeight: '1.5' }],
  'body-sm':    ['13px', { lineHeight: '1.5' }],
  'mono-lg':    ['15px', { lineHeight: '1.4',  letterSpacing: '0' }],
  'mono':       ['12px', { lineHeight: '1.4',  letterSpacing: '0.02em' }],
  'mono-sm':    ['10.5px',{lineHeight: '1.4',  letterSpacing: '0.06em' }],  // labels, all caps
}
```

Headings use `font-display`. Body uses `font-body`. All numbers, badges, time stamps, macros, durations, labels, and tag pills use `font-mono`.

---

## 4. Component patterns

### Cards
- Background: `--surface-1`
- Border: `1px solid var(--border-default)`
- Radius: `16px` (slightly more generous than default — feels premium)
- Padding: `24px` desktop, `20px` mobile
- Shadow: `--shadow-card`
- Hover (for clickable cards): border lifts to `--border-strong`, transform `translateY(-1px)`, transition `200ms ease`

### Buttons

**Primary:**
- Background: `--accent`
- Text: `--ink-inverse`, `font-display`, weight 600, 14px, letter-spacing -0.01em
- Padding: `12px 20px`
- Radius: `10px`
- Hover: background `--accent-hover`, subtle scale `1.01`
- Active: scale `0.98`
- All transitions `120ms ease-out`

**Secondary (ghost):**
- Background: transparent
- Text: `--ink-primary`
- Border: `1px solid var(--border-strong)`
- Hover: background `--surface-2`

**Destructive:**
- Background: transparent, text `--danger`, border `1px solid var(--danger)` at 30% opacity

### Inputs
- Background: `--surface-2` (dark mode) — slightly elevated to feel tactile
- Border: `1px solid var(--border-default)`
- Border on focus: `--accent`, plus `box-shadow: 0 0 0 3px var(--accent-ring)`
- Padding: `12px 14px`
- Radius: `10px`
- Numbers and times use `font-mono`
- Text uses `font-body`

### Chip input (for food preferences)
- Container: same as input
- Chip: `--surface-3` background, `--ink-primary` text, `font-mono` 11px, padding `4px 10px`, radius `6px`
- Remove × on hover, fades in
- Add via Enter key or comma

### Session tags (per-sub-session colour pills)
- Used by `SessionTag` in: dashboard hero day chips, training-editor day card headers, plan-grid day-header row (via `SessionPill` variant mapping)
- Six variants driven by `SubSession.type` (plus `customLabel` for free-text `customType`):
  - **Easy** / `cross`: background `--session-easy` at 15% opacity, text `--session-easy`, border `1px solid currentColor` at 30%
  - **Hard** (intervals / threshold / tempo): same pattern with `--session-hard`
  - **Long**: same pattern with `--session-long`
  - **Race**: same pattern with `--session-race` — gold, visually distinct from hard
  - **Rest**: same pattern with `--session-rest`
  - **Custom** (anything with `customType` set, e.g. "Gym"): same pattern with `--session-custom` — orange. Renders the free-text label instead of the preset name.
- `font-mono`, 10px, uppercase, letter-spacing 0.08em
- Padding `3px 8px`, radius `4px`

### Macro numbers (in-grid)
- Inline coloured numbers, no chip background, no `C`/`P` letter prefix, no `g` units in the plan grid
- Font: `font-mono`, 10–11px depending on context (10px in plan-grid meal cells, 11px in legend, 13px in totals row)
- Carbs: `color: var(--macro-carbs)` (warm amber)
- Protein: `color: var(--macro-protein)` (forest mint)
- `<MacroPill kind="carbs|protein" value={n} />` is still exported for any future "show units" context, but the plan grid renders bare numbers directly inline.

### Session pills (plan-grid day header)
- Used only in the plan-grid day-header row to indicate the day's session intensity
- Variant + label are **derived from the day's `TrainingWeek.sessions[].type`** (via `pillVariantForType` + `SESSION_LABELS`), not from `DayTotal.tag`. This means the header shows the specific session name ("Intervals", "Long Run", "Threshold") rather than the broad bucket — and a single-session day with `customType` set shows that custom label.
- Four colour variants — neutral (rest / easy / easy_double / cross), hard (intervals / threshold / tempo), long (long), race (race) — race is gold, distinct from hard
- Each uses paired `--session-pill-{variant}-bg` and `--session-pill-{variant}-fg` tokens
- `font-mono`, 10px, uppercase, letter-spacing 0.08em, padding `1px 6px`, radius `3px`
- Distinct from `SessionTag` (used in the dashboard hero day-chip column + training editor for per-sub-session colour-coding)

### Targets band (plan-view header)
- Compact legend showing the athlete's current carb + protein targets — replaces the static decorative legend
- Layout: `● Carbs 245–490 g  · ● Protein 78–88 g/day  · [Edit targets]` — coloured dot + label + computed gram range, followed by an accent-teal "Edit targets" mono-uppercase link
- Computed gram range = `Math.round(easyCarbLow × W)`–`Math.round(hardCarbHigh × W)` (lowest of Easy to highest of Hard band); protein uses min/max × W
- Numbers update live as the modal is edited; "Reset to defaults" link appears inside the modal when targets differ from `DEFAULT_CARB_TARGETS_G_PER_KG` / `DEFAULT_PROTEIN_TARGET_G_PER_KG`
- The actual editor lives in a modal (see "Modal" pattern below). Targets state is in-memory only — each page load resets to the rules-table defaults. They flow into `/api/plan` calls as `carbTargetsGperKg` / `proteinTargetGperKg`.

### Modal (shared pattern across edit / regenerate / chooser)
Used by: meal-cell editor, regenerate dialog, edit-targets modal, plan-next-week chooser. Identical visual structure:
- Fixed-position overlay (`z-50`, full-screen flex centre)
- Backdrop: `bg-black/60`, click to close (disabled while a save/network action is in flight)
- Card: `max-w-md` (or `max-w-lg` for content-heavy dialogs), `bg-surface-1`, `border-border`, `rounded-card`, `p-6`, `shadow-elevated`
- Enter: fade + scale from 0.96 + translateY 8 (Framer Motion, 180ms ease-out)
- Exit: fade + scale to 0.97 + translateY 4 (150ms)
- Header: title (`font-display text-display-sm`) on the left, optional subtitle in `text-body-sm text-ink-secondary`, close `<X>` button (16px) top-right that hides while busy
- Esc closes (single shared listener at page level, dispatched to the open modal)
- Cancel + primary action at the bottom, right-aligned

### Navigation
- Top app bar: `--surface-0` background, `--border-subtle` bottom border, `64px` tall, sticky
- Logo wordmark: `font-display`, 18px, weight 800, slight negative tracking
- Nav links: `font-mono` 11px uppercase letter-spacing 0.1em
- Active link: small `--accent` underline 2px
- AppBar hides itself on `/*/print` routes via a `pathname.endsWith('/print')` check.

### Plan grid
- CSS Grid: `gridTemplateColumns: '88px repeat(7, minmax(0, 1fr))'` — narrow label column + 7 equal day columns
- Borders: 0.5px hairlines using `--border-default`. Horizontal between every row; vertical only on day-column left edges (label column has no left border). No bottom border on the totals row, no border on the rules footer (separated by its own 0.5px top border).
- Day header row: `MON`–`SUN` mono uppercase tertiary, with a session pill below (see "Session pills" above).
- Meal cells: `flex flex-col justify-between`, `min-height: 88px` on desktop. Food at top (13px ink, 1.45 line-height), macros bottom-right (10px mono, two coloured numbers).
- Totals row: leftmost `Total` label, then per-day coloured number pair (13px font-medium mono, right-aligned).
- Rules footer: `grid-cols-3 gap-8` of rule label + 12px secondary text, no card chrome.

---

## 5. Layout & composition

- **Page container:** max-width 1240px, side padding 24px desktop / 20px mobile, centered.
- **Dashboard grid:** asymmetric. The "This Week" card spans 2/3 width on desktop, with a stacked column of smaller cards in the remaining 1/3. Don't default to equal-width grid cells.
- **Generous whitespace** between sections (64px desktop / 40px mobile vertical rhythm).
- **No more than two visible accent colours per screen.** The accent teal is precious — overuse kills its impact.

---

## 6. Atmosphere & depth

These details separate "default Tailwind" from "premium app":

1. **Subtle noise grain** on `--surface-0` page background (dark mode only):
   ```css
   body[data-theme="dark"]::before {
     content: '';
     position: fixed;
     inset: 0;
     pointer-events: none;
     background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
     opacity: var(--noise-opacity);
     z-index: 100;
     mix-blend-mode: overlay;
   }
   ```

2. **Hero card gradient wash** on the dashboard "This Week" card:
   ```css
   background:
     radial-gradient(circle at top right, var(--accent-muted), transparent 60%),
     var(--surface-1);
   ```

3. **Hairline dividers** between rows in lists — `1px solid var(--border-subtle)`, never use the heavier border.

4. **Focus rings are visible and beautiful** — never `outline: none` without replacement. Always `box-shadow: 0 0 0 3px var(--accent-ring)`.

---

## 7. Motion

Install Framer Motion: `npm install framer-motion`.

Standard transitions:
- **Page transitions:** fade + 8px translateY, 240ms, ease-out
- **Card hover:** translateY(-1px) + border shift, 200ms ease
- **Modal/popover enter:** fade + scale from 0.96, 180ms spring (stiffness 300, damping 30)
- **List item enter (staggered):** opacity 0→1 + translateY 4px→0, 160ms each, 30ms stagger
- **Checkbox toggle:** scale spring 1 → 1.15 → 1, 240ms

Reusable easing curves:
```ts
export const ease = {
  out: [0.16, 1, 0.3, 1] as const,         // sharp out
  inOut: [0.4, 0, 0.2, 1] as const,        // balanced
  spring: { type: 'spring', stiffness: 300, damping: 30 } as const,
};
```

**Reduced motion:** respect `prefers-reduced-motion`. All Framer Motion components should pass through a `useReducedMotion` check.

---

## 8. Specific screen updates

### Onboarding
- **Full-screen layout, not a card.** Centered max-width 560px column.
- Progress as a 3-step horizontal bar at top — filled segments in `--accent`, empty in `--surface-3`.
- Each step: large `display-lg` heading, `body-lg` subhead in `--ink-secondary`, then form fields with generous spacing (24px between).
- "Continue" button is full-width, primary style, anchored to bottom on mobile.
- Step transitions: outgoing step fades + slides left 24px, incoming fades + slides in from right 24px.

### Dashboard
- **Hero "This Week" card:** spans 2/3 width on desktop. Big week-of date in `font-display` display-lg. Below the headline: a grid of 7 day columns (Mon–Sun). Each column shows **one tile per sub-session** — a Mon with AM Easy + PM Gym renders as two stacked tiles inside the Mon column. Each tile carries:
  - The AM/PM label (when set), top-left, `font-mono mono-sm` in `--ink-tertiary`
  - The coloured session tag for the underlying `type` — or the free-text `customType` ("Gym", "Pilates") for non-preset sessions, still styled as a tag
  - Tap any tile → jump to that day's meals in the plan view
  - A rest day = empty column, no tiles, just the day name in `--ink-tertiary`
- Also in the hero: an inline "Edit training" link (deep-links to `/settings?tab=training`) next to the session count.
- **Quick stats row** below the hero: 3 cards in a row — "Sessions this week", "Plan completion %", "Energy" (from check-ins). Each shows a big monospace number and a tiny label below. Show "—" when no check-in exists yet.
- **Right column (1/3 width):** stacked smaller cards — "Last week's wins" (top 1–2 bullets from AI feedback with empty-state fallback), "Up next" CTA card that flips between "Do this week's check-in" and "Plan next week" based on check-in status.
- **History feed at the bottom:** vertical list of past weeks with status pills and dates.
- **"Plan next week" chooser** (when the current week has been checked in): clicking the CTA opens a Modal with three radio cards — **Copy last week** (default if a current-week plan exists), **Adjust last week** (disabled with "Coming in Phase 5" caption), **Generate fresh**. Confirm dispatches to `clonePlan()` or `/api/plan`, then routes to `/plan/[nextWeekId]`. See SPEC §4.7.

### Plan editor (on-screen)
See **SPEC §4.3** for the full layout. Visual notes:
- **Top utility row:** "← Dashboard" back-link, no actions.
- **Header strip:** tiny `WEEK OF MON 2 JUN` mono tertiary label + `Fuelling plan` 20px title (weight 500, ink) on the left. Right: **Targets band** (`● Carbs X–Y g · ● Protein X–Y g/day · Edit targets`) — see "Targets band" component pattern in §4.
- **Action button row** beneath the header strip, right-aligned, bordered below: `Print` (ghost) · `Regenerate` (primary teal) · `Grocery` (primary teal). Compact size — `h-7 px-2.5 text-mono-sm gap-1.5` with 12px icons.
- **Grocery button is smart:** if a list exists for this week and is newer than the plan's `generatedAt`, just navigates. Otherwise generates first (single click from the plan → populated grocery list).
- **Plan grid:** see "Plan grid" component pattern in §4.
- **Mobile (default <768px):** day-by-day, tabbed (not swipeable — 7 day-buttons across the top, tap to select). Below: 5 stacked `MealCard`s for the selected day, then a `DayTotalRow`. Each `MealCard`: slot label tiny mono tertiary, food at 15px ink, coloured macro numbers right-aligned.
- **Edit interaction:** tap any meal cell (desktop or mobile) → centered Modal opens with food / note / macros (carbs + protein g) / isCritical fields. Modal shows day + slot in mono header (e.g. `MON · BREAKFAST`).
- **Macro propagation on save:** when the meal save commits, any other meal in the plan with the exact same `food` string also receives the new `carbsG` / `proteinG`. Day totals recompute for every affected day. Notes and `isCritical` stay per-meal — they're context-dependent. The modal surfaces a one-line preview ("These macros will also apply to N other meals with 'X'") when N > 0.
- **Regenerate dialog:** the top-row Regenerate button opens a Modal with three radio options (Training has changed / Food preferences have changed / Nothing — try a different plan) and a free-text "Anything else for the AI" textarea. Confirm POSTs `/api/plan` with `mode: "fresh"` plus the current targets band values + the free-text as `previousFeedback`.
- **What is *not* rendered in the cell (but lives in the data model):** `meal.note` (reserved for a future tap/hover popover) and `meal.isCritical` (no left-accent border on the cell for now).

### Grocery list (on-screen)
- **Empty state:** "Generate grocery list" primary button. Generates from the week's plan + food prefs via `/api/grocery` (defaults `includeDinner: true`), saves to Dexie, refreshes into the populated view.
- **Header:** title + week range + "X of Y" item count + thin `--accent` progress bar. Only one action button — Print (ghost).
- **Mobile-first.** Single column, sticky category headers (`--surface-2` background, `font-mono` uppercase).
- Items as full-width rows: checkbox left, item name `font-body`, quantity right-aligned in `font-mono` and `--accent` colour, optional italic tertiary note below.
- Checking an item: row fades to 40% opacity + item name gets strikethrough, plays a tiny spring scale animation on the checkbox.
- **Back link** points to `/plan/[weekId]` (not the dashboard) — the grocery list is downstream of the plan.
- **No "Reset" or "Regenerate" buttons.** Regeneration happens automatically when the user clicks Grocery on the plan view and the existing list is older than the plan.

### Check-in
- **Compact recap section** at top: collapsible accordion showing the plan (deferred — not built yet).
- **Apply-to-all row** above the meal grid: section heading on the left, four status buttons (`Done` / `Partial` / `Missed` / `Swapped`) + `Clear` on the right. Tapping a status sets all 35 cells at once; tweak individual cells afterwards.
- **Meal grid:** 5 rows (slots) × 7 cols (days), each cell is a 4-state segmented control. Buttons show single letters `D / P / M / S` with full label in `title`. Selected state uses inline `color-mix()` styling on `--session-easy` / `--warning` / `--session-hard` / `--session-long` respectively — **not** Tailwind `/opacity` modifiers (those silently drop against hex CSS vars; see §11).
- **Energy rating:** big mono numeric `1–5` next to a row of 5 stacked pill segments (`--accent` filled up to the selected rating). Labels `flat` / `flying` underneath.
- **Sessions completed:** `NumberInput` with chevron steppers.
- **Submit button** spans full width on mobile. "Get AI feedback (Phase 5)" button sits adjacent — disabled until the feedback route lands.
- **AI feedback section:** appears below after submit (Phase 5). Three labeled columns ("WINS / MISSED / ACTIONS") with monospace labels. Each bullet animates in with staggered fade.

---

## 9. Dark mode toggle

- Place the toggle in the top app bar, right side. Sun/moon icon (Lucide React icons — `Sun`, `Moon`).
- Persist preference in `localStorage` under `theme` key.
- Default to dark.
- Apply via `data-theme="dark"` or `data-theme="light"` on `<html>`. Avoid `class="dark"` Tailwind pattern — using a data-attribute is cleaner and works with CSS variable swaps.
- Add Tailwind config: `darkMode: ['selector', '[data-theme="dark"]']`

---

## 10. Tailwind config extensions

Update `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: 'var(--surface-0)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
          4: 'var(--surface-4)',
        },
        ink: {
          DEFAULT: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          tertiary: 'var(--ink-tertiary)',
          inverse: 'var(--ink-inverse)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
          ring: 'var(--accent-ring)',
        },
        session: {
          easy: 'var(--session-easy)',
          hard: 'var(--session-hard)',
          long: 'var(--session-long)',
          rest: 'var(--session-rest)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
      },
      fontSize: { /* paste the scale from §3 */ },
      borderRadius: {
        card: '16px',
        button: '10px',
      },
    },
  },
};
export default config;
```

---

## 11. What NOT to do

Explicit avoid list — Claude Code should not produce these:
- Purple/violet gradients anywhere
- Glassmorphism (`backdrop-filter: blur`) — feels dated
- Neon glow effects
- Default shadcn `border: 1px solid hsl(var(--border))` looks — actually replace them with the tokens above
- Default Inter font for everything (use the type hierarchy)
- "Card with subtle shadow on white" generic SaaS look
- Centered single-column equal-weight grids on dashboard
- Emojis as primary UI elements
- Multiple competing accent colours

**Tailwind gotchas to avoid:**
- **Do not use the `/opacity` suffix on colour utilities whose underlying token is a hex-string CSS variable** (e.g. `bg-session-easy/20`, `border-danger/30`, `bg-surface-3/60`). Tailwind 3 computes opacity by injecting RGB channels into `rgb(var(--token) / <alpha>)`, which only works when the variable provides a `r g b` triplet — not a hex string. The classes parse without error but render with no colour. Use `color-mix(in srgb, var(--token) N%, transparent)` via inline `style` for tinted backgrounds, or define a dedicated `--token-muted` variable with the alpha baked in.

---

## 12. Verification checklist

After Claude Code applies this, the app should pass these visual tests:

**Foundation:**
- [ ] Dark mode loads by default; toggle in top-right switches to light mode and persists across refresh
- [ ] Body has subtle noise grain visible in dark mode (look closely at large empty areas)
- [ ] Dashboard "This Week" card has the radial gradient wash from top-right
- [ ] All numbers (dates, durations, macros, quantities) appear in JetBrains Mono
- [ ] Headings appear in Manrope (more geometric/condensed than default Inter)
- [ ] Primary buttons are accent-teal, never blue or orange
- [ ] Cards have visible but subtle borders, not heavy shadcn defaults
- [ ] Page transitions fade + slide, not instant snap
- [ ] Focus states show the teal ring, not browser default
- [ ] No reference to Fraunces in `app/layout.tsx` `<link>` or anywhere in `globals.css` (the `/reference/*.html` files retain it only as historical artefacts)

**Plan view:**
- [ ] Header strip: title left, targets legend right (`● Carbs … · ● Protein … · Edit targets`)
- [ ] Day-header pills read the **specific session label** ("Intervals", "Long Run", custom labels) — not the broad bucket
- [ ] Macro numbers in cells render as bare coloured digits (no `C`/`P` letters, no `g` units, no chip background)
- [ ] Critical meal indicator (`isCritical` left-accent border) is currently NOT rendered (data only)
- [ ] Note field is currently NOT rendered in the cell (data only)
- [ ] Clicking a meal opens the centered edit Modal with food / note / macros / isCritical fields
- [ ] Saving a meal edit propagates the new macros to every other meal in the plan with the exact same `food` string; affected day totals recompute
- [ ] Editing targets opens a centered Modal; "Reset to defaults" link appears only when values differ from `DEFAULT_*` constants
- [ ] Regenerate opens a Modal with three radio reasons + optional note textarea; submit POSTs `/api/plan` with the current targets band

**Dashboard:**
- [ ] "Plan next week" CTA (only when current week is checked in) opens the three-card chooser Modal
- [ ] "Copy last week" is the default selection when a current-week plan exists; "Generate fresh" otherwise
- [ ] "Adjust last week" is visibly disabled with "Coming in Phase 5"

**Grocery list:**
- [ ] Empty state has a single "Generate grocery list" primary button (no dev "Seed mock list")
- [ ] Populated header has only Print (no Reset, no Regenerate)
- [ ] Back link reads "← Fuelling plan" and points to `/plan/[weekId]`

**Check-in:**
- [ ] Apply-to-all row above the grid: section heading + 4 status buttons + Clear
- [ ] Selecting D / P / M / S in a cell renders a visibly tinted background using the matching status colour (via inline `color-mix()` — see §11 gotcha)

**Print routes:**
- [ ] `/plan/[weekId]/print` and `/grocery/[weekId]/print` render on white paper with Manrope + JetBrains Mono, hairline borders, light-tinted session pills, amber/green macro numbers — same minimal language as the in-app view

If any of these fail, fix before declaring this addendum complete.
