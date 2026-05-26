---
story_key: 4-5-calculation-notes-firm-vs-indicative
status: review
epic: 4
story_number: 4.5
---

# Story 4.5: Calculation Notes (Firm vs Indicative)

## Story

As Bruce (Interim CFO) reviewing,
I want to distinguish firm savings (contract-based) from indicative savings (estimates),
So that the budget alignment conversation can rely on what's genuinely committed.

## Acceptance Criteria

**Given** any savings line is rendered in the Decisions summary,
**When** I view or hover it,
**Then** I see a badge labelling it Firm or Indicative, with the source as a tooltip.

**And** firm savings can be asserted by the user for architecture savings (e.g. "confirmed quote").

**And** toggle savings are always Indicative (forecast-based estimate, not a contract).

**And** the Decisions summary has a "Firm only" filter that, when active, counts only firm-classified savings in the adjusted total.

## Tasks/Subtasks

- [x] Task 1: Add `hubspot.arch.saving_classification` assumption (firm | indicative, default indicative); add "Mark as firm / indicative" inline toggle on the architecture saving row in decisions-view.js
- [x] Task 2: Add Firm/Indicative badge to summary rows; toggle saving row is always Indicative; add firm-only filter chip to summary header; update adjusted total computation to respect firm-only mode
- [x] Task 3: CSS for Firm/Indicative badges and firm-only filter chip

## Dev Notes

**Classification storage:** `hubspot.arch.saving_classification` assumption — value 'firm' or 'indicative'. Default 'indicative'. Use same Resolved-direct dispatch pattern as active_status and selected_architecture toggles.

**Firm-only filter:** Local `useState` in DecisionsView — `firmOnly` boolean. When true: architecture saving only counts if classification is 'firm'; toggle saving = 0 regardless. Adjusted total = statusQuo - (firmOnly ? (archClassification === 'firm' ? archSaving : 0) : archSaving + toggleSaving).

Wait — correct logic: 
- When firmOnly=false: adjusted = statusQuo - archSaving - toggleSaving
- When firmOnly=true: adjusted = statusQuo - (archClassification === 'firm' ? archSaving : 0)

**Badge tooltip:** Use HTML `title` attribute for hover — architecture saving: rationale from the assumption or default text; toggle saving: "Forecast-based estimates; not a confirmed contract".

**Architecture saving row inline action:** Small "Mark as firm" / "Mark as indicative" button right of the badge that dispatches ASSUMPTION_PROPOSED/SUPERSEDED for `hubspot.arch.saving_classification`.

**Toggle saving:** Never has a "Mark as firm" action — always Indicative. Architecture F selected = no architecture saving row classification needed (saving is 0).

## Dev Agent Record

### Debug Log

No issues.

### Completion Notes

`makeClassificationAssumption(value)` factory builds a Resolved assumption for `hubspot.arch.saving_classification` ('firm'|'indicative'). Same Resolved-direct dispatch pattern as prior toggles.

`ClassificationBadge` component renders a colour-coded chip (green=firm, amber=indicative) with a `title` tooltip explaining the classification. Rendered inline in `.decisions__summary-label` (now a flex row) alongside the "Mark as firm / Mark as indicative" ghost button.

Architecture saving row: shows badge + classify button only when `archSaving > 0` (no point classifying a zero saving). Toggle saving row: always shows Indicative badge, no classify action.

`firmOnly` is local `useState` — a "Firm only" button in the page-header toggles it. When active: `effectiveArchSaving = archClassification === 'firm' ? archSaving : 0`, `effectiveToggleSaving = 0`. Adjusted total label changes to "Adjusted FY 26/27 (firm only)". Rows where saving is excluded show "(excluded)" hint in muted italic.

## File List

- `cost-tracker/src/components/decisions/decisions-view.js` — classification badge, firm-only filter
- `cost-tracker/public/css/app.css` — badge and filter CSS

## Change Log

- 2026-05-14: Story created and implementation started
