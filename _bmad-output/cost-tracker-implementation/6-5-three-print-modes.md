---
story_key: 6-5-three-print-modes
status: done
epic: 6
story_number: 6.5
---

# Story 6.5: Three Print Modes

## Story

As Niel (strategic contributor) preparing the board pack,
I want three provenance modes for the printed export,
So that external audiences see clean numbers while internal audits get the full trail.

## Acceptance Criteria

**Given** I am on the Dashboard view,
**When** I open the print mode selector,
**Then** I can choose: numbers only / numbers with footnotes / full provenance appendix.

**And** the selector sets a `body` class (`print-numbers-only`, `print-with-footnotes`, `print-full-provenance`) which the print stylesheet uses to switch variants.

**And** "numbers with footnotes" mode renders a footnote section listing each Resolved assumption with its `decided_on` date and `rationale`.

**And** "full provenance appendix" mode adds a new page with every Resolved assumption and its complete fields.

**And** Proposed and Under Discussion (and Superseded/Withdrawn) assumptions never appear in any print mode.

## Tasks/Subtasks

- [x] Task 1: Logic — extend `window.__WWCT__` destructure with `useState` + `useEffect`; import `exportPrintView` from `file-io.js`; add `printMode` state (`'print-with-footnotes'` default), `handlePrint` function, and `afterprint` cleanup effect in `DashboardView`
- [x] Task 2: Mode selector JSX — replace the single `dashboard__print-btn` in the page-header with a `.dashboard__print-controls` group containing a segmented mode selector + "Print board pack" button
- [x] Task 3: Footnotes JSX — add `resolvedAssumptions` useMemo (filters `assumptions` to `status === 'Resolved'`, sorted by category then label); add `.dashboard__print-footnotes` section after the movers panel inside `.dashboard`
- [x] Task 4: Appendix JSX — add `.dashboard__print-appendix` section after the footnotes section inside `.dashboard`
- [x] Task 5: CSS — add print controls + mode button styles to `app.css`; add footnotes + appendix print rules to `print-board.css`

## Dev Notes

### Files to change

- `cost-tracker/src/components/dashboard/dashboard-view.js` — Tasks 1–4
- `cost-tracker/public/css/app.css` — Task 5 (screen side)
- `cost-tracker/public/css/print-board.css` — Task 5 (print side)

No new files. No new imports beyond what's listed below.

---

### Task 1: Logic layer

**Extend the destructure at line 1:**
```js
const { html, useMemo, useState, useEffect } = window.__WWCT__;
```

**Add import for `exportPrintView` after the existing imports:**
```js
import { exportPrintView } from '../../state/file-io.js';
```

`exportPrintView(mode)` already exists in `file-io.js`:
```js
export function exportPrintView(mode = 'print-with-footnotes') {
  const MODES = ['print-numbers-only', 'print-with-footnotes', 'print-full-provenance'];
  MODES.forEach(m => document.body.classList.remove(m));
  document.body.classList.add(mode);
  window.print();
}
```
It handles the body class toggle before calling `window.print()`. Do NOT re-implement this logic — just import and call it.

**Add inside `DashboardView()`, alongside the existing memos:**
```js
const [printMode, setPrintMode] = useState('print-with-footnotes');

useEffect(() => {
  const cleanup = () => {
    ['print-numbers-only', 'print-with-footnotes', 'print-full-provenance']
      .forEach(m => document.body.classList.remove(m));
  };
  window.addEventListener('afterprint', cleanup);
  return () => window.removeEventListener('afterprint', cleanup);
}, []);

const handlePrint = () => exportPrintView(printMode);
```

The `afterprint` event fires after the print dialog closes, cleaning up the body class so the live view is unaffected.

---

### Task 2: Mode selector JSX

The current page-header (added in Story 6.4):
```jsx
<div class="page-header">
  <h1 class="page-header__title">Dashboard</h1>
  <button class="btn btn--outline dashboard__print-btn" onClick=${() => window.print()}>
    Print board pack
  </button>
</div>
```

Replace with:
```jsx
<div class="page-header">
  <h1 class="page-header__title">Dashboard</h1>
  <div class="dashboard__print-controls">
    <span class="dashboard__print-mode-label">Print mode</span>
    <div class="dashboard__print-mode-btns">
      ${[
        { mode: 'print-numbers-only',    label: 'Numbers only'    },
        { mode: 'print-with-footnotes',  label: 'With footnotes'  },
        { mode: 'print-full-provenance', label: 'Full provenance' },
      ].map(({ mode, label }) => html`
        <button
          key=${mode}
          class=${'dashboard__print-mode-btn' + (printMode === mode ? ' dashboard__print-mode-btn--active' : '')}
          onClick=${() => setPrintMode(mode)}
        >
          ${label}
        </button>
      `)}
    </div>
    <button class="btn btn--outline dashboard__print-btn" onClick=${handlePrint}>
      Print board pack
    </button>
  </div>
</div>
```

The `.dashboard__print-controls` group takes `margin-left: auto` (previously on `.dashboard__print-btn` directly). The `dashboard__print-btn` no longer needs `margin-left: auto` since its parent handles alignment.

---

### Task 3: Footnotes JSX

**Add `resolvedAssumptions` useMemo** alongside the existing `categoryRows` and `topMovers` memos:
```js
const resolvedAssumptions = useMemo(
  () => Object.values(assumptions)
    .filter(a => a.status === 'Resolved')
    .sort((a, b) =>
      (a.category || '').localeCompare(b.category || '') ||
      (a.label || '').localeCompare(b.label || '')
    ),
  [assumptions],
);
```

`STATUS.RESOLVED = 'Resolved'` (capital R, string — from `src/state/assumptions.js`). Do NOT use a constant import — just use the string literal `'Resolved'`.

Only `Resolved` assumptions appear. `Proposed`, `Under Discussion`, `Superseded`, `Withdrawn` are all excluded.

**Add footnotes section** inside `<div class="dashboard">` after `.dashboard__movers-panel`:
```jsx
<div class="dashboard__print-footnotes">
  <div class="dashboard__print-section-title">Footnotes — assumption basis</div>
  ${resolvedAssumptions.length === 0
    ? html`<p class="dashboard__print-empty">No resolved assumptions in this workbook.</p>`
    : html`
      <div class="dashboard__print-fn-grid">
        <div class="dashboard__print-fn-header">
          <span class="dashboard__print-fn-cell dashboard__print-fn-cell--num">#</span>
          <span class="dashboard__print-fn-cell">Assumption</span>
          <span class="dashboard__print-fn-cell">Value</span>
          <span class="dashboard__print-fn-cell">Decided</span>
          <span class="dashboard__print-fn-cell dashboard__print-fn-cell--wide">Rationale</span>
        </div>
        ${resolvedAssumptions.map((a, i) => html`
          <div key=${a.id} class="dashboard__print-fn-row">
            <span class="dashboard__print-fn-cell dashboard__print-fn-cell--num">${i + 1}</span>
            <span class="dashboard__print-fn-cell">
              <span class="dashboard__print-fn-label">${a.label}</span>
              ${a.category ? html`<span class="dashboard__print-fn-cat">${a.category}</span>` : ''}
            </span>
            <span class="dashboard__print-fn-cell">
              ${a.value}${a.unit ? html` <span class="dashboard__print-fn-unit">${a.unit}</span>` : ''}
            </span>
            <span class="dashboard__print-fn-cell">${fmt.date(a.decided_on)}</span>
            <span class="dashboard__print-fn-cell dashboard__print-fn-cell--wide">${a.rationale || '—'}</span>
          </div>
        `)}
      </div>
    `}
</div>
```

`fmt.date(iso)` is already imported and formats to `"14 May 2026"` style.

---

### Task 4: Appendix JSX

Add appendix section **after the footnotes section**, still inside `<div class="dashboard">`:
```jsx
<div class="dashboard__print-appendix">
  <div class="dashboard__print-section-title">Assumption appendix — full provenance</div>
  ${resolvedAssumptions.length === 0
    ? html`<p class="dashboard__print-empty">No resolved assumptions in this workbook.</p>`
    : resolvedAssumptions.map(a => html`
      <div key=${a.id} class="dashboard__print-appendix-entry">
        <div class="dashboard__print-appendix-header">
          <span class="dashboard__print-appendix-label">${a.label}</span>
          <span class="dashboard__print-appendix-key">${a.key}</span>
        </div>
        <table class="dashboard__print-appendix-table">
          <tbody>
            <tr><td>Value</td><td>${a.value}${a.unit ? ' ' + a.unit : ''}</td></tr>
            <tr><td>Category</td><td>${a.category || '—'}</td></tr>
            <tr><td>Author</td><td>${a.author || '—'}</td></tr>
            <tr><td>Decided on</td><td>${fmt.date(a.decided_on)}</td></tr>
            <tr><td>Source</td><td>${a.source || '—'}</td></tr>
            <tr><td>Rationale</td><td>${a.rationale || '—'}</td></tr>
            <tr><td>Confidence</td><td>${a.confidence || '—'}</td></tr>
            <tr><td>Effective from</td><td>${a.effective_from || '—'}</td></tr>
            <tr><td>Effective to</td><td>${a.effective_to || '—'}</td></tr>
            <tr><td>Applies to</td><td>${Array.isArray(a.applies_to) && a.applies_to.length ? a.applies_to.join(', ') : '—'}</td></tr>
            ${a.supersedes ? html`<tr><td>Supersedes</td><td>${a.supersedes}</td></tr>` : ''}
          </tbody>
        </table>
      </div>
    `)
  }
</div>
```

---

### Task 5: CSS

#### app.css — add after the existing `.dashboard__print-btn` rule

The existing `.dashboard__print-btn` rule currently has `margin-left: auto; align-self: center`. Remove `margin-left: auto` from it (the parent `.dashboard__print-controls` takes that responsibility). Add the new block:

```css
.dashboard__print-controls {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.dashboard__print-mode-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.dashboard__print-mode-btns {
  display: flex;
}

.dashboard__print-mode-btn {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  background: transparent;
  font-size: var(--font-size-xs);
  font-family: var(--font-ui);
  color: var(--color-text-secondary);
  cursor: pointer;
  line-height: 1.5;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.dashboard__print-mode-btns .dashboard__print-mode-btn:first-child {
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
}

.dashboard__print-mode-btns .dashboard__print-mode-btn:last-child {
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.dashboard__print-mode-btns .dashboard__print-mode-btn + .dashboard__print-mode-btn {
  margin-left: -1px;
}

.dashboard__print-mode-btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.dashboard__print-footnotes,
.dashboard__print-appendix {
  display: none;
}
```

#### print-board.css — add before the closing `}` of the `@media print` block

```css
  /* ── Print mode sections ────────────────────────────────────────────────── */

  .dashboard__print-section-title {
    font-size: 10pt;
    font-weight: 700;
    color: #009898;
    margin-bottom: 6pt;
    padding-bottom: 3pt;
    border-bottom: 1pt solid #009898;
  }

  .dashboard__print-empty {
    font-size: 8.5pt;
    color: #888;
    font-style: italic;
  }

  /* Footnotes: visible only in with-footnotes mode */
  body.print-with-footnotes .dashboard__print-footnotes {
    display: block !important;
    margin-top: 10pt;
    page-break-inside: avoid;
  }

  .dashboard__print-fn-grid {
    display: flex;
    flex-direction: column;
  }

  .dashboard__print-fn-header,
  .dashboard__print-fn-row {
    display: grid;
    grid-template-columns: 16pt 110pt 44pt 52pt 1fr;
    gap: 4pt;
    padding: 2.5pt 0;
    border-bottom: 0.5pt solid #eee;
    align-items: baseline;
  }

  .dashboard__print-fn-row:last-child {
    border-bottom: none;
  }

  .dashboard__print-fn-header {
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #666;
    border-bottom-color: #ccc;
  }

  .dashboard__print-fn-cell {
    font-size: 8.5pt;
    color: #222;
  }

  .dashboard__print-fn-cell--num {
    font-size: 7.5pt;
    color: #999;
    text-align: right;
  }

  .dashboard__print-fn-cell--wide {
    color: #444;
  }

  .dashboard__print-fn-label {
    display: block;
    font-size: 8.5pt;
    font-weight: 600;
    color: #000;
  }

  .dashboard__print-fn-cat {
    display: block;
    font-size: 7pt;
    color: #888;
  }

  .dashboard__print-fn-unit {
    font-size: 7.5pt;
    color: #666;
  }

  /* Appendix: visible only in full-provenance mode, starts new page */
  body.print-full-provenance .dashboard__print-appendix {
    display: block !important;
    page-break-before: always;
  }

  .dashboard__print-appendix-entry {
    margin-bottom: 8pt;
    page-break-inside: avoid;
  }

  .dashboard__print-appendix-header {
    display: flex;
    align-items: baseline;
    gap: 6pt;
    margin-bottom: 3pt;
  }

  .dashboard__print-appendix-label {
    font-size: 9.5pt;
    font-weight: 700;
    color: #000;
  }

  .dashboard__print-appendix-key {
    font-size: 7.5pt;
    color: #888;
    font-family: 'Courier New', monospace;
  }

  .dashboard__print-appendix-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
  }

  .dashboard__print-appendix-table td {
    padding: 1.5pt 4pt;
    border: 0.5pt solid #ddd;
    vertical-align: top;
  }

  .dashboard__print-appendix-table td:first-child {
    font-weight: 600;
    color: #444;
    width: 60pt;
    white-space: nowrap;
  }
```

---

### Ordering in dashboard JSX

The complete section order inside `<div class="dashboard">` after this story:

1. `.dashboard__print-header` (print-only logo strip — from Story 6.4)
2. `.dashboard__headline` (KPI panel)
3. `.dashboard__scenario-ticker` (scenario switcher)
4. `.dashboard__savings-panel`
5. `.dashboard__category-panel`
6. `.dashboard__movers-panel`
7. `.dashboard__print-footnotes` ← NEW (hidden in screen; shown in print-with-footnotes)
8. `.dashboard__print-appendix` ← NEW (hidden in screen; shown in print-full-provenance, new page)

---

### Important: don't break Story 6.4 changes

- Keep `.dashboard__print-header` exactly as-is
- Keep `.dashboard__print-btn` in the controls group (just update its positioning)
- The body class cleanup via `afterprint` is additive — it doesn't affect screen rendering because all print rules are inside `@media print`

### Seed workbook — expected resolved assumptions

With the seed workbook loaded and the Optimal Maximum scenario active, resolved assumptions will include the scenario discount rate and any other assumptions that have been resolved through the decision drawer. The seed workbook has these assumptions resolved by default (from Story 1.7):
- Scenario discount rates (minimum, primary, optimal)
- Seat count growth assumptions

If no assumptions are resolved in the workbook, the footnotes section shows "No resolved assumptions in this workbook." (the empty state) — this is correct behaviour.

### Regression safety

- Mode selector replaces the single `window.print()` button — no other views are affected
- Footnotes and appendix sections are `display: none` in screen CSS — zero visual impact on live view
- `afterprint` cleanup is purely additive DOM manipulation
- `exportPrintView` already existed in `file-io.js` — no behaviour change to existing code

## Dev Agent Record

### Debug Log

_empty_

### Completion Notes

`window.__WWCT__` destructure extended with `useState` and `useEffect`. `exportPrintView` imported from `file-io.js` (already implemented there — removes/adds body class then calls `window.print()`).

`printMode` state defaults to `'print-with-footnotes'`. `handlePrint` calls `exportPrintView(printMode)`. `useEffect` registers an `afterprint` listener that strips all three mode classes from `document.body` on cleanup and on component unmount.

`resolvedAssumptions` useMemo filters `Object.values(assumptions)` to `status === 'Resolved'`, sorted by category then label. Used by both footnotes and appendix sections.

Single `dashboard__print-btn` replaced with `.dashboard__print-controls` group: "Print mode" label + segmented three-button control (Numbers only / With footnotes / Full provenance) + "Print board pack" button. Active mode shown with teal background via `.dashboard__print-mode-btn--active`.

`.dashboard__print-footnotes` section added after movers panel — grid layout (# | Assumption+category | Value | Decided | Rationale) with one row per resolved assumption. Hidden in screen via `display: none` in app.css; shown via `body.print-with-footnotes .dashboard__print-footnotes { display: block !important }` in print-board.css.

`.dashboard__print-appendix` section added after footnotes — one card per resolved assumption with full fields table. Forces new page via `page-break-before: always`. Hidden in screen; shown via `body.print-full-provenance .dashboard__print-appendix { display: block !important }` in print-board.css.

## File List

- `cost-tracker/src/components/dashboard/dashboard-view.js`
- `cost-tracker/public/css/app.css`
- `cost-tracker/public/css/print-board.css`

## Change Log

- 2026-05-14: Story created and implemented
