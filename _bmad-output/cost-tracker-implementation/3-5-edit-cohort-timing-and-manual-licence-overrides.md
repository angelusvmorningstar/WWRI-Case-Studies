---
story_key: 3-5-edit-cohort-timing-and-manual-licence-overrides
status: done
epic: 3
story_number: 3.5
---

# Story 3.5: Edit cohort timing and manual licence overrides

## Story

As Niel (strategic contributor),
I want to shift cohort start dates and manually override licence counts where needed,
So that I can model recruitment plan changes without rebuilding the scenario.

## Acceptance Criteria

**Given** I am on the Licence Forecast view,
**When** I click a cohort marker,
**Then** I can edit its start month, which proposes new cohort intake Assumptions for the affected months.
**And** the system asks me to provide rationale before resolving the new dates.
**When** I click a licence count cell on a non-cohort row,
**Then** I can enter a manual override Assumption (`licences.<sub_id>.headcount.<yyyy_mm>`).
**And** the override is visually distinct from cohort-derived values.

## Tasks/Subtasks

- [x] Task 1: Implement CohortTimingForm in licence-forecast-view.js
  - [x] YYYY-MM format validation
  - [x] Rationale + source required
  - [x] Creates new assumption → resolves → builds supersession → dispatches
- [x] Task 2: Implement LicenceOverrideForm in licence-forecast-view.js
  - [x] Seat count input with validation
  - [x] Assumption key: `licences.<shortId>.headcount.<yyyy_mm>` (underscores)
  - [x] Override cell rendered with distinct CSS class
- [x] Task 3: Override cell click handler (only for non-cohort, non-bundle subscriptions)

## Dev Notes

- CohortTimingForm: creates assumption with key `cohort.timing.chXX.start_month`, category 'Scenario input'
- LicenceOverrideForm: creates assumption with key `licences.<shortId>.headcount.<yyyy_mm>` (yyyy_mm uses underscore: `2026_09`)
- shortId: `sub-m365-standard` → `m365_standard` via toShortId() helper
- Override detection in getLicenceCount: lookupAssumption for `licences.<shortId>.headcount.<yyyy_mm>` before falling back to seat_count
- Cohort-driven cells are never editable — their seat count is driven by the scenario
- After cohort timing change, the cost register automatically re-derives (monthlyHeadcountByRegion reads the updated assumption)
- Visual distinction: `licence-forecast__cell--override` has amber/yellow background consistent with override styling in cost register

## Dev Agent Record

### Completion Notes

Both forms implemented in licence-forecast-view.js:
- CohortTimingForm: validates YYYY-MM, creates assumption, supersedes prior if exists
- LicenceOverrideForm: validates seat count ≥ 0, creates licences.<shortId>.headcount.<yyyy_mm> assumption
Override cells get `licence-forecast__cell--override` CSS class (amber tint). Non-cohort cells are
editable (cursor pointer, hover state). Cohort-driven and bundle cells are not editable.

## File List

- cost-tracker/src/components/scenarios/licence-forecast-view.js

## Change Log

| Date | Change |
|---|---|
| 2026-05-13 | Story created and implemented |
