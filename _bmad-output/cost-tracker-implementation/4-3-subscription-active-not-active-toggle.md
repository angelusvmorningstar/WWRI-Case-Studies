---
story_key: 4-3-subscription-active-not-active-toggle
status: review
epic: 4
story_number: 4.3
---

# Story 4.3: Subscription Active / Not active toggle interface

## Story

As Angelus (driver),
I want a single screen showing every subscription with an Active / Not active toggle,
So that the operations meeting can model "what if we cut these" decisions live.

## Acceptance Criteria

**Given** I navigate to `#/decisions`,
**When** the view renders,
**Then** I see every non-archived subscription with its current status toggle and the per-subscription FY 26/27 saving if toggled off.

**And** toggling "Not active" marks the subscription's forecast cells as zero from that point (actuals are preserved).

**And** the toggle action creates/supersedes a `subscription.<id>.active_status` Resolved assumption with default rationale.

**And** historical actuals are not affected by the toggle.

**And** a summary section shows: status quo FY 26/7 total, toggle saving, adjusted total.

## Tasks/Subtasks

- [x] Task 1: Update `compute.js` to check active_status before computing forecast
- [x] Task 2: Create `src/components/decisions/decisions-view.js`
- [x] Task 3: Wire routes in `app.js` and update nav
- [x] Task 4: CSS for decisions view in `app.css`

## Dev Notes

See completion notes.

## Dev Agent Record

### Debug Log

No issues.

### Completion Notes

compute.js checks `subscription.<normalized_id>.active_status` assumption at the top of computeForecast — if Resolved and value is 'not_active', returns 0 for all forecast months. Actuals in cost register view are returned before computeForecast is called so they're untouched. Toggle dispatches ASSUMPTION_PROPOSED (new) or ASSUMPTION_SUPERSEDED (flip existing). Saving = sum of computeForecast values for FY_2627_MONTHS that don't have isActual entries. Summary row shows status quo FY 26/27, toggle saving, adjusted. #/decisions → DecisionsView, #/decision-log → existing DecisionLog. Nav updated.

## File List

- `cost-tracker/src/state/compute.js` — active_status check added
- `cost-tracker/src/components/decisions/decisions-view.js` — NEW
- `cost-tracker/src/app.js` — route changes
- `cost-tracker/src/components/shell/nav-bar.js` — decision-log link added
- `cost-tracker/public/css/app.css` — decisions view CSS

## Change Log

- 2026-05-14: Story created and implemented inline with dev-story workflow
