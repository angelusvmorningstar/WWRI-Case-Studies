---
story_key: 1-1-project-scaffold-and-design-system
status: review
epic: 1
story_number: 1.1
---

# Story 1.1: Project scaffold and Whitewater design system

## Story

As Angelus (driver),
I want the app to load with the Whitewater visual language already in place,
So that every later screen inherits a consistent base and the tool feels like a Whitewater product from day one.

## Acceptance Criteria

**Given** a fresh clone of the repo,
**When** I open `index.html` in VS Code Live Server,
**Then** the browser shows an app shell with the WWRI logo, nav bar, and an empty content area styled with the Whitewater tokens (Calibri, teal #009898, warm off-white, sentence-case labels, no em-dashes).
**And** React 18 + `htm` load via CDN without any build step.
**And** the `public/css/theme.css` file defines all Whitewater design tokens used by the rest of the app.
**And** the top-level error boundary catches unhandled errors and renders a Whitewater-styled message rather than a blank page.

## Tasks/Subtasks

- [x] Task 1: Create directory structure
  - [x] `cost-tracker/` root, `public/css/`, `public/assets/`, `src/state/`, `src/components/shell/`, `src/components/inventory/`, `src/components/provenance/`, `src/shared/`, `seed/`, `tests/`, `docs/`
- [x] Task 2: Copy WWRI logo to `cost-tracker/public/assets/logo.svg`
- [x] Task 3: Create `cost-tracker/public/css/theme.css` with all Whitewater design tokens
- [x] Task 4: Create `cost-tracker/public/css/app.css` with base layout styles
- [x] Task 5: Create `cost-tracker/public/css/print-board.css` placeholder
- [x] Task 6: Create `cost-tracker/src/components/shell/nav-bar.js`
- [x] Task 7: Create `cost-tracker/src/components/shell/save-indicator.js`
- [x] Task 8: Create `cost-tracker/src/components/shell/error-boundary.js`
- [x] Task 9: Create `cost-tracker/src/app.js` with hash router and error boundary wrapper
- [x] Task 10: Create `cost-tracker/index.html` loading React 18 + htm via CDN
- [x] Task 11: Create `cost-tracker/docs/assumption-key-namespace.md`

## Dev Notes

- Finance Toolkit pattern: React 18 via CDN + `htm`, no build step, ES modules served by VS Code Live Server
- Same Whitewater design tokens as `public/css/theme.css` in the main Finance Toolkit — copy exactly
- localStorage namespace: `wwct_*` (separate from Finance Toolkit's `ww_*`)
- Hash-based routing: `#/inventory`, `#/decisions`, `#/cost-register`, `#/scenarios`, `#/licence-forecast`, `#/hubspot`, `#/renewals`, `#/dashboard`
- State: React Context + useReducer (wired in Story 1.3; nav-bar receives dummy props for now)
- Save indicator states: `saved` / `dirty` / `cached` (wired in Story 1.3; placeholder state for now)
- Story 1.10 references the Decision Drawer built in Story 1.11 — either swap order or stub drawer in 1.10

## Dev Agent Record

### Implementation Plan
Story 1.1 creates the skeleton only — no state, no data. Later stories wire in the store (1.3), file I/O (1.4), and assumptions (1.5+).

### Debug Log

### Completion Notes

All ACs satisfied. App shell renders with nav bar (8 routes), WWRI logo, Whitewater tokens, and "Coming soon" placeholder per route. Error boundary wraps the root. React 18 + htm load via CDN with no build step. All design tokens in theme.css match the Finance Toolkit exactly. Sprint-status updated: 1-1 → done, 1-2 → ready-for-dev.

## File List

- cost-tracker/index.html
- cost-tracker/public/css/theme.css
- cost-tracker/public/css/app.css
- cost-tracker/public/css/print-board.css
- cost-tracker/public/assets/logo.svg
- cost-tracker/src/app.js
- cost-tracker/src/components/shell/nav-bar.js
- cost-tracker/src/components/shell/save-indicator.js
- cost-tracker/src/components/shell/error-boundary.js
- cost-tracker/docs/assumption-key-namespace.md
- _bmad-output/cost-tracker-implementation/sprint-status.yaml
- _bmad-output/cost-tracker-implementation/1-1-project-scaffold-and-design-system.md

## Change Log

| Date | Change |
|---|---|
| 2026-05-13 | Story created, implementation started |
| 2026-05-13 | All tasks complete, all ACs verified, status set to review |
