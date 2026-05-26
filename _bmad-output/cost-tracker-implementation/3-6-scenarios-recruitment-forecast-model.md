---
story_key: 3-6-scenarios-recruitment-forecast-model
status: review
epic: 3
story_number: 3.6
---

# Story 3.6: Scenarios — Recruitment Forecast Model (Phase 2 Cohort)

Status: review

## Story

As Angelus (driver),
I want the Scenarios panel to run the IE recruitment forecast model and show me the pipeline implications of our headcount targets,
So that the subscription cost forecasts are grounded in a realistic recruitment plan rather than manually entered numbers.

## Acceptance Criteria

**Given** I navigate to `#/scenarios`,
**When** the panel renders,
**Then** I see model parameter inputs (FY-end headcount targets, regional weights, attrition rates, conversion rates, cohorts per year) as freely editable number fields — no drawer, no rationale required.

**And** below the inputs, I see a forecast results table showing per-region (APAC / Americas / EMEA) and global totals for each FY: Sourced, Longlist + Reachout, Shortlist + Vetting, Attrition, Active IEs.

**And** a sanity check row shows average onboards per cohort per FY and whether it falls within the 10–15 target band.

**And** a scenario envelope section shows the Min / Primary / Max projected active IE count derived from the ±20% variance on the base forecast.

**And** changing any model parameter immediately re-runs the model and updates all displayed outputs without requiring a page reload.

**And** the subscription cost register and licence forecast automatically reflect the updated headcount because `monthlyHeadcountByRegion` reads the same model parameters.

## Tasks / Subtasks

- [x] Task 1: Add `forecast.model.*` assumption keys to the seed workbook and update `emptyWorkbook()` defaults
  - [x] Keys: `forecast.model.target.fy27` (60), `forecast.model.target.fy28` (99), `forecast.model.target.fy29` (150), `forecast.model.target.fy26` (22, read-only baseline)
  - [x] Regional weights: `forecast.model.region_weight.apac` (0.333), `.americas` (0.333), `.emea` (0.334)
  - [x] Attrition rates: `forecast.model.attrition_rate.apac` (0.10), `.americas` (0.10), `.emea` (0.10)
  - [x] Conversion rates: `forecast.model.vet_to_short_rate` (0.40), `forecast.model.short_to_onboard_rate` (0.50)
  - [x] Cohorts: `forecast.model.cohorts_per_year` (5)
  - [x] Variance: `forecast.model.variance.min` (0.80), `forecast.model.variance.max` (1.20)
  - [x] Add all of the above as Resolved assumptions to `seed/workbook-seed.json` with rationale "IE Recruitment Forecast v002, May 2026" and source "IE_Recruitment_Forecast_1 (v002).xlsx"

- [x] Task 2: Implement `runForecastModel(assumptions)` in `cohort.js`
  - [x] Reads all `forecast.model.*` keys via `lookupValue`
  - [x] Implements the Excel backward pipeline per region per FY: Active IEs → Attrition → Shortlist → Longlist → Sourced (see Dev Notes for exact formulas)
  - [x] Returns a structured result object (see Dev Notes for shape)

- [x] Task 3: Replace `monthlyHeadcountByRegion` body (Phase 2 implementation)
  - [x] Reads `forecast.model.target.<fy>` via `lookupValue` for the FY matching `yearMonth`
  - [x] Applies regional weights to get per-region active IEs
  - [x] Applies ±20% variance based on `scenario.id`
  - [x] Signature unchanged: `(yearMonth, scenario, assumptions) → { apac, americas, emea }`
  - [x] FY26 (Jul 25 – Jun 26): use `forecast.model.target.fy26` = 22 (actual, no variance)

- [x] Task 4: Replace `ScenariosView` in `scenarios-view.js`
  - [x] Remove: `LEVERS` array, `CohortTimingPanel`, all `AssumptionMarker` usage, all drawer-linked value cells
  - [x] Add: `ModelParamsPanel` — inline `<input type="number">` for each parameter, direct dispatch on blur/change
  - [x] Add: `ForecastResultsPanel` — computed table using `runForecastModel`, rendered read-only
  - [x] Add: `ScenarioEnvelopePanel` — Min / Primary / Max active IEs per FY derived from variance
  - [x] Dispatch pattern for inline edits: `ASSUMPTION_UPDATED` dispatched on blur — no drawer, no blocking

- [x] Task 5: Update `app.css` — Scenarios section
  - [x] Styles for `ModelParamsPanel`: clean input grid, section headings
  - [x] Styles for `ForecastResultsPanel`: full-width table, region row groups, stage rows, sanity check row
  - [x] Styles for `ScenarioEnvelopePanel`: three-column envelope display

## Dev Notes

### Why this story exists (context for the dev agent)

The previous Phase 1 Scenarios panel had a fundamental UX anti-pattern: freely-tunable what-if levers (IEs per cohort = 5/10/15) were gated behind the Assumption lifecycle UI (drawer, required rationale, required source). This was wrong for a modelling tool. The new design:
1. Uses the Excel recruitment forecast model (`IE_Recruitment_Forecast_1 (v002).xlsx`) as the calculation engine
2. Stores model parameters as assumptions in the `forecast.model.*` namespace but edits them without the drawer
3. Derives Min/Primary/Max from ±20% variance automatically — no more manual 5/10/15

### What is being removed (read these files before touching them)

**`src/components/scenarios/scenarios-view.js`** — FULL REPLACEMENT. The entire file is being rewritten. Do not preserve `LEVERS`, `LeverCell`, `CohortTimingPanel`, or any `AssumptionMarker` usage. The new component is described in Task 4.

**`src/state/cohort.js`** — FULL REPLACEMENT of the function body. The Phase 1 logic (base headcount + cohorts billing by now × ies_per_cohort) is removed. The function signature `(yearMonth, scenario, assumptions) → { apac, americas, emea }` is PRESERVED — do not change it.

**Old assumption keys being retired** (still in the workbook from the seed but no longer used by the model):
- `scenario.minimum_viable.ies_per_cohort` (was 5)
- `scenario.primary_target.ies_per_cohort` (was 10)
- `scenario.optimal_maximum.ies_per_cohort` (was 15)
- `scenario.*.num_cohorts_fy2627`
- `cohort.timing.ch17–ch22.start_month` (still read by licence-forecast-view — do NOT delete these from the workbook, just stop using them in cohort.js)

### What is NOT changing (do not touch)

- `src/components/scenarios/licence-forecast-view.js` — calls `monthlyHeadcountByRegion(yearMonth, scenario, assumptions)`. Signature unchanged; it continues to work. The CH17–CH22 cohort markers displayed there will show '—' (assumption not found), which is acceptable as a known UX gap for a follow-up story.
- `src/state/compute.js` — calls `monthlyHeadcountByRegion` on line 79. Signature unchanged; no edits needed.
- `src/components/hubspot-arch/hubspot-arch-compute.js` — uses `cohort.timing.hubspot.*` keys (DIFFERENT from CH17–CH22). Not affected by this story.
- Attribution rates (`subscription.m365_basic.attribution_rate`, `subscription.hubspot_core.attribution_rate`, `subscription.miro.attribution_rate`) — remain unchanged.

### The Excel model logic (implement exactly as specified)

**Source file:** `D:\WWRI Development\IE_Recruitment_Forecast_1 (v002).xlsx`

**Inputs:**
```
targets: { fy26: 22, fy27: 60, fy28: 99, fy29: 150 }
regionWeights: { apac, americas, emea }  // must sum to 1.0
attritionRates: { apac, americas, emea }
vetToShortRate: 0.40    // Vetted → Shortlist conversion
shortToOnboardRate: 0.50  // Shortlist → Onboarded conversion
cohortsPerYear: 5
```

**Calculation per region per FY (backward pipeline):**
```
activeIEs[region][fy]    = Math.round(targets[fy] * regionWeights[region])
attrition[region][fy]    = Math.ceil(activeIEs[region][fy - 1] * attritionRates[region])
shortlist[region][fy]    = Math.max(activeIEs[region][fy] - activeIEs[region][fy - 1] + attrition[region][fy], 0)
longlist[region][fy]     = shortlist > 0 ? Math.ceil(shortlist[region][fy] / shortToOnboardRate) : 0
sourced[region][fy]      = longlist > 0 ? Math.ceil(longlist[region][fy] / vetToShortRate) : 0
```

FY26 is the baseline (actuals, pre-calculated). All computed FYs are 27, 28, 29.

**Sanity check:**
```
globalShortlist[fy]       = shortlist.apac + shortlist.americas + shortlist.emea
avgOnboardsPerCohort[fy]  = globalShortlist[fy] / cohortsPerYear
withinBand[fy]            = avgOnboardsPerCohort >= 10 && avgOnboardsPerCohort <= 15
```

**`runForecastModel(assumptions)` return shape:**
```js
{
  params: { targets, regionWeights, attritionRates, vetToShortRate, shortToOnboardRate, cohortsPerYear },
  regions: ['apac', 'americas', 'emea'],
  fys: [26, 27, 28, 29],
  // Per-region, per-FY data:
  activeIEs:  { apac: { 26: 6, 27: 20, 28: 33, 29: 50 }, americas: {...}, emea: {...} },
  attrition:  { apac: { 27: 1, 28: 2, 29: 4 }, ... },
  shortlist:  { apac: { 27: 15, 28: 15, 29: 21 }, ... },
  longlist:   { apac: { 27: 30, 28: 30, 29: 42 }, ... },
  sourced:    { apac: { 27: 75, 28: 75, 29: 105 }, ... },
  // Global totals:
  globalTotals: {
    27: { activeIEs: 60, attrition: 4, shortlist: 42, longlist: 84, sourced: 210 },
    28: { ... },
    29: { ... },
  },
  sanity: {
    27: { avgOnboards: 8.4, withinBand: false, band: 'Below band' },
    28: { avgOnboards: 9.0, withinBand: false, band: 'Below band' },
    29: { avgOnboards: 12.6, withinBand: true, band: 'Within band' },
  },
}
```

### Phase 2 `monthlyHeadcountByRegion` implementation

```js
export function monthlyHeadcountByRegion(yearMonth, scenario, assumptions) {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  // FY ends in June: month 7–12 = start of FY(year+1), month 1–6 = end of FY(year)
  const fy = month >= 7 ? year + 1 : year;

  const globalTarget = lookupValue(assumptions, `forecast.model.target.fy${fy}`, 0);

  // Variance by scenario — fy26 baseline has no variance
  const varianceFactor = fy <= 26 ? 1.0
    : scenario?.id === 'scenario-minimum-viable'
      ? lookupValue(assumptions, 'forecast.model.variance.min', 0.80)
    : scenario?.id === 'scenario-optimal-maximum'
      ? lookupValue(assumptions, 'forecast.model.variance.max', 1.20)
    : 1.00;

  const adjusted = Math.round(globalTarget * varianceFactor);

  const wApac     = lookupValue(assumptions, 'forecast.model.region_weight.apac', 0.333);
  const wAmericas = lookupValue(assumptions, 'forecast.model.region_weight.americas', 0.333);
  const wEmea     = lookupValue(assumptions, 'forecast.model.region_weight.emea', 0.334);

  return {
    apac:     Math.round(adjusted * wApac),
    americas: Math.round(adjusted * wAmericas),
    emea:     Math.round(adjusted * wEmea),
  };
}
```

### Dispatch pattern for model parameter edits (no drawer)

The Scenarios panel edits model parameters with a helper:

```js
function updateForecastParam(key, value, existingAssumptions, dispatch) {
  // Find existing assumption by key
  const existing = Object.values(existingAssumptions).find(a => a.key === key);
  if (existing) {
    dispatch({
      type: 'ASSUMPTION_UPDATED',
      payload: {
        ...existing,
        value: Number(value),
        decided_on: new Date().toISOString(),
      },
    });
  }
  // If key doesn't exist yet (shouldn't happen with seeded workbook, but defensive):
  // dispatch ASSUMPTION_PROPOSED with a canned Resolved assumption
}
```

No `AssumptionMarker`, no `DecisionDrawer`, no `buildSupersessionPayload`. The assumption is updated in-place.

### ModelParamsPanel layout

Group inputs into four subsections:
1. **Headcount targets** (FY27, FY28, FY29 — FY26 is read-only "22 (actual)")
2. **Regional weights** (APAC %, Americas %, EMEA %, live sum shown — warn if ≠ 100%)
3. **Attrition rates** (APAC %, Americas %, EMEA %)
4. **Pipeline rates & cohorts** (Vetted→Shortlist %, Shortlist→Onboarded %, Cohorts per year)

Use `<input type="number">` with `onBlur` dispatch (not `onInput` — avoid dispatching on every keystroke). Show values as percentages where appropriate (×100 for display, ÷100 on store).

### ForecastResultsPanel layout

Match the Excel layout:
- Rows: Sourced / Longlist + Reachout / Shortlist + Vetting / Attrition / Active IEs
- Columns: FY26 (read-only actual) / FY27 / FY28 / FY29
- Grouped by region (APAC, Americas, EMEA) with a global total section
- Sanity check row below the table: avg onboards/cohort + within-band indicator

### ScenarioEnvelopePanel layout

Simple three-column card layout:
- **Minimum viable** — shows FY-end active IEs at −20% variance per FY
- **Primary target** — shows base forecast active IEs per FY
- **Optimal maximum** — shows FY-end active IEs at +20% variance per FY

Active-scenario card is highlighted (matches nav bar scenario picker).

### Technical stack reminders

- `const { html, useMemo, useState } = window.__WWCT__` — always destructure from here
- Style props must be objects: `style=${{ marginTop: 'var(--space-4)' }}`
- `useWorkbook()` gives `{ workbook, dispatch }`
- `lookupValue(assumptions, key, fallback)` from `../../state/assumptions.js`
- File naming: kebab-case files, PascalCase component identifiers

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

`seed/workbook-seed.json`: Added 15 new Resolved assumptions under `forecast.model.*` namespace (4 FY targets, 3 regional weights, 3 attrition rates, vet_to_short_rate, short_to_onboard_rate, cohorts_per_year, variance.min, variance.max). All with rationale "IE Recruitment Forecast v002, May 2026" and source "IE_Recruitment_Forecast_1 (v002).xlsx".

`src/state/cohort.js`: Full replacement. Added `runForecastModel(assumptions)` implementing the exact Excel backward pipeline (activeIEs → attrition → shortlist → longlist → sourced) per region per FY, with globalTotals and sanity check. Phase 2 `monthlyHeadcountByRegion` replaces Phase 1 body: reads `forecast.model.target.fy{short}` for the FY of the given yearMonth (using `fyFull % 100` to get the 2-digit year), applies ±20% variance by scenario.id, then splits by regional weights. Signature unchanged. Note: spec had a subtle 4-digit/2-digit year inconsistency in the template literal — fixed by using `fyShort = fyFull % 100`.

`src/components/scenarios/scenarios-view.js`: Full replacement. `LEVERS`, `LeverCell`, `CohortTimingPanel`, and all `AssumptionMarker` usage removed. New components: `ParamInput` (controlled-via-key-reset, dispatches `ASSUMPTION_UPDATED` on blur), `ModelParamsPanel` (4 subsections: headcount targets, regional weights with sum warning, attrition rates, pipeline rates & cohorts), `ForecastResultsPanel` (region-grouped table with 5 stage rows per region, global totals section, sanity check row), `ScenarioEnvelopePanel` (3-column cards with active-scenario highlight). `useMemo` wraps `runForecastModel(assumptions)`.

`public/css/app.css`: Replaced old `.scenario-inputs__table` block with new styles for `forecast-params`, `forecast-results`, and `forecast-envelope`.

### File List

- `cost-tracker/src/state/cohort.js` — full replacement (Phase 2 implementation + runForecastModel)
- `cost-tracker/src/components/scenarios/scenarios-view.js` — full replacement
- `cost-tracker/seed/workbook-seed.json` — 15 new `forecast.model.*` assumption entries added
- `cost-tracker/public/css/app.css` — Scenarios section replaced

## Change Log

- 2026-05-14: Story created (out-of-band; extends Epic 3 as story 3.6)
- 2026-05-14: Implemented and marked review
