---
story_key: 2-8-override-variable-editing
status: done
epic: 2
story_number: 2.8
---

# Story 2.8: Cell click reveals driving assumptions, not computed total

## Story

As Angelus or Niel (any user),
I want clicking a forecast cell to show me the assumptions driving that value,
So that I can adjust the right variable rather than stamping a one-off total that becomes stale next month.

## Acceptance Criteria

**Given** I click a forecast cell,
**When** the interaction opens,
**Then** I see two clearly labelled options:
  - "Edit driving assumption" — opens the Decision Drawer for the `primaryAssumptionKey` of that cell
  - "Set one-off value for this month" — opens the existing OverrideForm (already simplified by Story 2.7)
**And** the driving assumption label and current value are visible before I choose (e.g. "HubSpot bundle monthly cost — AUD 918").
**And** choosing "Edit driving assumption" opens the Decision Drawer on that assumption with "Propose new value" pre-activated.
**And** choosing "Set one-off value" opens the OverrideForm pre-filled with the current computed total as before.
**And** actual cells (isActual: true) remain non-editable — no click interaction.

## Tasks/Subtasks

- [x] Task 1: Create `src/components/cost-register/cell-action-picker.js`
  - [x] Small inline popover (not a full dialog) that appears on cell click
  - [x] Shows: assumption label + value (from `lookupAssumption(assumptions, primaryAssumptionKey)`)
  - [x] Two buttons: "Edit assumption" and "Override this month"
  - [x] Closes on Escape or outside click
  - [x] Whitewater styling: surface card, teal primary button, ghost secondary button
- [x] Task 2: Update `cost-register-view.js`
  - [x] Replace direct `setActiveOverride` call on cell click with `setActivePicker({ sub, yearMonth, primaryAssumptionKey, currentValue })`
  - [x] Render `CellActionPicker` when `activePicker` is set
  - [x] "Edit assumption" → set `activeDrawerAssumptionId` to the assumption's `id` (look up by key) → open DecisionDrawer
  - [x] "Override this month" → set `activeOverride` (existing path, no change)
  - [x] Preserve existing: actual cells not clickable, override cells re-clickable
- [x] Task 3: Wire Decision Drawer from cost register view
  - [x] Cost register view currently only opens Decision Drawer via assumption marker clicks
  - [x] Add `activeDrawerAssumptionId` state and conditionally render `DecisionDrawer` when set
  - [x] `onClose` clears `activeDrawerAssumptionId`
- [x] Task 4: CSS for cell action picker popover
  - [x] `.cell-action-picker` — positioned absolute relative to the clicked cell, z-index above table
  - [x] Max width ~280px, card shadow, border-radius matching `.drawer`
  - [x] `.cell-action-picker__assumption` — small label + bold value line
  - [x] `.cell-action-picker__actions` — flex row, gap, full-width buttons stacked on small viewports

## Dev Notes

- `primaryAssumptionKey` is already returned by `computeForecast()` and stored in the grid data — it is available at render time without any new computation.
- `lookupAssumption(assumptions, key)` returns the full assumption object including `label` and `value`. Use this to populate the picker's description line.
- For HubSpot post-Nov 2026, `primaryAssumptionKey` is `subscription.hubspot.renewal_monthly_aud`. Clicking "Edit assumption" would open the Decision Drawer on the renewal rate — which is exactly right.
- For override cells (already overridden), `primaryAssumptionKey` on the grid entry should be the `overrideAssumptionKey` — the picker should still show "Edit assumption" (to view/withdraw the override via the drawer) and "Override this month" (to re-override).
- The `CellActionPicker` popover does not need to be a full dialog with overlay — a lightweight positioned `<div>` that closes on outside click (via a `useEffect` window click listener) is sufficient and less visually heavy.
- Decision Drawer is already imported in the app but cost-register-view.js currently only renders it indirectly via assumption markers. This story adds a direct render path from the cost register — no changes to `decision-drawer.js` itself needed.
- Story 2.7 (source optional) must be complete before this story ships — the OverrideForm path opened from this picker should already have source optional.
- Do NOT change the assumption marker click behaviour — markers still open the Decision Drawer directly as before.

## Dev Agent Record

### Implementation Plan

New component `CellActionPicker` uses `position: fixed` with coordinates from the cell click event (`e.clientX/Y`), a `useEffect` window `mousedown` listener for outside-click dismiss, and Escape key handler. The picker resolves the driving assumption via `lookupAssumption` from the `primaryAssumptionKey` already on each grid cell. "Edit assumption" passes the assumption's `id` to a new `activeDrawerAssumptionId` state in the view, which conditionally renders `DecisionDrawer`. "Override this month" routes to the existing `OverrideForm` path, unchanged. Actual cells remain untouched — the guard is in the `onOverrideClick` handler, same as before.

### Debug Log

### Completion Notes

- Created `cell-action-picker.js`: fixed-position popover, resolves assumption from key, two CTA buttons, closes on Escape/outside mousedown
- Updated `cost-register-view.js`: added `activePicker` and `activeDrawerAssumptionId` states; `CostCell.handleClick` now passes `(clientX, clientY)` up; grid maps `onOverrideClick` to open picker with cell context; renders `CellActionPicker`, `OverrideForm`, and `DecisionDrawer` conditionally
- Added CSS block for `.cell-action-picker` and sub-elements to `app.css`
- `DecisionDrawer` is imported and rendered directly from cost-register-view for the first time (previously only via assumption markers); no changes to `decision-drawer.js` itself
- Override assumption marker click behaviour unchanged (assumption markers still stop propagation and open the drawer their own way)

## File List

- cost-tracker/src/components/cost-register/cell-action-picker.js (NEW)
- cost-tracker/src/components/cost-register/cost-register-view.js
- cost-tracker/public/css/app.css
- _bmad-output/cost-tracker-implementation/2-8-override-variable-editing.md
- _bmad-output/cost-tracker-implementation/sprint-status.yaml

## Change Log

| Date | Change |
|---|---|
| 2026-05-14 | Story created from UX-01 smoke test finding |
| 2026-05-14 | Implemented — CellActionPicker component, fixed-position popover, DecisionDrawer wired from cost register |
