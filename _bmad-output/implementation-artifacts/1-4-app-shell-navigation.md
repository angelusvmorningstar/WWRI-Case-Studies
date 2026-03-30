# Story 1.4: App Shell & Navigation

Status: review

## Story

As a user,
I want to open the app and switch between Finance Report and Pipeline Report modes with tab navigation,
so that I can access any part of the toolkit with one click.

## Acceptance Criteria

1. App shell renders with: header containing logo text and pill mode switcher, tab bar below the header, and a content area — all inner content constrained to `max-width: 1200px` centred (UX-DR2)
2. Finance Report mode is active by default
3. Finance tab bar shows: Dashboard, Cash Forecast, Revenue Pipeline, Controls, Print (UX-DR17)
4. Clicking the Pipeline Report pill swaps the tab bar to Pipeline tabs: Pipeline, Performance, Forecasting, Leads, History, Controls, Print
5. Switch is instant — no loading state, no confirmation dialog (FR14, UX-DR17)
6. Clicking a tab renders that tab's content (or empty state placeholder for now) and updates the active underline (FR15)
7. Active tab shows teal underline and bold weight (UX-DR2)
8. Keyboard Tab key moves through interactive elements in logical order with visible focus indicators (UX-DR16)
9. Mode switcher pills and tab buttons are `<button>` elements with appropriate ARIA attributes (NFR13)
10. `app.js` is the sole module that knows which tabs exist and routes between them
11. `layout.css` uses CSS custom properties from `theme.css` for all colour values (NFR6)
12. `store.init()` is called at startup before any tab renders
13. No file exceeds 500 lines (NFR4, NFR5)

## Tasks / Subtasks

- [x] Task 1: Create index.html app shell (AC: #1, #9)
  - [x] DOCTYPE, meta viewport, charset
  - [x] Link theme.css, layout.css, and shared component CSS files
  - [x] Script tag for app.js with type="module"
  - [x] Header: logo text + pill mode switcher container
  - [x] Tab bar container
  - [x] Content area (main element)
  - [x] All inner wrappers constrained to max-width 1200px
  - [x] Semantic HTML: nav for tab bar, main for content, header for header
  - [x] ARIA: role="tablist" on tab bar, role="tab" on tab buttons, aria-selected
- [x] Task 2: Create app.js — mode switcher and tab router (AC: #2, #3, #4, #5, #6, #10, #12)
  - [x] Import store.init and call at startup
  - [x] Define Finance tabs: Dashboard, Cash Forecast, Revenue Pipeline, Controls, Print
  - [x] Define Pipeline tabs: Pipeline, Performance, Forecasting, Leads, History, Controls, Print
  - [x] Mode switcher click handler — swap tab bar, render default tab
  - [x] Tab click handler — render tab content, update active state
  - [x] Placeholder content for each tab (simple heading + "Coming in Story X.Y" message)
  - [x] Default to Finance mode, Dashboard tab on load
- [x] Task 3: Create layout.css (AC: #1, #7, #8, #11, #13)
  - [x] App header: full-width bg, inner content 1200px centred
  - [x] Logo text styling
  - [x] Pill mode switcher: segmented control, active pill highlighted
  - [x] Tab bar: full-width bg, inner content 1200px centred
  - [x] Tab buttons: underline style, active state with teal underline + bold
  - [x] Content area: 1200px max-width centred, page background
  - [x] Focus states on all interactive elements (--color-primary border + --color-focus-ring shadow)
  - [x] All colours from theme.css custom properties
- [x] Task 4: Validate (AC: #8, #9, #13)
  - [x] Keyboard navigation works through mode switcher and tabs
  - [x] All buttons are semantic <button> elements
  - [x] No file exceeds 500 lines
  - [x] No hardcoded hex colours in layout.css

## Dev Notes

### index.html structure

The UX spec (Direction C) defines this layout:

```
┌─────────────────────────────────────────────────┐
│  Header (full-width bg: --color-bg-surface)     │
│  ┌──────────── max-width: 1200px ────────────┐  │
│  │ Logo    [Pipeline Report | Finance Report] │  │
│  └───────────────────────────────────────────-┘  │
├─────────────────────────────────────────────────┤
│  Tab bar (full-width bg: --color-bg-surface)    │
│  ┌──────────── max-width: 1200px ────────────┐  │
│  │ Dashboard | Cash Forecast | Revenue | ...  │  │
│  └────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  Content area (full-width bg: --color-bg-page)  │
│  ┌──────────── max-width: 1200px ────────────┐  │
│  │                                            │  │
│  │  [Tab content renders here]                │  │
│  │                                            │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### CSS class names (BEM-lite)

From the UX spec component definitions:

- `.app-header` — full-width header row
- `.app-header__inner` — 1200px centred inner wrapper
- `.app-header__logo` — logo text
- `.mode-switcher` — pill container
- `.mode-switcher__btn` — individual pill button
- `.mode-switcher__btn--active` — active pill state
- `.tab-bar` — full-width tab row
- `.tab-bar__inner` — 1200px centred inner wrapper
- `.tab-bar__btn` — individual tab button
- `.tab-bar__btn--active` — active tab with teal underline
- `.app-content` — content area wrapper (1200px centred)

### Pill mode switcher styling

From UX spec:
- Container: `background: var(--color-bg-page)`, border-radius for pill shape
- Active pill: `background: var(--color-bg-surface)`, subtle box-shadow, teal text
- Inactive pill: muted text, transparent background
- No confirmation dialog on switch — instant

### Tab bar styling

From UX spec:
- Tab buttons: `border-bottom: 2px solid transparent`
- Active tab: `border-bottom-color: var(--color-primary)`, `font-weight: var(--font-weight-semibold)`, `color: var(--color-primary)`
- Inactive: `color: var(--color-text-secondary)`
- Hover: `color: var(--color-text-primary)`

### app.js — Tab module loading strategy

For now (Story 1.4), tabs render placeholder content. In later stories, each tab module will export a `render(container)` function. app.js will dynamically import and call these as they're built.

**Current approach:** app.js sets `innerHTML` of the content area with a simple placeholder for each tab. When a real tab module is implemented in a later story, app.js will be updated to import and call its `render()` function instead.

**Do NOT import the placeholder tab modules** — they contain only comments. Just render placeholder HTML directly.

### app.js — store.init() at startup

```javascript
import { init } from './shared/store.js';

document.addEventListener('DOMContentLoaded', async () => {
  await init();
  // Then set up mode switcher, render default tab
});
```

### Finance Report tabs (left to right)

| Tab Label | Future Module | Story |
|-----------|--------------|-------|
| Dashboard | finance/dashboard.js | 3.1 |
| Cash Forecast | finance/cash-forecast.js | 3.2 |
| Revenue Pipeline | finance/revenue-pipeline.js | 3.5 |
| Controls | finance/finance-controls.js | 2.1 |
| Print | finance/finance-print.js | 4.2 |

### Pipeline Report tabs (left to right)

| Tab Label | Future Module | Story |
|-----------|--------------|-------|
| Pipeline | pipeline/pipeline.js | 5.2 |
| Performance | pipeline/performance.js | 5.3 |
| Forecasting | pipeline/forecasting.js | 5.3 |
| Leads | pipeline/leads.js | 5.4 |
| History | pipeline/history.js | 5.5 |
| Controls | pipeline/pipeline-controls.js | 5.1 |
| Print | pipeline/pipeline-report.js | 5.6 |

### Logo text

Use "WWRI Toolkit" as text. The WWT-Logo.jpg is for print layouts (Story 4.1+), not the app header. The header uses text only.

### Previous Story Intelligence

- Story 1.1: All placeholder files exist. theme.css has all design tokens.
- Story 1.2: store.js complete with init() function that loads seed data.
- Story 1.3: format.js, fx.js, csv-parser.js complete.
- No issues in any previous story.

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Direction Decision] — Direction C layout, pill switcher + underline tabs
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy] — App Header, Tab Bar component specs
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns] — tab order, mode switching behaviour
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — app.js manages mode and tab routing

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No issues encountered.

### Completion Notes List

- index.html (44 lines): semantic HTML shell with header, nav, main. ARIA roles on mode switcher and tab bar.
- app.js (144 lines): mode switcher, tab router, store.init() at startup. Finance/Pipeline tab definitions. Placeholder content per tab.
- layout.css (169 lines): Direction C layout — pill switcher, underline tabs, 1200px constrained content. All colours from theme.css. Focus-visible states on all interactive elements. No hardcoded hex values.
- Default state: Finance mode, Dashboard tab active on load.

### Change Log

- 2026-03-30: Story 1.4 implemented — app shell with mode switcher and tab navigation

### File List

- public/index.html (44 lines — modified from placeholder)
- public/js/app.js (144 lines — modified from placeholder)
- public/css/layout.css (169 lines — modified from placeholder)
