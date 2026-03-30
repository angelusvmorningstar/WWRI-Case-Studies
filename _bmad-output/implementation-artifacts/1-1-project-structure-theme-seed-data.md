# Story 1.1: Project Structure, Theme & Seed Data

Status: review

## Story

As a developer,
I want the project directory structure created with the design token system and seed data files in place,
so that all subsequent development follows consistent conventions and the visual foundation is established.

## Acceptance Criteria

1. **Directory structure** exists matching the architecture specification exactly
2. **theme.css** contains all CSS custom properties: colour palette, typography scale, spacing scale, border radii, and transition values — matching the UX Design Specification
3. **fx-rates.json** contains default exchange rates for AUD, EUR, USD, GBP, SGD
4. **stage-definitions.json** contains pipeline stage names, display order, colours, and close probabilities
5. **expense-categories.json** contains operating expense line items with categories and 9-month default values
6. **client-defaults.json** contains client reference data (payment terms, IE fee percentages, referral fee percentages)
7. **WWT-Logo.jpg** copied from `reference/WWT-Logo.jpg` to `public/assets/`
8. No file exceeds 500 lines (NFR4, NFR5)
9. All file names use kebab-case (NFR10)
10. JSON field names use camelCase (NFR10)

## Tasks / Subtasks

- [x] Task 1: Create directory structure (AC: #1)
  - [x] Create all directories listed in Project Structure Notes below
  - [x] Verify no extra directories are created
- [x] Task 2: Create theme.css (AC: #2)
  - [x] Brand & interactive colour tokens
  - [x] Text colour tokens
  - [x] Surface & background colour tokens
  - [x] Pipeline stage colour tokens
  - [x] Revenue status colour tokens
  - [x] Typography tokens (font stacks, size scale, weight scale, line heights)
  - [x] Spacing scale tokens
  - [x] Border radius tokens
  - [x] Transition/animation tokens
- [x] Task 3: Create fx-rates.json (AC: #3)
- [x] Task 4: Create stage-definitions.json (AC: #4)
- [x] Task 5: Create expense-categories.json (AC: #5)
- [x] Task 6: Create client-defaults.json (AC: #6)
- [x] Task 7: Copy logo asset (AC: #7)
- [x] Task 8: Validate all files (AC: #8, #9, #10)

## Dev Notes

### CRITICAL: This is a brownfield extraction

The project is refactoring a working 508KB monolith (`reference/WWRI-toolkit.html`) into modular files. All seed data values below are extracted from the existing monolith and MUST match exactly — these are production values, not placeholders.

### No build step

All files are browser-native. No npm, no bundler, no TypeScript. Files are served via VS Code Live Server from the `public/` directory.

### Architecture patterns to follow

- File naming: `kebab-case` for all files
- JSON field naming: `camelCase`
- Constants in JS: `UPPER_SNAKE_CASE`
- CSS: BEM-lite (`block__element--modifier`)
- No hardcoded hex values outside `theme.css`
- No `!important` in CSS
- No `var` in JS — `const` by default, `let` when reassignment needed

### Project Structure Notes

Create these directories and placeholder files exactly:

```
WWRI-Toolkit/
├── public/
│   ├── index.html              # EMPTY placeholder — built in Story 1.4
│   ├── data/
│   │   ├── fx-rates.json
│   │   ├── stage-definitions.json
│   │   ├── expense-categories.json
│   │   └── client-defaults.json
│   ├── css/
│   │   ├── theme.css
│   │   ├── layout.css          # EMPTY placeholder — built in Story 1.4
│   │   ├── print-finance.css   # EMPTY placeholder — built in Story 4.1
│   │   ├── print-pipeline.css  # EMPTY placeholder — built in Story 5.6
│   │   ├── shared/
│   │   │   ├── tables.css      # EMPTY placeholder — built in Story 1.5
│   │   │   ├── forms.css       # EMPTY placeholder — built in Story 1.5
│   │   │   ├── cards.css       # EMPTY placeholder — built in Story 1.5
│   │   │   └── charts.css      # EMPTY placeholder — built in Story 1.5
│   │   ├── finance/
│   │   │   ├── dashboard.css       # EMPTY placeholder
│   │   │   ├── cash-forecast.css   # EMPTY placeholder
│   │   │   ├── revenue-pipeline.css # EMPTY placeholder
│   │   │   └── finance-controls.css # EMPTY placeholder
│   │   └── pipeline/
│   │       ├── pipeline.css        # EMPTY placeholder
│   │       ├── performance.css     # EMPTY placeholder
│   │       ├── forecasting.css     # EMPTY placeholder
│   │       ├── leads.css           # EMPTY placeholder
│   │       ├── history.css         # EMPTY placeholder
│   │       └── pipeline-controls.css # EMPTY placeholder
│   ├── js/
│   │   ├── app.js              # EMPTY placeholder — built in Story 1.4
│   │   ├── shared/
│   │   │   ├── store.js        # EMPTY placeholder — built in Story 1.2
│   │   │   ├── csv-parser.js   # EMPTY placeholder — built in Story 1.3
│   │   │   ├── fx.js           # EMPTY placeholder — built in Story 1.3
│   │   │   ├── format.js       # EMPTY placeholder — built in Story 1.3
│   │   │   ├── charts.js       # EMPTY placeholder — built in Story 3.4
│   │   │   └── print.js        # EMPTY placeholder — built in Story 4.1
│   │   ├── finance/
│   │   │   ├── dashboard.js        # EMPTY placeholder
│   │   │   ├── cash-forecast.js    # EMPTY placeholder
│   │   │   ├── revenue-pipeline.js # EMPTY placeholder
│   │   │   ├── finance-controls.js # EMPTY placeholder
│   │   │   └── finance-print.js    # EMPTY placeholder
│   │   └── pipeline/
│   │       ├── pipeline.js         # EMPTY placeholder
│   │       ├── performance.js      # EMPTY placeholder
│   │       ├── forecasting.js      # EMPTY placeholder
│   │       ├── leads.js            # EMPTY placeholder
│   │       ├── history.js          # EMPTY placeholder
│   │       ├── pipeline-report.js  # EMPTY placeholder
│   │       └── pipeline-controls.js # EMPTY placeholder
│   └── assets/
│       └── WWT-Logo.jpg        # Copied from reference/WWT-Logo.jpg
```

**CRITICAL:** Placeholder files should contain a single comment indicating which story builds them. For JS: `// Placeholder — built in Story X.Y`. For CSS: `/* Placeholder — built in Story X.Y */`. For HTML: `<!-- Placeholder — built in Story X.Y -->`. This prevents import errors in later stories and makes it clear what's not yet implemented.

### theme.css — Complete Token Specification

All values below are from the UX Design Specification and MUST be used exactly.

**Brand & Interactive Colours:**

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#009898` | Buttons, active tabs, focus states, links |
| `--color-primary-hover` | `#007878` | Button/link hover states |
| `--color-danger` | `#C0392B` | Error states, destructive actions |
| `--color-danger-hover` | `#A93226` | Danger button hover |
| `--color-success` | `#1E8C4A` | Success indicators |
| `--color-accent-amber` | `#C07A00` | Pipeline stage highlights, warnings |

**Text Colours:**

| Token | Value |
|-------|-------|
| `--color-text-primary` | `#1A1A1A` |
| `--color-text-secondary` | `#555550` |
| `--color-text-muted` | `#888884` |

**Surface & Background Colours:**

| Token | Value |
|-------|-------|
| `--color-bg-page` | `#F5F4F0` |
| `--color-bg-surface` | `#FFFFFF` |
| `--color-bg-alt` | `#FAFAF8` |
| `--color-bg-hover` | `#F0EFEC` |
| `--color-border` | `#DDDBD6` |
| `--color-focus-ring` | `rgba(0,152,152,0.15)` |

**Pipeline Stage Colours:**

| Token | Value | Stage |
|-------|-------|-------|
| `--color-stage-m1` | `#C07A00` | M1 — Initial engagement |
| `--color-stage-m1-5` | `#B07820` | M1.5 — Early developing |
| `--color-stage-m2` | `#7A8848` | M2 — Developing |
| `--color-stage-m2-5` | `#4A9A70` | M2.5 — Mature developing |
| `--color-stage-m3` | `#00A882` | M3 — Advanced |
| `--color-stage-m4` | `#009898` | M4 — Most mature |

**Lead Stage Colours (derived from pipeline stages):**

| Token | Value | Stage |
|-------|-------|-------|
| `--color-stage-shortlist` | `#C07A00` | 0.1 Shortlist |
| `--color-stage-soft` | `#1E7A5A` | 0.2 Soft engagement |
| `--color-stage-engaged` | `#009898` | 0.3 Engaged |

**Revenue Status Colours:**

| Token | Value |
|-------|-------|
| `--color-status-contracted` | `#009898` |
| `--color-status-certain` | `#1E8C4A` |
| `--color-status-uncertain` | `#C07A00` |

**Typography — Font Stacks:**

| Token | Value |
|-------|-------|
| `--font-ui` | `'Calibri', 'Segoe UI', system-ui, sans-serif` |
| `--font-mono` | `'Cascadia Code', Consolas, monospace` |

**Typography — Size Scale:**

| Token | Value |
|-------|-------|
| `--font-size-xs` | `0.75rem` |
| `--font-size-sm` | `0.875rem` |
| `--font-size-base` | `1rem` |
| `--font-size-lg` | `1.25rem` |
| `--font-size-xl` | `1.5rem` |
| `--font-size-2xl` | `2rem` |

**Typography — Weights:**

| Token | Value |
|-------|-------|
| `--font-weight-normal` | `400` |
| `--font-weight-medium` | `500` |
| `--font-weight-semibold` | `600` |
| `--font-weight-bold` | `700` |

**Typography — Line Heights:**

| Token | Value |
|-------|-------|
| `--line-height-tight` | `1.2` |
| `--line-height-normal` | `1.5` |
| `--line-height-relaxed` | `1.75` |

**Spacing Scale (4px base):**

| Token | Value |
|-------|-------|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-12` | `48px` |

**Border Radius:**

| Token | Value |
|-------|-------|
| `--radius-sm` | `4px` |
| `--radius-md` | `6px` |
| `--radius-lg` | `8px` |

**Transitions:**

| Token | Value |
|-------|-------|
| `--transition-fast` | `150ms ease` |
| `--transition-normal` | `250ms ease` |

### fx-rates.json — Exact Values

These are the production default rates from the monolith (base AUD = 1):

```json
{
  "aud": 1,
  "eur": 1.61,
  "usd": 1.5,
  "gbp": 2,
  "sgd": 1
}
```

### stage-definitions.json — Exact Values

Pipeline stages with colours and close probabilities extracted from monolith:

```json
{
  "pipeline": [
    { "id": "m4", "label": "M4", "color": "--color-stage-m4", "probability": 0.80, "order": 1 },
    { "id": "m3", "label": "M3", "color": "--color-stage-m3", "probability": 0.60, "order": 2 },
    { "id": "m2.5", "label": "M2.5", "color": "--color-stage-m2-5", "probability": 0.45, "order": 3 },
    { "id": "m2", "label": "M2", "color": "--color-stage-m2", "probability": 0.30, "order": 4 },
    { "id": "m1.5", "label": "M1.5", "color": "--color-stage-m1-5", "probability": 0.20, "order": 5 },
    { "id": "m1", "label": "M1", "color": "--color-stage-m1", "probability": 0.10, "order": 6 }
  ],
  "leads": [
    { "id": "0.1", "label": "0.1 Shortlist", "color": "--color-stage-shortlist", "order": 1 },
    { "id": "0.2", "label": "0.2 Soft Engagement", "color": "--color-stage-soft", "order": 2 },
    { "id": "0.3", "label": "0.3 Engaged", "color": "--color-stage-engaged", "order": 3 }
  ],
  "m1StallThresholdDays": 30
}
```

### expense-categories.json — Exact Values

24 expense line items across 3 categories with 9-month default forecasts. The first column is the current month actuals, columns 2–9 are forecast months:

```json
{
  "categories": [
    {
      "name": "Overhead",
      "lines": [
        { "id": "ceo", "label": "CEO", "defaults": [0, 23000, 23000, 23000, 23000, 23000, 23000, 23000, 23000] },
        { "id": "coo", "label": "COO (Niel)", "defaults": [8000, 8000, 8000, 8000, 8000, 8000, 8000, 8000, 8000] },
        { "id": "contractors", "label": "Internal contractors", "defaults": [4357, 4300, 4300, 4300, 4300, 4300, 4300, 4300, 4300] },
        { "id": "wages", "label": "Wages and salaries", "defaults": [7717, 8000, 8000, 8000, 8000, 8000, 8000, 8000, 8000] },
        { "id": "super", "label": "Superannuation", "defaults": [1137, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200] },
        { "id": "consulting", "label": "Consulting fees", "defaults": [14771, 11458, 0, 0, 0, 0, 0, 0, 0] },
        { "id": "legal-au", "label": "Legal expenses (AU)", "defaults": [1697, 10000, 0, 0, 0, 0, 0, 0, 0] },
        { "id": "legal-eu", "label": "Legal expenses (EU)", "defaults": [0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { "id": "accountancy", "label": "Accountancy fees", "defaults": [0, 2500, 2500, 0, 0, 2500, 1000, 0, 2500] },
        { "id": "bookkeeping", "label": "Bookkeeping fees", "defaults": [719, 0, 0, 0, 0, 0, 0, 0, 0] },
        { "id": "hubspot", "label": "HubSpot", "defaults": [758, 800, 800, 800, 800, 800, 800, 800, 800] },
        { "id": "software", "label": "Software expense", "defaults": [0, 750, 750, 750, 750, 750, 750, 750, 750] },
        { "id": "subs-au", "label": "Subscriptions (AU)", "defaults": [1004, 400, 400, 400, 400, 400, 400, 400, 400] },
        { "id": "subs-eu", "label": "Subscriptions (EU)", "defaults": [0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { "id": "phone-it", "label": "Telephone and IT", "defaults": [621, 500, 500, 500, 500, 500, 500, 500, 500] },
        { "id": "travel-intl", "label": "Travel — international", "defaults": [5906, 0, 0, 0, 0, 0, 0, 0, 0] },
        { "id": "travel-natl", "label": "Travel — national", "defaults": [3170, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000] },
        { "id": "research", "label": "Research", "defaults": [309, 350, 350, 350, 350, 350, 350, 350, 350] },
        { "id": "bank-reval", "label": "Bank revaluations", "defaults": [1869, 0, 0, 0, 0, 0, 0, 0, 0] },
        { "id": "fx-gains", "label": "FX gains/losses", "defaults": [-701, 0, 0, 0, 0, 0, 0, 0, 0] },
        { "id": "bank-fees", "label": "Bank fees", "defaults": [13, 0, 0, 0, 0, 0, 0, 0, 0] },
        { "id": "filing", "label": "Filing fees", "defaults": [329, 0, 0, 0, 0, 0, 0, 0, 0] }
      ]
    },
    {
      "name": "Discretionary",
      "lines": [
        { "id": "gnowbe", "label": "Gnowbe/Ilonka", "defaults": [0, 500, 500, 500, 500, 500, 500, 500, 500] }
      ]
    },
    {
      "name": "Tax",
      "lines": [
        { "id": "income-tax", "label": "Income tax expense", "defaults": [0, 0, 0, 0, 0, 0, 0, 4500, 0] }
      ]
    }
  ]
}
```

### client-defaults.json — Exact Values

Client reference data for revenue pipeline calculations. The `iePct` is the IE fee percentage, `refPct` is referral fee, `avgPay` is average payment days:

```json
{
  "defaults": {
    "iePct": 0.70,
    "refPct": 0,
    "avgPay": 30
  },
  "clients": [
    { "name": "Yoplait Canada", "iePct": 0.75, "refPct": 0, "avgPay": 38 },
    { "name": "SODIAAL R&D", "iePct": 0.70, "refPct": 0, "avgPay": 42 },
    { "name": "Dominos Japan", "iePct": 0.70, "refPct": 0.10, "avgPay": 14 },
    { "name": "Renesas", "iePct": 0.70, "refPct": 0.10, "avgPay": 30 }
  ],
  "revenueStatuses": [
    { "id": 1, "label": "Contracted", "color": "--color-status-contracted" },
    { "id": 2, "label": "Certain", "color": "--color-status-certain" },
    { "id": 3, "label": "Uncertain", "color": "--color-status-uncertain" }
  ]
}
```

### localStorage Key Mapping Reference

This story does NOT create `store.js` (that's Story 1.2), but the seed data files must be structured so `store.js` can load them. The key mapping for reference:

| Clean Name | localStorage Key | Seed File |
|-----------|-----------------|-----------|
| fxRates | `ww_fx` | fx-rates.json |
| stageDefinitions | `ww_sprobs2` | stage-definitions.json |
| expenses | `ww_exp` | expense-categories.json |
| clientDefaults | `ww_ref` | client-defaults.json |
| deals | `ww_db2` | _(no seed file — imported via CSV)_ |
| importLog | `ww_log2` | _(no seed file — starts empty)_ |
| baselines | `ww_bl2` | _(no seed file — user-created)_ |
| snapshots | `ww_snaps2` | _(no seed file — auto-generated)_ |
| leads | `ww_leads2` | _(no seed file — imported via CSV)_ |
| balanceSheet | `ww_bs` | _(no seed file — imported via CSV)_ |
| profitLoss | `ww_pl` | _(no seed file — imported via CSV)_ |
| revenue | `ww_rev` | _(no seed file — imported via CSV)_ |
| xeroImport | `ww_xero2` | _(no seed file — imported via CSV)_ |
| lastUpdated | `ww_lastup` | _(no seed file — auto-generated)_ |

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — complete directory structure
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation] — all design token values
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation] — design system approach
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming conventions, anti-patterns
- [Source: reference/WWRI-toolkit.html] — all seed data values (SEED_FX, STAGES, EXP_LINES, EXP_DEFAULTS, revenue record structure)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No issues encountered.

### Completion Notes List

- Created complete directory structure: public/css/{shared,finance,pipeline}, public/js/{shared,finance,pipeline}, public/data, public/assets
- Created theme.css (113 lines) with all design tokens from UX spec
- Created 4 JSON seed data files with production values extracted from existing monolith
- Created 36 placeholder files with story reference comments
- Copied WWT-Logo.jpg to public/assets/
- All files under 500 lines, all kebab-case, all JSON camelCase
- No test framework in MVP — validated by file listing and line count checks

### Change Log

- 2026-03-30: Story 1.1 implemented — 43 files created under public/

### File List

public/index.html, public/css/theme.css, public/css/layout.css, public/css/print-finance.css, public/css/print-pipeline.css, public/css/shared/tables.css, public/css/shared/forms.css, public/css/shared/cards.css, public/css/shared/charts.css, public/css/finance/dashboard.css, public/css/finance/cash-forecast.css, public/css/finance/revenue-pipeline.css, public/css/finance/finance-controls.css, public/css/pipeline/pipeline.css, public/css/pipeline/performance.css, public/css/pipeline/forecasting.css, public/css/pipeline/leads.css, public/css/pipeline/history.css, public/css/pipeline/pipeline-controls.css, public/data/fx-rates.json, public/data/stage-definitions.json, public/data/expense-categories.json, public/data/client-defaults.json, public/js/app.js, public/js/shared/store.js, public/js/shared/csv-parser.js, public/js/shared/fx.js, public/js/shared/format.js, public/js/shared/charts.js, public/js/shared/print.js, public/js/finance/dashboard.js, public/js/finance/cash-forecast.js, public/js/finance/revenue-pipeline.js, public/js/finance/finance-controls.js, public/js/finance/finance-print.js, public/js/pipeline/pipeline.js, public/js/pipeline/performance.js, public/js/pipeline/forecasting.js, public/js/pipeline/leads.js, public/js/pipeline/history.js, public/js/pipeline/pipeline-report.js, public/js/pipeline/pipeline-controls.js, public/assets/WWT-Logo.jpg
