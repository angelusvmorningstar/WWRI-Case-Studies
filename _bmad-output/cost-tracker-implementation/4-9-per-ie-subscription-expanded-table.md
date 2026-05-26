---
story_key: 4-9-per-ie-subscription-expanded-table
status: review
epic: 4
story_number: 4.9
---

# Story 4.9: Per IE Subscription Expanded Table with Inline Rate Editing

Status: review

## Story

As Angelus (driver),
I want the Per IE subscriptions group to show each subscription's demand rate, estimated seats per cohort, and unit cost as explicit editable/readable columns — with the demand rate directly editable inline,
So that I can adjust what percentage of new intake IEs receive each subscription without leaving the Subscriptions view.

## Acceptance Criteria

**Given** I navigate to `#/decisions` (Subscriptions),
**When** the Per IE subscriptions group renders,
**Then** the table has six columns: **Subscription**, **% of Cohort** (editable input), **~Seats/Cohort** (computed), **Unit Cost**, **FY 26/27**, **Status**.

**And** the **% of Cohort** column shows a number input pre-filled with the current demand rate as a whole percentage (e.g. `100`, `33`, `50`) followed by a `%` label.

**And** the **~Seats/Cohort** column shows `~N` where N = `Math.round(demandRate × avgCohortSize)`.

**And** the **Unit Cost** column shows `{currency} {unitCost.toFixed(2)}/seat`.

**And** the **FY 26/27** column shows the same computed annual total as before (no change to `computeForecast` logic).

**And** when I type a new value into the % of Cohort input and press Enter or blur the field, the demand rate assumption for that subscription is created or superseded — same dispatch pattern as the active-status toggle.

**And** after committing, the ~Seats/Cohort and FY 26/27 columns update to reflect the new rate.

**And** the Company and Bespoke subscription groups are visually unchanged (still use the old 4-column layout with Cost Detail column).

## Tasks / Subtasks

- [x] Task 1: Add `makeAttributionAssumption` helper in `decisions-view.js`
  - [x] Follow exact shape of `makeActiveStatusAssumption` — same fields, same dispatch pattern
  - [x] `key` = `sub.attribution_assumption_key`
  - [x] `value` = `pct / 100` (store as decimal, same as existing assumptions)
  - [x] `label` = `` `${sub.vendor} ${sub.product} — demand rate` ``
  - [x] `unit` = `'%'`, `category` = `'Subscription cost'`
  - [x] `rationale` = `` `Demand rate set to ${pct}% via Subscriptions view.` ``
  - [x] `source` = `'Subscriptions view'`, `confidence` = `'high'`, `status` = `STATUS.RESOLVED`
  - [x] `applies_to` = `[sub.id]`, `tags` = `['demand-rate', 'subscription']`

- [x] Task 2: Add `CohortSubRow` component
  - [x] Props: `{ sub, assumptions, scenario, monthlyEntries, avgCohortSize, onToggle, onRateChange }`
  - [x] Derive: `isActive`, `demandRate`, `unitCost`, `seatsPerCohort`, `demandPct`, `fy2627Total` (same useMemo as `SubRow`)
  - [x] % of Cohort cell: uncontrolled `<input type="number">` with `key=${demandPct}` (resets on assumption update), `defaultValue=${demandPct}`, `min=0`, `max=100`, class `decisions__rate-input`
  - [x] On blur: clamp input to [0,100], call `onRateChange(sub, pct)` only if pct differs from current `demandPct`
  - [x] On keydown Enter: `e.target.blur()` (triggers blur handler)
  - [x] ~Seats/Cohort cell: `~${seatsPerCohort}`, class `decisions__seats-cell`
  - [x] Unit Cost cell: `${sub.currency} ${unitCost.toFixed(2)}/seat`, class `decisions__unitcost-cell`
  - [x] FY 26/27 and Status cells: identical to `SubRow`

- [x] Task 3: Add `CohortSubscriptionGroup` component
  - [x] Props: `{ title, subs, groupTotal, assumptions, scenario, monthlyEntries, avgCohortSize, onToggle, onRateChange }`
  - [x] Table class: `data-table decisions__table decisions__table--cohort`
  - [x] Six `<th>` columns: Subscription / % of Cohort / ~Seats/Cohort / Unit Cost / FY 26/27 / Status
  - [x] Empty state: `colspan="6"`
  - [x] Renders `CohortSubRow` per subscription, passing all props through

- [x] Task 4: Add `handleRateChange` in `DecisionsView` and wire up
  - [x] `handleRateChange(sub, pct)` creates/supersedes the attribution assumption using `makeAttributionAssumption(sub, pct)` — identical flow to `handleToggle`
  - [x] Replace the `<${SubscriptionGroup} title="Per IE subscriptions" ...>` render with `<${CohortSubscriptionGroup} ... onRateChange=${handleRateChange} />`
  - [x] Keep `SubscriptionGroup` renders for Bespoke and Company groups unchanged

- [x] Task 5: Add CSS to `app.css`
  - [x] `.decisions__table--cohort .decisions__sub-col` — width `35%` (override from 50%)
  - [x] `.decisions__rate-col` — width `9%`, text-align right
  - [x] `.decisions__seats-col` — width `12%`, text-align right
  - [x] `.decisions__unitcost-col` — width `14%`
  - [x] `.decisions__rate-cell` — text-align right, padding matches `decisions__saving-cell`, display flex, align-items center, justify-content flex-end, gap var(--space-1)
  - [x] `.decisions__rate-input` — width `3.5rem`, text-align right, font-size var(--font-size-sm), padding var(--space-1) var(--space-2), border 1px solid var(--color-border), border-radius var(--radius-sm), background var(--color-surface)
  - [x] `.decisions__rate-pct` — font-size var(--font-size-sm), color var(--color-text-secondary)
  - [x] `.decisions__seats-cell` — text-align right, padding matches `decisions__saving-cell`, font-size var(--font-size-sm), color var(--color-text-secondary), font-variant-numeric tabular-nums
  - [x] `.decisions__unitcost-cell` — padding matches `decisions__saving-cell`, font-size var(--font-size-sm), color var(--color-text-secondary)

## Dev Notes

### Files to modify

1. `cost-tracker/src/components/decisions/decisions-view.js` — new helper, two new components, one new handler, swap render for cohort group
2. `cost-tracker/public/css/app.css` — new classes appended to the decisions/subs section (~line 1886, after `.subs__empty`)

### What is NOT changing

- `computeForecast`, `compute.js` — no changes
- `assumptions.js`, `store.js`, `cohort.js` — no changes
- `workbook-seed.json` — no changes
- `SubRow` and `SubscriptionGroup` components — kept exactly as-is (used by Company and Bespoke groups)
- `CostDetail` component — kept as-is (cohort branch becomes dead code but leave it; don't delete)
- `avgCohortSize` derivation in `DecisionsView` — no changes
- The summary strip (statusQuoTotal, toggleSaving, archSaving) — no changes

### Assumption dispatch pattern (copy from handleToggle)

```js
function handleRateChange(sub, pct) {
  const newAssumption = makeAttributionAssumption(sub, pct);
  const existing = lookupAssumption(assumptions, sub.attribution_assumption_key);
  if (existing) {
    const payload = buildSupersessionPayload(assumptions, newAssumption);
    if (payload) {
      dispatch({ type: 'ASSUMPTION_SUPERSEDED', payload });
    } else {
      dispatch({ type: 'ASSUMPTION_PROPOSED', payload: newAssumption });
    }
  } else {
    dispatch({ type: 'ASSUMPTION_PROPOSED', payload: newAssumption });
  }
}
```

### Uncontrolled input reset pattern

Using `key=${demandPct}` on the input causes Preact/HTM to recreate the DOM element (and reset the displayed value) whenever `demandPct` changes — i.e. after a committed assumption update. This avoids controlled-input complexity while still keeping the display in sync after a save.

```js
const demandPct = Math.round(demandRate * 100);

html`<input
  key=${demandPct}
  type="number"
  class="decisions__rate-input"
  defaultValue=${demandPct}
  min=0
  max=100
  onBlur=${e => {
    const pct = Math.min(100, Math.max(0, Number(e.target.value) || 0));
    if (pct !== demandPct) onRateChange(sub, pct);
  }}
  onKeyDown=${e => { if (e.key === 'Enter') e.target.blur(); }}
/>`
```

### Technical stack reminders

- `const { html, useMemo, useState } = window.__WWCT__` — always from here
- `style=${{ ... }}` for inline styles (object, not string)
- `lookupValue(assumptions, key, fallback)` from `../../state/assumptions.js`
- `lookupAssumption(assumptions, key)` — finds the live assumption object
- `buildSupersessionPayload(assumptions, newAssumption)` — returns payload or null
- `STATUS.RESOLVED` — correct status for decisions made via UI
- `fmt.aud(n)` from `../../shared/format.js`
- `activeStatusKey(sub.id)` from `../../state/compute.js`
- `FY_2627_MONTHS` from `../../state/compute.js`
- `computeForecast(sub, ym, assumptions, scenario)` from `../../state/compute.js`

### CSS variable reference (from existing decisions styles)

- `var(--space-1)` through `var(--space-6)` for spacing
- `var(--font-size-xs)`, `var(--font-size-sm)`, `var(--font-size-base)`
- `var(--font-weight-medium)`
- `var(--color-text)`, `var(--color-text-secondary)`, `var(--color-text-muted)`
- `var(--color-border)`, `var(--color-surface)`
- `var(--radius-sm)`
- `var(--font-variant-numeric: tabular-nums)` — already used on `.decisions__saving-cell`

### Existing column widths to preserve

Current 4-column `SubscriptionGroup` (company/bespoke):
- `.decisions__sub-col` = 50%
- `.decisions__saving-col`, `.decisions__toggle-col` = 25% each

New 6-column `CohortSubscriptionGroup` — must NOT affect the above. Use `.decisions__table--cohort .decisions__sub-col` override to narrow the subscription column only for cohort tables.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Added `makeAttributionAssumption(sub, pct)` — stores value as pct/100 decimal, same shape as makeActiveStatusAssumption.
- `CohortSubRow` uses uncontrolled input with `key=${demandPct}` so it resets to the committed value after a dispatch without needing controlled-input state.
- Blur handler clamps to [0,100] and only dispatches if the value differs from current, preventing spurious assumption writes.
- `CohortSubscriptionGroup` uses `decisions__table--cohort` modifier class so the sub-col width override applies only to the cohort table, leaving company/bespoke tables at their existing 50% width.
- Added focus ring on `.decisions__rate-input:focus` for accessibility.
- `SubRow`, `SubscriptionGroup`, and `CostDetail` untouched — company/bespoke groups unchanged.

### File List

- `cost-tracker/src/components/decisions/decisions-view.js`
- `cost-tracker/public/css/app.css`

## Change Log

- 2026-05-14: Story created — extends Epic 4 as story 4.9, follows 4.8 and user request to make demand rate editable inline
- 2026-05-14: Implemented — CohortSubRow, CohortSubscriptionGroup, makeAttributionAssumption, handleRateChange, CSS for 6-column layout
