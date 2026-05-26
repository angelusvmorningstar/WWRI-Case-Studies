---
story_key: 6-4-print-stylesheet-for-board-pack
status: done
epic: 6
story_number: 6.4
---

# Story 6.4: Print Stylesheet for Board Pack

## Story

As Angelus (driver) preparing for the next board meeting,
I want a dedicated print stylesheet that turns the dashboard into a board-ready PDF,
So that the export looks polished without me touching Word or PowerPoint.

## Acceptance Criteria

**Given** I trigger `window.print()` from the Dashboard view,
**When** the browser print preview opens,
**Then** `public/css/print-board.css` applies.

**And** the print layout uses the WWRI brand (logo, teal #009898, Calibri).

**And** the layout fits A4 portrait with pagination at sensible section breaks.

**And** the live view's navigation chrome and interactive controls are hidden in print.

## Tasks/Subtasks

- [x] Task 1: Add `<div class="page-header">` with "Print board pack" button at the top of the full DashboardView render (above `.dashboard__headline`), calling `window.print()`
- [x] Task 2: Expand `public/css/print-board.css` from skeleton to full A4 board-pack stylesheet — `@page` rule, brand colours, typography, panel layout, page breaks
- [x] Task 3: Add print-header strip (logo + title) that is screen-hidden but visible in print

## Dev Notes

### Files to change

- `cost-tracker/src/components/dashboard/dashboard-view.js` — add page-header + print button to the main (non-empty) render path
- `cost-tracker/public/css/print-board.css` — replace skeleton with full stylesheet
- `cost-tracker/public/css/app.css` — add `.dashboard__print-btn` rule (screen-side only); hide print-header div in screen

No other files. `print-board.css` is already linked in `index.html`. No new imports needed.

### Dashboard page-header — where to add it

The full dashboard render (when `subs.length > 0`) currently opens directly with:

```js
return html`
  <div class="dashboard">
    <div class="dashboard__headline">
```

Add a page-header above `.dashboard__headline` like this:

```jsx
return html`
  <div class="page-header">
    <h1 class="page-header__title">Dashboard</h1>
    <button class="btn btn--outline dashboard__print-btn" onClick=${() => window.print()}>
      Print board pack
    </button>
  </div>
  <div class="dashboard">
    <div class="dashboard__headline">
    ...
```

The existing `.page-header` CSS uses `display: flex; align-items: baseline; gap: var(--space-3)`. The button must use `margin-left: auto; align-self: center` to push it to the right. Add this to `app.css`:

```css
.dashboard__print-btn {
  margin-left: auto;
  align-self: center;
}
```

The button is already hidden in print via the existing `.btn { display: none !important; }` rule in `print-board.css`.

### print-board.css — full replacement

Replace the skeleton entirely. The skeleton content (basic chrome-hiding + body reset + numbers-only marker rule) must all be preserved — just expand it:

```css
/* WWRI Subscription Cost Tracker — board pack print stylesheet
   Applied when window.print() is called from the Dashboard view.
   Three print modes toggled via body class (Story 6.5):
     .print-numbers-only     — values only, no provenance markers
     .print-with-footnotes   — values + per-value footnotes
     .print-full-provenance  — values + full Assumption appendix */

@page {
  size: A4 portrait;
  margin: 15mm 18mm 20mm 18mm;
}

@media print {

  /* ── Hide interactive chrome ────────────────────────────────── */
  .nav-bar,
  .save-indicator,
  .needs-decision-tray,
  .decision-drawer,
  .btn,
  .page-placeholder,
  .dashboard__scenario-ticker,
  .dashboard__savings-link {
    display: none !important;
  }

  /* ── Body reset ─────────────────────────────────────────────── */
  body {
    background: #fff;
    color: #000;
    font-family: 'Calibri', 'Segoe UI', sans-serif;
    font-size: 10pt;
    line-height: 1.4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── App shell — remove screen padding ─────────────────────── */
  .app-shell {
    display: block;
  }

  .app-shell__content {
    padding: 0;
    max-width: none;
  }

  /* ── Print-only header (logo + title) ──────────────────────── */
  .dashboard__print-header {
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2pt solid #009898;
    padding-bottom: 8pt;
    margin-bottom: 16pt;
  }

  .dashboard__print-header-logo {
    height: 28pt;
    width: auto;
  }

  .dashboard__print-header-title {
    font-size: 16pt;
    font-weight: 700;
    color: #009898;
  }

  .dashboard__print-header-date {
    font-size: 9pt;
    color: #666;
  }

  /* ── Page header (screen) ───────────────────────────────────── */
  .page-header {
    display: none;
  }

  /* ── Dashboard container ────────────────────────────────────── */
  .dashboard {
    display: block;
  }

  /* ── Headline KPI panel ─────────────────────────────────────── */
  .dashboard__headline {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12pt;
    margin-bottom: 12pt;
    page-break-after: avoid;
  }

  .dashboard__headline-col {
    padding: 8pt 10pt;
    border: 1pt solid #ddd;
    border-radius: 4pt;
  }

  .dashboard__col-header {
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #009898;
    margin-bottom: 4pt;
  }

  .dashboard__col-amount {
    font-size: 18pt;
    font-weight: 700;
    color: #000;
    line-height: 1.1;
  }

  .dashboard__col-amount--up {
    color: #c0392b;
  }

  .dashboard__col-amount--down {
    color: #1a7a4a;
  }

  .dashboard__col-period,
  .dashboard__col-desc {
    font-size: 8pt;
    color: #666;
    margin: 2pt 0 0;
  }

  /* ── Shared panel style ─────────────────────────────────────── */
  .dashboard__savings-panel,
  .dashboard__category-panel,
  .dashboard__movers-panel {
    border: 1pt solid #ddd;
    border-radius: 0;
    padding: 8pt 10pt;
    margin-bottom: 10pt;
    page-break-inside: avoid;
  }

  /* ── Savings panel ──────────────────────────────────────────── */
  .dashboard__savings-title,
  .dashboard__category-title,
  .dashboard__movers-title {
    font-size: 10pt;
    font-weight: 700;
    color: #009898;
    margin-bottom: 6pt;
  }

  .dashboard__savings-desc {
    font-size: 8.5pt;
    color: #444;
    margin-bottom: 8pt;
  }

  .dashboard__savings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8pt;
  }

  .dashboard__savings-col {
    padding: 6pt 8pt;
    border: 1pt solid #ddd;
    border-radius: 3pt;
  }

  .dashboard__savings-col--savings {
    background: #f0faf6;
  }

  .dashboard__savings-header {
    font-size: 8pt;
    color: #666;
    margin-bottom: 2pt;
  }

  .dashboard__savings-amount {
    font-size: 14pt;
    font-weight: 700;
    color: #000;
  }

  .dashboard__savings-sub {
    font-size: 7.5pt;
    color: #888;
    margin-top: 2pt;
  }

  /* ── Category breakdown ─────────────────────────────────────── */
  .dashboard__category-rows {
    display: flex;
    flex-direction: column;
    gap: 4pt;
  }

  .dashboard__category-row {
    display: grid;
    grid-template-columns: 200pt 1fr 40pt 80pt;
    align-items: center;
    gap: 6pt;
  }

  .dashboard__category-row--empty {
    opacity: 0.45;
  }

  .dashboard__category-label {
    font-size: 9pt;
    color: #222;
  }

  .dashboard__category-bar-wrap {
    height: 6pt;
    background: #e8e8e8;
    border-radius: 3pt;
    overflow: hidden;
  }

  .dashboard__category-bar {
    display: block;
    height: 100%;
    background: #009898;
    border-radius: 3pt;
  }

  .dashboard__category-pct {
    font-size: 9pt;
    text-align: right;
    color: #444;
  }

  .dashboard__category-amount {
    font-size: 9pt;
    font-weight: 600;
    text-align: right;
    color: #000;
  }

  /* ── Top movers ─────────────────────────────────────────────── */
  .dashboard__movers-header,
  .dashboard__movers-row {
    display: grid;
    grid-template-columns: 1fr 80pt 80pt 90pt 70pt;
    gap: 6pt;
    padding: 3pt 0;
    border-bottom: 0.5pt solid #ddd;
  }

  .dashboard__movers-row:last-child {
    border-bottom: none;
  }

  .dashboard__movers-header {
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #666;
  }

  .dashboard__movers-name {
    display: flex;
    flex-direction: column;
    gap: 1pt;
  }

  .dashboard__movers-vendor {
    font-size: 9pt;
    font-weight: 600;
    color: #000;
  }

  .dashboard__movers-product {
    font-size: 8pt;
    color: #666;
  }

  .dashboard__movers-col-num {
    font-size: 9pt;
    text-align: right;
    color: #222;
  }

  .dashboard__movers-delta--up {
    color: #c0392b;
    font-weight: 600;
  }

  .dashboard__movers-delta--down {
    color: #1a7a4a;
    font-weight: 600;
  }

  /* ── Provenance markers — numbers-only mode ─────────────────── */
  body.print-numbers-only .assumption-marker {
    display: none !important;
  }
}
```

### Print-only header JSX element

Add a `.dashboard__print-header` div inside `<div class="dashboard">` as the very first child (before `.dashboard__headline`). It must be `display: none` in screen CSS and `display: flex !important` in print CSS:

```jsx
<div class="dashboard__print-header">
  <img
    class="dashboard__print-header-logo"
    src="public/assets/logo.svg"
    alt="Whitewater Reinventions"
  />
  <span class="dashboard__print-header-title">Subscription Cost Tracker</span>
  <span class="dashboard__print-header-date">${new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
</div>
```

The logo path is `public/assets/logo.svg` — confirmed in `nav-bar.js`.

Add to `app.css` (screen side — hide the print-only header in normal view):

```css
.dashboard__print-header {
  display: none;
}
```

### App shell padding

The `app-shell__content` has screen-side padding. Check if `app-shell__content` needs to be reset in print (remove left/right padding so panels use full page width). The `@page` margins handle the whitespace in print. Add in `print-board.css`:

```css
.app-shell__content {
  padding: 0;
  max-width: none;
}
```

### Page-break strategy

- `.dashboard__headline`: `page-break-after: avoid` — keep KPIs on same page as savings
- `.dashboard__savings-panel`, `.dashboard__category-panel`, `.dashboard__movers-panel`: `page-break-inside: avoid` — each panel stays together
- No forced page breaks — let the browser flow them naturally; all 4 panels should fit on 1–2 A4 pages

### Scope boundary with Story 6.5

Story 6.4 = base print stylesheet only (one visual mode). The three-mode selector (numbers only / footnotes / full provenance) is Story 6.5. The `body.print-numbers-only .assumption-marker` rule is included in 6.4 because it was already in the skeleton, but the UI for choosing modes is 6.5.

### Regression safety

Purely additive:
- New page-header in `DashboardView` is visible in screen too (shows "Dashboard" heading), which is an improvement
- `print-board.css` only applies inside `@media print` — zero impact on screen rendering
- `.dashboard__print-header { display: none }` in `app.css` keeps it invisible on screen
- No existing compute functions or reducers touched

## Dev Agent Record

### Debug Log

_empty_

### Completion Notes

Page-header with "Dashboard" title and "Print board pack" button (`window.print()`) added to the full DashboardView render path. Button right-aligned via `margin-left: auto; align-self: center` in app.css.

Print-only `.dashboard__print-header` strip (logo + title + formatted date) injected as first child of `.dashboard` in JSX; hidden in screen via `display: none` in app.css; shown with `display: flex !important` in print-board.css.

`print-board.css` replaced skeleton with full A4 stylesheet: `@page { size: A4 portrait; margin: 15mm 18mm 20mm 18mm }`, Calibri font, teal #009898 branding on titles and KPI headers, panel-by-panel layout overrides for all four dashboard sections (headline, savings, category, top movers), `page-break-inside: avoid` on each panel. All interactive chrome hidden in print: `.nav-bar`, `.btn`, `.page-header`, `.dashboard__scenario-ticker`, `.dashboard__savings-link`, `.save-indicator`, `.needs-decision-tray`, `.decision-drawer`, `.page-placeholder`. Provenance marker rule from skeleton preserved for Story 6.5 mode selector.

## File List

- `cost-tracker/src/components/dashboard/dashboard-view.js` — page-header + print button + print-header strip
- `cost-tracker/public/css/print-board.css` — full A4 board-pack stylesheet (replaced skeleton)
- `cost-tracker/public/css/app.css` — `.dashboard__print-btn` + `.dashboard__print-header` screen-side rules

## Change Log

- 2026-05-14: Story created and implemented
