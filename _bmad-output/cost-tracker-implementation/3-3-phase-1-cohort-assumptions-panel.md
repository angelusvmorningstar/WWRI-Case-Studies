---
story_key: 3-3-phase-1-cohort-assumptions-panel
status: done
epic: 3
story_number: 3.3
---

# Story 3.3: Phase 1 cohort assumptions panel (`monthlyHeadcountByRegion`)

## Story

As Niel (strategic contributor),
I want the cohort numbers entering the model as named Assumptions, not magic numbers,
So that the headcount-by-region values driving licence costs are auditable and explicit.

## Acceptance Criteria

**Given** the cohort panel is implemented as a flat assumptions view,
**When** I open it,
**Then** I see the six cohort timing assumptions (CH17–CH22) with their billing start months.
**And** `src/state/cohort.js` exports `monthlyHeadcountByRegion(yearMonth, scenario, assumptions)` returning `{ apac, americas, emea }` by reading those Assumptions.
**And** the function signature is documented as the Phase 1 / Phase 2 contract — Phase 2 replaces the body, not the signature.
**And** the seed populates cohort intake assumptions from PRD §3.4 dates (Jun 26, Sep 26, Oct 26, Feb 27, Apr 27, Jun 27).

## Tasks/Subtasks

- [x] Task 1: Add cohort timing panel to `scenarios-view.js` (CohortTimingPanel component)
- [x] Task 2: Verify seed has all 6 cohort timing assumptions (already seeded in story 2.5)
- [x] Task 3: Document Phase 1/2 contract in cohort.js comment (already documented)

## Dev Notes

- `monthlyHeadcountByRegion` was already implemented and tested in Story 2.5 with correct signature
- Phase 1: all headcount attributed to `apac`; `americas` and `emea` are always 0
- The cohort timing panel is co-located with the scenario inputs panel in `scenarios-view.js`
- Each cohort row has an AssumptionMarker so users can click to view/edit via Decision Drawer
- The "edit cohort timing" interaction (proposing a new YYYY-MM assumption) is in Story 3.5 via the Licence Forecast view

## Dev Agent Record

### Completion Notes

Cohort timing panel implemented as CohortTimingPanel component inside scenarios-view.js.
Shows CH17–CH22 with start months and FY classification. Each start month value is wrapped in
an AssumptionMarker that opens the Decision Drawer. monthlyHeadcountByRegion is already correct
(Story 2.5) with Phase 1/2 contract comment. All 6 cohort timing assumptions already seeded.

## File List

- cost-tracker/src/components/scenarios/scenarios-view.js
- cost-tracker/src/state/cohort.js (no changes — already correct)
- cost-tracker/seed/workbook-seed.json (no changes — already seeded)

## Change Log

| Date | Change |
|---|---|
| 2026-05-13 | Story created; cohort panel implemented in scenarios-view.js |
