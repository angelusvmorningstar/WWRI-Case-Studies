---
story_key: 2-3-xero-csv-upload-parse-and-reconcile
status: review
epic: 2
story_number: 2.3
---

# Story 2.3: Xero CSV upload, parse, and reconcile

## Story

As Angelus (driver),
I want to upload a Xero CSV of subscription transactions and have it reconciled against the inventory,
So that actuals update without manual entry per subscription.

## Acceptance Criteria

**Given** I am on the Cost Register view,
**When** I click "Import Xero CSV" and select a file,
**Then** the parser tolerates column reordering and trailing whitespace.
**And** matched transactions update the corresponding MonthlyEntry rows as `is_actual: true`.
**And** unmatched transactions are surfaced in an exception list with vendor, amount, currency, account, and date.
**And** I can manually assign an unmatched transaction to a subscription.
**And** matched-confirmation is required before any forecast cell is overwritten by an actual.
**And** the raw CSV is parsed and discarded; only the reconciled MonthlyEntries are persisted.

## Tasks/Subtasks

- [x] Task 1: Create `src/state/xero-parser.js`
  - [x] `parseXeroCSV(csvText)` — column-tolerant header detection, handles DD/MM/YYYY, ISO, DD-MMM-YYYY dates, quoted fields
  - [x] `reconcile(rows, subscriptions, fxRate)` — fuzzy vendor match, returns `{ matched, unmatched }`
- [x] Task 2: Add `MONTHLY_ENTRIES_BATCH_UPDATED` reducer to store.js
- [x] Task 3: Create `src/components/cost-register/xero-import.js` — multi-step import UI
  - [x] File picker trigger (hidden input + button)
  - [x] Matched section: confirmation checkboxes (pre-checked), vendor, yearMonth, amount (AUD)
  - [x] Unmatched section: vendor, amount, currency, account, date + subscription select dropdown
  - [x] "Confirm and import" dispatches MONTHLY_ENTRIES_BATCH_UPDATED for confirmed rows
  - [x] Modal closes on confirm or cancel, raw CSV not retained in state
- [x] Task 4: Update cost-register-view.js — add "Import Xero CSV" button, render XeroImport

## Dev Notes

- Column detection: case-insensitive header matching against known aliases (ContactName / Contact, InvoiceDate / Date, Total / Amount / UnitAmount, Currency, Description, AccountCode / Account)
- Date parsing: DD/MM/YYYY (en-AU), YYYY-MM-DD (ISO), DD-MMM-YYYY (e.g. 09-Apr-2026)
- Vendor matching: normalize both strings (toLowerCase, strip non-alphanumeric), then substring include check
- FX rate: read via lookupValue(assumptions, 'scenario.fx_rate.aud_usd') for USD → AUD on import
- EUR/GBP: store costAud = costNative (no conversion) and add warning — current subscriptions are AUD or USD only
- MonthlyEntry written by import: isActual: true, costAud (converted), costNative (original), currency, xeroId (row index as string)
- Confirmation step: matched rows pre-checked, user can uncheck; unmatched rows show select for manual assignment
- "Confirm and import" writes only confirmed rows — raw CSV text must not persist in workbook state
- Multiple rows from same vendor + same yearMonth are aggregated (sum) before writing one MonthlyEntry

## Dev Agent Record

### Implementation Plan

1. Build xero-parser.js (pure module)
2. Add batch reducer to store.js
3. Build XeroImport modal component
4. Wire into CostRegisterView

### Debug Log

Parser validation (Node.js): DD/MM/YYYY, ISO, DD-MMM-YYYY, and "D MMM YYYY" all parse correctly. Vendor fuzzy match: "Microsoft Pty Ltd" → Microsoft, "HubSpot, Inc." → HubSpot, "Miro Team" → Miro, "Google LLC" → unmatched, "Zoom Video Communications" → unmatched. Normalize+include approach works correctly.

### Completion Notes

All ACs satisfied. parseXeroCSV() detects columns by name aliases (8 aliases per field), handles 4 date formats, trims whitespace, parses quoted CSV fields, abs() amounts. reconcile() aggregates same-vendor/month rows, fuzzy matches to subscriptions. XeroImport modal: choose file → parse → show matched (checkboxes) + unmatched (subscription select) → confirm → MONTHLY_ENTRIES_BATCH_UPDATED dispatch. Raw CSV text never stored. "Confirm and import" disabled when nothing selected. "Load different file" resets to step 1. FX conversion for USD actuals uses scenario.fx_rate.aud_usd assumption.

## File List

- cost-tracker/src/state/xero-parser.js
- cost-tracker/src/state/store.js
- cost-tracker/src/components/cost-register/xero-import.js
- cost-tracker/src/components/cost-register/cost-register-view.js
- cost-tracker/public/css/app.css
- _bmad-output/cost-tracker-implementation/2-3-xero-csv-upload-parse-and-reconcile.md
- _bmad-output/cost-tracker-implementation/sprint-status.yaml

## Change Log

| Date | Change |
|---|---|
| 2026-05-13 | Story created, implementation started |
| 2026-05-13 | All tasks complete, all ACs verified, status set to review |
