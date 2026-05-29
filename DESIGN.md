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

  --macro-carbs: #BA7517;
  --macro-protein: #0F6E56;

  --session-pill-neutral-bg: var(--surface-3);
  --session-pill-neutral-fg: var(--ink-secondary);
  --session-pill-hard-bg:    #FCEBEB;
  --session-pill-hard-fg:    #791F1F;
  --session-pill-long-bg:    #E6F1FB;
  --session-pill-long-fg:    #0C447C;

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
- Five variants driven by `SubSession.type` (plus `customLabel` for free-text `customType`):
  - **Easy** / `cross`: background `--session-easy` at 15% opacity, text `--session-easy`, border `1px solid currentColor` at 30%
  - **Hard** (intervals / threshold / tempo / race): same pattern with `--session-hard`
  - **Long**: same pattern with `--session-long`
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
- Used only in the plan-grid day-header row to indicate the day's session intensity (mapped from `DayTotal.tag`)
- Three variants — neutral (easy / easy+ / rest), hard (intervals / threshold / tempo / race), long
- Each uses paired `--session-pill-{variant}-bg` and `--session-pill-{variant}-fg` tokens
- `font-mono`, 10px, uppercase, letter-spacing 0.08em, padding `1px 6px`, radius `3px`
- Distinct from `SessionTag` (used in the dashboard hero day-chip column + training editor for per-sub-session colour-coding)

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

### Plan editor (on-screen)
See **SPEC §4.3** for the full layout. Visual notes:
- **Top utility row:** "← Dashboard" back-link left, action buttons right (Print · Regenerate · Grocery).
- **Header strip:** tiny `WEEK OF MON 2 JUN` mono tertiary label + `Fuelling plan` 20px title (weight 500, ink). Right side: macro legend with two 8px coloured dots (`--macro-carbs`, `--macro-protein`) and target ranges.
- **Plan grid:** see "Plan grid" component pattern in §4.
- **Mobile (default <768px):** day-by-day, swipeable / tabbed. 7 day-buttons across the top, tapping selects. Below, 5 stacked `MealCard`s for the selected day, then a `DayTotalRow`. Each `MealCard`: slot label tiny mono tertiary, food at 15px ink, coloured macro numbers right-aligned.
- **Edit interaction (Phase 3+):** tap any meal → bottom sheet on mobile, popover on desktop. Same form fields either way: food, note, macros, isCritical.
- **What is *not* rendered in the cell (but lives in the data model):** `meal.note` (reserved for popover surfacing later), `meal.isCritical` (no left-accent border for now).

### Grocery list (on-screen)
- **Mobile-first.** Single column, sticky category headers (`--surface-2` background, `font-mono` uppercase).
- Items as full-width rows: checkbox left, item name `font-body`, quantity right-aligned in `font-mono` and `--accent` colour.
- Checking an item: row fades to 40% opacity + item name gets strikethrough, plays a tiny spring scale animation on the checkbox.
- Progress bar at top: "12 of 28" with thin `--accent` fill bar.

### Check-in
- **Compact recap section** at top: collapsible accordion showing the plan.
- **Meal grid:** 5 rows (slots) × 7 cols (days), each cell is a 4-state segmented control (done · partial · missed · swapped). On mobile, switch to per-day swipeable view matching the plan editor.
- **Energy rating:** custom slider with 1-5 ticks. Selected value displayed huge in `font-display` next to the slider.
- **Submit button** spans full width on mobile.
- **AI feedback section:** appears below after submit. Three labeled columns ("WINS / MISSED / ACTIONS") with monospace labels. Each bullet animates in with staggered fade.

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

---

## 12. Verification checklist

After Claude Code applies this, the app should pass these visual tests:
- [ ] Dark mode loads by default; toggle in top-right switches to light mode and persists across refresh
- [ ] Body has subtle noise grain visible in dark mode (look closely at large empty areas)
- [ ] Dashboard "This Week" card has the radial gradient wash from top-right
- [ ] All numbers (dates, durations, macros, quantities) appear in JetBrains Mono
- [ ] Headings appear in Manrope (more geometric/condensed than default Inter)
- [ ] Primary buttons are accent-teal, never blue or orange
- [ ] Session tags use the three coloured pill style on both light and dark
- [ ] Cards have visible but subtle borders, not heavy shadcn defaults
- [ ] Page transitions fade + slide, not instant snap
- [ ] Focus states show the teal ring, not browser default
- [ ] Print routes (`/plan/[weekId]/print`, `/grocery/[weekId]/print`) render on white paper with Manrope + JetBrains Mono, hairline borders, light-tinted session pills, amber/green macro numbers — same minimal language as the in-app view
- [ ] No reference to Fraunces in `app/layout.tsx` `<link>` or anywhere in `globals.css` (the `/reference/*.html` files retain it only as historical artefacts)
- [ ] Macro numbers in the plan grid render as bare coloured digits (no `C`/`P` letters, no `g` units, no chip background)

If any of these fail, fix before declaring this addendum complete.
