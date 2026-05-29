# DESIGN ADDENDUM — In-App Visual Language

**This document amends SPEC.md. Apply these changes to all in-app screens (onboarding, dashboard, plan editor, grocery list interactive view, check-in, settings). The print views (`/plan/[weekId]/print` and `/grocery/[weekId]/print`) remain UNCHANGED — they keep the editorial aesthetic from the reference HTML files.**

Two visual languages, two different jobs:
- **App shell** (this doc) — dark, sporty, premium. The athlete's daily tool.
- **Print views** (unchanged) — editorial, warm, paper-feel. The deliverable.

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

  /* Session colours — pulled forward from the print sheet but recalibrated for dark mode */
  --session-easy: #65a30d;       /* lime-700 — easy days */
  --session-hard: #dc2626;       /* red-600 — intervals/threshold */
  --session-long: #2563eb;       /* blue-600 — long runs */
  --session-rest: #6b7280;       /* gray-500 — rest days */

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

Three families, each with a specific job. Keep Fraunces for the print views only — the app shell uses a more modern stack.

```css
/* Display & headings — strong, slightly condensed, athletic */
--font-display: 'Söhne', 'Inter Tight', 'Manrope', system-ui, sans-serif;

/* Body */
--font-body: 'Inter', system-ui, sans-serif;

/* Numbers, labels, monospace data — keep JetBrains Mono (already loaded for print views) */
--font-mono: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
```

**Practical setup — `<link>` tag, not `next/font/google`:**

Söhne is paid (Klim Type Foundry). Use **Manrope** as the free substitute — same compact, slightly geometric athletic feel.

`next/font/google` fetches at compile time and **hangs the dev server when `fonts.gstatic.com` is slow or unreachable**. We load the font stylesheets via `<link>` in `app/layout.tsx` instead — async, browser-side, with system-font fallbacks (declared in `globals.css`) so the page never blocks:

```tsx
// app/layout.tsx <head>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link
  href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,800;1,9..144,400&display=swap"
  rel="stylesheet"
/>
```

The font-family CSS variables (`--font-display`, `--font-body`, `--font-mono`, `--font-fraunces`) are declared in `globals.css` with system-font fallbacks. `app/fonts.ts` is a comment-only file documenting this decision.

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

### Session tags (carry through from print but darker-mode optimised)
- Easy: background `--session-easy` at 15% opacity, text `--session-easy`, border `1px solid currentColor` at 30%
- Hard: same pattern with `--session-hard`
- Long: same pattern with `--session-long`
- `font-mono`, 10px, uppercase, letter-spacing 0.08em
- Padding `3px 8px`, radius `4px`

### Macro pills (in-app version — distinct from print)
- Inline-flex, `font-mono` 11px
- Carbs: `--session-long` text colour on `--session-long` 12% background
- Protein: `--accent` text colour on `--accent-muted` background
- Radius `4px`, padding `2px 7px`

### Navigation
- Top app bar: `--surface-0` background, `--border-subtle` bottom border, `64px` tall, sticky
- Logo wordmark: `font-display`, 18px, weight 800, slight negative tracking
- Nav links: `font-mono` 11px uppercase letter-spacing 0.1em
- Active link: small `--accent` underline 2px

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

### Plan editor (on-screen, not print)
- **Mobile (default <768px):** swipeable day-by-day. One day per screen, large day name + session tag at top, 5 meal cards stacked. Swipe left/right to change day. Dots indicator at bottom.
- **Desktop (≥768px):** weekly grid as in spec, but darker — `--surface-1` cells with `--border-default` dividers, session row uses coloured tags. Critical meals get a 2px left border in `--accent`, not red.
- **Edit interaction:** tap any meal → bottom sheet on mobile, popover on desktop. Same form fields either way.
- Toolbar above the grid: monospace "Week of [date]", action buttons (Print · Regenerate · Grocery List) right-aligned.

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
- [ ] Print routes (`/plan/[weekId]/print`, `/grocery/[weekId]/print`) are COMPLETELY UNCHANGED — still editorial Fraunces + cream background

If any of these fail, fix before declaring this addendum complete.
