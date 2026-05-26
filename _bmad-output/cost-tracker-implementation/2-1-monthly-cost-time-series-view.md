---
story_key: 2-1-monthly-cost-time-series-view
status: review
epic: 2
story_number: 2.1
---

# Story 2.1: Monthly cost time series view (actuals vs forecasts)

## Story

As Angelus (driver),
I want a grid of every subscription × every month across FY 25/26 and FY 26/27,
So that I can see actuals and forecasts side by side and spot anomalies.

## Acceptance Criteria

**Given** the workbook contains MonthlyEntries from Jul 2025 to Jun 2027,
**When** I navigate to `#/cost-register`,
**Then** I see a table with subscriptions as rows and months as columns (24 months).
**And** actual cells are visually distinct from forecast cells (solid teal-tinted background vs default).
**And** the total per month is shown at the bottom, the total per subscription is shown on the right.
**And** every value flows through an Assumption — there are no magic numbers in `compute.js`.

## Tasks/Subtasks

- [x] Task 1: Add `monthlyEntries` to workbook schema (store.js + emptyWorkbook)
  - [x] Add `monthlyEntries: {}` to `emptyWorkbook()`
  - [x] Add `MONTHLY_ENTRY_UPSERTED` reducer case
- [x] Task 2: Create `src/state/compute.js` — forecast computation, no magic numbers
  - [x] `FY_2526_MONTHS`, `FY_2627_MONTHS`, `ALL_MONTHS`, `FY_GROUPS` exports
  - [x] `computeForecast(subscription, yearMonth, assumptions)` → `{ value, primaryAssumptionKey }`
  - [x] HubSpot: bundle_annual_aud / 12 (AUD direct, no FX)
  - [x] Cohort-driven: unit_cost × round(active_billing_IEs × attribution_rate), FX for USD
  - [x] Fixed-seat: unit_cost × seat_count, FX for USD
- [x] Task 3: Update seed workbook
  - [x] Add `subscription.m365_standard.seat_count` assumption (value 5, high confidence)
  - [x] Add `seat_count_assumption_key` field to `sub-m365-standard`
  - [x] Add `monthlyEntries` to seed with Apr 2026 actuals for all 4 subscriptions
- [x] Task 4: Create `src/components/cost-register/cost-register-view.js`
  - [x] Scrollable grid: subscriptions × 24 months + row totals + monthly totals
  - [x] Actual cells: teal-tinted background, no assumption marker
  - [x] Forecast cells: default background, unit_cost assumption marker
  - [x] FY separator row (colspan 12 each) in thead
  - [x] Monthly total tfoot row, per-subscription total right column
- [x] Task 5: Add cost register CSS to `public/css/app.css`
  - [x] Sticky subscription name column
  - [x] Sticky thead rows
  - [x] Actual vs forecast cell styles
  - [x] FY header styles
- [x] Task 6: Wire `#/cost-register` route in `src/app.js`

## Dev Notes

- FY 25/26: Jul 2025 → Jun 2026; FY 26/27: Jul 2026 → Jun 2027 (24 months total)
- Computation reads entirely from `workbook.assumptions` via `lookupValue()` — MONTHS_PER_FY = 12 is the only constant
- `MONTHS_PER_FY` is explicitly declared in compute.js to document intent (not a magic number)
- M365 Standard has `seat_count_assumption_key` (not cohort_driven); assumption key: `subscription.m365_standard.seat_count`
- HubSpot: `bundle_annual_aud / MONTHS_PER_FY` — already AUD, no FX needed
- Miro (USD): seats = `Math.round(activeIEs × attrRate)`, then `nativeCost / fxRate`
- Table needs horizontal scroll — use `overflow-x: auto` on wrapper, sticky left col via CSS `position: sticky`
- FY 26/27 forecasts in Story 2.1 use the same static headcount (86) as FY 25/26 — cohort-driven population is Story 2.5
- Monthly entries key format: `${subscriptionId}_${yearMonth}` (e.g. `sub-m365-basic_2026-04`)
- Assumption markers on forecast cells use the subscription's `unit_cost_assumption_key` as the primary key
- Pattern: React 18 + htm via `window.__WWCT__`, ES modules, no build step

## Dev Agent Record

### Implementation Plan

1. Extend workbook schema with monthlyEntries
2. Build compute.js (pure functions, reads assumptions only)
3. Seed Apr 2026 actuals + M365 Standard seat count assumption
4. Build CostRegisterView with scrollable grid
5. Add CSS, wire route

### Debug Log

Compute validation (Node.js): M365 Basic AUD 868.60, M365 Standard AUD 105.50, HubSpot AUD 918.00, Miro AUD 719.38 — all match seed actuals exactly. Seed JSON validated (15 assumptions, 4 monthlyEntries). No magic numbers in compute.js: MONTHS_PER_FY = 12 declared as named constant.

### Completion Notes

All ACs satisfied. Cost register renders a 24-month scrollable grid (Jul 2025 → Jun 2027) with subscriptions as rows. Apr 2026 actuals (4 entries) display with teal-tinted background; all other cells show computed forecasts with unit_cost assumption markers. Monthly totals in tfoot, per-subscription 24-month totals in rightmost column. Sticky left column + sticky thead keep context while scrolling. compute.js is pure: all inputs from lookupValue(), MONTHS_PER_FY the only declared constant. New assumption `subscription.m365_standard.seat_count` (5 seats, high confidence) added to seed. MONTHLY_ENTRY_UPSERTED reducer case added to store.js for Story 2.2 to use.

## File List

- cost-tracker/src/state/store.js
- cost-tracker/src/state/compute.js
- cost-tracker/src/components/cost-register/cost-register-view.js
- cost-tracker/src/app.js
- cost-tracker/public/css/app.css
- cost-tracker/seed/workbook-seed.json
- _bmad-output/cost-tracker-implementation/2-1-monthly-cost-time-series-view.md
- _bmad-output/cost-tracker-implementation/sprint-status.yaml

## Change Log

| Date | Change |
|---|---|
| 2026-05-13 | Story created, implementation started |
| 2026-05-13 | All tasks complete, all ACs verified, status set to review |
