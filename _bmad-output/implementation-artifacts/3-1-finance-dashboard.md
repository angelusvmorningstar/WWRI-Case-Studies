# Story 3.1: Finance Dashboard

Status: review

## Story

As a user,
I want to see headline KPIs and a revenue breakdown by entity when I open the Dashboard,
so that I can immediately verify the current financial position after importing data.

## Acceptance Criteria

1. Four KPI cards in 4-column grid: revenue, gross profit, operating profit, cash position (FR25, UX-DR3)
2. Each card shows: uppercase muted label, large monospace value via format.js, coloured change indicator where applicable
3. Revenue by entity table: AU, EU, combined with month and YTD figures (FR26, UX-DR4)
4. Numeric columns right-aligned monospace
5. All values recalculate from current storage data within 1 second (NFR1)
6. Empty state: KPI cards show $0/dash, table shows "No data imported yet" with Controls link (UX-DR14)
7. dashboard.js exports render(container), dashboard.css uses BEM-lite + theme tokens

## Tasks / Subtasks

- [x] Task 1: Create dashboard.js with KPI calculations (AC: #1, #2, #5)
  - [x] Read profitLoss and balanceSheet from store
  - [x] Calculate: revenue (AU+EU month), gross profit, operating profit, cash position
  - [x] Convert EU values to AUD via fx.js
  - [x] Render 4 KPI cards using .kpi-grid and .kpi-card classes
- [x] Task 2: Create entity table (AC: #3, #4)
  - [x] AU row: month revenue/GP/net, YTD revenue/GP/net
  - [x] EU row: same (converted to AUD)
  - [x] Combined row: totals
  - [x] Use .data-table with .num class for right-aligned monospace
- [x] Task 3: Empty states (AC: #6)
  - [x] KPI cards show $0 or — when no data
  - [x] Table shows message with link to Controls
- [x] Task 4: Wire into app.js and create CSS (AC: #7)
  - [x] Import dashboard render in app.js
  - [x] Add routing for Finance Dashboard tab
  - [x] Create dashboard.css with layout-specific styles
  - [x] Add CSS link to index.html

## Dev Notes

### KPI data sources

| KPI | Source | Calculation |
|-----|--------|-------------|
| Revenue | profitLoss.auMo.revenue + profitLoss.euMo.revenue (FX converted) | Sum of AU + EU monthly revenue |
| Gross Profit | profitLoss.auMo.gp + profitLoss.euMo.gp (FX converted) | Sum of AU + EU monthly GP |
| Operating Profit | profitLoss.auMo.net + profitLoss.euMo.net (FX converted) | Sum of AU + EU monthly net profit |
| Cash Position | balanceSheet.au.bank + balanceSheet.eu.bank (FX converted) | Sum of AU + EU bank balances |

EU values need FX conversion via `convertToAUD(amount, 'EUR')` from fx.js.

### Entity table columns

| Column | AU Source | EU Source |
|--------|----------|----------|
| Month Revenue | auMo.revenue | euMo.revenue × FX |
| Month GP | auMo.gp | euMo.gp × FX |
| Month Net | auMo.net | euMo.net × FX |
| YTD Revenue | auYtd.revenue | euYtd.revenue × FX |
| YTD GP | auYtd.gp | euYtd.gp × FX |
| YTD Net | auYtd.net | euYtd.net × FX |

### Previous Story Intelligence

- Story 1.5: .kpi-grid, .kpi-card, .data-table CSS classes ready
- Story 1.3: format.js (formatCurrency) and fx.js (convertToAUD) ready
- Story 1.2: store.js get() ready
- Story 2.2: profitLoss and balanceSheet data shapes defined in xero-parsers.js

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No issues encountered.

### Completion Notes List

- dashboard.js (167 lines): 4 KPI cards (revenue, GP, operating profit, cash position) calculated from P&L + BS data. EU values converted to AUD via fx.js. Entity table with AU/EU/Combined rows showing month + YTD revenue, GP, net. Empty state with Controls link.
- dashboard.css (37 lines): layout-specific styles only, composes shared .kpi-grid, .kpi-card, .data-table classes.
- app.js updated (157 lines): added dashboard import and routing.
- Negative values shown with red colour via .num--negative class.

### Change Log

- 2026-03-30: Story 3.1 implemented — Finance Dashboard with KPIs and entity table

### File List

- public/js/finance/dashboard.js (167 lines — modified from placeholder)
- public/css/finance/dashboard.css (37 lines — modified from placeholder)
- public/js/app.js (157 lines — modified: added dashboard import/routing)
- public/index.html (47 lines — modified: added dashboard.css link)
