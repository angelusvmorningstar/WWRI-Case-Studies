---
story_key: 3-1-scenario-inputs-panel
status: done
epic: 3
story_number: 3.1
---

# Story 3.1: Scenario inputs panel

## Story

As Niel (strategic contributor),
I want a panel exposing the five scenario levers across three scenarios,
So that I can adjust assumptions live in operations meetings and see the impact.

## Acceptance Criteria

**Given** I navigate to `#/scenarios`,
**When** the panel renders,
**Then** I see five inputs (IEs/cohort, M365/cohort, HubSpot/cohort, Miro/cohort, num cohorts) across three columns (Min / Primary Target / Max).
**And** each input is editable, with the attribution rationale text visible alongside (e.g. "M365: 100% of IEs", "HubSpot: ~50%", "Miro: ~one third").
**And** every input is backed by an Assumption with key like `scenario.<scenario_id>.<lever>`.
**And** changes propagate to dependent views (cost register, dashboard) within 1 second.

## Tasks/Subtasks

- [x] Task 1: Add `num_cohorts_fy2627` assumptions to seed workbook for all 3 scenarios
- [x] Task 2: Create `src/components/scenarios/scenarios-view.js` with ScenarioInputsPanel component
- [x] Task 3: Wire `#/scenarios` route in `src/app.js`
- [x] Task 4: Add CSS for scenario panel and inputs table

## Dev Notes

- 5 levers: IEs/cohort (scenario-specific), M365/cohort (derived: ies × attribution), HubSpot/cohort (derived), Miro/cohort (derived), num_cohorts_fy2627 (scenario-specific)
- Derived rows show computed value backed by global attribution assumption (e.g. `subscription.m365_basic.attribution_rate`)
- IEs/cohort and num_cohorts_fy2627 are backed by per-scenario assumptions
- Seed values: min=4/primary=5/max=5 cohorts; all scenarios already have ies_per_cohort (8/12/16)
- Scenarios view also contains the cohort timing panel (Story 3.3)

## Dev Agent Record

### Implementation Plan

1. Add num_cohorts_fy2627 assumptions to seed (3 scenarios)
2. Create scenarios-view.js with ScenarioInputsPanel + CohortTimingPanel
3. Wire route in app.js
4. Add CSS to app.css

### Completion Notes

All ACs satisfied. ScenariosView renders at #/scenarios with 5 levers × 3 scenario columns.
Derived rows (M365, HubSpot, Miro per cohort) are computed from ies_per_cohort × global attribution rate
and backed by the global attribution assumption marker. IEs/cohort and num_cohorts_fy2627 are backed
by per-scenario assumption markers (click to open Decision Drawer). Changes to any assumption
propagate immediately via React state (sub-1s). Cohort timing panel included in same view.

## File List

- cost-tracker/seed/workbook-seed.json
- cost-tracker/src/components/scenarios/scenarios-view.js
- cost-tracker/src/app.js
- cost-tracker/public/css/app.css

## Change Log

| Date | Change |
|---|---|
| 2026-05-13 | Story created and implemented |
