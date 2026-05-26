---
story_key: 4-7-subscriptions-view-grouped-by-type
status: ready-for-dev
epic: 4
story_number: 4.7
---

# Story 4.7: Subscriptions View — Grouped by Type

Status: done

## Story

As Angelus (driver),
I want the Subscriptions tab to show all subscriptions organised into three clear groups — Per IE, Bespoke, and Company — each showing cost context appropriate to that type,
So that I can see the full subscription landscape and toggle active status without needing to go to the Inventory tab.

## Acceptance Criteria

**Given** I navigate to `#/decisions` (Subscriptions),
**When** the page renders,
**Then** I see three visually distinct sections: **Per IE subscriptions**, **Bespoke subscriptions**, and **Company subscriptions** — each with a section heading showing the group's FY 26/27 total.

**And** each subscription row shows: vendor, product, cost-type-appropriate detail, FY 26/27 forecast cost, and an Active/Not active toggle — preserving the toggle behaviour from Story 4.3.

**And** the existing summary strip (status quo, architecture saving, toggle saving, adjusted total) is retained above the groups.

**And** adding or editing a subscription in the Inventory view (existing `SubscriptionForm`) now includes a **Subscription type** selector: Per IE / Bespoke / Company. The selected type determines which group the subscription appears in on this view.

**And** existing subscriptions without an explicit `subscription_type` field display in the correct group via backward-compat inference: `cohort_driven: true` → Per IE; `cohort_driven: false` → Company. Bespoke is never inferred — it must be explicitly set.

**And** the Inventory tab continues to work exactly as before (no changes to `inventory-view.js` other than adding the `subscription_type` field to `SubscriptionForm`).

## Tasks / Subtasks

- [x] Task 1: Add `subscription_type` to the subscription data model
  - [x] Valid values: `'cohort' | 'bespoke' | 'company'`
  - [x] Add to `SubscriptionForm` in `subscription-form.js`: a `<select>` with labels "Per IE (cohort-driven)", "Bespoke (individual)", "Company (fixed seats)"
  - [x] Update `workbook-seed.json`: set `subscription_type` on all 4 seeded subscriptions (M365 Basic → `'cohort'`, M365 Standard → `'company'`, HubSpot → `'cohort'`, Miro → `'cohort'`)
  - [x] `SUBSCRIPTION_SAVED` reducer in `store.js` already persists all subscription fields — no change needed there

- [x] Task 2: Add `inferSubType(sub)` helper to `decisions-view.js`
  - [x] Returns `sub.subscription_type` if set, else `sub.cohort_driven ? 'cohort' : 'company'`
  - [x] Used to partition subscriptions into the three groups

- [x] Task 3: Redesign `decisions-view.js` — three grouped sections
  - [x] Replace the flat `<table>` (single `SubToggleRow` list) with three `<SubscriptionGroup>` sections
  - [x] Each `<SubscriptionGroup>` receives: `title`, `subs[]`, and the group's FY 26/27 total in the heading
  - [x] Row columns (all three groups): Vendor + Product | Cost detail | FY 26/27 | Status toggle
  - [x] Cost detail column content differs by type — see Dev Notes
  - [x] If a group has no subscriptions, render a subtle "None" empty state rather than omitting the section entirely
  - [x] Preserve: existing summary strip, Active/Not active toggle dispatch, ClassificationBadge, Firm only filter, Decision log link

- [x] Task 4: CSS — Subscription group headings and type-appropriate row styling
  - [x] `.subs__group` section wrapper
  - [x] `.subs__group-title` heading with FY total inline
  - [x] `.subs__type-badge` small badge — grouping makes it redundant, omitted per story note
  - [x] Existing `.decisions__*` classes preserved for the summary strip

## Dev Notes

### What is NOT changing

- `inventory-view.js` — no changes except as a consumer of the updated `SubscriptionForm` (which gains the type selector)
- `store.js` reducer `SUBSCRIPTION_SAVED` — already spreads all subscription fields, no change needed
- `compute.js` `computeForecast` — signature and behaviour unchanged; called the same way
- Summary strip at the top of `DecisionsView` — all existing logic (statusQuoTotal, toggleSaving, archSaving, adjustedTotal, firmOnly filter) preserved verbatim
- `activeStatusKey(subId)` — unchanged
- Route `#/decisions`, component name `DecisionsView`, export — all unchanged

### Subscription type classification

```js
// Inference for backward compat (existing subscriptions without subscription_type)
function inferSubType(sub) {
  if (sub.subscription_type) return sub.subscription_type;
  return sub.cohort_driven ? 'cohort' : 'company';
}
```

Seed values to set:
| Sub ID | subscription_type |
|--------|------------------|
| sub-m365-basic | 'cohort' |
| sub-m365-standard | 'company' |
| sub-hubspot | 'cohort' |
| sub-miro | 'cohort' |

### Cost detail column — what to show per type

**Per IE (`cohort`):**
```
Attribution: 100%  ·  86 IEs  →  86 seats
AUD 10.10/seat
```
Use: `lookupValue(assumptions, sub.attribution_assumption_key, 1)` × `(headcount.apac + headcount.americas + headcount.emea)` from `monthlyHeadcountByRegion` for the current month. Show as "N seats at $X/seat". For HubSpot (special-cased in compute), show "Bundle + cohort additions".

**Bespoke:**
```
Cardholder: Angelus Morningstar
AUD 50.00/mo
```
Show `sub.cardholder` and unit cost formatted in the subscription's currency. Simple — just read `unit_cost_assumption_key`.

**Company (`company`):**
```
5 fixed seats
AUD 21.10/seat
```
Show `lookupValue(assumptions, sub.seat_count_assumption_key, 0)` seats and unit cost. If no `seat_count_assumption_key`, show just unit cost.

The cost detail column is informational only — it does NOT need to match exactly what `computeForecast` computes. It is a human-readable summary, not a recalculation.

### FY 26/27 column

Re-use the existing `fy2627Saving` calculation from `SubToggleRow` — sum `computeForecast(sub, ym, assumptions, scenario).value` over `FY_2627_MONTHS`. This is the same logic already in the current view, just moved to a new row component.

### Partitioning subscriptions into groups

```js
const allSubs = useMemo(
  () => Object.values(workbook.subscriptions || {}).filter(s => s.status !== 'archived'),
  [workbook.subscriptions],
);

const cohortSubs  = allSubs.filter(s => inferSubType(s) === 'cohort');
const bespokeSubs = allSubs.filter(s => inferSubType(s) === 'bespoke');
const companySubs = allSubs.filter(s => inferSubType(s) === 'company');
```

### SubscriptionForm changes (subscription-form.js)

Add a `<select>` for `subscription_type` near the top of the form (after vendor/product, before category). Default to `'cohort'` for new subscriptions.

```js
// Inside SubscriptionForm local state initialisation:
const [subType, setSubType] = useState(initial?.subscription_type ?? 'cohort');

// In the saved subscription object:
subscription_type: subType,
```

Labels in the select:
- `cohort` → "Per IE (scales with cohort headcount)"
- `bespoke` → "Bespoke (individual subscription)"
- `company` → "Company (fixed seats)"

### SubscriptionGroup component shape

```js
function SubscriptionGroup({ title, subs, groupTotal, assumptions, scenario, monthlyEntries, onToggle }) { ... }
```

The group renders:
1. A `<h2>` or section heading: `{title}` — `{fmt.aud(groupTotal)}` FY 26/27
2. A `<table>` with one `SubRow` per subscription
3. If `subs.length === 0`: a dim "None" row spanning all columns

### Technical stack reminders

- `const { html, useMemo, useState } = window.__WWCT__` — always from here
- `style=${{ ... }}` for inline styles
- `useWorkbook()` → `{ workbook, dispatch }`
- `lookupValue(assumptions, key, fallback)` from `../../state/assumptions.js`
- `computeForecast(sub, ym, assumptions, scenario)` from `../../state/compute.js`
- `FY_2627_MONTHS`, `ALL_MONTHS` from `../../state/compute.js`
- `monthlyHeadcountByRegion` from `../../state/cohort.js` — for cost detail display only
- `fmt.aud(n)`, `fmt.date(s)` from `../../shared/format.js`

### Files to read before implementing

1. `cost-tracker/src/components/decisions/decisions-view.js` — full replacement (preserve summary strip logic exactly)
2. `cost-tracker/src/components/inventory/subscription-form.js` — add subscription_type field
3. `cost-tracker/seed/workbook-seed.json` — add subscription_type to 4 existing subs

### Current DecisionsView summary strip — preserve verbatim

The following logic block must be kept unchanged in the redesigned view:

```js
const { statusQuoTotal, toggleSaving, archSaving, archClassification } = useMemo(() => {
  // ... iterates ALL subs (not per-group), computes FY 26/27 totals
  // ... computes arch saving from computeArchitectureMetrics
  // ... reads hubspot.arch.saving_classification
}, [subs, assumptions, scenario, monthlyEntries]);

const effectiveArchSaving = firmOnly ? (archClassification === 'firm' ? archSaving : 0) : archSaving;
const effectiveToggleSaving = firmOnly ? 0 : toggleSaving;
const adjustedTotal = statusQuoTotal - effectiveArchSaving - effectiveToggleSaving;
```

The summary strip renders above the groups and continues to show the overall totals.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Replaced flat `SubToggleRow` table with `SubscriptionGroup` + `SubRow` + `CostDetail` component tree
- `inferSubType` added as module-level helper; used for both partitioning and cost detail rendering
- `computeGroupTotal` added as module-level helper; memoized per group in DecisionsView
- Cost detail: cohort shows attribution % + seat count + unit cost; HubSpot special-cased to "Bundle + cohort additions"; bespoke shows cardholder + unit cost; company shows fixed seat count + unit cost
- `monthlyHeadcountByRegion` imported from `cohort.js` for live seat count in cohort detail column
- Summary strip logic preserved verbatim from original DecisionsView
- `.subs__type-badge` omitted — visual grouping makes per-row type badges redundant

### File List

- `cost-tracker/src/components/decisions/decisions-view.js` — major redesign (grouped sections)
- `cost-tracker/src/components/inventory/subscription-form.js` — add subscription_type select
- `cost-tracker/seed/workbook-seed.json` — add subscription_type to 4 seeded subscriptions
- `cost-tracker/public/css/app.css` — add `.subs__group*` styles

## Change Log

- 2026-05-14: Story created (out-of-band; extends Epic 4 as story 4.7)
- 2026-05-14: Story implemented — all tasks complete
