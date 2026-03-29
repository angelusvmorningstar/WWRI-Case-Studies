---
title: "Product Brief Distillate: WWRI Toolkit"
type: llm-distillate
source: "product-brief-WWRI-Toolkit.md"
created: "2026-03-29"
purpose: "Token-efficient context for downstream PRD creation"
---

## Scope Signals

- **Immediate priority (2-day deadline, due 2026-03-31):** Finance Report mode must be board-ready
- Refactor, not rebuild — extract existing working code from `WWRI-toolkit.html` (508KB monolith) into modular files
- Pipeline Report mode must remain functional through the refactor (extracted but not rewritten)
- Consultant tools (costing, interview) are subsequent releases — not in scope now
- No GitHub Pages deployment yet — runs locally via VS Code Live Server
- localStorage is the persistence layer for now — no backend

## Architecture Constraints (from Terra Mortis standards)

- **No build step** — no webpack, npm packages, TypeScript. Edit file, refresh browser
- `public/` for deployable files (HTML, CSS, JS); `public/css/` and `public/js/` subdirs
- `data/` for JSON data files (never deployed)
- `specs/` for BMAD planning artifacts
- `private/` for local sensitive files (gitignored)
- One `theme.css` with all colours as CSS custom properties — no hardcoded hex elsewhere
- BEM-lite CSS class naming, no `!important`, max 500 lines per CSS file
- ES modules with import/export, `.js` extension required in import paths
- `const` default, `let` when needed, never `var`; named exports only, no barrel files
- Max 500 lines per JS file; camelCase functions/vars, UPPER_SNAKE_CASE constants, kebab-case filenames
- Semantic HTML (button not div), alt on images, labels on inputs
- Feature branches, PR to merge to main (when using GitHub)

## Shared Data Layer (critical design decision)

- Pipeline Report and Finance Report share HubSpot and Xero data sources
- Single Controls interface handles all imports — user imports once, both modes consume
- localStorage keys: `ww_db2` (deals), `ww_log2` (import log), `ww_bl2` (baseline), `ww_snaps2` (snapshots), `ww_leads2` (leads), `ww_sprobs2` (stage probs), `ww_xero2` (Xero invoices), `ww_bs` (balance sheet), `ww_pl` (P&L), `ww_rev` (revenue pipeline), `ww_exp` (expenses), `ww_fx` (FX rates)
- Mode switcher in app header toggles between Pipeline Report and Finance Report views

## Finance Report Features (from spec + existing app)

- **Dashboard tab:** KPI cards (revenue, GP, operating profit, cash position), revenue by entity table (AU + EU)
- **Cash Forecast tab:** 9-month rolling forecast, editable expense table (22 line items), revenue projection by status (contracted/certain/uncertain), SVG dual-line chart (forecast vs potential cash)
- **Revenue Pipeline tab:** Project-level revenue tracking — status (contracted/certain/uncertain), FX conversion, referral fees, IE fees, monthly projection columns. Inline editing
- **Controls tab:** 6 new Xero CSV imports (BS AU/EU, P&L AU/EU month, P&L AU/EU YTD), client reference table, FX rate editor, backup/restore
- **Print tab:** A4 portrait PDF export for board

## Pipeline Report Features (existing, must survive refactor)

- 7 tabs: Pipeline, Performance, Forecasting, Leads, History, Report, Controls
- Deal stages: M1 → M1.5 → M2 → M2.5 → M3 → M4 → Closed Won/Lost/Dormant
- SVG funnel chart, stacked area chart (24-month rolling)
- CSV imports: HubSpot pipeline (full + update), Xero invoices, rolling totals, leads
- Baseline comparison, monthly snapshots, stale deal detection
- Printable A4 report (up to 5 pages)

## Requirements Hints

- Xero CSV parsing should use name-based lookups (not fixed row positions) — resilient to Xero adding/reordering accounts
- Revenue pipeline auto-population from HubSpot deals + Xero invoices is a future enhancement — manual entry for first release
- FX rates: currently hardcoded (AUD/USD 0.6951, EUR/USD 1.1618). Future: Frankfurter API integration
- Expense actuals should auto-populate from P&L imports by matching account names
- Three legal entities: AU (WhitewaterTX Pty Ltd), EU, US — financial data tracked per entity
- Report date derivation is an open question (from P&L export header? manual?)

## Rejected Ideas

- Separate apps with separate data imports — rejected because HubSpot + Xero data feeds both reports
- Full rebuild from scratch — rejected due to 2-day deadline; refactor preserves working logic
- npm/webpack/TypeScript — rejected per architectural standards; no build step
- Backend/server — rejected; stays client-side with localStorage

## User Context

- Angelus: first-time developer, first day using Git and Claude Code (2026-03-29)
- Collaborator Peter has established the architectural standards on Terra Mortis
- Reports go to the Whitewater board — must be professional quality
- Motivation: "I will do anything to automate boring parts of my work"
- British/Australian English throughout
- Currently using Excel for finance report (`WWRI_Financial_Report_[Month]_CASH.xlsx`) — the toolkit replaces this

## Open Questions

- Report date derivation: from P&L export header or manual input?
- Expense actuals → forecast mapping: account code lookup, name matching, or manual mapping table?
- Should revenue pipeline be a single table with Entity column, or separate AU/EU views?
- How to handle the existing `WWRI-finance.html` and `WWRI-costing.html` — archive? Delete? Keep as reference?
