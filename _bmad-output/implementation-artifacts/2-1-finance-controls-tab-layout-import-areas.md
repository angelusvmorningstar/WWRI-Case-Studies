# Story 2.1: Finance Controls Tab Layout & Import Areas

Status: review

## Story

As a user,
I want a Controls tab with clearly labelled import areas for each Xero CSV type,
so that I know exactly where to paste each export and can import them one at a time.

## Acceptance Criteria

1. Controls tab displays import areas for: Balance Sheet AU, Balance Sheet EU, P&L AU Month, P&L AU YTD, P&L EU Month, P&L EU YTD, and Invoices
2. Each import area contains: a label identifying the CSV type, a `<textarea>` with monospace font and placeholder text describing the expected format (UX-DR6), and a primary Import button (UX-DR9)
3. `finance-controls.js` exports a `render(container)` function as its sole public interface
4. `finance-controls.css` is created in `public/css/finance/` using BEM-lite naming and theme.css custom properties (NFR6, NFR7)
5. The textarea retains pasted content on parse error so the user can inspect it (UX-DR6)
6. The textarea is cleared after a successful import (UX-DR6)
7. Navigating to the Finance Controls tab renders this module instead of the placeholder
8. No file exceeds 500 lines (NFR4, NFR5)

## Tasks / Subtasks

- [x] Task 1: Create finance-controls.js render function (AC: #1, #2, #3)
  - [x] Export render(container) function
  - [x] Render 7 import areas with labels, textareas, and Import buttons
  - [x] Each textarea has monospace font placeholder describing expected format
  - [x] Each Import button is styled as .btn--primary
  - [x] Add section heading and brief instructions at top
  - [x] Add empty container for import feedback banners (Story 2.3 will populate)
  - [x] Add empty containers for FX/ref data (Story 2.4) and backup/restore (Story 2.5)
  - [x] Wire up Import button click handlers — for now, just clear textarea on click (actual parsing in Story 2.2)
- [x] Task 2: Create finance-controls.css (AC: #4, #8)
  - [x] .finance-controls layout styles
  - [x] .finance-controls__section — section groupings
  - [x] .finance-controls__heading — section headings
  - [x] Import areas use shared .import-area, .form-textarea, .form-label, .btn classes from forms.css
  - [x] Additional layout-specific styles only (no duplication of shared styles)
- [x] Task 3: Wire into app.js (AC: #7)
  - [x] Import finance-controls render function in app.js
  - [x] Update renderTabContent to call finance-controls.render() for the Controls tab in Finance mode
  - [x] Other tabs continue to show placeholder content
- [x] Task 4: Validate (AC: #5, #6, #8)
  - [x] Textarea retains content on error (default behaviour — Story 2.2 will handle parse errors)
  - [x] Textarea clears after successful import (placeholder: clears on button click for now)
  - [x] No file exceeds 500 lines

## Dev Notes

### The 7 Xero CSV import types

| Import Label | Description | Placeholder Text |
|-------------|-------------|-----------------|
| Balance Sheet AU | Xero Balance Sheet — Australian entity | Paste Xero Balance Sheet AU CSV here |
| Balance Sheet EU | Xero Balance Sheet — European entity | Paste Xero Balance Sheet EU CSV here |
| P&L AU Month | Xero Profit & Loss — AU current month | Paste Xero P&L AU Month CSV here |
| P&L AU YTD | Xero Profit & Loss — AU year to date | Paste Xero P&L AU YTD CSV here |
| P&L EU Month | Xero Profit & Loss — EU current month | Paste Xero P&L EU Month CSV here |
| P&L EU YTD | Xero Profit & Loss — EU year to date | Paste Xero P&L EU YTD CSV here |
| Invoices | Xero invoice data for project reconciliation | Paste Xero Invoice CSV here |

### Controls tab layout structure

The Controls tab has several sections that will be built across Stories 2.1–2.5:

```
┌─ Controls Tab ─────────────────────────────────┐
│                                                 │
│  [Import Feedback Banners]     ← Story 2.3      │
│                                                 │
│  ── Data Import ──────────────                  │
│  [Balance Sheet AU import area]                 │
│  [Balance Sheet EU import area]                 │
│  [P&L AU Month import area]                     │
│  [P&L AU YTD import area]                       │
│  [P&L EU Month import area]                     │
│  [P&L EU YTD import area]                       │
│  [Invoices import area]        ← Story 2.1      │
│                                                 │
│  ── Reference Data ───────────                  │
│  [FX Rates editor]                              │
│  [Client Defaults editor]      ← Story 2.4      │
│                                                 │
│  ── Data Management ──────────                  │
│  [Export Backup button]                         │
│  [Restore from Backup]         ← Story 2.5      │
│                                                 │
│  ── Activity Log ─────────────                  │
│  [Import history log]          ← Story 2.3      │
│                                                 │
└─────────────────────────────────────────────────┘
```

Story 2.1 builds the full layout with placeholder sections for 2.3–2.5. This means the render function creates the container divs with IDs that later stories can populate, but they show "Coming in Story X.Y" for now.

### Import area HTML pattern

Each import area follows this structure using shared CSS classes from forms.css:

```html
<div class="import-area">
  <label class="form-label" for="import-bs-au">Balance Sheet AU</label>
  <textarea class="form-textarea" id="import-bs-au"
            placeholder="Paste Xero Balance Sheet AU CSV here"></textarea>
  <button class="btn btn--primary" type="button" data-import-type="bs-au">Import</button>
</div>
```

### Import type identifiers

Use `data-import-type` attribute on buttons to identify which import was clicked:

| data-import-type | Import |
|-----------------|--------|
| bs-au | Balance Sheet AU |
| bs-eu | Balance Sheet EU |
| pl-au-month | P&L AU Month |
| pl-au-ytd | P&L AU YTD |
| pl-eu-month | P&L EU Month |
| pl-eu-ytd | P&L EU YTD |
| invoices | Invoices |

### Wiring into app.js

app.js currently renders placeholder content for all tabs. For this story, update app.js to:

1. Import the finance-controls module: `import { render as renderFinanceControls } from './finance/finance-controls.js';`
2. In `renderTabContent()`, check if the current mode is 'finance' and tab ID is 'controls'
3. If so, call `renderFinanceControls(content)` instead of showing the placeholder
4. All other tabs continue to show placeholder content

**Pattern for future tab wiring:** Each story that implements a tab module will follow this same pattern — import in app.js, add a condition to renderTabContent. Keep the imports at the top of app.js.

### Architecture patterns

- finance-controls.js: `public/js/finance/finance-controls.js`
- finance-controls.css: `public/css/finance/finance-controls.css`
- Tab module pattern: export `render(container)` — sets `container.innerHTML` and binds events
- Events bound INSIDE the render function, not centralised
- Use `const` by default, named exports, `.js` in import paths
- CSS: BEM-lite, theme.css custom properties, no hex, no !important

### Previous Story Intelligence

- Story 1.4: app.js (144 lines) has renderTabContent() function with placeholder content. Mode and tab routing works.
- Story 1.5: forms.css has .import-area, .form-textarea, .form-label, .btn, .btn--primary classes ready to use.
- All shared CSS loaded in index.html.

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy] — Import Area component (#6)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns] — CSV paste textarea, monospace font
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — tab render(container) pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No issues encountered.

### Completion Notes List

- finance-controls.js (97 lines): render(container) with 7 import areas (BS AU/EU, P&L AU/EU month/YTD, Invoices). Placeholder sections for ref data, backup, activity log.
- finance-controls.css (38 lines): layout-only styles, composes shared forms.css classes. No duplication.
- app.js updated (152 lines): imports finance-controls, routes Finance Controls tab to real module. Other tabs still show placeholders.
- index.html updated: added finance-controls.css link.
- Import buttons clear textarea on click (placeholder behaviour until Story 2.2 adds real parsing).

### Change Log

- 2026-03-30: Story 2.1 implemented — Finance Controls tab layout with 7 import areas

### File List

- public/js/finance/finance-controls.js (97 lines — modified from placeholder)
- public/css/finance/finance-controls.css (38 lines — modified from placeholder)
- public/js/app.js (152 lines — modified: added finance-controls import and routing)
- public/index.html (45 lines — modified: added finance-controls.css link)
