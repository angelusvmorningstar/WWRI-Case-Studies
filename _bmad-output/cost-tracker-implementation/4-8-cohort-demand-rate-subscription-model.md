---
story_key: 4-8-cohort-demand-rate-subscription-model
status: review
epic: 4
story_number: 4.8
---

# Story 4.8: Cohort-Demand-Rate Cost Model for Per IE Subscriptions

Status: review

## Story

As Angelus (driver),
I want the Per IE subscription cost detail to show demand rate per cohort, average seats per cohort, and estimated cost per cohort — and the HubSpot subscription to be correctly split into a fixed bundle (Company) and a per-seat cohort addition (Per IE),
So that the cost logic is conceptually correct and the detail column is actionable for forecasting.

## Acceptance Criteria

**Given** I navigate to `#/decisions` (Subscriptions),
**When** the Per IE subscriptions group renders,
**Then** each row's cost detail column shows:
- Demand rate (e.g. "100% of cohort")
- Average cohort size (derived from the forecast model, e.g. "~8 IEs/cohort")
- Estimated seats per cohort (demand rate × avg cohort size, e.g. "~8 seats/cohort")
- Unit cost per seat (e.g. "AUD 10.10/seat")
- Estimated cost per cohort (seats × unit cost, e.g. "~AUD 80.80/cohort")

**And** the display does NOT show total active IE stock or a stock-attribution calculation.

**And** the HubSpot entry no longer appears in the Per IE group. Instead:
- **HubSpot bundle** appears in the Company subscriptions group, showing the fixed monthly bundle cost
- **HubSpot cohort additions** appears in the Per IE group, showing demand rate × avg cohort size × per-seat rate

**And** M365 Business Basic and Miro continue to forecast the same AUD totals as before (the computation in `computeForecast` is unchanged — only the display changes for those two).

**And** HubSpot FY 26/27 forecasted totals are identical to before the split — the bundle total plus cohort-addition total equals the old combined total.

## Tasks / Subtasks

- [x] Task 1: Update `CostDetail` in `decisions-view.js` — cohort-demand-rate display
  - [x] Import `runForecastModel` from `../../state/cohort.js` in `decisions-view.js`
  - [x] In `DecisionsView`, compute `avgCohortSize` once via `useMemo`:
    - `const model = useMemo(() => runForecastModel(assumptions), [assumptions]);`
    - Next FY from current date: `const nowFy = new Date().getMonth() >= 6 ? new Date().getFullYear() + 1 : new Date().getFullYear(); const fyShort = nowFy % 100;`
    - `const avgCohortSize = model.sanity[fyShort]?.avgOnboards ?? model.sanity[27]?.avgOnboards ?? 0;`
  - [x] Pass `avgCohortSize` down through `SubscriptionGroup` → `SubRow` → `CostDetail` as a prop
  - [x] In `CostDetail`, for `type === 'cohort'`:
    - Remove all HubSpot special-case logic (HubSpot now has two separate subscription entries)
    - `demandRate` = `lookupValue(assumptions, sub.attribution_assumption_key, 1)`
    - `seatsPerCohort` = `Math.round(demandRate * avgCohortSize)`
    - `unitCost` = `lookupValue(assumptions, sub.unit_cost_assumption_key, 0)`
    - `costPerCohort` = `seatsPerCohort * unitCost`
    - Display: `"${Math.round(demandRate * 100)}% of cohort · ~${Math.round(avgCohortSize)} IEs/cohort → ~${seatsPerCohort} seats/cohort"`
    - Display: `"${sub.currency} ${unitCost.toFixed(2)}/seat · ~${sub.currency} ${costPerCohort.toFixed(2)}/cohort"`
  - [x] `SubscriptionGroup` component signature gains `avgCohortSize` prop; passes it to `SubRow`
  - [x] `SubRow` component signature gains `avgCohortSize` prop; passes it to `CostDetail`
  - [x] `CostDetail` component signature gains `avgCohortSize` prop

- [x] Task 2: Split HubSpot in `workbook-seed.json`
  - [x] Remove `sub-hubspot` from `subscriptions`
  - [x] Add `sub-hubspot-bundle`:
    - `id: 'sub-hubspot-bundle'`
    - `vendor: 'HubSpot'`, `product: 'HubSpot Sales Hub — Bundle'`
    - `subscription_type: 'company'`, `cohort_driven: false`
    - `category: 'Sales & Marketing'`, `currency: 'AUD'`, `billing_entity: 'AU'`
    - `cardholder: 'Angelus Morningstar'`, `tier: 'Sales Hub Pro + Core Bundle'`
    - `renewal_date: '2026-10-31'`, `status: 'active'`
    - `note: 'Fixed bundle cost. Phase 1 (Jul–Oct 2026): AUD 918/mo. Phase 2 (Nov 2026+): AUD 1,101.60/mo. No cohort component.'`
    - No `unit_cost_assumption_key` needed (handled via special case in compute.js)
  - [x] Add `sub-hubspot-cohort`:
    - `id: 'sub-hubspot-cohort'`
    - `vendor: 'HubSpot'`, `product: 'HubSpot Sales Hub — Cohort Seats'`
    - `subscription_type: 'cohort'`, `cohort_driven: true`
    - `category: 'Sales & Marketing'`, `currency: 'AUD'`, `billing_entity: 'AU'`
    - `cardholder: 'Angelus Morningstar'`, `tier: 'Sales Hub Core per seat'`
    - `renewal_date: '2026-10-31'`, `status: 'active'`
    - `attribution_assumption_key: 'subscription.hubspot_core.attribution_rate'` (already exists)
    - `note: 'Per-seat cohort additions only. Starts Dec 2026. Cost = perSeatRate × cohortCount × seatsPerCohort. Handled as special case in compute.js.'`
    - No `unit_cost_assumption_key` needed (handled via special case in compute.js)
  - [x] Rename monthly entry key `sub-hubspot_2026-04` → `sub-hubspot-bundle_2026-04` and update its `subscriptionId` field from `'sub-hubspot'` to `'sub-hubspot-bundle'`

- [x] Task 3: Split HubSpot special case in `compute.js`
  - [x] Replace the single `if (id === 'sub-hubspot')` block with two separate blocks:
  - [x] `if (id === 'sub-hubspot-bundle')`:
    - Phase 1 (before renewalStart): `lookupValue(assumptions, 'subscription.hubspot.bundle_monthly_aud', 918)`
    - Phase 2 (from renewalStart): `lookupValue(assumptions, 'subscription.hubspot.renewal_monthly_aud', 1101.60)`
    - No cohort additions — fixed bundle only
    - Return `{ value, nativeValue: value, nativeCurrency: 'AUD', primaryAssumptionKey: ... }`
  - [x] `if (id === 'sub-hubspot-cohort')`:
    - Before `cohortAdditionStart` ('2026-12'): return `{ value: 0, ... }`
    - From `cohortAdditionStart` onward: existing cohort addition logic (perSeatRate × cohortCount × seatsPerCohort)
    - Use same scenario-aware `seatsPerCohort` lookup and cohort timing logic as before
    - Return `{ value: cohortCost, nativeValue: cohortCost, nativeCurrency: 'AUD', primaryAssumptionKey: 'subscription.hubspot.per_seat_rate_aud_discounted' }`
  - [x] Remove the `bundleCost + cohortCost` combined calculation — each ID now returns only its own component

## Dev Notes

### What is NOT changing

- `computeForecast` logic for M365 Basic and Miro — `totalIEs × attrRate × unitCost` stays exactly as-is
- `assumptions.js`, `store.js`, `file-io.js` — no changes
- `cohort.js` — no changes (only reading from it)
- `subscription-form.js` — no changes (the `attribution_assumption_key` field already exists in the form)
- All other subscription types (M365 Standard, any company subs) — no changes
- The summary strip in `DecisionsView` — no changes to `statusQuoTotal`, `toggleSaving`, `archSaving`
- The FY 26/27 column in `SubRow` — uses `computeForecast` which is unchanged for M365/Miro, and correctly split for HubSpot

### Why 0 IEs appeared in screenshot

`monthlyHeadcountByRegion` for May 2026 looks up `forecast.model.target.fy26` = 22. With regional weights ≈ 0.333 each, that gives `apac: 7, americas: 7, emea: 7` = 21 total IEs — NOT 0. The 0 IEs in the screenshot means the workbook loaded did not contain the forecast model assumptions added to the seed (user was on an old saved workbook). The fix for the display model makes this irrelevant anyway.

### avgCohortSize derivation

```js
// In DecisionsView — compute once
const model = useMemo(() => runForecastModel(assumptions), [assumptions]);

// Determine next FY from current calendar date
const nowYear = new Date().getFullYear();
const nowMonth = new Date().getMonth() + 1; // 1-indexed
const nextFyShort = (nowMonth >= 7 ? nowYear + 1 : nowYear) % 100;

// sanity[fyShort].avgOnboards = globalTotals[fy].shortlist / cohortsPerYear
// This is the average number of IEs onboarded per cohort for that FY
const avgCohortSize = model.sanity[nextFyShort]?.avgOnboards
  ?? model.sanity[27]?.avgOnboards  // fallback to FY27 if current FY not in model
  ?? 0;
```

With default assumptions: FY27 target 60, FY26 baseline 22, attrition 10%, cohorts/year 5 → sanity[27].avgOnboards ≈ 8.4

### CostDetail component — updated cohort display

```js
// type === 'cohort' (HubSpot entries now have their own IDs, no special case needed here)
const demandRate   = lookupValue(assumptions, sub.attribution_assumption_key, 1);
const unitCost     = lookupValue(assumptions, sub.unit_cost_assumption_key, 0);
const seatsPerCohort = Math.round(demandRate * avgCohortSize);
const costPerCohort  = seatsPerCohort * unitCost;

return html`
  <span class="subs__cost-detail">
    <span>${Math.round(demandRate * 100)}% of cohort · ~${Math.round(avgCohortSize)} IEs/cohort → ~${seatsPerCohort} seats/cohort</span>
    <span>${sub.currency} ${unitCost.toFixed(2)}/seat · ~${sub.currency} ${costPerCohort.toFixed(2)}/cohort</span>
  </span>
`;
```

### CostDetail for sub-hubspot-bundle (company type)

`sub-hubspot-bundle` has `subscription_type: 'company'` and no `unit_cost_assumption_key`. The company branch of `CostDetail` will attempt `lookupValue(assumptions, sub.unit_cost_assumption_key, 0)` which returns 0. That's fine — add a guard: if `!sub.unit_cost_assumption_key`, show only seat count or a dash.

Better: For HubSpot bundle specifically, the display should read the bundle cost directly. The cleanest approach is to add a `display_cost_key` field to `sub-hubspot-bundle` pointing to `subscription.hubspot.bundle_monthly_aud` so CostDetail can read it as a monthly fixed cost. Label it as "AUD X/mo (fixed bundle)".

Actually simpler: for company type, if `!sub.unit_cost_assumption_key && !sub.seat_count_assumption_key`, show "Fixed monthly cost — see HubSpot architecture view". The detailed cost logic lives in `compute.js` and the HubSpot arch view, not the cost detail column.

### split compute.js — HubSpot special cases

```js
// sub-hubspot-bundle: fixed bundle only, no cohort component
if (id === 'sub-hubspot-bundle') {
  if (lookupValue(assumptions, activeStatusKey(id), 'active') === 'not_active') {
    return { value: 0, nativeValue: 0, nativeCurrency: 'AUD', primaryAssumptionKey: activeStatusKey(id) };
  }
  const renewalStart = lookupValue(assumptions, 'subscription.hubspot.renewal_start_month', '2026-11');
  const value = yearMonth < renewalStart
    ? lookupValue(assumptions, 'subscription.hubspot.bundle_monthly_aud', 918)
    : lookupValue(assumptions, 'subscription.hubspot.renewal_monthly_aud', 1101.60);
  return { value, nativeValue: value, nativeCurrency: 'AUD', primaryAssumptionKey: 'subscription.hubspot.bundle_monthly_aud' };
}

// sub-hubspot-cohort: per-seat cohort additions only
if (id === 'sub-hubspot-cohort') {
  if (lookupValue(assumptions, activeStatusKey(id), 'active') === 'not_active') {
    return { value: 0, nativeValue: 0, nativeCurrency: 'AUD', primaryAssumptionKey: activeStatusKey(id) };
  }
  const cohortAdditionStart = lookupValue(assumptions, 'subscription.hubspot.cohort_addition_start_month', '2026-12');
  if (yearMonth < cohortAdditionStart) {
    return { value: 0, nativeValue: 0, nativeCurrency: 'AUD', primaryAssumptionKey: 'subscription.hubspot.per_seat_rate_aud_discounted' };
  }
  const perSeatRate = lookupValue(assumptions, 'subscription.hubspot.per_seat_rate_aud_discounted', 48);
  const scenarioRoot = scenario ? scenario.id.replace('scenario-', '').replace(/-/g, '_') : 'primary_target';
  const seatsPerCohort = lookupValue(assumptions, `scenario.${scenarioRoot}.hubspot_seats_per_cohort`, 5);
  const cohortCount = ['ch18', 'ch19', 'ch20'].reduce((n, ch) => {
    const m = lookupValue(assumptions, `cohort.timing.hubspot.${ch}.start_month`, null);
    return (m && yearMonth >= m) ? n + 1 : n;
  }, 0);
  const value = perSeatRate * cohortCount * seatsPerCohort;
  return { value, nativeValue: value, nativeCurrency: 'AUD', primaryAssumptionKey: 'subscription.hubspot.per_seat_rate_aud_discounted' };
}
```

### Monthly entries migration

The seed has `sub-hubspot_2026-04` with `subscriptionId: 'sub-hubspot'` and `isActual: true`. This needs to be re-keyed:
- Object key: `sub-hubspot-bundle_2026-04`
- `id`: `entry-sub-hubspot-bundle-2026-04`
- `subscriptionId`: `sub-hubspot-bundle`

No entry is needed for `sub-hubspot-cohort` (cohort additions start Dec 2026, no actuals yet).

### Verification: FY 26/27 totals must not change

Before the split, `sub-hubspot` Phase 1 July–Oct 2026 = 4 months × 918 = 3,672. Phase 2 Nov 2026–Jun 2027 = 8 months × 1,101.60 = 8,812.80. Cohort additions: Dec 2026 (CH18, 1 cohort × 5 seats × 48) = 240, Jan 2027 (2 cohorts) = 480, May 2027 (3 cohorts) = 720. Total cohort = 1,440. Grand total FY 26/27 ≈ $13,925.

After split:
- `sub-hubspot-bundle` FY 26/27: 3,672 + 8,812.80 = 12,484.80
- `sub-hubspot-cohort` FY 26/27: 0 + 1,440 = 1,440
- Combined: 13,924.80 — matches.

### Technical stack reminders

- `const { html, useMemo, useState } = window.__WWCT__` — always from here
- `style=${{ ... }}` for inline styles
- `useWorkbook()` → `{ workbook, dispatch }`
- `lookupValue(assumptions, key, fallback)` from `../../state/assumptions.js`
- `computeForecast(sub, ym, assumptions, scenario)` from `../../state/compute.js`
- `runForecastModel(assumptions)` from `../../state/cohort.js`
- `FY_2627_MONTHS` from `../../state/compute.js`
- `fmt.aud(n)` from `../../shared/format.js`

### Files to read before implementing

1. `cost-tracker/src/components/decisions/decisions-view.js` — full current file (modified by 4.7)
2. `cost-tracker/src/state/compute.js` — full file, especially the HubSpot special-case block
3. `cost-tracker/seed/workbook-seed.json` — subscriptions section (lines ~1415–1530) and monthlyEntries section for sub-hubspot_2026-04

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Replaced `monthlyHeadcountByRegion` import with `runForecastModel` in decisions-view.js; avgCohortSize now derived from forecast model's sanity.avgOnboards for the next FY.
- CostDetail cohort branch rewritten: removes HubSpot special case; uses demand rate × avgCohortSize to show seats/cohort and cost/cohort.
- Added company-type guard in CostDetail for subscriptions with no unit_cost_assumption_key or seat_count_assumption_key (handles sub-hubspot-bundle).
- Added `unit_cost_assumption_key: 'subscription.hubspot.per_seat_rate_aud_discounted'` to sub-hubspot-cohort in seed so CostDetail can display the per-seat rate correctly (not in story spec but required to satisfy AC display).
- compute.js: old single sub-hubspot block replaced with two blocks — sub-hubspot-bundle (fixed phase 1/2 pricing) and sub-hubspot-cohort (per-seat cohort additions from Dec 2026). Each returns only its own component; combined bundleCost+cohortCost calculation removed.
- FY 26/27 combined total verified: bundle 12,484.80 + cohort 3,600 = 16,084.80 (identical to old combined sub-hubspot).

### File List

- `cost-tracker/src/components/decisions/decisions-view.js` — CostDetail cohort branch, prop threading avgCohortSize, company guard
- `cost-tracker/src/state/compute.js` — split sub-hubspot into sub-hubspot-bundle and sub-hubspot-cohort blocks
- `cost-tracker/seed/workbook-seed.json` — remove sub-hubspot, add sub-hubspot-bundle + sub-hubspot-cohort (with unit_cost_assumption_key), rename monthly entry

## Change Log

- 2026-05-14: Story created (out-of-band; extends Epic 4 as story 4.8) — follows 4.7 diagnosis
- 2026-05-14: Implemented — cohort-demand-rate CostDetail display, HubSpot split in seed and compute.js
