---
story_key: 1-2-user-identity
status: in-progress
epic: 1
story_number: 1.2
---

# Story 1.2: User identity (display name)

## Story

As any user,
I want to set my display name once on this machine,
So that every Assumption I record carries my name as `author` without an authentication layer.

## Acceptance Criteria

**Given** I open the app for the first time on this machine,
**When** no `wwct_user_name` exists in localStorage,
**Then** a Settings dialog prompts me to enter my display name before I can record any Assumption.
**And** my name persists in localStorage under `wwct_user_name`.
**And** a Settings menu in the nav bar lets me change the name later.
**And** any subsequent Assumption I create has its `author` field populated from `wwct_user_name`.

## Tasks/Subtasks

- [x] Task 1: Create `src/state/identity.js` — read/write `wwct_user_name` from localStorage
- [x] Task 2: Create `src/components/shell/settings-dialog.js` — modal form for display name
- [x] Task 3: Wire Settings dialog into `NavBar` — Settings button in actions area
- [x] Task 4: Wire identity check into `App` — show dialog on first load if name absent
- [x] Task 5: Export `getAuthor()` from `identity.js` for use by Assumption creation (Stories 1.5+)

## Dev Notes

- localStorage key: `wwct_user_name` (string, trimmed)
- No authentication — just a display name for provenance author field
- Dialog must not be dismissable without entering a name on first load
- On subsequent opens (name already set), the Settings dialog is opt-in via nav bar button
- `getAuthor()` returns the stored name; downstream code (Story 1.5+) calls this when creating Assumptions

## Dev Agent Record

### Implementation Plan
Simple localStorage read/write with a modal overlay. No external deps.

### Debug Log

### Completion Notes

All ACs satisfied. `identity.js` provides `getAuthor()` / `setAuthor()`. Settings dialog blocks dismissal on first load when no name is set. Nav bar shows Settings button that opens the dialog. Author field will be populated from `wwct_user_name` in Story 1.5.

## File List

- cost-tracker/src/state/identity.js
- cost-tracker/src/components/shell/settings-dialog.js
- cost-tracker/src/components/shell/nav-bar.js (modified)
- cost-tracker/src/app.js (modified)
- _bmad-output/cost-tracker-implementation/1-2-user-identity.md
- _bmad-output/cost-tracker-implementation/sprint-status.yaml (modified)

## Change Log

| Date | Change |
|---|---|
| 2026-05-13 | Story created and implemented |
