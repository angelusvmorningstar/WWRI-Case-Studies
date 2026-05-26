---
story_key: 2-4-yoy-comparison-view
status: review
epic: 2
story_number: 2.4
---

# Story 2.4: YoY comparison view

## Story

As Niel (strategic contributor),
I want a side-by-side comparison of FY 25/26 actuals vs FY 26/27 forecast,
So that I can see the year-on-year movement at a glance.

## Acceptance Criteria

**Given** the workbook contains both financial years,
**When** I select the YoY view in the Cost Register tab,
**Then** I see FY 25/6 total, FY 26/7 total, and percentage change per subscription and per category.
**And** the totals reconcile with the monthly grid.
**And** the comparison updates when scenario inputs change.

## Tasks/Subtasks

- [x] Task 1: Create `src/components/cost-register/yoy-view.js`
  - [x] Table: subscription rows grouped by category, category subtotal rows, grand total row
  - [x] Columns: Subscription, FY 25/26 total, FY 26/27 total, Change ($), Change (%)
  - [x] FY totals computed from same cell logic as grid (actuals + overrides + forecasts)
  - [x] Category subtotals: sum of subscriptions per category
  - [x] Grand total: sum of all categories
  - [x] % change: (FY2627 - FY2526) / FY2526, rendered with colour (positive = red, negative = green)
- [x] Task 2: Add tab switcher to `cost-register-view.js` — "Monthly grid" / "YoY comparison"

## Dev Notes

- FY totals MUST use the same cell-value logic as the monthly grid (actuals/overrides/forecasts via computeForecast) — no separate computation
- "Updates when scenario inputs change" is satisfied automatically because the computation reads from workbook.assumptions which changes with scenario inputs
- Categories from subscription.category field — use the same 5 category list as inventory but only show categories that exist in the workbook
- % change: if FY 25/26 is 0, show "N/A" rather than ÷0
- Colour convention: cost increase (positive delta) = red/danger, cost decrease (negative delta) = green/success — standard for cost reporting
- Tab state is local to CostRegisterView, not persisted

## Dev Agent Record

### Implementation Plan

1. Build YoYView component using existing grid computation helpers
2. Add tab switcher to CostRegisterView

### Debug Log

### Completion Notes

All ACs satisfied. YoYView renders a table grouped by subscription.category (sorted descending by FY 26/27 spend). Columns: Subscription, FY 25/26, FY 26/27, Change ($), Change (%). Category subtotal rows and grand total tfoot row. Percentage change: N/A when base is 0; red for cost increases, green for decreases. Totals use the same cell-value logic as the monthly grid (actual → override → computed forecast). Tab switcher "Monthly grid" / "YoY comparison" added to CostRegisterView header area — local state, not persisted.

## File List

- cost-tracker/src/components/cost-register/yoy-view.js
- cost-tracker/src/components/cost-register/cost-register-view.js
- cost-tracker/public/css/app.css
- _bmad-output/cost-tracker-implementation/2-4-yoy-comparison-view.md
- _bmad-output/cost-tracker-implementation/sprint-status.yaml

## Change Log

| Date | Change |
|---|---|
| 2026-05-13 | Story created, implementation started |
| 2026-05-13 | All tasks complete, all ACs verified, status set to review |
