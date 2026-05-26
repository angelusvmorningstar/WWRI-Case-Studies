---
story_key: 3-4-licence-forecast-view-with-cohort-markers
status: done
epic: 3
story_number: 3.4
---

# Story 3.4: Licence forecast view with cohort markers

## Story

As Angelus (driver),
I want a time series showing licence counts per subscription, with cohort markers,
So that I can see when each cohort lifts the seat count.

## Acceptance Criteria

**Given** the cohort assumptions are populated,
**When** I navigate to `#/licence-forecast`,
**Then** I see a grid: subscriptions × months, with each cell showing the licence count.
**And** vertical markers in the time axis label CH17 through CH22 at their start months.
**And** the cell value is derived from `monthlyHeadcountByRegion(yearMonth, scenario) × attribution_rate` for cohort-driven subscriptions.
**And** non-cohort subscriptions show a flat licence count from a per-subscription Assumption.

## Tasks/Subtasks

- [x] Task 1: Create `src/components/scenarios/licence-forecast-view.js`
- [x] Task 2: Wire `#/licence-forecast` route in `src/app.js`
- [x] Task 3: Add CSS for licence forecast grid and cohort markers
- [x] Task 4: Handle HubSpot bundle (null count, shows "—")

## Dev Notes

- getLicenceCount(sub, yearMonth, scenario, assumptions):
  - cohort_driven: monthlyHeadcountByRegion × attribution_rate, rounded
  - non-cohort: check override assumption `licences.<shortId>.headcount.<yyyy_mm>` first, then seat_count_assumption_key
  - HubSpot (no seat_count_assumption_key): returns null → renders "—"
- Cohort markers are `<button>` elements in the month header column that open CohortTimingForm
- toShortId converts sub ID: `sub-m365-standard` → `m365_standard`
- Cohort-driven cells are not editable (headcount is scenario-driven)
- The cohort badge click uses e.stopPropagation() — not needed since th has no click handler, but kept for clarity

## Dev Agent Record

### Completion Notes

LicenceForecastView implemented at #/licence-forecast. Grid shows subscriptions × 24 months.
Cohort markers (CH17–CH22 badges) appear as clickable buttons in the month headers when a cohort
starts in that month. Cohort-driven rows show derived seat counts; non-cohort rows show flat seat
counts with override support. HubSpot bundle shows "—" since it has no per-seat count.
Scenario change re-derives all cohort-driven counts immediately via React state.

## File List

- cost-tracker/src/components/scenarios/licence-forecast-view.js
- cost-tracker/src/app.js
- cost-tracker/public/css/app.css

## Change Log

| Date | Change |
|---|---|
| 2026-05-13 | Story created and implemented |
