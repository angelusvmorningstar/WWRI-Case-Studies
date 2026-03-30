# Story 1.5: Shared Component Styles

Status: review

## Story

As a developer,
I want reusable CSS component styles available for tables, forms, cards, charts, and buttons,
so that all tabs render with consistent visual patterns without duplicating CSS.

## Acceptance Criteria

1. `.data-table` provides: column headers in uppercase muted text, alternating row tints, row hover, numeric columns right-aligned with monospace font (UX-DR4)
2. `.data-table__cell--editable` provides a subtle background tint to distinguish editable cells (UX-DR10)
3. `.btn--primary` renders teal background with white text (UX-DR9)
4. `.btn--ghost` renders transparent with border and muted text
5. `.btn--danger` renders red background with white text
6. All button variants show hover, focus, and disabled states
7. `.kpi-card` provides the label/value/change layout with consistent padding and visual hierarchy (UX-DR3)
8. `.chart-area` provides consistent chart container styling with title area
9. All class names follow BEM-lite convention (NFR7)
10. All colour values reference theme.css custom properties — no hardcoded hex (NFR6)
11. No use of `!important` (NFR12)
12. No single CSS file exceeds 500 lines (NFR5)

## Tasks / Subtasks

- [x] Task 1: Create tables.css (AC: #1, #2, #9, #10, #11, #12)
  - [x] .data-table-wrap — optional scrollable container
  - [x] .data-table — base table styling, border-collapse, full width
  - [x] .data-table th — uppercase, muted, medium weight, small font
  - [x] .data-table td — standard cell padding, border-bottom
  - [x] .data-table td.num — right-aligned, monospace font
  - [x] .data-table tr:nth-child(even) — alternating row tint
  - [x] .data-table tr:hover — hover background
  - [x] .data-table__cell--editable — editable cell background tint
  - [x] .data-table__footer — totals row styling (bold)
  - [x] .data-table__title — optional table title bar
  - [x] .data-table th[data-sortable] — sortable column header with cursor pointer
- [x] Task 2: Create forms.css (AC: #3, #4, #5, #6, #9, #10, #11, #12)
  - [x] .btn — base button reset and shared styles
  - [x] .btn--primary — teal bg, white text, hover/focus/disabled
  - [x] .btn--ghost — transparent, border, muted text, hover/focus/disabled
  - [x] .btn--danger — red bg, white text, hover/focus/disabled
  - [x] .form-input — text/number input styling
  - [x] .form-select — select dropdown styling
  - [x] .form-textarea — textarea styling (monospace for CSV paste)
  - [x] .form-label — label styling
  - [x] Focus states: --color-primary border + --color-focus-ring shadow
  - [x] .import-area — import area container (label + textarea + button)
  - [x] .import-feedback — import confirmation banner base
  - [x] .import-feedback--success — green left border + checkmark
  - [x] .import-feedback--error — red left border + warning
- [x] Task 3: Create cards.css (AC: #7, #9, #10, #11, #12)
  - [x] .kpi-card — card container with padding and surface background
  - [x] .kpi-card__label — uppercase, muted, small text
  - [x] .kpi-card__value — large monospace value
  - [x] .kpi-card__change — change indicator
  - [x] .kpi-card__change--positive — green with up arrow
  - [x] .kpi-card__change--negative — red with down arrow
  - [x] .kpi-grid — 4-column grid for dashboard KPI cards
- [x] Task 4: Create charts.css (AC: #8, #9, #10, #11, #12)
  - [x] .chart-area — chart container
  - [x] .chart-area__title — chart title styling
  - [x] .chart-placeholder — empty state for charts with no data
  - [x] SVG inside .chart-area — responsive width
- [x] Task 5: Validate all files (AC: #9, #10, #11, #12)
  - [x] All class names BEM-lite
  - [x] No hardcoded hex colours
  - [x] No !important
  - [x] All files under 500 lines

## Dev Notes

### tables.css — Detailed specifications from UX spec

**Column headers:**
- `text-transform: uppercase`
- `font-size: var(--font-size-xs)`
- `font-weight: var(--font-weight-medium)`
- `color: var(--color-text-muted)`
- `letter-spacing: 0.05em`

**Numeric columns (.num):**
- `text-align: right`
- `font-family: var(--font-mono)`

**Alternating rows:**
- Even rows: `background-color: var(--color-bg-alt)`

**Row hover:**
- `background-color: var(--color-bg-hover)`

**Editable cells:**
- `background-color: var(--color-bg-alt)` with slight visual distinction
- When focused: input inside gets `--color-primary` border + `--color-focus-ring` shadow

**Sortable column headers:**
- `cursor: pointer` on `th[data-sortable]`
- Sort indicator (▲/▼) handled by JS, CSS just needs the cursor and hover state

**Table cell padding:**
- `padding: var(--space-2) var(--space-3)` for compact density (data-heavy reporting tool)

### forms.css — Button hierarchy from UX spec

**Base .btn:**
- `font-family: var(--font-ui)`
- `font-size: var(--font-size-sm)`
- `font-weight: var(--font-weight-semibold)`
- `padding: var(--space-2) var(--space-4)`
- `border-radius: var(--radius-md)`
- `cursor: pointer`
- `transition: all var(--transition-fast)`
- `border: none` (overridden by ghost)

**Primary (.btn--primary):**
- `background-color: var(--color-primary)`
- `color: var(--color-bg-surface)` (white)
- Hover: `background-color: var(--color-primary-hover)`
- Disabled: `opacity: 0.5; cursor: not-allowed`

**Ghost (.btn--ghost):**
- `background: transparent`
- `border: 1px solid var(--color-border)`
- `color: var(--color-text-secondary)`
- Hover: `border-color: var(--color-text-secondary); color: var(--color-text-primary)`

**Danger (.btn--danger):**
- `background-color: var(--color-danger)`
- `color: var(--color-bg-surface)` (white)
- Hover: `background-color: var(--color-danger-hover)`

**Focus for all buttons:**
- `outline: 2px solid var(--color-primary)`
- `outline-offset: 2px`
- `box-shadow: 0 0 0 4px var(--color-focus-ring)`

### forms.css — Import area and feedback banners

**Import area (.import-area):**
- Container for label + textarea + button
- `margin-bottom: var(--space-6)`

**Textarea (.form-textarea):**
- `font-family: var(--font-mono)` for CSV data alignment
- `min-height: 120px`
- `resize: vertical`

**Import feedback banners (.import-feedback):**
- `border-left: 4px solid`
- `padding: var(--space-3) var(--space-4)`
- `margin-bottom: var(--space-2)`
- `border-radius: var(--radius-sm)`
- `background-color: var(--color-bg-surface)`

Success variant: `border-left-color: var(--color-success)`
Error variant: `border-left-color: var(--color-danger)`

Layout: icon + text on left, timestamp on right (flex with space-between)

### cards.css — KPI card from UX spec

**Card (.kpi-card):**
- `background-color: var(--color-bg-surface)`
- `border-radius: var(--radius-md)`
- `padding: var(--space-4) var(--space-6)`
- `border: 1px solid var(--color-border)`

**Label (.kpi-card__label):**
- `text-transform: uppercase`
- `font-size: var(--font-size-xs)`
- `font-weight: var(--font-weight-medium)`
- `color: var(--color-text-muted)`
- `letter-spacing: 0.05em`

**Value (.kpi-card__value):**
- `font-size: var(--font-size-2xl)`
- `font-weight: var(--font-weight-bold)`
- `font-family: var(--font-mono)`
- `color: var(--color-text-primary)`
- `line-height: var(--line-height-tight)`

**Grid (.kpi-grid):**
- `display: grid`
- `grid-template-columns: repeat(4, 1fr)`
- `gap: var(--space-4)`

### Status badges (used by revenue pipeline and deal rows)

Include `.status-badge` base + variants in forms.css or a new shared file. The UX spec defines:
- `.status-badge` — small pill, inline-block, padding, border-radius, font-size-xs
- `.status-badge--contracted` — `background-color: var(--color-status-contracted); color: white`
- `.status-badge--certain` — `background-color: var(--color-status-certain); color: white`
- `.status-badge--uncertain` — `background-color: var(--color-status-uncertain); color: white`

Include these in forms.css since they're used across multiple tabs.

### Previous Story Intelligence

- Story 1.1: theme.css has all design tokens ready to reference
- Story 1.4: layout.css establishes the pattern — BEM-lite, custom properties, no hex, focus-visible states
- layout.css (169 lines) serves as the style pattern to follow

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy] — all component specs
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Consistency Patterns] — button hierarchy, feedback patterns, table patterns
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation] — colour and typography usage

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No issues encountered.

### Completion Notes List

- tables.css (119 lines): data table with uppercase headers, alternating rows, hover, editable cell tint, sortable headers, numeric alignment, footer/totals row
- forms.css (212 lines): button hierarchy (primary/ghost/danger with hover/focus/disabled), form inputs, textarea (monospace for CSV), import area, import feedback banners (success/error), status badges (contracted/certain/uncertain), inline confirmation row
- cards.css (52 lines): KPI card (label/value/change), 4-column grid, positive/negative change indicators
- charts.css (40 lines): chart container, title, responsive SVG, empty state placeholder
- All files use BEM-lite naming, theme.css custom properties only, no hardcoded hex, no !important

### Change Log

- 2026-03-30: Story 1.5 implemented — shared component CSS (tables, forms, cards, charts)

### File List

- public/css/shared/tables.css (119 lines — modified from placeholder)
- public/css/shared/forms.css (212 lines — modified from placeholder)
- public/css/shared/cards.css (52 lines — modified from placeholder)
- public/css/shared/charts.css (40 lines — modified from placeholder)
