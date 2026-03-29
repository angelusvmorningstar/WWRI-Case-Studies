---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
status: complete
completedAt: '2026-03-29'
classification:
  projectType: web_app
  domain: general
  complexity: low-medium
  projectContext: brownfield
inputDocuments:
  - product-brief-WWRI-Toolkit.md
  - product-brief-WWRI-Toolkit-distillate.md
  - WWRI_Finance_Report_Spec_v0.1.md
documentCounts:
  briefs: 1
  distillates: 1
  specifications: 1
  research: 0
  projectDocs: 0
workflowType: 'prd'
---

# Product Requirements Document — WWRI Toolkit

**Author:** Angelus
**Date:** 2026-03-29

## Executive Summary

The WWRI Toolkit is a browser-based executive reporting application for Whitewater Reinventions, a consulting firm operating across Australia, Europe, and the US. It consolidates two reporting functions — sales pipeline analytics (from HubSpot) and financial reporting (from Xero) — into a single application with a shared data layer, replacing both a 508KB monolithic HTML file and an Excel-based finance workflow.

The toolkit serves one primary user: Angelus, the firm's admin and finance manager, who generates monthly board reports, manages the deal pipeline, and forecasts cash flow across three legal entities (AU, EU, US). Secondary users are Whitewater consultants who use companion tools (project costing sheets and structured interview assessments) in client engagements.

The current tools work but are unmaintainable — all data, logic, and styles live in single files exceeding 3,000 lines. Hardcoded business data (FX rates, client details, benchmarks) is embedded in application code. AI-assisted development is expensive because each edit requires loading the entire monolith into context. The refactor extracts these into a modular architecture (vanilla ES modules, CSS custom properties, separated data files) following standards established on the sister project Terra Mortis. No build step — edit and refresh.

### What Makes This Special

This is not a market product. It is a force multiplier for one person wearing many hats. Tasks that currently take hours and produce errors (importing from multiple data sources, running multi-entity financial calculations, generating printable board reports) become reliable and fast.

A modular codebase is dramatically cheaper to work with in AI-assisted development. Small, focused files mean targeted edits instead of full-context rewrites. This directly reduces the cost of every future change — for both the developer and the AI.

The rebuild is also a deliberate learning exercise. Angelus is a first-time developer building real architectural skills through practice, with patterns that transfer directly to future projects.

## Project Classification

- **Project Type:** Web application (browser-based SPA, vanilla JS with ES modules, no backend)
- **Domain:** Business operations / internal tooling
- **Complexity:** Low-medium (no regulated domain, but multi-entity financial calculations and multiple data source integrations add domain complexity)
- **Project Context:** Brownfield (refactoring four existing working applications into modular architecture)

## Success Criteria

### User Success

- Finance report prints the same board-ready PDF it does today — no regression
- Monthly reporting workflow (import CSVs → review data → print report) works without manual workarounds
- Bugs in the current version are identified and fixed
- Editing one module doesn't risk breaking unrelated functionality

### Business Success

- Finance report delivered to the board on time (deadline: 2026-03-31)
- Monthly reporting cycle becomes faster and more reliable over subsequent months
- Codebase is maintainable enough that Angelus can confidently make changes with AI assistance

### Technical Success

- No single JS or CSS file exceeds 500 lines
- All colour values in one theme.css as CSS custom properties
- ES modules with proper imports, no global state spaghetti
- Data (FX rates, seed data, benchmarks) separated from application logic
- Follows Terra Mortis file structure conventions

### Measurable Outcomes

- Current monolith (`WWRI-toolkit.html`, 508KB) fully replaced by modular file structure
- All existing features working — zero functional regression
- Any individual module can be read and understood in isolation

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Brownfield extraction — restructuring a working 508KB monolith into modular files while preserving all existing functionality. The app is feature-complete; the value is in maintainability, not new capabilities.

**Resource Requirements:** One developer (Angelus) with AI assistance (Claude Code). No design, no backend, no DevOps.

### Phase 1: MVP (2 days — deadline 2026-03-31)

**Core User Journeys Supported:** All four (monthly finance report, pipeline update, app editing, data recovery)

**Must-Have Capabilities:**

1. Modular file structure following Terra Mortis conventions
   - `public/index.html` — single entry point
   - `public/css/theme.css` — all colour custom properties
   - `public/css/*.css` — component stylesheets
   - `public/js/` — ES modules, max 500 lines each
   - `data/` — JSON data files (seed data, FX rates, benchmarks)
2. Mode switcher (Pipeline Report / Finance Report) working
3. Finance Report — all 5 tabs functional (Dashboard, Cash Forecast, Revenue Pipeline, Controls, Print)
4. Pipeline Report — all 7 tabs functional (carried through refactor)
5. Shared data layer (localStorage) intact with all existing keys
6. CSV import/export working (HubSpot, Xero, backup/restore)
7. Print/PDF layouts producing same output
8. SVG charts rendering correctly
9. Bug fixes for known issues

**Explicitly NOT in Phase 1:** New features, responsive/tablet layouts, API integrations, consultant tools.

### Phase 2: Growth (weeks following)

- Frankfurter API for live FX rates (simple fetch, no auth)
- Pipeline Report modules cleaned up and improved
- Revenue pipeline auto-population from HubSpot + Xero data
- Project Costing Sheet refactored (WWRI Consult)
- Structured Interview Tool refactored (WWRI Consult)

### Phase 3: Expansion (months)

- Responsive/tablet layouts for consultant tools
- iPad Safari optimisation
- GitHub Pages deployment
- Consultant tools working independently offline

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Regression during refactor | Test each tab after extraction. Git commits at each stable checkpoint. |
| localStorage data format mismatch | Keep same keys and data structures. No migration needed. |
| ES module import issues | Use Live Server (required for ES modules). Cannot use file:// protocol. |
| 2-day deadline is tight | Extract (not rewrite) existing working code. Prioritise Finance Report if time runs short. |
| Single developer | AI-assisted development. Modular structure enables smaller, focused edits. |

## User Journeys

### Journey 1: Angelus — Monthly Finance Report (primary, happy path)

It's the last day of the month. Angelus needs to produce the board finance report. She opens the WWRI Toolkit in her browser via Live Server, switches to Finance Report mode.

She goes to the Controls tab and imports this month's Xero exports — Balance Sheet AU, Balance Sheet EU, P&L AU (month and YTD), P&L EU (month and YTD). Each is a CSV paste. The app parses each one and confirms the import. She checks the Dashboard tab — KPI cards show this month's revenue, gross profit, operating profit, and cash position. The revenue by entity table shows AU and EU breakdowns.

She switches to Cash Forecast and reviews the 9-month rolling projection. She updates a couple of expense line items that changed this month (a one-off legal fee, an updated consulting rate). The SVG chart updates — forecast and potential cash lines look right.

She checks the Revenue Pipeline tab, updates the status on two deals (one moved from Uncertain to Certain, another got invoiced so it's now Contracted with an invoice number). The monthly projection columns shift accordingly.

She switches to the Print tab, selects her report options, and hits Print. A clean A4 PDF renders — KPIs, entity summary, cash forecast, chart. She saves the PDF and emails it to the board. Done in 20 minutes.

**Capabilities revealed:** CSV import/parsing, data persistence, KPI calculation, expense editing, revenue pipeline status management, print layout.

### Journey 2: Angelus — Pipeline Report update (primary, parallel workflow)

Same week. Angelus exports the latest deal pipeline from HubSpot as a TSV. She switches to Pipeline Report mode and imports it via Controls. The app detects stale deals, flags them. She reviews the funnel, checks the Performance tab for IE Lead stats, and prints the pipeline board report.

**Capabilities revealed:** Mode switcher, shared Controls tab, HubSpot CSV parsing, stale deal detection, pipeline analytics, separate print layout.

### Journey 3: Angelus — Debugging/editing the app (primary, edge case)

Angelus notices a calculation is off — a FX rate is stale, or a new expense category needs adding. She opens VS Code, finds the relevant module (e.g., `public/js/finance/forecast.js` or `data/fx-rates.json`), makes the change, and refreshes the browser. The fix is isolated — she doesn't need to scroll through 3,000 lines to find the right spot. She commits the change with a clear message.

**Capabilities revealed:** Modular file structure, data separated from logic, AI-friendly editing, git workflow.

### Journey 4: Angelus — Data recovery (edge case/failure)

Something goes wrong — localStorage gets cleared, or she imports a bad CSV. She goes to Controls, uses the Restore Backup button, selects her last JSON export, and the app repopulates. Or she uses git to revert a bad code change.

**Capabilities revealed:** Backup/restore, data resilience, git as safety net.

### Journey Requirements Summary

| Capability | Journeys |
|-----------|----------|
| CSV import/parsing (Xero, HubSpot) | 1, 2 |
| localStorage persistence | 1, 2, 4 |
| Mode switcher (Pipeline/Finance) | 1, 2 |
| KPI calculation engine | 1 |
| Editable expense forecast | 1 |
| Revenue pipeline with status management | 1 |
| SVG chart rendering | 1 |
| Print/PDF layout (Finance + Pipeline) | 1, 2 |
| Stale deal detection | 2 |
| Pipeline analytics | 2 |
| Modular file structure | 3 |
| Data/logic separation | 3 |
| Backup/restore | 4 |

## Functional Requirements

### Data Import & Parsing

- FR1: User can import a full HubSpot pipeline export (CSV/TSV) to replace the deal database
- FR2: User can import a HubSpot pipeline update (active deals only) to merge with existing data, with stale deals flagged
- FR3: User can import Xero invoice data (CSV) for active project reconciliation
- FR4: User can import Xero Balance Sheet exports (CSV) for AU and EU entities
- FR5: User can import Xero P&L exports (CSV) for AU and EU entities (month and year-to-date)
- FR6: User can import rolling monthly totals (CSV) for pipeline history
- FR7: User can import HubSpot leads/contacts (CSV) for the leads pipeline
- FR8: System parses CSV/TSV data using name-based column matching (not fixed positions)

### Data Persistence & Recovery

- FR9: System persists all data to localStorage across browser sessions
- FR10: User can export a full backup of all data as a JSON file
- FR11: User can restore data from a previously exported JSON backup
- FR12: User can save the current pipeline state as a baseline for comparison
- FR13: System captures monthly snapshots automatically at import time

### Mode Switching & Navigation

- FR14: User can switch between Pipeline Report mode and Finance Report mode via a top-level mode switcher
- FR15: User can navigate between tabs within each mode
- FR16: Both modes share the same underlying data layer

### Pipeline Report

- FR17: User can view the deal pipeline as a visual funnel chart with stage-wise values
- FR18: User can view a sortable table of all active deals with key fields
- FR19: User can view pipeline performance analytics (IE Lead origination, client concentration, win rates, stage timing)
- FR20: User can view forecasting data (weighted pipeline, win rate trends by quarter and deal size, loss analysis)
- FR21: User can view the leads pipeline with activity status, IE matrix, and category breakdown
- FR22: User can view 24-month rolling pipeline history as a stacked area chart
- FR23: User can view and compare current pipeline against a saved baseline
- FR24: User can mark deals as lost or dismiss stale deal alerts

### Finance Report — Dashboard

- FR25: User can view KPI cards showing current month revenue, gross profit, operating profit, and cash position
- FR26: User can view a revenue by entity table (AU, EU, combined) with month and year-to-date figures

### Finance Report — Cash Forecast

- FR27: User can view a 9-month rolling cash forecast table (actuals + 8 forecast months)
- FR28: User can edit operating expense line items per month in the forecast
- FR29: System calculates revenue projections by month based on revenue pipeline status and due dates
- FR30: System calculates cost of sales (IE fees, referral fees) from the revenue pipeline
- FR31: System calculates net cash movement and rolling opening/closing cash positions
- FR32: User can view a dual-line SVG chart showing forecast cash vs potential cash

### Finance Report — Revenue Pipeline

- FR33: User can view all revenue lines with status (Contracted, Certain, Uncertain), client, amount, and fees
- FR34: User can edit revenue line status, dates, and amounts inline
- FR35: System calculates referral fees, IE fees, WWRI margin, and FX conversion per revenue line
- FR36: System projects revenue into future month columns based on due date and status

### Finance Report — FX & Reference Data

- FR37: User can view and edit exchange rates (AUD, EUR, USD, GBP, SGD)
- FR38: User can view and edit client reference data (payment terms, IE fee percentages)
- FR39: System applies FX rates to convert multi-currency revenue to AUD

### Print & Export

- FR40: User can generate a printable A4 finance report for the board (PDF via browser print)
- FR41: User can generate a printable A4 pipeline report (up to 5 pages)
- FR42: User can select basic or advanced print options for the pipeline report

### Activity Logging

- FR43: System logs all data imports with type, date, and record counts
- FR44: User can view the import log in the Controls tab

## Non-Functional Requirements

### Performance

- NFR1: Tab switching and data recalculation complete within 1 second for typical dataset sizes (up to 200 deals, 50 revenue lines)
- NFR2: CSV import and parsing complete within 3 seconds for files up to 500 rows
- NFR3: Print layout renders within 2 seconds

### Maintainability

- NFR4: No single JavaScript file exceeds 500 lines
- NFR5: No single CSS file exceeds 500 lines
- NFR6: All colour values defined as CSS custom properties in `theme.css` — no hardcoded hex values in other files
- NFR7: CSS class names follow BEM-lite convention (block__element--modifier)
- NFR8: JavaScript uses ES modules with explicit named exports and `.js` file extensions in import paths
- NFR9: Business data (FX rates, seed data, stage definitions, benchmarks) stored in separate JSON data files, not in application code
- NFR10: File naming uses kebab-case; functions/variables use camelCase; constants use UPPER_SNAKE_CASE
- NFR11: No use of `var` — `const` by default, `let` when reassignment is needed
- NFR12: No use of `!important` in CSS
- NFR13: Semantic HTML elements used throughout (button, not div with onclick)

### Integration

- NFR14: CSV parsing handles both comma-delimited and tab-separated formats with quoted field support
- NFR15: Xero CSV imports use account-name-based lookups (not fixed row positions) to remain resilient to format changes

### Data Integrity

- NFR16: localStorage data format is backward-compatible with existing data — no migration required on first load
- NFR17: All import operations are logged with type, timestamp, and record counts
- NFR18: Backup export captures complete application state in a single JSON file that can fully restore the app

## Technical Context

### Architecture

- **SPA architecture:** Single `index.html` entry point, ES modules loaded via `<script type="module">`, JavaScript handles all routing/tab switching
- **Browser targets:** Chrome (primary, development), Safari (future, iPad consultant tools)
- **No SEO, real-time, or native feature requirements**
- **Accessibility:** Semantic HTML per Terra Mortis standards (buttons, labels, alt attributes). No WCAG audit required for MVP

### Implementation Notes

- ES modules require a local server (Live Server in VS Code) — cannot open `index.html` as a file:// URL
- Print/PDF layout uses `@media print` CSS and `window.print()` — no third-party PDF library
- SVG charts rendered via string concatenation (no D3 or charting library)
- All data persistence via localStorage JSON serialisation — no IndexedDB or server
