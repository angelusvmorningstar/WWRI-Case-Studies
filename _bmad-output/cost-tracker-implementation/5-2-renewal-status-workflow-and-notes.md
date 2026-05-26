---
story_key: 5-2-renewal-status-workflow-and-notes
status: review
epic: 5
story_number: 5.2
---

# Story 5.2: Renewal Status Workflow and Notes

Status: ready-for-dev

## Story

As Niel (strategic contributor),
I want to track where each renewal sits (prepared / negotiated / signed),
So that the operations meeting can see what's outstanding.

## Acceptance Criteria

**Given** I am viewing a renewal row in the renewals list,
**When** I change its status from `pending` → `prepared` → `negotiated` → `signed`,
**Then** the status persists in the workbook.

**And** I can attach free-text notes (markdown) to the renewal at any stage.

**And** the status change is logged with timestamp and author.

## Tasks / Subtasks

- [x] Task 1: Add `renewals: {}` to `emptyWorkbook()` in `store.js`; add `RENEWAL_UPSERTED` case to reducer
  - [x] `renewals` map keyed by subscription id — `{ [subId]: { status, notes, statusLog } }`
  - [x] `RENEWAL_UPSERTED` payload: the full renewal record; upserts by `subId`
  - [x] Backward compat: reads as `workbook.renewals || {}`

- [x] Task 2: Add inline status control and notes field to `renewals-view.js` (from Story 5.1)
  - [x] Status pill/select with four options: pending / prepared / negotiated / signed
  - [x] Changing status dispatches `RENEWAL_UPSERTED` with updated status + new log entry `{ status, changedAt, author }`
  - [x] Expandable notes area per row (inline textarea or click-to-expand)
  - [x] "Save notes" button dispatches `RENEWAL_UPSERTED` with updated notes

- [x] Task 3: CSS for status controls and notes area in `app.css`
  - [x] `.renewals__status-select` / `.renewals__status-chip` per status value (colour-coded)
  - [x] `.renewals__notes-area` expandable section
  - [x] Status chip colours: pending = neutral, prepared = blue, negotiated = amber, signed = green

## Dev Notes

### Data model extension

Add a `renewals` map to the workbook at the top level (same level as `subscriptions`, `opportunities`):

```js
// emptyWorkbook() addition:
renewals: {},

// Renewal record shape:
{
  subId: string,          // subscription id — the map key
  status: 'pending' | 'prepared' | 'negotiated' | 'signed',
  notes: string,          // free-text markdown, may be empty
  statusLog: [            // append-only log
    { status: string, changedAt: ISO string, author: string }
  ],
}
```

Default state for a subscription with no renewal record: treat as `status: 'pending'`, `notes: ''`, `statusLog: []`.

### Reducer pattern

```js
case 'RENEWAL_UPSERTED': {
  const renewal = action.payload;
  return {
    ...state,
    renewals: { ...(state.renewals || {}), [renewal.subId]: renewal },
    updatedAt: new Date().toISOString(),
  };
}
```

### Status change dispatch pattern

When user changes status:
1. Read existing record: `const existing = workbook.renewals?.[sub.id] || { subId: sub.id, status: 'pending', notes: '', statusLog: [] }`
2. Append to statusLog: `{ status: newStatus, changedAt: new Date().toISOString(), author: getAuthor() || 'Unknown' }`
3. Dispatch `RENEWAL_UPSERTED` with updated record

### UI pattern — inline expand

Follow the `OpportunityRow` expand pattern from `savings-view.js`:
- Row renders status pill (read-only display)
- A chevron/expand button reveals a details panel beneath the row (inline `<tr>` with `colspan` trick, or a `<div>` below the row)
- Details panel shows: status select, notes textarea, statusLog entries, save button
- Keep it minimal — no modal/drawer needed at this stage

### Notes field

- Free-text `<textarea>` with no markdown rendering in v1 (render as plain text). Markdown stored, rendered in v2.
- "Save notes" updates the renewal record (does not append to statusLog — only status changes go in the log)

### Column addition to the table

Add a "Status" column to the renewals table (between "Owner" and any actions). The status chip in the collapsed row is click-to-expand. No need to add a whole new column for notes — notes live in the expanded section.

### Backward compatibility

`workbook.renewals` will be absent in workbooks saved before this story. Always read as `workbook.renewals || {}`. The `emptyWorkbook()` addition ensures new workbooks have the key.

### What Story 5.1 established (do not undo)

- `renewals-view.js` renders a read-only table of subscriptions with upcoming renewals
- Route `#/renewals` wired in `app.js`
- CSS section in `app.css`

This story ADDS to that component — it does not replace it. Read `renewals-view.js` before editing to understand the current table structure and prop patterns.

### Imports to add in renewals-view.js

```js
import { getAuthor } from '../../state/identity.js';
```
(Already imported in other views; `getAuthor()` for statusLog author field.)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No issues.

### Completion Notes List

`store.js`: Added `renewals: {}` to `emptyWorkbook()`. Added `RENEWAL_UPSERTED` reducer case — upserts the full renewal record by `subId` in `state.renewals`, reads as `state.renewals || {}` for backward compat.

`renewals-view.js`: Rewrote with `useState` for expand toggle (accordion, one row at a time). `RenewalRow` now renders 9 columns including a `StatusChip` and expand button. When expanded, a `<tr class="renewals__details-row">` with `colspan=9` renders the `DetailsPanel`. `DetailsPanel` has a `<select>` for status (dispatches `RENEWAL_UPSERTED` with a new `statusLog` entry on change) and a `<textarea>` for notes (shows "Save notes" button only when dirty, dispatches `RENEWAL_UPSERTED` on save). Status log shows the last 3 entries reversed. `getRecord()` helper returns the persisted record or an `emptyRenewalRecord()` default. Added `getAuthor` import. `documents: []` already included in `emptyRenewalRecord` ready for Story 5.3.

`app.css`: Status chip colour variants, expand button, details row and panel, status log — all included in the pre-written Renewals section.

### File List

- `cost-tracker/src/state/store.js` — `renewals: {}` added to emptyWorkbook; RENEWAL_UPSERTED case added
- `cost-tracker/src/components/renewals/renewals-view.js` — extended with expand, status select, notes textarea, status log
- `cost-tracker/public/css/app.css` — status chip variants, details row/panel, notes textarea (already written in Story 5.1 CSS block)

## Change Log

- 2026-05-14: Story created
- 2026-05-14: Implemented and marked review
