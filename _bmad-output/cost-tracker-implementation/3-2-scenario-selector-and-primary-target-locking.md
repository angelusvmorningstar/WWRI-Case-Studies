---
story_key: 3-2-scenario-selector-and-primary-target-locking
status: done
epic: 3
story_number: 3.2
---

# Story 3.2: Scenario selector and Primary Target locking

## Story

As Angelus (driver),
I want to pick which scenario is the "active" one for the cost register and dashboard,
So that the rest of the app shows one consistent set of numbers.

## Acceptance Criteria

**Given** the workbook contains three scenarios,
**When** I select one via the scenario picker in the nav bar,
**Then** `wwct_active_scenario_id` updates in localStorage.
**And** the Cost Register, Licence Forecast, and Dashboard views all re-derive from the selected scenario.
**And** the Primary Target is the default on first load.
**And** the selection persists across page reloads.

## Tasks/Subtasks

- [x] Task 1: Add `SCENARIO_SWITCHED` action to `store.js` reducer
- [x] Task 2: Add scenario picker `<select>` to `nav-bar.js`
- [x] Task 3: Wire `onScenarioChange` callback from `app.js` to nav bar
- [x] Task 4: Add nav bar scenario picker CSS

## Dev Notes

- `activeScenarioId` is already in the workbook state and autosaves to localStorage via wwct_workbook
- Primary target (`scenario-primary-target`) is already the default in emptyWorkbook()
- All views that use scenario (cost register, licence forecast) already read from `workbook.activeScenarioId`
- The select element in the nav bar is intentionally compact (xs font-size, sm padding)

## Dev Agent Record

### Implementation Plan

1. Add SCENARIO_SWITCHED to store reducer
2. Add props (scenarios, activeScenarioId, onScenarioChange) to NavBar
3. Add select element in nav-bar__actions
4. Wire in AppShell

### Completion Notes

All ACs satisfied. Scenario picker `<select>` added to nav bar actions area. Dispatches
SCENARIO_SWITCHED which updates workbook.activeScenarioId. Because workbook autosaves to localStorage
on every mutation, the active scenario persists across reloads without extra storage code.
Primary target is the default from emptyWorkbook(). Cost register and YoY views already read
from workbook.activeScenarioId; licence forecast also reads from it.

## File List

- cost-tracker/src/state/store.js
- cost-tracker/src/components/shell/nav-bar.js
- cost-tracker/src/app.js
- cost-tracker/public/css/app.css

## Change Log

| Date | Change |
|---|---|
| 2026-05-13 | Story created and implemented |
