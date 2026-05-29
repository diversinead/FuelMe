// Minimal print sheet — mirrors the in-app /grocery/[weekId] visual language.
// (Previously a verbatim port of /reference/weekly-grocery-list.html; that
// editorial Fraunces direction has been retired. Tokens here are light-mode
// only since the printed page is always white paper.)
export const groceryPrintCss = `
@page {
  size: A4 portrait;
  margin: 12mm 10mm;
}

.sheet {
  --ink: #18181b;
  --ink-secondary: #52525b;
  --ink-tertiary: #71717a;
  --paper: #ffffff;
  --border: #d4d4d8;

  --macro-carbs: #BA7517;
  --macro-protein: #0F6E56;

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
  padding-bottom: 12px;
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

.sheet .summary {
  text-align: right;
  font-size: 10.5px;
  color: var(--ink-secondary);
  line-height: 1.6;
}
.sheet .summary strong {
  color: var(--ink);
  font-weight: 600;
}

/* Two-column category layout */
.sheet .categories {
  column-count: 2;
  column-gap: 18px;
}

.sheet section.category {
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  page-break-inside: avoid;
  margin-bottom: 18px;
}

.sheet section.category > h2 {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink-tertiary);
  margin: 0 0 6px 0;
  padding-bottom: 4px;
  border-bottom: 0.5px solid var(--border);
}

.sheet ul.items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sheet li.item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 0.5px solid var(--border);
  font-size: 11px;
  line-height: 1.35;
}
.sheet li.item:last-child { border-bottom: none; }

.sheet .check {
  flex-shrink: 0;
  width: 11px;
  height: 11px;
  border: 0.5px solid var(--ink);
  background: var(--paper);
  margin-top: 3px;
  position: relative;
}
.sheet .check.checked {
  background: var(--ink);
}
.sheet .check.checked::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 3px;
  width: 3px;
  height: 6px;
  border: solid var(--paper);
  border-width: 0 1px 1px 0;
  transform: rotate(45deg);
}

.sheet .item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.sheet .item-name {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  align-items: baseline;
}

.sheet .item-name .name {
  color: var(--ink);
  font-weight: 500;
}

.sheet .item-name .qty {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px;
  color: var(--macro-carbs);
  font-weight: 600;
  white-space: nowrap;
}

.sheet .item-note {
  font-size: 9.5px;
  color: var(--ink-tertiary);
  font-style: italic;
}

/* Macro check section — new page */
.sheet .macro-check {
  margin-top: 22px;
  page-break-before: always;
  break-before: page;
}

.sheet .macro-check h2,
.sheet .notes h2 {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink);
  margin: 0 0 10px 0;
}

.sheet .macro-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.sheet .macro-table thead th {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink-tertiary);
  text-align: left;
  padding: 6px 8px;
  border-bottom: 0.5px solid var(--border);
}

.sheet .macro-table tbody td {
  padding: 6px 8px;
  border-bottom: 0.5px solid var(--border);
  vertical-align: middle;
}
.sheet .macro-table tbody tr:last-child td { border-bottom: none; }

.sheet .macro-table .day-name {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-secondary);
}

.sheet .macro-table .num {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-weight: 600;
}

.sheet .macro-table .num.carbs   { color: var(--macro-carbs); }
.sheet .macro-table .num.protein { color: var(--macro-protein); }

.sheet .macro-table .tag {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 9.5px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-tertiary);
}

.sheet .macro-footnote {
  font-size: 10.5px;
  color: var(--ink-tertiary);
  font-style: italic;
  margin-top: 10px;
  line-height: 1.5;
}

/* Notes */
.sheet .notes { margin-top: 22px; }

.sheet .notes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sheet .note-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  font-size: 10.5px;
  line-height: 1.55;
}

.sheet .note-num {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ink-tertiary);
  white-space: nowrap;
  padding-top: 2px;
  min-width: 48px;
}

.sheet .note-text { color: var(--ink-secondary); }
.sheet .note-text strong {
  color: var(--ink);
  font-weight: 600;
}

/* Screen toolbar — hidden in print */
.sheet .screen-toolbar {
  display: flex;
  gap: 14px;
  justify-content: space-between;
  align-items: center;
  margin-top: 22px;
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

/* Screen preview */
@media screen {
  html, body {
    background: #ddd !important;
    color: var(--ink, #18181b);
  }
  body {
    padding: 24px !important;
    font-family: 'Manrope', 'Inter', system-ui, sans-serif !important;
  }
  body::before { display: none !important; }
  .sheet {
    max-width: 780px;
    padding: 26px 30px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }
}

@media print {
  html, body {
    background: #fff !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  body::before { display: none !important; }
  .sheet {
    max-width: 100%;
    padding: 0;
    box-shadow: none;
  }
  .sheet .screen-toolbar { display: none; }
  .sheet .check.checked,
  .sheet .qty,
  .sheet .macro-table .num.carbs,
  .sheet .macro-table .num.protein {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
`;
