---
story_key: 6-6-export-log-and-pdf-footer-metadata
status: done
epic: 6
story_number: 6.6
---

# Story 6.6: Export Log and PDF Footer Metadata

## Story

As Bruce (Interim CFO) reviewing a board PDF later,
I want every printed page to carry its provenance,
So that I can trace any number back to the model state that produced it.

## Acceptance Criteria

**Given** I print the board pack in any mode,
**When** the print stylesheet renders,
**Then** every page footer shows: export timestamp (ISO 8601), exporter display name, active scenario id, and workbook version hash.

**And** the print action appends a new entry to the workbook's `exportLog` array with timestamp, user, mode, scenario_id.

**And** the `exportLog` entry persists in localStorage and is saved with the next Save action.

## Tasks/Subtasks

- [x] Task 1: Add `EXPORT_LOG_APPENDED` reducer case to `store.js`
- [x] Task 2: Add `computeVersionHash` helper + `printMeta` state + updated `handlePrint` in `dashboard-view.js` — computes entry, sets footer state, dispatches to store, triggers print via `requestAnimationFrame`
- [x] Task 3: Add `.dashboard__print-footer` DOM element (last child of `.dashboard`); add `import { getAuthor }` to `dashboard-view.js`
- [x] Task 4: CSS — hide footer in screen (app.css); add fixed-bottom footer in print (print-board.css)

## Dev Notes

### Files to change

- `cost-tracker/src/state/store.js` — Task 1: new reducer case
- `cost-tracker/src/components/dashboard/dashboard-view.js` — Tasks 2–3
- `cost-tracker/public/css/app.css` — Task 4
- `cost-tracker/public/css/print-board.css` — Task 4

No new files. No new external libraries.

---

### Task 1: `EXPORT_LOG_APPENDED` reducer case in store.js

`exportLog: []` is already part of `emptyWorkbook()` — the array exists in the schema. Only the reducer case is missing.

Add inside `workbookReducer` switch, before `default`:

```js
case 'EXPORT_LOG_APPENDED': {
  const entry = action.payload;
  return {
    ...state,
    exportLog: [...(state.exportLog || []), entry],
    updatedAt: new Date().toISOString(),
  };
}
```

The `state.exportLog || []` guard handles old workbooks loaded from disk that predate this field.

The `updatedAt` update ensures the next autosave (localStorage write) captures the log entry — satisfying the "persists in localStorage" AC.

---

### Task 2: Logic in dashboard-view.js

**New import** (after the existing imports):
```js
import { getAuthor } from '../../state/identity.js';
```

`getAuthor()` reads `wwct_user_name` from localStorage. It may return an empty string if the user hasn't set their name — guard with `|| 'Unknown'`.

**New module-level helper** (add at the top of the file alongside the compute helpers, NOT inside the component):

```js
function computeVersionHash(workbook) {
  const str = JSON.stringify(workbook);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, '0').slice(0, 8);
}
```

This produces a deterministic 8-char hex hash from the workbook JSON. It changes whenever any workbook field changes.

**New state in DashboardView** (alongside `printMode`):

```js
const [printMeta, setPrintMeta] = useState(null);
```

**Replace the existing `handlePrint`** (currently `const handlePrint = () => exportPrintView(printMode);`):

```js
const handlePrint = () => {
  const timestamp = new Date().toISOString();
  const user = getAuthor() || 'Unknown';
  const scenarioId = workbook.activeScenarioId || '—';
  const versionHash = computeVersionHash(workbook);
  const entry = {
    id: crypto.randomUUID(),
    timestamp,
    user,
    mode: printMode,
    scenario_id: scenarioId,
  };
  setPrintMeta({ timestamp, user, scenarioId, versionHash, mode: printMode });
  dispatch({ type: 'EXPORT_LOG_APPENDED', payload: entry });
  requestAnimationFrame(() => exportPrintView(printMode));
};
```

**Why `requestAnimationFrame`**: React batches the `setPrintMeta` and `dispatch` state updates and re-renders synchronously before the next animation frame. By calling `exportPrintView` inside `requestAnimationFrame`, the DOM will have the footer values populated before the browser opens the print dialog.

---

### Task 3: Footer DOM element in dashboard-view.js

**Place as the last child of `<div class="dashboard">`** (after `.dashboard__print-appendix`).

The footer is `null` on initial render (before any print) — use conditional rendering so it only renders once `printMeta` is set:

```jsx
${printMeta && html`
  <div class="dashboard__print-footer">
    <span class="dashboard__print-footer-left">
      ${printMeta.timestamp}
      &nbsp;·&nbsp;${printMeta.user}
      &nbsp;·&nbsp;Scenario: ${printMeta.scenarioId}
      &nbsp;·&nbsp;v.${printMeta.versionHash}
    </span>
    <span class="dashboard__print-footer-right">
      WWRI Subscription Cost Tracker
    </span>
  </div>
`}
```

Note: the `&nbsp;·&nbsp;` separators work correctly in `htm` template literals.

The footer is hidden on screen via CSS (`display: none`) and shown as a fixed-bottom element in print.

---

### Task 4: CSS

#### app.css — hide footer on screen

Add to the `.dashboard__print-footer` alongside the existing `.dashboard__print-footnotes, .dashboard__print-appendix { display: none; }` block. Replace that rule with:

```css
.dashboard__print-footnotes,
.dashboard__print-appendix,
.dashboard__print-footer {
  display: none;
}
```

#### print-board.css — fixed footer on every printed page

`position: fixed; bottom: 0` in `@media print` causes the element to repeat on every page of the PDF. Add inside the `@media print` block, before the closing `}`:

```css
  /* ── PDF page footer ────────────────────────────────────────────────────── */
  .dashboard__print-footer {
    display: flex !important;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    justify-content: space-between;
    align-items: baseline;
    font-size: 7pt;
    color: #888;
    padding-top: 3pt;
    border-top: 0.5pt solid #ccc;
  }

  .dashboard__print-footer-left {
    font-size: 7pt;
    color: #888;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 75%;
  }

  .dashboard__print-footer-right {
    font-size: 7pt;
    color: #aaa;
    white-space: nowrap;
    text-align: right;
  }
```

**Important:** `position: fixed` in print CSS is standard and supported by all modern browsers (Chrome, Edge, Safari, Firefox). The element renders anchored to the bottom of each physical page, not the logical document flow.

**Important:** Add bottom margin to the `.dashboard` container in print so the fixed footer doesn't overlap the last content panel. Add to the existing `.dashboard` print rule:

```css
  .dashboard {
    display: block;
    gap: 0;
    padding-bottom: 18pt; /* clearance for fixed footer */
  }
```

---

### Existing code state — what NOT to change

- `emptyWorkbook()` in `store.js` already has `exportLog: []` — do NOT add it again
- `exportPrintView` in `file-io.js` — unchanged; still called from `handlePrint` via `requestAnimationFrame`
- The `afterprint` cleanup in `DashboardView` (`useEffect` with `window.addEventListener('afterprint', ...)`) — unchanged; it still removes body classes after printing. It does NOT reset `printMeta` — the footer values persist in state so the footer can be inspected if needed between prints
- All other dashboard panels, memos, and JSX — unchanged

---

### Export log entry shape

```js
{
  id: string,       // crypto.randomUUID()
  timestamp: string, // ISO 8601: "2026-05-14T12:34:56.789Z"
  user: string,      // getAuthor() || 'Unknown'
  mode: string,      // 'print-numbers-only' | 'print-with-footnotes' | 'print-full-provenance'
  scenario_id: string, // workbook.activeScenarioId
}
```

No `versionHash` in the log entry — the hash is for the footer display only. The log captures who printed what and when.

---

### Footer display format

Example footer text (left side):
```
2026-05-14T12:34:56.789Z · Angelus · Scenario: scenario-primary-target · v.a1b2c3d4
```

Right side: `WWRI Subscription Cost Tracker`

---

### Regression safety

- New reducer case is purely additive — existing actions unaffected
- `printMeta` state starts null and stays null until print is triggered — no screen-side rendering change
- Fixed-bottom footer is inside `@media print` only — zero live-view impact
- `requestAnimationFrame` wrapping `exportPrintView` is a timing change to the print flow only

## Dev Agent Record

### Debug Log

_empty_

### Completion Notes

`EXPORT_LOG_APPENDED` reducer case added to `workbookReducer` in `store.js`. Appends the entry to `state.exportLog || []` (guarded for old workbooks) and bumps `updatedAt` so the next localStorage autosave captures the entry.

`computeVersionHash` module-level helper added: djb2-style hash of `JSON.stringify(workbook)` → 8-char hex string. Added as module-level function alongside the other compute helpers.

`getAuthor` imported from `identity.js`. `printMeta` state (`useState(null)`) added alongside `printMode`. `handlePrint` updated to: compute timestamp/user/scenarioId/versionHash → set `printMeta` → dispatch `EXPORT_LOG_APPENDED` → call `exportPrintView(printMode)` via `requestAnimationFrame` (ensures React flushes footer DOM before print dialog opens).

`.dashboard__print-footer` conditionally rendered as last child of `.dashboard` when `printMeta` is non-null. Shows ISO timestamp, user, scenario ID, version hash left-aligned; "WWRI Subscription Cost Tracker" right-aligned.

`print-board.css`: footer uses `position: fixed; bottom: 0` so it repeats on every printed page. `background: #fff` prevents content bleed-through. `.dashboard` print rule gets `padding-bottom: 18pt` to keep last panel clear of the footer. `app.css`: footer added to the `display: none` block alongside footnotes and appendix.

## File List

- `cost-tracker/src/state/store.js`
- `cost-tracker/src/components/dashboard/dashboard-view.js`
- `cost-tracker/public/css/app.css`
- `cost-tracker/public/css/print-board.css`

## Change Log

- 2026-05-14: Story created and implemented
