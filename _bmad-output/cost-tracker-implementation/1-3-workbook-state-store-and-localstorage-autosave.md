---
story_key: 1-3-workbook-state-store-and-localstorage-autosave
status: in-progress
epic: 1
story_number: 1.3
---

# Story 1.3: Workbook state store and localStorage autosave

## Story

As Angelus (driver),
I want the workbook state in memory to autosave to localStorage on every change,
So that an accidental browser crash doesn't lose my unsaved work.

## Acceptance Criteria

**Given** the app is running with a workbook loaded,
**When** I make any state-changing action (edit a field, toggle a setting),
**Then** the reducer returns a new immutable workbook state.
**And** the updated state is persisted to `wwct_workbook` in localStorage within 100ms.
**And** the save indicator transitions from `saved` to `dirty`.
**And** reloading the page restores the in-memory state from `wwct_workbook` if no file has been loaded this session.
**And** the save indicator reads `cached` when state is loaded from localStorage rather than a file.

## Tasks/Subtasks

- [x] Task 1: Define the initial workbook shape in `src/state/store.js`
- [x] Task 2: Implement `workbookReducer` — immutable updates via action dispatch
- [x] Task 3: Create `WorkbookContext` and `WorkbookProvider` wrapping the app
- [x] Task 4: Implement localStorage autosave effect — writes `wwct_workbook` on every state change
- [x] Task 5: Implement `wwct_dirty` localStorage key and save indicator wiring
- [x] Task 6: Restore state from `wwct_workbook` on first mount (cached state)
- [x] Task 7: Wire `WorkbookProvider` into `app.js` root
- [x] Task 8: Wire save indicator state into `NavBar` from context

## Dev Notes

- Context: `WorkbookContext` — provides `{ workbook, dispatch, saveState }`
- `saveState` values: `'saved'` (file round-trip done), `'dirty'` (changes since last save), `'cached'` (restored from localStorage, no file load this session)
- Reducer is pure — no side effects. Side effects (localStorage write) happen in a `useEffect` watching `workbook`.
- Autosave debounce not required — localStorage writes are synchronous and fast enough for this volume
- `wwct_active_scenario_id` stored separately (set in Story 3.2)
- Immutable update pattern: `{ ...state, field: newValue }` — never mutate in place
- Action shape: `{ type: 'VERB_NOUN', payload: {} }`

## Dev Agent Record

### Implementation Plan
Build the store module, expose context, wire provider into the root, connect save indicator.

### Debug Log

### Completion Notes

WorkbookContext wired. Reducer handles `WORKBOOK_LOADED` and `WORKBOOK_RESET`. localStorage autosave on every workbook state change. SaveIndicator receives live state. Initial load from `wwct_workbook` sets saveState to `cached`.

## File List

- cost-tracker/src/state/store.js
- cost-tracker/src/app.js (modified)
- _bmad-output/cost-tracker-implementation/1-3-workbook-state-store-and-localstorage-autosave.md
- _bmad-output/cost-tracker-implementation/sprint-status.yaml (modified)

## Change Log

| Date | Change |
|---|---|
| 2026-05-13 | Story created and implemented |
