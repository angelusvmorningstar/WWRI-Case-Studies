# Story 2.2: Xero CSV Import & Parsing

Status: review

## Story

As a user,
I want to paste Xero CSV exports and have the app parse them correctly using column names,
so that my financial data is imported reliably even if Xero changes the column order.

## Acceptance Criteria

1. Balance Sheet AU/EU CSVs parse correctly using account-name substring matching (NFR15)
2. P&L AU/EU (month and YTD) CSVs parse correctly using account-name matching
3. Xero invoice CSVs parse into row objects using header-based column keys
4. Parsed data is saved via `store.set()` with the correct storage key
5. Parsing completes within 3 seconds for files up to 500 rows (NFR2)
6. Unrecognised format or missing columns returns a clear error message
7. No data is written to storage on parse failure
8. Textarea retains content on error, clears on success
9. All Xero-specific column mappings defined in finance-controls, not in csv-parser.js

## Tasks / Subtasks

- [x] Task 1: Implement BS parser function (AC: #1, #6, #9)
  - [x] parseFinRows() — split text into rows/columns (Xero accounting format, not standard CSV)
  - [x] findRow() — search rows by account name substring in columns 0+1
  - [x] parseValue() — strip commas, parse float
  - [x] parseBalanceSheet(entity, text) — extract bank accounts, assets, liabilities, net assets
  - [x] Extract FX rates from AU balance sheet (EUR/USD rate patterns)
  - [x] Return { ok, data } or { ok: false, error }
- [x] Task 2: Implement PL parser function (AC: #2, #6, #9)
  - [x] parseProfitLoss(entity, type, text) — type is 'mo' or 'ytd'
  - [x] Find header row containing "Account"
  - [x] Extract: revenue, cost of sales, gross profit, opex, net profit
  - [x] For month type: also extract international sales, reimbursement, IE fees, referral fees, client-charged expenses
  - [x] Extract prior period comparisons (p1, p2) from columns 2 and 3
  - [x] Return { ok, data } or { ok: false, error }
- [x] Task 3: Implement invoice parser (AC: #3, #9)
  - [x] parseInvoices(text) — use csv-parser.js parseCSV() for standard header+rows format
  - [x] Store raw row objects without transformation
  - [x] Return { ok, data, rowCount } or { ok: false, error }
- [x] Task 4: Wire parsers into import button handlers (AC: #4, #7, #8)
  - [x] Replace placeholder click handlers from Story 2.1
  - [x] Map each import type to its parser: bs-au → parseBalanceSheet('au'), etc.
  - [x] On success: store.set() with correct key, clear textarea
  - [x] On failure: show error (console.log for now — Story 2.3 adds banners), retain textarea
  - [x] Merge BS/PL data into existing stored object (don't overwrite other entities)
- [x] Task 5: Validate (AC: #5, #8)
  - [x] File stays under 500 lines — split into helper module if needed
  - [x] All parsing logic in finance-controls.js (not in csv-parser.js)

## Dev Notes

### CRITICAL: Xero CSVs are NOT standard header+rows format

Balance Sheet and P&L exports from Xero are accounting-format CSVs. They don't have a single header row followed by data rows. Instead, each row is an account line item, and you search for specific account names to find the values you need.

**Only the Invoice export** is a standard header+rows CSV that can use csv-parser.js parseCSV().

### BS/PL row parsing helper

The monolith uses a simple row parser for financial CSVs:

```javascript
// Split text into rows of columns — NOT the same as csv-parser.js parseCSV()
function parseFinRows(text) {
  const sep = text.includes('\t') ? '\t' : ',';
  return text.split('\n').map(line =>
    line.split(sep).map(c => c.replace(/^"|"$/g, '').trim())
  );
}
```

Then searches rows by concatenating columns 0 and 1:
```javascript
function findRow(rows, pattern) {
  for (const row of rows) {
    const label = (row[0] || '') + (row[1] || '');
    if (label.includes(pattern)) return row;
  }
  return null;
}
```

### Balance Sheet — Account patterns to search for

| Pattern | Field | Notes |
|---------|-------|-------|
| "Bank" (NOT "Total", "Fee", "Reval") | bank_detail[] | Loop between "Bank" and "Total Bank" |
| "Total Bank" | bank | Sum of bank accounts |
| "Total Current Assets" | currentAssets | |
| "Total Fixed Assets" | fixedAssets | |
| "Total Non-current Assets" | nonCurrentAssets | |
| "Total Assets" | assets | |
| "Total Current Liabilities" | currentLiabilities | |
| "Total Liabilities" | liabilities | |
| "Unearned Income" | unearnedIncome | |
| "Net Assets" | netAssets | |
| "Retained Earnings" | retainedEarnings | |
| "Ordinary shares" OR "Share Capital" | shareCapital | |
| "Current Year Earnings" | currentYearEarnings | |
| "As at" | period | Date string from header area |

**FX rate extraction (AU entity only):** Look for patterns like "1.23 EUR" or "1.50 USD" in bank account rows.

**Value extraction:** The value is in the LAST non-empty column of the row.

### P&L — Account patterns to search for

Find header row containing "Account" in column 0. Then:

| Pattern | Field | Columns |
|---------|-------|---------|
| "Total Trading Income" | revenue | [1]=current, [2]=p1, [3]=p2 |
| "Total Cost of Sales" | cos | [1], [2], [3] |
| "Gross Profit" | gp | [1], [2], [3] |
| "Total Operating Expenses" | opex | [1], [2], [3] |
| "Net Profit" | net | [1], [2], [3] |

**Month-only additional fields:**

| Pattern | Field |
|---------|-------|
| "International Sales" | intlSales |
| "Reimbursement" | reimb |
| "International Experts" | ieFees |
| "Referral Partner" | refFees |
| "Client-Charged" | clientExp |

### Data storage — merging not replacing

BS and PL data is stored as a single object per type. When importing BS AU, you must:
1. `store.get('balanceSheet')` — get existing (may have EU data)
2. Update the `au` property with new parsed data
3. `store.set('balanceSheet', merged)` — save back

Same for PL: get existing, update the specific entity+type key (e.g., `auMo`), save back.

### Storage keys for each import type

| Import Type | store.set() key | Sub-key |
|-------------|----------------|---------|
| bs-au | balanceSheet | .au |
| bs-eu | balanceSheet | .eu |
| pl-au-month | profitLoss | .auMo |
| pl-au-ytd | profitLoss | .auYtd |
| pl-eu-month | profitLoss | .euMo |
| pl-eu-ytd | profitLoss | .euYtd |
| invoices | xeroImport | (whole array) |

### File size concern

finance-controls.js is currently 97 lines. The Xero parsers add significant logic. If the file approaches 500 lines, extract parsing helpers into a separate `finance/xero-parsers.js` module. The column mappings stay in finance-controls or xero-parsers — NOT in shared/csv-parser.js.

### Previous Story Intelligence

- Story 1.3: csv-parser.js has parseCSV() for standard header+rows CSV — use for invoices only
- Story 1.2: store.js has get/set — import as `import { get, set } from '../shared/store.js'`
- Story 2.1: finance-controls.js (97 lines) has import button handlers that currently just clear textarea

### References

- [Source: reference/WWRI-toolkit.html lines 2103-2268] — importBS(), importPL(), parseFinCSV(), findRow(), pv()
- [Source: reference/WWRI-toolkit.html lines 1003-1015] — onFileXero() invoice import
- [Source: _bmad-output/planning-artifacts/prd.md#NFR15] — name-based lookups, resilient to format changes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No issues encountered.

### Completion Notes List

- Created xero-parsers.js (266 lines): parseBalanceSheet, parseProfitLoss, parseInvoices
- BS parser: extracts bank accounts (detail loop), assets, liabilities, net assets, FX rates from AU entity. Uses findRow/findVal pattern matching on account names.
- PL parser: finds "Account" header row, extracts revenue/COS/GP/opex/net from columns 1-3 (current + 2 priors). Month type adds revenue breakdown (intl sales, reimb, IE/ref fees, client exp).
- Invoice parser: delegates to shared csv-parser.js parseCSV() for standard header+rows format.
- Updated finance-controls.js (145 lines): IMPORT_HANDLERS map linking each import type to parser + storage key + subKey. handleImport() merges BS/PL data into existing stored object (preserves other entities).
- All parsing errors return { ok: false, error } with descriptive messages. Textarea retained on error, cleared on success.

### Change Log

- 2026-03-30: Story 2.2 implemented — Xero CSV parsers for BS, PL, invoices

### File List

- public/js/finance/xero-parsers.js (266 lines — new file)
- public/js/finance/finance-controls.js (145 lines — modified: added parser imports, handleImport, IMPORT_HANDLERS)
