---
story_key: 2-2-manual-forecast-cell-override-with-provenance
status: review
epic: 2
story_number: 2.2
---

# Story 2.2: Manual forecast cell override with provenance

## Story

As Niel (strategic contributor),
I want to override a forecast cell manually with an explanatory note,
So that I can model a known one-off cost without changing the underlying scenario.

## Acceptance Criteria

**Given** I click an editable forecast cell,
**When** an inline editor opens,
**Then** I can enter a new value plus a required rationale.
**And** submitting creates a Resolved Assumption with key `subscription.<id>.monthly_override.<yyyy_mm>` and the rationale.
**And** the cell renders with an "overridden" marker until the assumption is withdrawn.
**And** the cell value reflects the override in all downstream views.

## Tasks/Subtasks

- [x] Task 1: Create `src/components/cost-register/override-form.js`
  - [x] Dialog form: value (number, pre-filled), rationale (required textarea), source (required input)
  - [x] On submit: `createAssumption` → `resolveAssumption` → check `buildSupersessionPayload` → dispatch
  - [x] Assumption key format: `subscription.${shortId}.monthly_override.${yyyy_mm}` (dashes → underscores)
  - [x] Dispatch `MONTHLY_ENTRY_UPSERTED` with `overrideAssumptionKey` set
  - [x] Cancel on Escape or overlay click
- [x] Task 2: Update `cost-register-view.js` — fix override lookup + wire override form
  - [x] Import `lookupValue` from assumptions.js, use it for override cell value lookup
  - [x] Add `activeOverride` state: `{ sub, yearMonth, currentValue } | null`
  - [x] Import and conditionally render `OverrideForm`
  - [x] Make forecast cells clickable (td onClick, skip if click was on assumption-marker)
  - [x] Override cells also clickable (re-override)
  - [x] Add `cost-register__cell--editable` class and cursor pointer style
- [x] Task 3: Add CSS for editable cell affordance

## Dev Notes

- Assumption key format: `subscription.${subscriptionId.replace(/^sub-/, '').replace(/-/g, '_')}.monthly_override.${yearMonth.replace('-', '_')}`
  - Example: `subscription.m365_basic.monthly_override.2026_05`
- Override assumption fields: unit="AUD/month", category="Subscription cost", confidence="high"
- The existing `MONTHLY_ENTRY_UPSERTED` reducer from Story 2.1 handles the entry update
- Withdrawal of an override happens via Decision Drawer (already built) — no separate UI needed on the cell
- CostCell onClick: check `e.target.closest('.assumption-marker')` to avoid conflicting with marker click
- The fix to `lookupValue` in the override branch is also part of this story (the 2.1 grid used incorrect `assumptions[key]` dict lookup instead of `lookupValue`)
- OverrideForm is a dialog (same pattern as SubscriptionForm), not truly inline — AC says "inline editor" meaning it opens in context, not in a separate page

## Dev Agent Record

### Implementation Plan

1. Fix cost-register-view.js override lookup
2. Create override-form.js dialog
3. Wire activeOverride state and OverrideForm render in CostRegisterView
4. Add CSS

### Debug Log

Override key generation validated (Node.js): all 12 test cases match namespace convention `subscription.<shortId>.monthly_override.<yyyy_mm>`.

### Completion Notes

All ACs satisfied. Clicking any forecast or overridden cell in the cost register opens OverrideForm dialog. Form requires rationale + source (blocked on empty). On submit: creates Resolved Assumption via createAssumption → resolveAssumption → supersession check, then upserts MonthlyEntry with overrideAssumptionKey. Overridden cells render amber background + assumption marker (Decision Drawer access for withdrawal). CostRegisterView override lookup fixed to use lookupValue() (key-based) rather than dict lookup by ID. CSS editable affordance: pointer cursor + hover highlight on forecast/override cells.

## File List

- cost-tracker/src/components/cost-register/override-form.js
- cost-tracker/src/components/cost-register/cost-register-view.js
- cost-tracker/public/css/app.css
- _bmad-output/cost-tracker-implementation/2-2-manual-forecast-cell-override-with-provenance.md
- _bmad-output/cost-tracker-implementation/sprint-status.yaml

## Change Log

| Date | Change |
|---|---|
| 2026-05-13 | Story created, implementation started |
| 2026-05-13 | All tasks complete, all ACs verified, status set to review |
