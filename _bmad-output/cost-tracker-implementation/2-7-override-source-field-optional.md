---
story_key: 2-7-override-source-field-optional
status: done
epic: 2
story_number: 2.7
---

# Story 2.7: Make source field optional on override form

## Story

As Angelus or Niel (any user),
I want to submit a forecast override without being required to enter a source citation,
So that I can make quick exploratory adjustments during a modelling session without being blocked by a field that adds no value for one-off overrides.

## Acceptance Criteria

**Given** I click a forecast cell and the OverrideForm dialog opens,
**When** I enter a value and rationale but leave source blank,
**Then** "Resolve override" is enabled and submitting succeeds.
**And** the created Assumption has source set to "Manual override" (auto-filled, not user-visible as an error).
**And** if I do enter a source, it is used verbatim (existing behaviour preserved).
**And** rationale remains required — the form still blocks submission if rationale is empty.

## Tasks/Subtasks

- [x] Task 1: Update `override-form.js`
  - [x] Remove `source` from the required-field validation check
  - [x] When `source` is empty on submit, pass `source: 'Manual override'` to `createAssumption`
  - [x] Remove the "Source is required" error state and display logic for the source field
  - [x] Keep the source input visible but marked optional (remove the `*` required indicator)
  - [x] Update placeholder text to e.g. "Optional — Xero INV-1234, vendor quote, email thread..."
- [x] Task 2: Verify assumption layer still receives a non-empty source string (no reducer validation error)

## Dev Notes

- The store reducer currently calls `resolveAssumption()` which calls the `ValidationError` check in `assumptions.js` for empty source. Passing `'Manual override'` as the default avoids touching the reducer validation — keep it that way.
- `override-form.js` line reference: the `propErrors.source` state and the `if (!fields.source.trim()) errs.source = ...` check are the only things to remove.
- Do NOT make source optional in the Decision Drawer "Propose new value" or "Resolve" forms — those are formal decisions where source is meaningful. This change is scoped to `override-form.js` only.
- This story is a prerequisite for Story 2.8 (which redesigns the override interaction); keep the form structure otherwise identical.

## Dev Agent Record

### Implementation Plan

Scoped to `override-form.js` only. Three changes: (1) removed source from validation, (2) introduced `resolvedSource` constant that falls back to `'Manual override'`, (3) swapped required `*` indicator for optional label. Added `.field__optional` CSS class to `app.css`.

### Debug Log

### Completion Notes

- Removed `if (!source.trim()) errs.source = ...` from `handleSubmit`
- Added `const resolvedSource = source.trim() || 'Manual override'` and threaded through both `createAssumption` and `resolveAssumption` calls
- Replaced `<span class="field__required">*</span>` with `<span class="field__optional">(optional)</span>` on source label
- Updated placeholder text to "Optional — Xero INV-1234, vendor quote, email thread..."
- Added `.field__optional` utility class to `app.css`
- Decision Drawer forms untouched — source remains required there

## File List

- cost-tracker/src/components/cost-register/override-form.js
- cost-tracker/public/css/app.css (if placeholder text styling needs updating)
- _bmad-output/cost-tracker-implementation/2-7-override-source-field-optional.md
- _bmad-output/cost-tracker-implementation/sprint-status.yaml

## Change Log

| Date | Change |
|---|---|
| 2026-05-14 | Story created from UX-02 smoke test finding |
| 2026-05-14 | Implemented — source optional, auto-fills 'Manual override', `.field__optional` CSS added |
