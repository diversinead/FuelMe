// Minimal print sheet — mirrors the in-app /plan/[weekId] visual language.
// (Previously a verbatim port of /reference/fueling-plan-print.html; that
// editorial Fraunces direction has been retired for the plan view. Tokens
// here are light-mode only since the printed page is always white paper.)
export const planPrintCss = `
@page {
  size: A4 landscape;
  margin: 8mm;
}

.sheet {
  /* Print tokens — kept scoped so they don't leak into the dark app shell. */
  --ink: #18181b;
  --ink-secondary: #52525b;
  --ink-tertiary: #71717a;
  --paper: #ffffff;
  --border: #d4d4d8;

  --macro-carbs: #BA7517;
  --macro-protein: #0F6E56;

  --session-pill-neutral-bg: #f4f4f5;
  --session-pill-neutral-fg: #52525b;
  --session-pill-hard-bg: #FCEBEB;
  --session-pill-hard-fg: #791F1F;
  --session-pill-long-bg: #E6F1FB;
  --session-pill-long-fg: #0C447C;

  width: 100%;
  margin: 0 auto;
  background: var(--paper);
  color: var(--ink);
  font-family: 'Manrope', 'Inter', system-ui, sans-serif;
  font-size: 11px;
  line-height: 1.5;
}

.sheet * { box-sizing: border-box; }

/* Header strip */
.sheet header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 14px;
  margin-bottom: 18px;
  border-bottom: 0.5px solid var(--border);
}

.sheet .meta {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink-tertiary);
}

.sheet h1 {
  font-size: 20px;
  font-weight: 500;
  color: var(--ink);
  margin: 4px 0 0 0;
  line-height: 1;
  letter-spacing: -0.01em;
}

.sheet .legend {
  display: flex;
  gap: 18px;
  align-items: center;
  font-size: 11px;
  color: var(--ink-secondary);
}

.sheet .legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.sheet .legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* Plan grid */
.sheet .plan-grid {
  display: grid;
  grid-template-columns: 80px repeat(7, minmax(0, 1fr));
}

.sheet .plan-grid > * {
  padding: 10px 8px;
}

.sheet .corner-cell,
.sheet .day-cell,
.sheet .slot-label,
.sheet .meal-cell {
  border-bottom: 0.5px solid var(--border);
}

.sheet .day-cell,
.sheet .meal-cell,
.sheet .total-cell {
  border-left: 0.5px solid var(--border);
}

.sheet .day-cell .day {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink-tertiary);
}

.sheet .session-pill {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 3px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 8.5px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 4px;
}

.sheet .session-pill.neutral {
  background: var(--session-pill-neutral-bg);
  color: var(--session-pill-neutral-fg);
}
.sheet .session-pill.hard {
  background: var(--session-pill-hard-bg);
  color: var(--session-pill-hard-fg);
}
.sheet .session-pill.long {
  background: var(--session-pill-long-bg);
  color: var(--session-pill-long-fg);
}

.sheet .slot-label,
.sheet .total-label {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink-tertiary);
  display: flex;
  align-items: flex-start;
}

.sheet .total-label {
  align-items: center;
}

.sheet .meal-cell {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 62px;
}

.sheet .meal-food {
  font-size: 10.5px;
  color: var(--ink);
  line-height: 1.4;
}

.sheet .meal-empty {
  color: var(--ink-tertiary);
  font-size: 11px;
}

.sheet .meal-macros,
.sheet .total-cell {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.sheet .meal-macros {
  margin-top: 6px;
  font-size: 9.5px;
}

.sheet .total-cell {
  font-size: 11px;
  font-weight: 500;
}

.sheet .macro-c { color: var(--macro-carbs); }
.sheet .macro-p { color: var(--macro-protein); }

/* Rules footer */
.sheet .rules {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 0.5px solid var(--border);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px;
}

.sheet .rule-num {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink-tertiary);
}

.sheet .rule-text {
  font-size: 10.5px;
  color: var(--ink-secondary);
  margin-top: 4px;
  line-height: 1.5;
}

/* On-screen preview controls — hidden in print */
.sheet .screen-toolbar {
  display: flex;
  gap: 14px;
  justify-content: space-between;
  align-items: center;
  margin-top: 18px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-tertiary);
}

.sheet .screen-toolbar a {
  color: var(--ink-tertiary);
  text-decoration: none;
}
.sheet .screen-toolbar a:hover { color: var(--ink); }

.sheet .screen-toolbar button {
  font: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
  color: var(--paper);
  background: var(--ink);
  border: none;
  padding: 8px 14px;
  cursor: pointer;
}
.sheet .screen-toolbar button:hover { background: var(--ink-secondary); }

/* Screen preview — grey backdrop, centred paper card. Overrides the dark app shell. */
@media screen {
  html, body {
    background: #ddd !important;
    color: var(--ink, #18181b);
  }
  body {
    padding: 20px !important;
    font-family: 'Manrope', 'Inter', system-ui, sans-serif !important;
  }
  body::before { display: none !important; }
  .sheet {
    max-width: 1100px;
    padding: 22px 26px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }
}

@media print {
  html, body {
    background: #fff !important;
    width: 100% !important;
    height: auto !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    min-height: 0 !important;
  }
  body::before { display: none !important; }
  .sheet {
    width: 100% !important;
    max-width: none !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
  }
  .sheet .plan-grid,
  .sheet .rules {
    width: 100% !important;
  }
  /* Stretch meal cells so the grid fills the A4 landscape page vertically
     instead of leaving ~80px of whitespace below the rules. */
  .sheet .meal-cell {
    min-height: 78px;
  }
  .sheet .screen-toolbar { display: none !important; }
  .sheet .session-pill,
  .sheet .legend-dot,
  .sheet .macro-c,
  .sheet .macro-p {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
`;
