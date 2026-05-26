---
story_key: 5-3-document-attachments-for-renewal-events
status: review
epic: 5
story_number: 5.3
---

# Story 5.3: Document Attachments for Renewal Events

Status: ready-for-dev

## Story

As Angelus (driver),
I want to associate documents (contracts, vendor quotes, email threads) with a renewal,
So that the relevant artefacts are one click away during the negotiation.

## Acceptance Criteria

**Given** I am viewing a renewal,
**When** I add a document link,
**Then** the renewal record stores a URL plus a display label and an `attached_at` timestamp.

**And** clicking the link opens the document in a new tab.

**And** v1 supports SharePoint and OneDrive URLs (and any HTTPS URL); the app does not host or upload files.

## Tasks / Subtasks

- [x] Task 1: Extend the renewal data model to include a `documents` array
  - [x] Add `documents: []` to the renewal record shape (alongside `status`, `notes`, `statusLog`)
  - [x] Add `RENEWAL_DOCUMENT_ADDED` and `RENEWAL_DOCUMENT_REMOVED` reducer cases to `store.js`
  - [x] Backward compat: read as `renewal.documents || []`

- [x] Task 2: Add document management UI to the renewal expanded section in `renewals-view.js`
  - [x] "Add document" inline form: URL input + label input + submit button
  - [x] URL validation: must be non-empty and start with `https://` (warn but do not block on non-HTTPS for flexibility)
  - [x] Renders each document as a labelled link (`<a href target="_blank" rel="noopener noreferrer">`)
  - [x] "Remove" button per document dispatches `RENEWAL_DOCUMENT_REMOVED`

- [x] Task 3: CSS for document list and add-form in `app.css`
  - [x] `.renewals__documents` list
  - [x] `.renewals__doc-link` with external-link visual cue
  - [x] `.renewals__add-doc-form` inline form (compact, 2 inputs + submit in a row)

## Dev Notes

### Data model extension (building on Story 5.2)

Extend the renewal record shape from Story 5.2:

```js
// Full renewal record after Story 5.3:
{
  subId: string,
  status: 'pending' | 'prepared' | 'negotiated' | 'signed',
  notes: string,
  statusLog: [ { status, changedAt, author } ],
  documents: [                // NEW in Story 5.3
    {
      id: string,             // crypto.randomUUID()
      label: string,
      url: string,            // HTTPS URL
      attached_at: ISO string,
      attached_by: string,    // getAuthor() || 'Unknown'
    }
  ],
}
```

### Reducer additions

```js
case 'RENEWAL_DOCUMENT_ADDED': {
  const { subId, doc } = action.payload;
  const existing = (state.renewals || {})[subId] || { subId, status: 'pending', notes: '', statusLog: [], documents: [] };
  return {
    ...state,
    renewals: {
      ...(state.renewals || {}),
      [subId]: { ...existing, documents: [...(existing.documents || []), doc] },
    },
    updatedAt: new Date().toISOString(),
  };
}

case 'RENEWAL_DOCUMENT_REMOVED': {
  const { subId, docId } = action.payload;
  const existing = (state.renewals || {})[subId];
  if (!existing) return state;
  return {
    ...state,
    renewals: {
      ...(state.renewals || {}),
      [subId]: { ...existing, documents: (existing.documents || []).filter(d => d.id !== docId) },
    },
    updatedAt: new Date().toISOString(),
  };
}
```

### Add document form behaviour

- Two inputs side by side: "Label" (text, required) + "URL" (url input, required)
- Submit: validate both non-empty and URL starts with `https://`; if invalid, show inline error and do not dispatch
- On success: dispatch `RENEWAL_DOCUMENT_ADDED`, clear the form inputs
- No external API call — the app stores only the URL string, not the file contents

### Link rendering

```js
html`<a href=${doc.url} target="_blank" rel="noopener noreferrer" class="renewals__doc-link">
  ${doc.label}
</a>`
```

The `noopener noreferrer` is a security requirement (prevents the target page from accessing `window.opener`). Do not omit it.

### URL validation note

The PRD says "v1 supports SharePoint and OneDrive URLs (and any HTTPS URL)". Validate that the URL is non-empty and starts with `https://`. Do not use a complex URL regex — the browser will validate on click. Surface a clear error message if the user tries to add an HTTP (non-HTTPS) URL: "Only HTTPS URLs are supported."

### What Stories 5.1 and 5.2 established (do not undo)

- `renewals-view.js` renders a list of upcoming renewals with urgency flags, annual costs, and expandable details (status, notes from 5.2)
- `store.js` has `renewals: {}` in `emptyWorkbook()` and `RENEWAL_UPSERTED` action (from 5.2)
- Route `#/renewals` wired in `app.js`

This story ADDS the documents array and two new reducer cases. Read `store.js` and `renewals-view.js` before editing — do not replace 5.2's additions.

### No provenance markers needed

Document links are metadata/attachments, not numeric values backed by Assumptions. No `AssumptionMarker` needed in this component.

### CSS placement

Add to the existing `/* ── Renewals ──` section in `app.css` (established in 5.1). Do not create a separate file.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No issues.

### Completion Notes List

`store.js`: Added `RENEWAL_DOCUMENT_ADDED` — reads the existing renewal record (or empty default), appends the new `doc` to `documents[]`, upserts in `state.renewals`. Added `RENEWAL_DOCUMENT_REMOVED` — filters out the doc by `docId` from the existing record's `documents[]`. Both use `state.renewals || {}` and `existing.documents || []` for backward compat.

`renewals-view.js`: Added `DocumentList` component — renders each doc as `<a href target="_blank" rel="noopener noreferrer">` with label, metadata (attached_at date + attached_by), and a Remove button. Added `AddDocForm` component — two inputs (label text, URL) with inline validation (empty label, empty URL, non-https URL blocked with inline error). On valid submit, calls `onAdd` and clears the form. `DetailsPanel` now includes a "Documents" section beneath the Notes section. `RenewalRow` passes through `onDocAdd` and `onDocRemove` handlers. Main `RenewalsView` implements `handleDocAdd` (builds the full doc object with `crypto.randomUUID()`, attached_at, attached_by, dispatches `RENEWAL_DOCUMENT_ADDED`) and `handleDocRemove` (dispatches `RENEWAL_DOCUMENT_REMOVED`).

`app.css`: Document list, doc-link, doc-meta, add-doc-form — all already written in the Renewals CSS block during Story 5.1.

### File List

- `cost-tracker/src/state/store.js` — RENEWAL_DOCUMENT_ADDED and RENEWAL_DOCUMENT_REMOVED cases added
- `cost-tracker/src/components/renewals/renewals-view.js` — DocumentList, AddDocForm, document section in DetailsPanel
- `cost-tracker/public/css/app.css` — document CSS already in place from Story 5.1 block

## Change Log

- 2026-05-14: Story created
- 2026-05-14: Implemented and marked review
