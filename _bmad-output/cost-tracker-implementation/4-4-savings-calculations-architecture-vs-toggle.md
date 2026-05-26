---
story_key: 4-4-savings-calculations-architecture-vs-toggle
status: review
epic: 4
story_number: 4.4
---

# Story 4.4: Savings Calculations — Architecture vs Toggle

## Story

As Nicolette (approver) reading the board pack,
I want architecture savings and toggle savings shown separately,
So that I can see what comes from negotiation vs what comes from cuts.

## Acceptance Criteria

**Given** an active HubSpot architecture is selected AND some subscriptions are toggled Not active,
**When** viewing the Decisions summary,
**Then** I see: status quo FY 26/7 forecast, identified architecture saving, identified toggle saving, adjusted FY 26/7 forecast — all as separate lines.

**And** architecture saving and toggle saving are computed independently and displayed separately.

**And** changing the architecture selection updates the architecture saving line without affecting the toggle saving line.

## Tasks/Subtasks

- [x] Task 1: Add "Select" button to each ArchCard in `hubspot-arch-view.js`; store selection as `hubspot.selected_architecture` assumption (Resolved, direct)
- [x] Task 2: Update `decisions-view.js` summary to add architecture saving row between status quo and toggle saving; import `computeArchitectureMetrics`
- [x] Task 3: CSS for selected state on arch card and new summary row style

## Dev Notes

**Architecture saving key:** `hubspot.selected_architecture` — value is arch id string ('F', '1', '2', '3'). Default 'F' (no saving).

**Saving formula:** architectures.find(F).yearOneTotal − architectures.find(selected).yearOneTotal. If F is selected, saving = 0.

**Dispatch pattern:** Same as active_status toggle — build Resolved assumption directly, dispatch ASSUMPTION_SUPERSEDED if key exists, ASSUMPTION_PROPOSED otherwise.

**Discount in Decisions view:** Use resolved `hubspot.discount_rate` assumption (no slider override) — the Decisions view shows committed numbers, not what-if modelling.

**ArchCard selection UX:** Add a "Select" button below the metrics. When selected, button becomes "Selected ✓" (or similar). The selected card should have a distinct border/background (different from the "Current / Architecture F" highlight).

**Summary panel order:** Status quo → Architecture saving → Toggle saving → Adjusted FY 26/27.

## Dev Agent Record

### Debug Log

No issues.

### Completion Notes

hubspot-arch-view.js: added `makeSelectedArchAssumption` factory (same Resolved-direct pattern as active_status toggle), `handleSelectArch` dispatcher (ASSUMPTION_SUPERSEDED if key exists, ASSUMPTION_PROPOSED otherwise), `selectedArchId` read from assumptions with default 'F'. ArchCard now accepts `isSelected` and `onSelect` props — renders "Selected ✓" / "Select" button at bottom of card, and `.hubspot-arch__col--selected` + `.hubspot-arch__badge--selected` (green) modifiers when selected.

decisions-view.js: imported `computeArchitectureMetrics` from hubspot-arch-compute. Summary `useMemo` now also computes `archSaving` — reads `hubspot.selected_architecture`, calls `computeArchitectureMetrics` with resolved discount (no override), takes `archF.yearOneTotal − selectedArch.yearOneTotal` clamped to ≥0. Summary panel now has 4 rows: status quo → architecture saving → toggle saving → adjusted FY 26/27. Adjusted total = statusQuo − archSaving − toggleSaving.

## File List

- `cost-tracker/src/components/hubspot-arch/hubspot-arch-view.js` — add selection
- `cost-tracker/src/components/decisions/decisions-view.js` — add arch saving row
- `cost-tracker/public/css/app.css` — selected card style + summary row style

## Change Log

- 2026-05-14: Story created and implementation started
