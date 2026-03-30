# Story 1.3: Shared Utilities

Status: review

## Story

As a user,
I want all numbers, currencies, and dates displayed consistently across the app,
so that I can trust the data presentation and scan figures quickly.

## Acceptance Criteria

1. `formatCurrency(amount, currency)` returns formatted string with currency symbol, thousands separators, and 2 decimal places (e.g., `"$1,234.56"`)
2. Negative values formatted with a minus sign
3. `formatPercent(value)` returns percentage string (e.g., `0.15` → `"15%"`)
4. `formatDate(isoString)` returns a human-readable date string
5. `convertToAUD(amount, fromCurrency)` uses current FX rates from `store.get('fxRates')` and returns a number
6. `parseCSV(text)` auto-detects comma vs tab delimiters
7. Parser handles quoted fields containing delimiters or newlines (NFR14)
8. Parser returns array of objects with column-name keys (name-based matching, not positional) (FR8)
9. Parser returns a clear error object if expected columns are not found
10. All three modules use ES module named exports with `.js` file extensions in import paths (NFR8)
11. No file exceeds 500 lines (NFR4)

## Tasks / Subtasks

- [x] Task 1: Implement format.js (AC: #1, #2, #3, #4, #10, #11)
  - [x] `formatCurrency(amount, currency)` — symbol lookup, Intl.NumberFormat or manual formatting, negative handling
  - [x] `formatPercent(value)` — multiply by 100, append %
  - [x] `formatDate(isoString)` — parse ISO string, return readable format (e.g., "Mar 2026" or "30 Mar 2026")
  - [x] Export all functions as named exports
- [x] Task 2: Implement fx.js (AC: #5, #10, #11)
  - [x] `convertToAUD(amount, fromCurrency)` — fetch rates from store, multiply by rate
  - [x] Handle edge cases: unknown currency returns amount unchanged, null/zero rates
  - [x] Import store.js using relative path with .js extension
- [x] Task 3: Implement csv-parser.js (AC: #6, #7, #8, #9, #10, #11)
  - [x] Auto-detect delimiter (comma vs tab) by inspecting first line
  - [x] Parse header row to extract column names
  - [x] Parse data rows into objects keyed by column name
  - [x] Handle quoted fields (fields wrapped in double quotes containing delimiters, newlines, or escaped quotes)
  - [x] Return `{ ok: true, data: [...], columns: [...], rowCount: n }` on success
  - [x] Return `{ ok: false, error: "descriptive message" }` on failure
- [x] Task 4: Validate all files (AC: #10, #11)
  - [x] All files use named exports
  - [x] All import paths include .js extension
  - [x] No file exceeds 500 lines

## Dev Notes

### format.js — Currency symbols

The app deals with these currencies: AUD, EUR, USD, GBP, SGD. Currency symbol mapping:

```javascript
const CURRENCY_SYMBOLS = {
  AUD: '$',
  USD: 'US$',
  EUR: '€',
  GBP: '£',
  SGD: 'S$'
};
```

AUD is the base currency and primary display currency. Most values will be AUD. Use `$` for AUD (no prefix needed — this is an Australian business app).

### format.js — Date formatting

The monolith uses short month-year format extensively (e.g., "Mar-26", "Apr-26"). The `formatDate` function should support this pattern as the primary format. Consider exporting a `formatMonthYear(isoString)` helper as well if needed for column headers.

Dates in data are stored as ISO strings (`"2026-03-30"`). Never store pre-formatted dates.

### format.js — No inline formatting elsewhere

The architecture doc is explicit: no `toFixed()`, `toLocaleString()`, or manual number formatting scattered across modules. ALL user-facing number/currency/date display goes through `format.js`.

### fx.js — Conversion logic

FX rates are stored as multipliers from foreign currency to AUD. The monolith uses: `amountAUD = amountForeign * rate`.

```
Example: €10,000 at EUR rate 1.61 = $16,100 AUD
```

The `convertToAUD` function should:
1. Import `get` from `store.js` (relative path: `'./store.js'`)
2. Call `get('fxRates')` to fetch current rates
3. Look up the rate for `fromCurrency` (case-insensitive)
4. Return `amount * rate`
5. If currency is AUD, return amount unchanged
6. If rate not found, return amount unchanged (safe fallback)

### csv-parser.js — Delimiter detection

The monolith detects tabs vs commas by checking if the first line contains tabs. Simple heuristic:

```javascript
const delimiter = text.includes('\t') ? '\t' : ',';
```

This works because HubSpot exports are TSV (tab-separated) and Xero exports are CSV (comma-separated). No file uses both.

### csv-parser.js — Quoted field handling

CSV spec (RFC 4180): fields wrapped in double quotes can contain delimiters, newlines, and escaped quotes (doubled: `""`). The parser must handle:
- `"field with, comma"` → `field with, comma`
- `"field with ""quotes"""` → `field with "quotes"`
- `"field with\nnewline"` → `field with\nnewline`

### csv-parser.js — Return format

Success:
```javascript
{ ok: true, data: [{ colName: value, ... }, ...], columns: ['col1', 'col2'], rowCount: 42 }
```

Failure:
```javascript
{ ok: false, error: "Could not detect delimiter — data appears empty" }
```

The `columns` array is useful for downstream validators that check for expected columns (Xero-specific parsers in Epic 2 will use this).

### csv-parser.js — This is the BASE parser only

This story creates the generic CSV/TSV parser. Format-specific logic (Xero column mappings, HubSpot field extraction) lives in the Controls tab modules (Stories 2.2 and 5.1). The base parser does NOT know about Xero or HubSpot — it just parses any CSV/TSV into objects.

### Architecture patterns

- Files: `public/js/shared/format.js`, `public/js/shared/fx.js`, `public/js/shared/csv-parser.js`
- All three are placeholder files from Story 1.1
- `fx.js` imports from `store.js`: `import { get } from './store.js';`
- `format.js` and `csv-parser.js` have zero imports — they are pure utility modules
- `const` by default, `let` only when reassignment needed
- No `var`, no `!important`, no inline styles

### Previous Story Intelligence

- Story 1.1: Seed data files created with production values
- Story 1.2: store.js implemented (126 lines) with get/set/getAll/clear/init. Import as `import { get } from './store.js'`
- FX rates seed data: `{ "aud": 1, "eur": 1.61, "usd": 1.5, "gbp": 2, "sgd": 1 }`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — format.js for all display, no inline toFixed()
- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns] — FX conversion shared utility, CSV parsing shared base
- [Source: _bmad-output/planning-artifacts/prd.md#NFR14] — CSV handles both comma and tab with quoted fields
- [Source: _bmad-output/planning-artifacts/prd.md#FR8] — name-based column matching
- [Source: reference/WWRI-toolkit.html] — FX conversion formula, delimiter detection, date formats

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No issues encountered.

### Completion Notes List

- format.js (105 lines): formatCurrency, formatPercent, formatDate, formatMonthYear, formatNumber
- fx.js (40 lines): convertToAUD using store.get('fxRates'), handles unknown currencies gracefully
- csv-parser.js (162 lines): parseCSV with auto-delimiter detection, RFC 4180 quoted field handling, validateColumns helper
- All modules use named exports, const by default, no var
- csv-parser returns { ok, data, columns, rowCount } or { ok, error } — consistent with store.js pattern
- Added formatMonthYear and formatNumber as additional helpers needed by later stories

### Change Log

- 2026-03-30: Story 1.3 implemented — format.js, fx.js, csv-parser.js

### File List

- public/js/shared/format.js (105 lines — modified from placeholder)
- public/js/shared/fx.js (40 lines — modified from placeholder)
- public/js/shared/csv-parser.js (162 lines — modified from placeholder)
