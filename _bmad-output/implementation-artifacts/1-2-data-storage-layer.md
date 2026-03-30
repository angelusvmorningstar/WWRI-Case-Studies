# Story 1.2: Data Storage Layer

Status: review

## Story

As a user,
I want my existing localStorage data preserved when I open the refactored app,
so that I don't lose any previously imported pipeline or finance data.

## Acceptance Criteria

1. `store.get('deals')` returns the data from `localStorage.getItem('ww_db2')` parsed as JSON
2. `store.set('deals', data)` writes to `localStorage.setItem('ww_db2', JSON.stringify(data))`
3. `store.getAll()` returns an object containing all mapped keys and their current values
4. `store.clear()` removes all mapped localStorage keys
5. On first run (no existing localStorage data), seed data from JSON files in `public/data/` is loaded into localStorage for any key that has no existing value
6. Subsequent calls to `store.get()` return the seeded defaults after first-run loading
7. No direct `localStorage.getItem()` or `localStorage.setItem()` calls exist outside `store.js`
8. All exports use named exports with ES module syntax (NFR8)
9. The module uses `const` by default, `let` only when reassignment is needed (NFR11)
10. File does not exceed 500 lines (NFR4)

## Tasks / Subtasks

- [x] Task 1: Define the key mapping constant (AC: #1, #2)
  - [x] Create STORAGE_KEYS object mapping clean names to localStorage keys
  - [x] Include all 14 keys from the monolith
- [x] Task 2: Implement core get/set functions (AC: #1, #2, #8, #9)
  - [x] Implement `get(key)` — looks up real key, parses JSON, returns data or null
  - [x] Implement `set(key, data)` — looks up real key, stringifies, writes to localStorage
  - [x] Implement `getAll()` — returns object with all mapped keys and values (AC: #3)
  - [x] Implement `clear()` — removes all mapped keys from localStorage (AC: #4)
  - [x] Add try/catch error handling for localStorage quota and parse errors
- [x] Task 3: Implement seed data loading (AC: #5, #6)
  - [x] Create `init()` function that fetches JSON seed files via `fetch()`
  - [x] For each seedable key, check if localStorage already has data — skip if yes
  - [x] Load seed data only for keys with no existing value
  - [x] Map seed files to correct storage keys (fx-rates.json → fxRates, etc.)
- [x] Task 4: Export public API and validate (AC: #7, #8, #10)
  - [x] Export named functions: get, set, getAll, clear, init
  - [x] Verify file stays under 500 lines
  - [x] Verify no other module in the project uses localStorage directly

## Dev Notes

### CRITICAL: Backward compatibility with existing data

Users may already have data in localStorage from the monolith app. The key mapping MUST preserve access to that data. The monolith uses `lsGet(k)` / `lsSet(k,v)` helper functions — we are replacing those with `store.get()` / `store.set()` but the underlying localStorage keys remain identical.

### Complete localStorage Key Mapping

This is the authoritative mapping extracted from the monolith (`reference/WWRI-toolkit.html`):

```javascript
const STORAGE_KEYS = {
  deals:            'ww_db2',
  importLog:        'ww_log2',
  baselines:        'ww_bl2',
  snapshots:        'ww_snaps2',
  leads:            'ww_leads2',
  balanceSheet:     'ww_bs',
  profitLoss:       'ww_pl',
  revenue:          'ww_rev',
  expenses:         'ww_exp',
  clientDefaults:   'ww_ref',
  fxRates:          'ww_fx',
  xeroImport:       'ww_xero2',
  stageDefinitions: 'ww_sprobs2',
  lastUpdated:      'ww_lastup'
};
```

### Seed Data File Mapping

Only 4 keys have seed data files (created in Story 1.1). All other keys start as `null` until data is imported via CSV.

| Clean Key | Seed File | Path |
|-----------|-----------|------|
| fxRates | fx-rates.json | `./data/fx-rates.json` |
| stageDefinitions | stage-definitions.json | `./data/stage-definitions.json` |
| expenses | expense-categories.json | `./data/expense-categories.json` |
| clientDefaults | client-defaults.json | `./data/client-defaults.json` |

**Seed loading uses `fetch()`** because the app runs via Live Server (HTTP), not file:// protocol. The `init()` function must be `async` and called at app startup before any tab renders.

### Fetch paths

The seed data files are in `public/data/`. Since `index.html` is in `public/`, the fetch paths are relative: `./data/fx-rates.json`, etc. Do NOT use absolute paths.

### Error handling pattern (from Architecture)

- Wrap localStorage access in try/catch at the store.js level
- If localStorage is full on write, surface a clear error message (return an error object or throw a descriptive error)
- If JSON.parse fails on read, return `null` (corrupted data — don't crash)
- `init()` should handle fetch failures gracefully (network error with Live Server is unlikely but possible)

### Architecture patterns to follow

- File: `public/js/shared/store.js` (placeholder already exists from Story 1.1)
- Named exports only: `export { get, set, getAll, clear, init }`
- Import with `.js` extension: consumers will use `import { get, set } from '../shared/store.js'`
- `const` by default, `let` only when reassignment needed
- No `var` anywhere
- UPPER_SNAKE_CASE for the key mapping constant

### Anti-patterns to avoid

- Do NOT export the STORAGE_KEYS constant — it's an internal implementation detail
- Do NOT add any DOM manipulation — store.js is a pure data layer
- Do NOT import from any other module — store.js has zero dependencies (except fetch for seed loading)
- Do NOT use `localStorage` directly anywhere else in the project — this module is the sole gateway

### Previous Story Intelligence (Story 1.1)

- Directory structure and all placeholder files created successfully
- Seed data JSON files are in place at `public/data/` with production values from the monolith
- `public/js/shared/store.js` exists as a placeholder with comment `// Placeholder — built in Story 1.2`
- No issues encountered in Story 1.1

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — store.js interface and key mapping
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns] — store-mediated data access
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — error handling, anti-patterns
- [Source: reference/WWRI-toolkit.html] — localStorage key names (ww_db2, ww_log2, etc.) and lsGet/lsSet functions

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No issues encountered.

### Completion Notes List

- Implemented store.js (126 lines) with complete localStorage wrapper
- STORAGE_KEYS maps all 14 clean names to monolith localStorage keys (ww_db2, ww_log2, etc.)
- get() returns parsed JSON or null on missing/corrupted data
- set() returns { ok, error } for quota handling
- getAll() returns full state snapshot, clear() removes all mapped keys
- async init() fetches 4 seed JSON files, only loads for keys with no existing value
- STORAGE_KEYS kept private (not exported) — internal implementation detail
- Verified: localStorage only referenced in store.js, nowhere else in project

### Change Log

- 2026-03-30: Story 1.2 implemented — store.js data access wrapper

### File List

- public/js/shared/store.js (126 lines — modified from placeholder)
