---
story_key: 4-6-savings-opportunity-register
status: review
epic: 4
story_number: 4.6
---

# Story 4.6: Savings Opportunity Register

## Story

As Angelus (driver),
I want a separate register of savings opportunities (proposed, validated, applied, declined),
So that I can track what we've considered cutting even when no toggle is in place yet.

## Acceptance Criteria

**Given** I navigate to `#/savings`,
**When** the view renders,
**Then** I see every recorded opportunity with title, description, estimated saving, classification (firm/indicative), status, owner, and related subscription.

**And** I can add a new opportunity via an inline form and transition its status (Proposed → Validated → Applied / Declined).

**And** Applied opportunities show a badge/link indicating the corresponding subscription toggle or HubSpot architecture selection.

## Tasks/Subtasks

- [x] Task 1: Add `opportunities: {}` to `emptyWorkbook()` in store.js; add `OPPORTUNITY_SAVED` and `OPPORTUNITY_STATUS_CHANGED` cases to reducer
- [x] Task 2: Create `cost-tracker/src/components/savings/savings-view.js` — list, inline add form, status transitions
- [x] Task 3: Wire `#/savings` route in `app.js`, add import; add "Savings" to nav-bar
- [x] Task 4: CSS for savings view in `app.css`

## Dev Notes

**Data model:**
```
opportunity = {
  id: uuid,
  title: string,
  description: string,
  estimatedSaving: number (AUD),
  classification: 'firm' | 'indicative',
  status: 'Proposed' | 'Validated' | 'Applied' | 'Declined',
  owner: string,
  relatedSubscriptionId: string | null,
  relatedArchitecture: 'F' | '1' | '2' | '3' | null,
  createdAt: ISO string,
}
```

**Status flow:** Proposed → Validated → Applied | Declined. Buttons: from Proposed: [Validate], [Decline]; from Validated: [Apply], [Decline]; from Applied/Declined: no transitions.

**Add form fields:** title (required), estimated saving (number, AUD), classification (select), description (textarea), owner (text, defaults to getAuthor()), related subscription (select from workbook subscriptions, optional), related architecture (select F/1/2/3, optional).

**Applied badge:** if relatedSubscriptionId set, show sub vendor+product; if relatedArchitecture set, show "Architecture X". These are informational only — no auto-linking to toggle state.

**Store pattern:** OPPORTUNITY_SAVED keyed by id on workbook.opportunities. OPPORTUNITY_STATUS_CHANGED updates status in place. Workbook persists via localStorage autosave (existing mechanism).

**Workbook loading compatibility:** existing saved workbooks won't have opportunities key — read as `workbook.opportunities || {}`.

## Dev Agent Record

### Debug Log

No issues.

### Completion Notes

store.js: `opportunities: {}` added to `emptyWorkbook()`. `OPPORTUNITY_SAVED` dispatches keyed by opp.id on `state.opportunities`. `OPPORTUNITY_STATUS_CHANGED` updates status in place. Both use `state.opportunities || {}` for backward compat with pre-story workbook files.

savings-view.js: `SavingsView` component renders page-header with count + "+ Add opportunity" toggle. Inline add form (2-col grid) appears on toggle — fields: title (required), estimated saving, classification select, owner, description textarea, related subscription select (from active subs), related architecture select (F/1/2/3). Submit dispatches `OPPORTUNITY_SAVED` with status='Proposed'. Opportunities sorted by status order (Proposed→Validated→Applied→Declined) then by createdAt desc. `OpportunityRow` renders all fields + status chip (coloured by status) + transition buttons. Applied/Declined rows show related subscription or architecture badge if set.

app.js: `SavingsView` imported, `#/savings` route added, route label added. nav-bar.js: "Savings" link added between "Decision log" and "Dashboard".

## File List

- `cost-tracker/src/state/store.js` — emptyWorkbook + reducer
- `cost-tracker/src/components/savings/savings-view.js` — NEW
- `cost-tracker/src/app.js` — route + import
- `cost-tracker/src/components/shell/nav-bar.js` — Savings link
- `cost-tracker/public/css/app.css` — savings view CSS

## ⚠️ Product Flag — Potentially Redundant

**Raised 2026-05-14 by Angelus:** The register may not add meaningful value over the existing Decisions view (toggle + architecture selection already captures the key decisions). Consider whether this view earns its nav slot before Epic 5 planning. Options: remove it, fold it into the Decisions view as a collapsible "opportunities" section, or keep and validate with users.

## Change Log

- 2026-05-14: Story created and implemented
- 2026-05-14: Flagged as potentially redundant — see Product Flag above
