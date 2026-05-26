# Story 7.2 — Forecast-Model-Driven Subscription Costs

**Status:** done  
**Epic:** 7 — Seat-Intake-Driven Redesign  
**Date:** 2026-05-26

---

## User Story

As Angelus running the ops meeting, I want the Min/Primary/Max scenario costs to be driven by the recruitment forecast model (60 IEs target ±20%), so that the Forecast tab shows meaningfully divergent cost envelopes rather than three identical numbers.

---

## Context and Motivation

After Story 7.1, the Forecast tab shows three scenario tiles (Min/Primary/Max) with FY27 costs — but those costs are currently all the same because the cost driver (`activeCohortIEs`) reads from `scenario.${root}.ies_per_cohort` assumptions, not from the ±20% variance baked into `monthlyHeadcountByRegion`.

`monthlyHeadcountByRegion` is already implemented in `cohort.js` (stub labelled "Phase 2") and correctly applies:
- Primary Target → FY27 target × 1.00 (60 IEs)
- Minimum Viable → FY27 target × 0.80 (48 IEs)  
- Optimal Maximum → FY27 target × 1.20 (72 IEs)

This story wires `monthlyHeadcountByRegion` into `computeForecast`, making scenario-driven cost divergence real.

---

## Acceptance Criteria

### AC1 — Compute path updated
In `src/state/compute.js`, the cohort-driven subscription branch when `totalIEOverride === null` (IE register empty):
- **Before:** `baselineSeats + Math.round(activeCohortIEs(yearMonth, scenario, assumptions) × attrRate)`
- **After:** `baselineSeats + Math.round((hc.apac + hc.americas + hc.emea) × attrRate)` where `hc = monthlyHeadcountByRegion(yearMonth, scenario, assumptions)`

The `activeCohortIEs` import is removed from `compute.js`. `monthlyHeadcountByRegion` is added to the import.

### AC2 — IE register override is unchanged
When `totalIEOverride !== null` (IE register is populated), the computation is unchanged: `Math.round(totalIEOverride × attrRate)`. The IE register remains the higher-priority source of truth.

### AC3 — HubSpot special cases unchanged
`sub-hubspot-bundle` and `sub-hubspot-cohort` keep their existing special-case logic in `computeForecast`. No changes to those branches.

### AC4 — Scenario costs diverge
On the Forecast tab, the three scenario tiles show different FY27 costs:
- Min cost < Primary cost < Max cost
- The gap reflects the ±20% IE headcount variance applied through M365 (100% attr), Miro (100% attr), and other cohort-driven subs.

### AC5 — FY step-change behaviour
Costs are flat within each FY period and step up at FY boundaries:
- Jul 2025 – Jun 2026: costs based on FY26 target (22 IEs)
- Jul 2026 – Jun 2027: costs based on FY27 target (60/48/72 by scenario)
- The Delta column on the Forecast tab shows large jumps in July 2026 and zeros for other months. This is correct — it reflects the FY-level model, not monthly cohort staircase.

### AC6 — Dashboard FYTimeline unaffected
The dashboard's `FYTimeline` component displays IE count using `preExisting + activeCohortIEs` (gradual build-up) — this display-only visualization is intentionally left unchanged. When the IE register is empty, the timeline's cost column now reflects FY-level costs (flat within each FY), which is a known model simplification.

### AC7 — Build passes
`npm run build` produces `dist/cost-tracker.html` under 600 KB with no errors.

---

## File Map

| Action | File |
|---|---|
| UPDATE | `src/state/compute.js` — swap import + change 3 lines in cohort-driven branch |
| PRESERVE | `src/state/cohort.js` — `activeCohortIEs` left in place (still used by dashboard display) |
| PRESERVE | `src/components/dashboard/dashboard-view.js` — no changes |
| PRESERVE | All view files — numbers update automatically via `computeForecast` |

---

## Dev Notes

### The change (compute.js)
```js
// Import: remove activeCohortIEs, add monthlyHeadcountByRegion
import { scenarioRootKey, monthlyHeadcountByRegion } from './cohort.js';

// In computeForecast, cohort_driven branch, totalIEOverride === null path:
const baselineSeats = lookupValue(assumptions, seat_count_assumption_key, 0);
const hc = monthlyHeadcountByRegion(yearMonth, scenario, assumptions);
const forecastIEs = hc.apac + hc.americas + hc.emea;
seats = baselineSeats + Math.round(forecastIEs * attrRate);
```

### Expected cost impact (Primary Target, M365 Basic, FY27)
- Baseline seats: 42, Attribution: 100%, IE target: 60
- Seats: 42 + 60 = 102
- Monthly cost at current rate: 102 × unit cost

### Why baseline seats are preserved
`monthlyHeadcountByRegion` returns the total active IE headcount (not incremental). Baseline seats represent non-IE members (staff, management). These two are additive.

### Why the dashboard display isn't changed
The `FYTimeline` uses `activeCohortIEs` only for the IE count progress bar (displaying how headcount grows across FY27). Costs in the timeline use `computeForecast` which automatically picks up the Story 7.2 change. The display/cost inconsistency is a known model simplification; Story 7.3 will tighten this if needed.

---

## Definition of Done

- [x] Import in `compute.js` updated (no `activeCohortIEs`, yes `monthlyHeadcountByRegion`)
- [x] Cohort-driven branch uses `monthlyHeadcountByRegion` when `totalIEOverride === null`
- [x] HubSpot special cases unchanged
- [x] Forecast tab shows Min < Primary < Max costs
- [x] `npm run build` passes at 524.0 KB ✓
- [x] Old routes still reachable via deep link

---

## Dev Agent Record

**Implemented:** 2026-05-26  
**Build output:** `dist/cost-tracker.html` 524.0 KB ✓

### Files changed
| Action | File |
|---|---|
| UPDATE | `cost-tracker/src/state/compute.js` — import swap + 3-line change in cohort-driven branch |
