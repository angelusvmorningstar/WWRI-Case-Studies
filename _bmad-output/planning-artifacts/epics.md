---
stepsCompleted: ['step-01', 'step-02', 'step-03', 'step-04']
status: 'complete'
completedAt: '2026-03-30'
inputDocuments:
  - prd.md
  - architecture.md
  - ux-design-specification.md
project_name: 'WWRI-Toolkit'
user_name: 'Angelus'
date: '2026-03-30'
---

# WWRI-Toolkit - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for WWRI-Toolkit, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can import a full HubSpot pipeline export (CSV/TSV) to replace the deal database
FR2: User can import a HubSpot pipeline update (active deals only) to merge with existing data, with stale deals flagged
FR3: User can import Xero invoice data (CSV) for active project reconciliation
FR4: User can import Xero Balance Sheet exports (CSV) for AU and EU entities
FR5: User can import Xero P&L exports (CSV) for AU and EU entities (month and year-to-date)
FR6: User can import rolling monthly totals (CSV) for pipeline history
FR7: User can import HubSpot leads/contacts (CSV) for the leads pipeline
FR8: System parses CSV/TSV data using name-based column matching (not fixed positions)
FR9: System persists all data to localStorage across browser sessions
FR10: User can export a full backup of all data as a JSON file
FR11: User can restore data from a previously exported JSON backup
FR12: User can save the current pipeline state as a baseline for comparison
FR13: System captures monthly snapshots automatically at import time
FR14: User can switch between Pipeline Report mode and Finance Report mode via a top-level mode switcher
FR15: User can navigate between tabs within each mode
FR16: Both modes share the same underlying data layer
FR17: User can view the deal pipeline as a visual funnel chart with stage-wise values
FR18: User can view a sortable table of all active deals with key fields
FR19: User can view pipeline performance analytics (IE Lead origination, client concentration, win rates, stage timing)
FR20: User can view forecasting data (weighted pipeline, win rate trends by quarter and deal size, loss analysis)
FR21: User can view the leads pipeline with activity status, IE matrix, and category breakdown
FR22: User can view 24-month rolling pipeline history as a stacked area chart
FR23: User can view and compare current pipeline against a saved baseline
FR24: User can mark deals as lost or dismiss stale deal alerts
FR25: User can view KPI cards showing current month revenue, gross profit, operating profit, and cash position
FR26: User can view a revenue by entity table (AU, EU, combined) with month and year-to-date figures
FR27: User can view a 9-month rolling cash forecast table (actuals + 8 forecast months)
FR28: User can edit operating expense line items per month in the forecast
FR29: System calculates revenue projections by month based on revenue pipeline status and due dates
FR30: System calculates cost of sales (IE fees, referral fees) from the revenue pipeline
FR31: System calculates net cash movement and rolling opening/closing cash positions
FR32: User can view a dual-line SVG chart showing forecast cash vs potential cash
FR33: User can view all revenue lines with status (Contracted, Certain, Uncertain), client, amount, and fees
FR34: User can edit revenue line status, dates, and amounts inline
FR35: System calculates referral fees, IE fees, WWRI margin, and FX conversion per revenue line
FR36: System projects revenue into future month columns based on due date and status
FR37: User can view and edit exchange rates (AUD, EUR, USD, GBP, SGD)
FR38: User can view and edit client reference data (payment terms, IE fee percentages)
FR39: System applies FX rates to convert multi-currency revenue to AUD
FR40: User can generate a printable A4 finance report for the board (PDF via browser print)
FR41: User can generate a printable A4 pipeline report (up to 5 pages)
FR42: User can select basic or advanced print options for the pipeline report
FR43: System logs all data imports with type, date, and record counts
FR44: User can view the import log in the Controls tab

### NonFunctional Requirements

NFR1: Tab switching and data recalculation complete within 1 second for typical dataset sizes (up to 200 deals, 50 revenue lines)
NFR2: CSV import and parsing complete within 3 seconds for files up to 500 rows
NFR3: Print layout renders within 2 seconds
NFR4: No single JavaScript file exceeds 500 lines
NFR5: No single CSS file exceeds 500 lines
NFR6: All colour values defined as CSS custom properties in theme.css — no hardcoded hex values in other files
NFR7: CSS class names follow BEM-lite convention (block__element--modifier)
NFR8: JavaScript uses ES modules with explicit named exports and .js file extensions in import paths
NFR9: Business data (FX rates, seed data, stage definitions, benchmarks) stored in separate JSON data files, not in application code
NFR10: File naming uses kebab-case; functions/variables use camelCase; constants use UPPER_SNAKE_CASE
NFR11: No use of var — const by default, let when reassignment is needed
NFR12: No use of !important in CSS
NFR13: Semantic HTML elements used throughout (button, not div with onclick)
NFR14: CSV parsing handles both comma-delimited and tab-separated formats with quoted field support
NFR15: Xero CSV imports use account-name-based lookups (not fixed row positions) to remain resilient to format changes
NFR16: localStorage data format is backward-compatible with existing data — no migration required on first load
NFR17: All import operations are logged with type, timestamp, and record counts
NFR18: Backup export captures complete application state in a single JSON file that can fully restore the app

### Additional Requirements

- No starter template — manual file structure following Terra Mortis conventions (brownfield extraction)
- store.js wrapper as sole gateway to localStorage — clean key names mapped to existing localStorage keys (e.g., deals → ww_db2) for backward compatibility
- JSON seed files in public/data/ loaded only when localStorage has no value for that key (first-run defaults)
- Tab modules as self-contained render(container) functions — each module owns its HTML, event binding, and data reads
- Feature-based folder structure — public/js/shared/, public/js/finance/, public/js/pipeline/ with matching CSS folders
- Events bound inside each tab module — no centralised event delegation, no event bus
- Shared utilities — store.js, csv-parser.js, fx.js, format.js, charts.js, print.js in shared/
- Implementation sequence — file structure + store.js first → shared utilities → tab modules (Finance first) → app.js wiring → print layouts last
- Error handling patterns — CSV parse errors shown in Controls tab, storage errors caught in store.js, render errors caught per tab with fallback message
- format.js for all user-facing display — no inline toFixed() or toLocaleString() scattered across modules
- Anti-patterns enforced — no direct localStorage access, no cross-tab DOM access, no inline styles in JS, no var, no !important

### UX Design Requirements

UX-DR1: Design token system in theme.css — complete colour palette (brand, text, surface, pipeline stage, revenue status), typography scale (6 sizes, 4 weights), spacing scale (4px base, 8 tokens), border radii, and transition values
UX-DR2: App shell layout (Direction C) — pill mode switcher in header + underline tab bar on separate row, all inner content constrained to max-width 1200px centred
UX-DR3: KPI Card component — label (uppercase muted) / value (large monospace) / change indicator (coloured arrow), displayed as 4-column grid on Dashboard
UX-DR4: Data Table component — consistent styling across all tabs: column headers (uppercase muted), alternating row tints, row hover, numeric columns right-aligned with monospace font, sortable columns with arrow indicator, optional title bar and footer/totals row
UX-DR5: Status Badge component — colour-coded pills for revenue pipeline statuses (Contracted/Certain/Uncertain) and pipeline deal stages, with text label supplementing colour
UX-DR6: Import Area component — one per CSV type on Controls tab: label identifying import type, textarea with placeholder text (monospace font), Import button. Cleared after successful import, retains content on error
UX-DR7: Import Confirmation Banner — stacking banners at top of Controls (most recent on top). Success: green left border + checkmark + entity name + row count + relative timestamp. Error: red left border + warning icon + specific error message
UX-DR8: SVG Chart components — dual-line chart (Cash Forecast: solid teal forecast + dashed amber potential, fill gradient), funnel chart (Pipeline: stage-wise horizontal bars), stacked area chart (Pipeline History: 24-month rolling)
UX-DR9: Button hierarchy — primary (teal bg, white text: one per context), ghost (transparent, bordered: secondary actions), danger (red: destructive actions). Primary aligned right, danger visually separated, max 3 buttons per group
UX-DR10: Editable Table Row — inline editing via input or select elements (not contenteditable), distinguished by subtle background tint, blur/change events trigger save + cascade. No save button
UX-DR11: Revenue Line component — client name, project, status badge (dropdown), editable amount, calculated WWRI margin, editable due date. Status change triggers revenue projection → cash forecast → chart cascade. FX conversion for non-AUD amounts
UX-DR12: Deal Card/Row — deal name, client, stage badge, value, close date, stale flag. Stale deals show dismiss/mark-as-lost action. Column header sorting
UX-DR13: Print Layout — A4 pages via @media print in separate CSS files. Header: logo + report title + date. Page break markers. Finance: 1–2 pages. Pipeline: up to 5 pages (basic/advanced). Screen elements hidden
UX-DR14: Empty states — KPI cards show $0 or dash placeholders, tables show "No data imported yet" with link to Controls. Charts show empty axes. No onboarding wizard
UX-DR15: Destructive action confirmation — inline (not modal): danger button transforms to confirm/cancel row. 5-second auto-cancel timeout. Only for Clear All Data and Restore from Backup
UX-DR16: Accessibility — semantic HTML (button, th, label, nav), keyboard navigation with visible focus indicators, no colour-only indicators, WCAG AA contrast ratios
UX-DR17: Navigation patterns — tab order reflects workflow sequence (data review → Controls → Print), no modals/breadcrumbs/nested navigation, mode switch instant with no confirmation
UX-DR18: Form patterns — monospace textarea for CSV paste, inline editable cells with background tint, FX rate inputs with 4 decimal places, no form validation beyond parse errors

### FR Coverage Map

FR1: Epic 5 — HubSpot full pipeline import
FR2: Epic 5 — HubSpot pipeline update (merge + stale flagging)
FR3: Epic 2 — Xero invoice import for reconciliation
FR4: Epic 2 — Xero Balance Sheet import (AU, EU)
FR5: Epic 2 — Xero P&L import (AU, EU, month + YTD)
FR6: Epic 5 — Rolling monthly totals import
FR7: Epic 5 — HubSpot leads/contacts import
FR8: Epic 2 — CSV/TSV parsing with name-based column matching
FR9: Epic 1 — localStorage persistence via store.js
FR10: Epic 2 — Full backup export as JSON
FR11: Epic 2 — Restore from JSON backup
FR12: Epic 5 — Save pipeline baseline for comparison
FR13: Epic 5 — Automatic monthly snapshots at import
FR14: Epic 1 — Mode switcher (Pipeline/Finance)
FR15: Epic 1 — Tab navigation within each mode
FR16: Epic 1 — Shared data layer across modes
FR17: Epic 5 — Pipeline funnel chart
FR18: Epic 5 — Sortable deal table
FR19: Epic 5 — Pipeline performance analytics
FR20: Epic 5 — Pipeline forecasting data
FR21: Epic 5 — Leads pipeline view
FR22: Epic 5 — 24-month rolling pipeline history chart
FR23: Epic 5 — Pipeline baseline comparison
FR24: Epic 5 — Mark deals lost / dismiss stale alerts
FR25: Epic 3 — Finance Dashboard KPI cards
FR26: Epic 3 — Revenue by entity table
FR27: Epic 3 — 9-month rolling cash forecast table
FR28: Epic 3 — Editable operating expense line items
FR29: Epic 3 — Revenue projections by month
FR30: Epic 3 — Cost of sales calculation
FR31: Epic 3 — Net cash movement and rolling cash positions
FR32: Epic 3 — Dual-line SVG chart (forecast vs potential cash)
FR33: Epic 3 — Revenue lines with status, client, amount, fees
FR34: Epic 3 — Inline edit revenue line status, dates, amounts
FR35: Epic 3 — Referral fees, IE fees, WWRI margin, FX per revenue line
FR36: Epic 3 — Revenue projection into future month columns
FR37: Epic 2 — View and edit exchange rates
FR38: Epic 2 — View and edit client reference data
FR39: Epic 2 — FX rate application for multi-currency conversion
FR40: Epic 4 — Printable A4 finance report (PDF via browser print)
FR41: Epic 5 — Printable A4 pipeline report
FR42: Epic 5 — Basic/advanced print options for pipeline report
FR43: Epic 2 — Import logging (type, date, record counts)
FR44: Epic 2 — Import log display in Controls tab

## Epic List

### Epic 1: App Foundation & Navigation
User can open the refactored app, switch between Finance Report and Pipeline Report modes, navigate tabs within each mode, and all existing localStorage data is preserved. The design system, shared utilities, and data storage layer are established.
**FRs covered:** FR9, FR14, FR15, FR16

### Epic 2: Finance Controls & Data Management
User can import Xero CSVs (Balance Sheet, P&L, invoices), manage exchange rates and client reference data, export and restore data backups, and view the import history log — all from the Finance Controls tab.
**FRs covered:** FR3, FR4, FR5, FR8, FR10, FR11, FR37, FR38, FR39, FR43, FR44

### Epic 3: Finance Dashboard, Forecast & Revenue
User can view KPI cards and entity summary on the Dashboard, view and edit the 9-month cash forecast with expenses and SVG chart, and manage revenue pipeline lines with statuses, amounts, and projections that cascade across tabs.
**FRs covered:** FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36

### Epic 4: Finance Print
User can print a board-ready A4 finance report — KPIs, entity summary, cash forecast, chart — with the Whitewater logo and professional formatting, ready to email to the board.
**FRs covered:** FR40

### Epic 5: Pipeline Report
User can import HubSpot pipeline data, view the deal funnel, performance analytics, forecasting, leads pipeline, and 24-month history, manage baselines and stale deals, and print the pipeline board report with basic or advanced options.
**FRs covered:** FR1, FR2, FR6, FR7, FR12, FR13, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR41, FR42

## Epic 1: App Foundation & Navigation

User can open the refactored app, switch between Finance Report and Pipeline Report modes, navigate tabs within each mode, and all existing localStorage data is preserved. The design system, shared utilities, and data storage layer are established.

### Story 1.1: Project Structure, Theme & Seed Data

As a developer,
I want the project directory structure created with the design token system and seed data files in place,
So that all subsequent development follows consistent conventions and the visual foundation is established.

**Acceptance Criteria:**

**Given** the project repository exists
**When** the file structure is created
**Then** the following directories exist: `public/css/shared/`, `public/css/finance/`, `public/css/pipeline/`, `public/js/shared/`, `public/js/finance/`, `public/js/pipeline/`, `public/data/`, `public/assets/`
**And** `public/css/theme.css` contains all CSS custom properties: colour palette (brand, text, surface, pipeline stage, revenue status), typography scale (6 sizes, 4 weights, 2 font stacks), spacing scale (8 tokens on 4px base), border radii, and transition values — matching the UX Design Specification exactly
**And** `public/data/fx-rates.json` contains default exchange rates for AUD, EUR, USD, GBP, SGD
**And** `public/data/stage-definitions.json` contains pipeline stage names and display order
**And** `public/data/expense-categories.json` contains operating expense line items
**And** `public/data/client-defaults.json` contains client reference data (payment terms, IE fee percentages)
**And** `public/assets/WWT-Logo.jpg` is copied from `reference/WWT-Logo.jpg`
**And** no file exceeds 500 lines (NFR4, NFR5)
**And** all file names use kebab-case (NFR10)

### Story 1.2: Data Storage Layer

As a user,
I want my existing localStorage data preserved when I open the refactored app,
So that I don't lose any previously imported pipeline or finance data.

**Acceptance Criteria:**

**Given** the user has existing data in localStorage under keys like `ww_db2`, `ww_log2`, `ww_snaps2`
**When** the app loads and `store.js` initialises
**Then** `store.get('deals')` returns the data from `localStorage.getItem('ww_db2')` parsed as JSON
**And** `store.set('deals', data)` writes to `localStorage.setItem('ww_db2', JSON.stringify(data))`
**And** `store.getAll()` returns an object containing all mapped keys and their current values
**And** `store.clear()` removes all mapped localStorage keys

**Given** the user opens the app for the first time (no existing localStorage data)
**When** `store.js` initialises
**Then** seed data from JSON files in `public/data/` is loaded into localStorage for any key that has no existing value
**And** subsequent calls to `store.get()` return the seeded defaults

**Given** any module in the application needs to read or write data
**When** that module accesses data
**Then** it does so exclusively through `store.js` — no direct `localStorage.getItem()` or `localStorage.setItem()` calls exist outside `store.js`
**And** all exports use named exports with ES module syntax (NFR8)
**And** the module uses `const` by default, `let` only when reassignment is needed (NFR11)

### Story 1.3: Shared Utilities

As a user,
I want all numbers, currencies, and dates displayed consistently across the app,
So that I can trust the data presentation and scan figures quickly.

**Acceptance Criteria:**

**Given** a currency amount needs to be displayed
**When** `formatCurrency(amount, currency)` is called from `format.js`
**Then** the output is formatted with currency symbol, thousands separators, and 2 decimal places (e.g., `"$1,234.56"`)
**And** negative values are formatted with a minus sign

**Given** a percentage needs to be displayed
**When** `formatPercent(value)` is called from `format.js`
**Then** the output is formatted as a percentage string (e.g., `0.15` → `"15%"`)

**Given** a date needs to be displayed
**When** `formatDate(isoString)` is called from `format.js`
**Then** the output is a human-readable date string

**Given** a revenue amount in EUR needs to be converted to AUD
**When** `convertToAUD(amount, fromCurrency)` is called from `fx.js`
**Then** the conversion uses the current FX rates from `store.get('fxRates')`
**And** the result is a number (not pre-formatted)

**Given** CSV or TSV text data needs to be parsed
**When** `parseCSV(text)` is called from `csv-parser.js`
**Then** the parser auto-detects comma vs tab delimiters
**And** handles quoted fields containing delimiters or newlines (NFR14)
**And** returns an array of objects with column-name keys (name-based matching, not positional) (FR8)
**And** returns a clear error object if expected columns are not found

**And** all three modules use ES module named exports with `.js` file extensions in import paths (NFR8)

### Story 1.4: App Shell & Navigation

As a user,
I want to open the app and switch between Finance Report and Pipeline Report modes with tab navigation,
So that I can access any part of the toolkit with one click.

**Acceptance Criteria:**

**Given** the user opens `index.html` via Live Server
**When** the page loads
**Then** the app shell renders with: header containing logo text and pill mode switcher, tab bar below the header, and a content area — all inner content constrained to `max-width: 1200px` centred (UX-DR2)
**And** Finance Report mode is active by default
**And** the Finance tab bar shows: Dashboard, Cash Forecast, Revenue Pipeline, Controls, Print (UX-DR17)
**And** the Dashboard tab is active by default

**Given** the user is in Finance Report mode
**When** they click the Pipeline Report pill in the mode switcher
**Then** the tab bar updates to show Pipeline tabs: Pipeline, Performance, Forecasting, Leads, History, Controls, Print
**And** the first Pipeline tab is active by default
**And** the switch is instant — no loading state, no confirmation dialog (FR14, UX-DR17)

**Given** the user is viewing any tab
**When** they click a different tab in the tab bar
**Then** the content area renders that tab's content (or empty state placeholder for now)
**And** the active tab shows a teal underline and bold weight (UX-DR2)
**And** the previously active tab returns to inactive styling (FR15)

**Given** the app shell is rendered
**When** the user navigates with the keyboard
**Then** Tab key moves through interactive elements (mode switcher pills, tab buttons) in logical order
**And** all interactive elements show visible focus indicators (UX-DR16)
**And** mode switcher pills and tab buttons are `<button>` elements with appropriate ARIA attributes (NFR13)

**And** `app.js` is the sole module that knows which tabs exist and routes between them
**And** `layout.css` uses CSS custom properties from `theme.css` for all colour values (NFR6)

### Story 1.5: Shared Component Styles

As a developer,
I want reusable CSS component styles available for tables, forms, cards, charts, and buttons,
So that all tabs render with consistent visual patterns without duplicating CSS.

**Acceptance Criteria:**

**Given** a tab module renders a data table
**When** it uses the classes from `tables.css`
**Then** `.data-table` provides: column headers in uppercase muted text, alternating row tints (`--color-bg-alt`), row hover (`--color-bg-hover`), and numeric columns right-aligned with monospace font (`--font-mono`) (UX-DR4)
**And** `.data-table__cell--editable` provides a subtle background tint to distinguish editable cells (UX-DR10)

**Given** a tab module renders buttons
**When** it uses the classes from `forms.css`
**Then** `.btn--primary` renders teal background with white text (UX-DR9)
**And** `.btn--ghost` renders transparent with border and muted text
**And** `.btn--danger` renders red background with white text
**And** all button variants show hover, focus, and disabled states

**Given** a tab module renders KPI cards
**When** it uses the classes from `cards.css`
**Then** `.kpi-card` provides the label/value/change layout with consistent padding and visual hierarchy (UX-DR3)

**Given** a tab module renders an SVG chart container
**When** it uses the classes from `charts.css`
**Then** `.chart-area` provides consistent chart container styling with title area

**Given** any shared CSS file
**When** its classes are inspected
**Then** all class names follow BEM-lite convention (`block__element--modifier`) (NFR7)
**And** all colour values reference `theme.css` custom properties — no hardcoded hex values (NFR6)
**And** no use of `!important` (NFR12)
**And** no single CSS file exceeds 500 lines (NFR5)

## Epic 2: Finance Controls & Data Management

User can import Xero CSVs (Balance Sheet, P&L, invoices), manage exchange rates and client reference data, export and restore data backups, and view the import history log — all from the Finance Controls tab.

### Story 2.1: Finance Controls Tab Layout & Import Areas

As a user,
I want a Controls tab with clearly labelled import areas for each Xero CSV type,
So that I know exactly where to paste each export and can import them one at a time.

**Acceptance Criteria:**

**Given** the user navigates to the Controls tab in Finance Report mode
**When** the tab renders
**Then** the Controls tab displays import areas for: Balance Sheet AU, Balance Sheet EU, P&L AU Month, P&L AU YTD, P&L EU Month, P&L EU YTD, and Invoices
**And** each import area contains: a label identifying the CSV type, a `<textarea>` with monospace font and placeholder text describing the expected format (UX-DR6), and a primary Import button (UX-DR9)
**And** the tab layout uses shared component styles from `tables.css`, `forms.css` (Story 1.5)
**And** `finance-controls.js` exports a `render(container)` function as its sole public interface
**And** `finance-controls.css` is created in `public/css/finance/` using BEM-lite naming and theme.css custom properties (NFR6, NFR7)
**And** the textarea retains pasted content on parse error so the user can inspect it (UX-DR6)
**And** the textarea is cleared after a successful import (UX-DR6)

### Story 2.2: Xero CSV Import & Parsing

As a user,
I want to paste Xero CSV exports and have the app parse them correctly using column names,
So that my financial data is imported reliably even if Xero changes the column order.

**Acceptance Criteria:**

**Given** the user pastes a Xero Balance Sheet CSV for AU into the Balance Sheet AU textarea
**When** they click the Import button
**Then** the parser uses `csv-parser.js` to parse the CSV and looks up columns by account name (not row position) (FR4, NFR15)
**And** parsed balance sheet data is saved via `store.set()` with the correct key for AU entity
**And** parsing completes within 3 seconds for files up to 500 rows (NFR2)

**Given** the user pastes a Xero P&L CSV (month or YTD) for AU or EU
**When** they click the Import button
**Then** the parser identifies the entity and period type from the data and column names (FR5, NFR15)
**And** parsed P&L data is saved via `store.set()` with the correct entity and period key

**Given** the user pastes a Xero invoice CSV
**When** they click the Import button
**Then** the parser extracts invoice data for active project reconciliation (FR3)
**And** parsed invoice data is saved via `store.set()`

**Given** the user pastes data with an unrecognised format or missing expected columns
**When** they click the Import button
**Then** the parser returns a clear error message identifying which expected column was not found (e.g., "Expected column 'Account' not found in Balance Sheet AU")
**And** no data is written to storage on parse failure
**And** the textarea retains the pasted content so the user can inspect it

**And** all Xero-specific column mappings are defined in the finance-controls module, not in csv-parser.js (separation of generic parsing from format-specific logic)

### Story 2.3: Import Feedback & Activity Log

As a user,
I want clear confirmation after each import and a log of all past imports,
So that I know what was imported, when, and can check the history if something seems off.

**Acceptance Criteria:**

**Given** a CSV import succeeds
**When** the data is saved to storage
**Then** a success banner appears at the top of the Controls content area with: green left border, checkmark icon, entity name, row count, and relative timestamp (UX-DR7)
**And** the banner is non-modal and does not block interaction

**Given** a CSV import fails
**When** the parse error is returned
**Then** an error banner appears in the same position with: red left border, warning icon, and the specific error message (UX-DR7)

**Given** multiple imports have been performed
**When** the user views the Controls tab
**Then** confirmation banners stack with the most recent on top (UX-DR7)

**Given** any import operation completes (success or failure)
**When** the result is determined
**Then** the import is logged with type, timestamp, and record count via `store.set()` (FR43, NFR17)

**Given** the user scrolls to the activity log section of the Controls tab
**When** the log is displayed
**Then** all past imports are shown in chronological order with type, timestamp, and record count (FR44)
**And** the log reads from `store.get('importLog')`

### Story 2.4: FX Rates & Client Reference Data

As a user,
I want to view and edit exchange rates and client reference data on the Controls tab,
So that I can keep rates current and client details accurate for all calculations.

**Acceptance Criteria:**

**Given** the user views the FX rates section on the Controls tab
**When** the section renders
**Then** editable number inputs are displayed for AUD, EUR, USD, GBP, and SGD exchange rates (FR37)
**And** inputs show 4 decimal places (UX-DR18)
**And** current values are loaded from `store.get('fxRates')`

**Given** the user changes an FX rate value
**When** the input loses focus (`blur` event)
**Then** the new rate is saved immediately via `store.set('fxRates', ...)` (FR37)
**And** no save button is required — silent persistence (UX-DR10)
**And** the FX rate is available to `fx.js` for all subsequent currency conversions (FR39)

**Given** the user views the client reference data section
**When** the section renders
**Then** editable fields are displayed for client payment terms and IE fee percentages (FR38)
**And** current values are loaded from `store.get('clientDefaults')`

**Given** the user edits a client reference data field
**When** the input loses focus
**Then** the updated value is saved immediately via `store.set('clientDefaults', ...)`

**And** editable cells are visually distinguished with a subtle background tint (`--color-bg-alt`) (UX-DR10, UX-DR18)
**And** focus states show `--color-primary` border + `--color-focus-ring` shadow (UX-DR16)

### Story 2.5: Backup Export & Restore

As a user,
I want to export a full backup of my data and restore from a previous backup,
So that I have a safety net if something goes wrong with my data.

**Acceptance Criteria:**

**Given** the user clicks the Export Backup button (ghost button style) on the Controls tab
**When** the export runs
**Then** `store.getAll()` is called and the complete application state is saved as a single JSON file download (FR10, NFR18)
**And** the downloaded file contains all mapped storage keys and their current values
**And** the file name includes a date stamp for identification

**Given** the user wants to restore from a backup
**When** they select a previously exported JSON file and click the Restore button (danger button style)
**Then** an inline confirmation row appears: "This will replace all current data with the backup. [Cancel] [Confirm]" (UX-DR15)
**And** if the user does not respond within 5 seconds, the confirmation auto-cancels (UX-DR15)

**Given** the user clicks Confirm on the restore confirmation
**When** the restore executes
**Then** each key in the backup JSON is written via `store.set()` (FR11)
**And** the app state reflects the restored data
**And** a success message confirms the restore completed

**Given** the user clicks Cancel on the restore confirmation
**When** the confirmation dismisses
**Then** no data is changed and the Controls tab returns to its default state

## Epic 3: Finance Dashboard, Forecast & Revenue

User can view KPI cards and entity summary on the Dashboard, view and edit the 9-month cash forecast with expenses and SVG chart, and manage revenue pipeline lines with statuses, amounts, and projections that cascade across tabs.

### Story 3.1: Finance Dashboard

As a user,
I want to see headline KPIs and a revenue breakdown by entity when I open the Dashboard,
So that I can immediately verify the current financial position after importing data.

**Acceptance Criteria:**

**Given** the user navigates to the Dashboard tab in Finance Report mode
**When** financial data exists in storage
**Then** four KPI cards are displayed in a 4-column grid showing: current month revenue, gross profit, operating profit, and cash position (FR25, UX-DR3)
**And** each KPI card shows: uppercase muted label, large monospace value formatted via `format.js`, and a coloured change indicator with directional arrow where applicable
**And** a revenue by entity table is displayed below the KPI cards showing AU, EU, and combined totals with month and year-to-date figures (FR26, UX-DR4)
**And** numeric columns are right-aligned with monospace font
**And** all values recalculate from current storage data within 1 second (NFR1)

**Given** the user navigates to the Dashboard tab
**When** no financial data has been imported yet
**Then** KPI cards show `$0` or `—` placeholder values (UX-DR14)
**And** the entity table shows a "No data imported yet" message with a suggestion to go to Controls (UX-DR14)

**And** `dashboard.js` exports a `render(container)` function as its sole public interface
**And** `dashboard.css` is created in `public/css/finance/` using BEM-lite naming and theme.css custom properties

### Story 3.2: Cash Forecast — Table & Expense Editing

As a user,
I want to view a 9-month rolling cash forecast and edit operating expenses per month,
So that I can keep the forecast current when expense commitments change.

**Acceptance Criteria:**

**Given** the user navigates to the Cash Forecast tab
**When** the tab renders
**Then** a 9-month rolling forecast table is displayed with the current month showing actuals and the following 8 months showing forecast values (FR27)
**And** the table rows include operating expense line items loaded from storage (seeded from `expense-categories.json` on first run)
**And** each expense cell for forecast months is editable via `<input type="number">` (FR28, UX-DR10)
**And** editable cells are visually distinguished with a subtle background tint (`--color-bg-alt`)

**Given** the user edits an expense line item value
**When** the input loses focus (`blur` event)
**Then** the new value is saved immediately via `store.set()` — no save button (UX-DR10)
**And** all dependent rows in the forecast table recalculate within 1 second (NFR1)

**Given** no financial data has been imported
**When** the Cash Forecast tab renders
**Then** the table structure displays with zero or placeholder values and editable expense cells still functional

**And** `cash-forecast.js` exports a `render(container)` function
**And** `cash-forecast.css` is created in `public/css/finance/`
**And** numeric columns are right-aligned with monospace font, formatted via `format.js`

### Story 3.3: Cash Forecast — Revenue Projections & Calculations

As a user,
I want the cash forecast to automatically calculate revenue projections, costs, and net cash movement,
So that I can see a complete rolling cash picture without manual spreadsheet work.

**Acceptance Criteria:**

**Given** revenue pipeline data exists in storage with status and due dates
**When** the Cash Forecast tab renders or revenue data changes
**Then** revenue projections are calculated per month based on each revenue line's status (Contracted, Certain, Uncertain) and due date (FR29)
**And** cost of sales is calculated per month — IE fees and referral fees derived from the revenue pipeline data (FR30)
**And** net cash movement is calculated per month as: revenue minus cost of sales minus operating expenses (FR31)
**And** rolling opening and closing cash positions are calculated across all 9 months, with each month's opening balance equal to the previous month's closing balance (FR31)

**Given** the user edits an expense line item (Story 3.2) or a revenue line status changes (Story 3.5)
**When** the dependent data updates
**Then** all projections, costs, and cash positions recalculate and the table re-renders within 1 second (NFR1)

**Given** revenue lines exist in multiple currencies
**When** projections are calculated
**Then** all amounts are converted to AUD using `fx.js` with current stored FX rates (FR39)

### Story 3.4: Cash Forecast — SVG Chart

As a user,
I want to see a visual chart of forecast cash versus potential cash,
So that I can quickly assess the cash trajectory and identify any concerning months.

**Acceptance Criteria:**

**Given** the Cash Forecast tab renders with calculated cash position data
**When** the chart area is rendered
**Then** a dual-line SVG chart is displayed showing: a solid teal line for forecast cash and a dashed amber line for potential cash (FR32, UX-DR8)
**And** the forecast line includes a fill gradient below it
**And** the chart includes grid lines, axis labels (months and dollar values), and a legend identifying each line
**And** the chart is generated via `charts.js` using SVG string concatenation — no charting library

**Given** the underlying cash forecast data changes (expense edit, revenue update, FX rate change)
**When** the data recalculates
**Then** the SVG chart re-renders to reflect the updated values

**Given** no financial data has been imported
**When** the chart area renders
**Then** empty axes are displayed with no data lines (UX-DR14)

**And** `.chart-area` CSS classes from `charts.css` are used for container styling

### Story 3.5: Revenue Pipeline — Display & Editing

As a user,
I want to view all revenue lines with their details and edit statuses, amounts, and dates inline,
So that I can keep the revenue pipeline accurate and see calculation updates immediately.

**Acceptance Criteria:**

**Given** the user navigates to the Revenue Pipeline tab in Finance Report mode
**When** revenue data exists in storage
**Then** all revenue lines are displayed in a data table showing: client name, project, status badge (Contracted/Certain/Uncertain), amount, referral fee, IE fee, WWRI margin, and due date (FR33)
**And** status is shown as a colour-coded badge: Contracted (green), Certain (teal), Uncertain (amber), with text label supplementing colour (UX-DR5)
**And** referral fees, IE fees, WWRI margin, and FX conversion are calculated per revenue line (FR35)
**And** non-AUD amounts are converted to AUD using `fx.js` (FR39)

**Given** the user clicks the status badge on a revenue line
**When** the status dropdown appears
**Then** the user can change the status to Contracted, Certain, or Uncertain (FR34)
**And** on selection, the status badge updates, calculations recalculate, and the change is saved via `store.set()` (UX-DR11)

**Given** the user edits an amount or due date on a revenue line
**When** the input loses focus
**Then** the new value is saved immediately (FR34, UX-DR10)
**And** dependent calculations cascade: referral fee, IE fee, WWRI margin recalculate (FR35)
**And** all changes propagate to the Cash Forecast (revenue projections, cost of sales)

**Given** no revenue data exists
**When** the Revenue Pipeline tab renders
**Then** a "No data imported yet" empty state is shown (UX-DR14)

**And** `revenue-pipeline.js` exports a `render(container)` function
**And** `revenue-pipeline.css` is created in `public/css/finance/`
**And** editable cells use `<input>` or `<select>` elements, not `contenteditable` (UX-DR10)

### Story 3.6: Revenue Pipeline — Monthly Projections

As a user,
I want to see which months each revenue line is projected to land in,
So that I can understand the timing of expected income and spot gaps.

**Acceptance Criteria:**

**Given** revenue lines exist with due dates and statuses
**When** the Revenue Pipeline tab renders
**Then** future month columns are displayed after the revenue line details, showing projected revenue amounts in each month based on due date and status (FR36)
**And** Contracted revenue shows in the month of its due date
**And** Certain and Uncertain revenue shows in the month of its due date (distinguished by status for weighting)

**Given** the user changes a revenue line's due date or status
**When** the edit is saved
**Then** the monthly projection columns update dynamically to reflect the new timing and status
**And** recalculation completes within 1 second (NFR1)

**And** numeric projection values are right-aligned, monospace, and formatted via `format.js`
**And** month columns align with the Cash Forecast's 9-month window for visual consistency

## Epic 4: Finance Print

User can print a board-ready A4 finance report — KPIs, entity summary, cash forecast, chart — with the Whitewater logo and professional formatting, ready to email to the board.

### Story 4.1: Finance Print Layout & CSS

As a developer,
I want a print stylesheet that produces clean A4 output and hides screen-only elements,
So that the printed finance report looks professional without manual layout adjustments.

**Acceptance Criteria:**

**Given** the user triggers `window.print()` or `Ctrl+P` while on the Finance Print tab
**When** the browser print dialog opens
**Then** the app shell (header, mode switcher, tab bar) is hidden via `display: none` in print CSS (UX-DR13)
**And** the print layout renders at A4 page dimensions with appropriate margins
**And** a print header is displayed on each page with: Whitewater logo (`WWT-Logo.jpg`), report title, and current date (UX-DR13)
**And** page break markers control content flow across 1–2 pages (UX-DR13)
**And** typography, colours, and spacing are optimised for print (no background colours that waste ink unless essential for readability)

**And** `print-finance.css` is created at `public/css/print-finance.css` using `@media print`
**And** all colour values reference `theme.css` custom properties (NFR6)
**And** no use of `!important` (NFR12)

### Story 4.2: Finance Print Tab & Content

As a user,
I want to click Print on the Finance Print tab and get a board-ready PDF,
So that I can email the monthly finance report to the board without any manual formatting.

**Acceptance Criteria:**

**Given** the user navigates to the Print tab in Finance Report mode
**When** the tab renders
**Then** the content area displays a print-ready layout containing: KPI summary section, revenue by entity table, cash forecast table, and SVG dual-line chart (FR40)
**And** all data is pulled from current storage via `store.js` and formatted via `format.js`
**And** the layout renders within 2 seconds (NFR3)

**Given** the user clicks the Print button on the Print tab
**When** `window.print()` is triggered
**Then** the browser print dialog opens with the formatted finance report
**And** the output produces a clean 1–2 page A4 PDF when saved

**Given** the user views the Print tab on screen (before printing)
**When** the tab renders
**Then** the content is readable and provides a reasonable preview of the printed output
**And** the Print button is styled as a primary button (UX-DR9)

**And** `finance-print.js` exports a `render(container)` function
**And** the module uses `shared/print.js` for any shared print setup/teardown logic
**And** the module uses `shared/charts.js` for SVG chart rendering

## Epic 5: Pipeline Report

User can import HubSpot pipeline data, view the deal funnel, performance analytics, forecasting, leads pipeline, and 24-month history, manage baselines and stale deals, and print the pipeline board report with basic or advanced options.

### Story 5.1: Pipeline Controls & HubSpot Import

As a user,
I want to import HubSpot pipeline data from the Pipeline Controls tab,
So that I can update the deal database and leads pipeline with fresh exports.

**Acceptance Criteria:**

**Given** the user navigates to the Controls tab in Pipeline Report mode
**When** the tab renders
**Then** import areas are displayed for: full HubSpot pipeline TSV, active deals update TSV, rolling monthly totals CSV, and leads/contacts CSV
**And** each import area has a label, monospace `<textarea>` with placeholder, and Import button (UX-DR6)

**Given** the user pastes a full HubSpot pipeline TSV and clicks Import
**When** the parser runs
**Then** the deal database is fully replaced with the imported data (FR1)
**And** `csv-parser.js` auto-detects tab delimiters and uses name-based column matching (FR8, NFR14)
**And** parsed deals are saved via `store.set('deals', ...)`
**And** a success banner shows deal count and date range (UX-DR7)
**And** the import is logged (FR43)

**Given** the user pastes an active deals update TSV and clicks Import
**When** the parser runs
**Then** active deals are merged with the existing deal database (FR2)
**And** deals present in the database but absent from the update are flagged as stale (FR2)
**And** a success banner shows deals updated count and stale deals flagged count

**Given** the user pastes rolling monthly totals CSV and clicks Import
**When** the parser runs
**Then** monthly pipeline history data is saved via `store.set()` (FR6)
**And** a monthly snapshot is captured automatically at import time (FR13)

**Given** the user pastes HubSpot leads/contacts CSV and clicks Import
**When** the parser runs
**Then** leads data is saved via `store.set()` (FR7)

**Given** a parse fails due to unrecognised format or missing columns
**When** the error is returned
**Then** an error banner shows a specific message identifying the issue (UX-DR7)
**And** the textarea retains content for inspection
**And** no data is written to storage

**And** `pipeline-controls.js` exports a `render(container)` function
**And** `pipeline-controls.css` is created in `public/css/pipeline/`

### Story 5.2: Pipeline Tab — Funnel Chart & Deal Table

As a user,
I want to see the deal pipeline as a visual funnel and a sortable table,
So that I can assess pipeline health and manage individual deals at a glance.

**Acceptance Criteria:**

**Given** the user navigates to the Pipeline tab in Pipeline Report mode
**When** deal data exists in storage
**Then** a funnel chart is displayed showing stage-wise horizontal bars with deal counts and values per stage (FR17, UX-DR8)
**And** the funnel chart is generated via `charts.js` using SVG string concatenation
**And** each stage bar uses the corresponding `--color-stage-*` token from `theme.css`

**Given** deal data exists in storage
**When** the deal table renders
**Then** all active deals are displayed in a sortable table with key fields: deal name, client, stage badge, value, close date (FR18, UX-DR12)
**And** stage is shown as a colour-coded status badge with text label (UX-DR5)
**And** clicking a column header sorts the table ascending, clicking again sorts descending, with a visual indicator (UX-DR12)

**Given** deals have been flagged as stale (from Story 5.1 active deals update)
**When** the deal table renders
**Then** stale deals show a warning indicator (UX-DR12)
**And** each stale deal has dismiss and mark-as-lost actions (FR24)

**Given** the user clicks dismiss on a stale deal
**When** the action completes
**Then** the stale flag is removed and the deal returns to normal display (FR24)

**Given** the user clicks mark-as-lost on a stale deal
**When** the action completes
**Then** the deal is marked as lost with greyed-out styling (FR24, UX-DR12)
**And** the change is saved via `store.set()`

**And** `pipeline.js` exports a `render(container)` function
**And** `pipeline.css` is created in `public/css/pipeline/`

### Story 5.3: Pipeline Performance & Forecasting

As a user,
I want to view pipeline performance analytics and forecasting data,
So that I can identify trends, assess win rates, and understand pipeline strength.

**Acceptance Criteria:**

**Given** the user navigates to the Performance tab
**When** deal data exists in storage
**Then** performance analytics are displayed showing: IE Lead origination stats, client concentration analysis, win rates by stage, and stage timing metrics (FR19)
**And** data is presented in data tables using shared `.data-table` styles (UX-DR4)
**And** numeric columns are right-aligned with monospace font, formatted via `format.js`

**Given** the user navigates to the Forecasting tab
**When** deal data exists in storage
**Then** forecasting data is displayed showing: weighted pipeline value, win rate trends by quarter and deal size, and loss analysis (FR20)
**And** data is presented in data tables and/or charts as appropriate

**Given** no deal data exists
**When** either tab renders
**Then** an appropriate empty state message is shown (UX-DR14)

**And** `performance.js` and `forecasting.js` each export a `render(container)` function
**And** `performance.css` and `forecasting.css` are created in `public/css/pipeline/`
**And** all recalculations complete within 1 second (NFR1)

### Story 5.4: Leads Pipeline

As a user,
I want to view the leads pipeline with activity status and categorisation,
So that I can track lead progression and identify engagement opportunities.

**Acceptance Criteria:**

**Given** the user navigates to the Leads tab in Pipeline Report mode
**When** leads data exists in storage
**Then** the leads pipeline is displayed showing activity status per lead, IE matrix positioning, and category breakdown (FR21)
**And** data is presented in data tables using shared `.data-table` styles (UX-DR4)
**And** status indicators use colour-coded badges with text labels (UX-DR5)

**Given** no leads data has been imported
**When** the Leads tab renders
**Then** an empty state message is shown with a suggestion to import leads from Controls (UX-DR14)

**And** `leads.js` exports a `render(container)` function
**And** `leads.css` is created in `public/css/pipeline/`

### Story 5.5: Pipeline History & Baselines

As a user,
I want to see 24-month pipeline history and compare the current pipeline against a saved baseline,
So that I can track pipeline trends over time and measure progress.

**Acceptance Criteria:**

**Given** the user navigates to the History tab in Pipeline Report mode
**When** pipeline history data exists in storage
**Then** a 24-month rolling pipeline history is displayed as a stacked area chart with stages shown as coloured layers (FR22, UX-DR8)
**And** the chart is generated via `charts.js` using SVG string concatenation
**And** each stage layer uses the corresponding `--color-stage-*` token

**Given** the user clicks the Save Baseline button (ghost button) on the Pipeline tab or Controls
**When** the save executes
**Then** the current pipeline state is saved as a named baseline via `store.set()` (FR12)

**Given** a saved baseline exists
**When** the user views the baseline comparison section
**Then** the current pipeline is displayed alongside the saved baseline with differences highlighted (FR23)

**Given** a pipeline import occurs (Story 5.1)
**When** data is saved to storage
**Then** a monthly snapshot is automatically captured with timestamp (FR13)

**Given** no history data exists
**When** the History tab renders
**Then** empty axes are displayed with no data (UX-DR14)

**And** `history.js` exports a `render(container)` function
**And** `history.css` is created in `public/css/pipeline/`

### Story 5.6: Pipeline Print

As a user,
I want to print a pipeline board report with basic or advanced options,
So that I can share pipeline analytics with the board in a professional format.

**Acceptance Criteria:**

**Given** the user navigates to the Print tab in Pipeline Report mode
**When** the tab renders
**Then** print option controls are displayed allowing selection of basic or advanced report format (FR42)
**And** the basic option includes: funnel chart, deal summary table
**And** the advanced option includes: funnel chart, full deal table, performance analytics, forecasting data
**And** a Print button (primary style) is displayed (UX-DR9)

**Given** the user selects basic or advanced options and clicks Print
**When** `window.print()` is triggered
**Then** the browser print dialog opens with the formatted pipeline report (FR41)
**And** the output produces up to 5 clean A4 pages depending on option selected (UX-DR13)
**And** the print layout includes: Whitewater logo, report title, date header, and page break markers
**And** the app shell (header, tab bar) is hidden in print output
**And** the layout renders within 2 seconds (NFR3)

**And** `pipeline-report.js` exports a `render(container)` function
**And** `print-pipeline.css` is created at `public/css/print-pipeline.css` using `@media print`
**And** the module uses `shared/print.js` for shared print setup/teardown logic
