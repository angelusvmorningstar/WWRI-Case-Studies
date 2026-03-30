# Story 2.5: Backup Export & Restore

Status: review

## Story

As a user,
I want to export a full backup of my data and restore from a previous backup,
so that I have a safety net if something goes wrong with my data.

## Acceptance Criteria

1. Export Backup button downloads complete app state as JSON file via `store.getAll()` (FR10, NFR18)
2. File name includes date stamp (e.g., wwri-backup-2026-03-30.json)
3. Restore button shows inline confirmation row with Confirm/Cancel (UX-DR15)
4. Confirmation auto-cancels after 5 seconds (UX-DR15)
5. Confirm restores data via `store.set()` per key (FR11)
6. Cancel returns to default state without changing data
7. Success/failure shown via feedback banners

## Tasks / Subtasks

- [x] Task 1: Implement export backup (AC: #1, #2)
- [x] Task 2: Implement restore with inline confirmation (AC: #3, #4, #5, #6)
- [x] Task 3: Wire feedback banners for restore (AC: #7)
- [x] Task 4: Validate file size (AC: all)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No issues encountered.

### Completion Notes List

- Export: getAll() → JSON.stringify → Blob → download link with date-stamped filename
- Restore: file input + danger button → inline confirm/cancel row with 5s auto-cancel timeout
- Confirm reads file via FileReader, JSON.parse, iterates keys with store.set()
- Success/failure feedback via existing addFeedbackBanner() + logImport()
- finance-controls.js now 467 lines (was 359). Approaching 500-line limit — next modification should consider splitting.

### Change Log

- 2026-03-30: Story 2.5 implemented — backup export and restore with inline confirmation

### File List

- public/js/finance/finance-controls.js (467 lines — modified: added backup/restore, imported getAll)
- public/css/finance/finance-controls.css (54 lines — modified: added backup-row layout)
