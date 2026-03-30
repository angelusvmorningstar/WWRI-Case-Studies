# Story 2.4: FX Rates & Client Reference Data

Status: review

## Story

As a user,
I want to view and edit exchange rates and client reference data on the Controls tab,
so that I can keep rates current and client details accurate for all calculations.

## Acceptance Criteria

1. Editable number inputs displayed for EUR, USD, GBP, SGD exchange rates (FR37)
2. Inputs show 4 decimal places (UX-DR18)
3. Current values loaded from `store.get('fxRates')`
4. FX rate changes saved immediately on blur via `store.set('fxRates', ...)` (FR37)
5. Client reference data displayed with editable IE fee %, referral %, and avg payment days (FR38)
6. Client data changes saved immediately on blur (UX-DR10)
7. Editable cells visually distinguished with background tint (UX-DR10)
8. Focus states show --color-primary border + --color-focus-ring shadow (UX-DR16)

## Tasks / Subtasks

- [x] Task 1: Render FX rates editor (AC: #1, #2, #3)
- [x] Task 2: Bind FX rate blur handlers (AC: #4)
- [x] Task 3: Render client defaults table (AC: #5)
- [x] Task 4: Bind client data blur handlers (AC: #6)
- [x] Task 5: Validate styling (AC: #7, #8)

## Dev Notes

Implemented directly in finance-controls.js — renderFxRates(), renderClientDefaults(), bindReferenceData(). Uses shared .data-table and .data-table__cell--editable CSS classes.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No issues encountered.

### Completion Notes List

- Added renderFxRates() — 4 currency inputs (EUR, USD, GBP, SGD) with step=0.0001, loaded from store
- Added renderClientDefaults() — table of clients with editable IE fee %, referral %, avg payment days
- Added bindReferenceData() — blur handlers save immediately to store for both FX and client data
- Replaced placeholder section in render() with real content
- finance-controls.js now 359 lines (was 242)
- finance-controls.css now 46 lines (added .finance-controls__label)

### Change Log

- 2026-03-30: Story 2.4 implemented — FX rates and client reference data editors

### File List

- public/js/finance/finance-controls.js (359 lines — modified: added FX rates + client defaults)
- public/css/finance/finance-controls.css (46 lines — modified: added label class)
