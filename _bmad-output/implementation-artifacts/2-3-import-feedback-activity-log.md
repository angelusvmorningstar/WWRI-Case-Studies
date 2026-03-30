# Story 2.3: Import Feedback & Activity Log

Status: review

## Story

As a user,
I want clear confirmation after each import and a log of all past imports,
so that I know what was imported, when, and can check the history if something seems off.

## Acceptance Criteria

1. Success banner appears with green left border, checkmark icon, entity name, row count, and relative timestamp (UX-DR7)
2. Error banner appears with red left border, warning icon, and specific error message (UX-DR7)
3. Banners are non-modal and do not block interaction
4. Multiple banners stack with most recent on top (UX-DR7)
5. Every import (success or failure) is logged with type, timestamp, and record count (FR43, NFR17)
6. Activity log section shows all past imports in chronological order (FR44)
7. Log reads from `store.get('importLog')`

## Tasks / Subtasks

- [x] Task 1: Create feedback banner rendering functions (AC: #1, #2, #3, #4)
  - [x] renderSuccessBanner(type, rowCount) — green border, checkmark, entity name, count, timestamp
  - [x] renderErrorBanner(type, errorMessage) — red border, warning icon, specific error
  - [x] Prepend banners to #import-feedback-area (most recent on top)
  - [x] Use shared .import-feedback CSS classes from forms.css
- [x] Task 2: Create import logging function (AC: #5, #7)
  - [x] logImport(type, success, rowCount) — append to importLog array in store
  - [x] Each log entry: { type, timestamp (ISO), rowCount, success }
  - [x] Read existing log, push new entry, save back
- [x] Task 3: Create activity log display (AC: #6, #7)
  - [x] renderActivityLog(container) — display all past imports from store
  - [x] Show type, timestamp, row count in a table or list
  - [x] Most recent first
  - [x] Render into #activity-log-section created by Story 2.1
- [x] Task 4: Wire into import flow in finance-controls.js (AC: #1, #2, #5)
  - [x] After successful parse: call renderSuccessBanner + logImport
  - [x] After failed parse: call renderErrorBanner + logImport (with success=false)
  - [x] Re-render activity log after each import
- [x] Task 5: Validate (AC: #3, #4)
  - [x] Banners don't block interaction
  - [x] Multiple banners stack correctly
  - [x] No file exceeds 500 lines

## Dev Notes

### Banner HTML structure

Uses the shared CSS classes from forms.css (Story 1.5):

```html
<div class="import-feedback import-feedback--success">
  <span class="import-feedback__icon">✓</span>
  <span class="import-feedback__text">Balance Sheet AU — 45 rows imported</span>
  <span class="import-feedback__meta">just now</span>
</div>
```

Error variant uses `import-feedback--error` and `⚠` icon.

### Import type display names

Map the data-import-type IDs to human-readable names for banners:

| ID | Display Name |
|----|-------------|
| bs-au | Balance Sheet AU |
| bs-eu | Balance Sheet EU |
| pl-au-month | P&L AU Month |
| pl-au-ytd | P&L AU YTD |
| pl-eu-month | P&L EU Month |
| pl-eu-ytd | P&L EU YTD |
| invoices | Invoices |

### Relative timestamp

Use "just now" for banners added in the current session. The activity log shows full timestamps.

### Activity log storage

```javascript
// importLog array in store:
[
  { type: "bs-au", timestamp: "2026-03-30T14:22:00.000Z", rowCount: 45, success: true },
  { type: "pl-au-month", timestamp: "2026-03-30T14:23:00.000Z", rowCount: 0, success: false },
  ...
]
```

### Where to put the code

The feedback/logging functions could go directly in finance-controls.js or in a small helper. Since finance-controls.js is currently 145 lines and this adds ~80-100 lines, keeping it in the same file is fine (still well under 500).

### Row count for BS/PL

BS and PL parsers don't return a rowCount (they extract specific values, not row arrays). For the log, use a descriptive count:
- BS: count of bank accounts found in bankDetail array
- PL: 1 (it's a single period summary)
- Invoices: result.rowCount from parseCSV

### Previous Story Intelligence

- Story 2.1: #import-feedback-area and #activity-log-section containers exist in the rendered HTML
- Story 2.2: handleImport() in finance-controls.js is where success/failure is determined
- Story 1.5: .import-feedback, .import-feedback--success, .import-feedback--error CSS classes ready

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — import success/error banners
- [Source: _bmad-output/planning-artifacts/prd.md#FR43] — import logging
- [Source: _bmad-output/planning-artifacts/prd.md#FR44] — import log display

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No issues encountered.

### Completion Notes List

- Added addFeedbackBanner() — prepends success/error banners to #import-feedback-area using shared .import-feedback CSS. Most recent on top. Non-modal.
- Added logImport() — appends { type, timestamp, rowCount, success } to importLog array in store.
- Added renderActivityLog() — displays all past imports in a data-table, most recent first, with status icon, type name, row count, and formatted date/time.
- Added refreshActivityLog() — re-renders the log section after each import.
- Wired into handleImport(): success path adds green banner + logs + clears textarea. Failure path adds red banner + logs + retains textarea.
- finance-controls.js now 242 lines (was 145).

### Change Log

- 2026-03-30: Story 2.3 implemented — import feedback banners and activity log

### File List

- public/js/finance/finance-controls.js (242 lines — modified: added feedback, logging, activity log)
