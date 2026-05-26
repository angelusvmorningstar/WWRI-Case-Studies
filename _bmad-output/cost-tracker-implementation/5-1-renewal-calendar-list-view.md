---
story_key: 5-1-renewal-calendar-list-view
status: review
epic: 5
story_number: 5.1
---

# Story 5.1: Renewal Calendar List View

Status: ready-for-dev

## Story

As Angelus (driver),
I want every subscription renewal in the next twelve months sorted by date,
So that nothing surprises us and I can prepare in advance.

## Acceptance Criteria

**Given** the workbook contains renewal dates per subscription,
**When** I navigate to `#/renewals`,
**Then** I see every renewal happening in the next 12 months in date order.

**And** each row shows vendor, current annual cost (in AUD), current discount, expected new pricing, decision deadline, and owner.

**And** renewals within 30 / 60 / 90 days are visually flagged with a colour-coded urgency indicator.

**And** the HubSpot renewal (Oct 2026) is prominently surfaced as the most material event.

**And** if no subscriptions have a renewal date in the next 12 months, the view shows a friendly empty state.

## Tasks / Subtasks

- [x] Task 1: Create `cost-tracker/src/components/renewals/renewals-view.js` — list component
  - [x] Filter `workbook.subscriptions` to those with `renewal_date` within the next 12 months (non-archived)
  - [x] Sort by `renewal_date` ascending
  - [x] Compute `daysUntil` for urgency banding (≤30 / ≤60 / ≤90)
  - [x] Compute `annualCostAud` per subscription using `computeForecast` summed over next 12 months
  - [x] Render table with all required columns; HubSpot row gets a `--highlight` modifier

- [x] Task 2: Wire up the route in `app.js`
  - [x] Import `RenewalsView` from `./components/renewals/renewals-view.js`
  - [x] Replace the `'/renewals': 'Renewals'` entry in the `default` branch with a `case '/renewals': return html\`<${RenewalsView} />\``

- [x] Task 3: Add CSS for renewals view in `app.css`
  - [x] `.renewals` page wrapper, `.renewals__table` data table
  - [x] Urgency modifier classes: `.renewals__row--urgent` (≤30 days, red), `.renewals__row--warning` (≤60 days, amber), `.renewals__row--soon` (≤90 days, soft yellow)
  - [x] `.renewals__row--highlight` for HubSpot
  - [x] `.renewals__urgency-badge` chip for the days-until indicator

## Dev Notes

### Data sources and computation

**Subscriptions with renewal dates:** Read from `workbook.subscriptions` (top-level map, same as inventory/decisions views). Each subscription object has:
- `renewal_date`: ISO date string e.g. `"2026-10-31"`, or `null` if not set
- `vendor`, `product`, `cardholder` — display columns
- `id`, `currency`, `unit_cost_assumption_key`, `cohort_driven` — needed for cost computation
- `status` — filter out `'archived'` subscriptions

**12-month window:** Calculate today's date at render time (`new Date()`). Include renewals where `renewal_date >= today` and `renewal_date < today + 365 days`. Use pure date comparison (ISO string comparison works correctly for YYYY-MM-DD).

**Annual cost (AUD):** Sum `computeForecast(sub, ym, assumptions, scenario).value` over the 12 months starting from the renewal month (or today's month, whichever is closer to what we have). The simplest correct approach:
- Use `ALL_MONTHS` from `compute.js` and filter to the 12 months starting from the current month
- Sum the AUD forecast values for each of those months for that subscription
- This correctly picks up scenario-adjusted cohort-driven pricing

**Urgency banding** (computed from `daysUntil = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24))`):
- ≤ 30 days → `.renewals__row--urgent` (red)
- ≤ 60 days → `.renewals__row--warning` (amber)
- ≤ 90 days → `.renewals__row--soon` (yellow)
- > 90 days → no modifier

**HubSpot highlight:** Check `sub.id === 'sub-hubspot'` OR `sub.vendor === 'HubSpot'`. Apply `.renewals__row--highlight` on top of any urgency modifier (both classes together).

**Discount column:** The PRD says "current discount". For HubSpot this is the `hubspot.discount_rate` assumption (default 40%). For other subscriptions there is no discount assumption in v1 — render `—` for those rows. Use `lookupValue(assumptions, 'hubspot.discount_rate', 0.40)` for HubSpot; others: `null`.

**Expected new pricing column:** PRD says "expected new pricing". For HubSpot this is the `subscription.hubspot.renewal_monthly_aud` assumption × 12 (using `lookupValue`). For all other subscriptions, there is no "expected new" in v1 — render `—`.

**Decision deadline column:** PRD says "decision deadline". No explicit field exists in the subscription model for v1. Derive it as 30 days before `renewal_date`. Format with `fmt.date()`.

**Owner column:** Maps to `subscription.cardholder`. Display as-is.

### Route change in app.js

Currently `app.js` has `/renewals` falling through to the `default` case:
```js
default: {
  const routes = {
    '/renewals':  'Renewals',
  };
  return html`<${PagePlaceholder} name=${routes[path] || path} />`;
}
```
Replace by adding a `case '/renewals':` to the `RouteContent` switch before `default`, matching the pattern of every other route.

### Component structure

```
cost-tracker/src/components/renewals/
└── renewals-view.js          ← NEW — RenewalsView component
```

No sub-components needed for 5.1; a single file is sufficient. Stories 5.2 and 5.3 will add to this folder.

### CSS pattern

Follow the same pattern as other views (decisions-view, savings-view, etc.):
- Add a `/* ── Renewals ──` section to `cost-tracker/public/css/app.css`
- Use `.renewals` as the top-level BEM block
- Table: reuse the existing `.data-table` class for the `<table>` element, add `.renewals__table` for table-specific overrides

### Imports needed in renewals-view.js

```js
const { html, useMemo } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { computeForecast, ALL_MONTHS, activeStatusKey } from '../../state/compute.js';
import { lookupValue } from '../../state/assumptions.js';
import { fmt } from '../../shared/format.js';
```

### What NOT to add in this story

- No `renewals` map on `emptyWorkbook()` — that is needed for 5.2 (status field) and 5.3 (document links), not for this read-only display story
- No RENEWAL_* actions on the reducer — ditto
- No edit/status controls — that is 5.2
- No document attachment UI — that is 5.3
- No provenance markers — renewals are derived display values, not directly Assumption-backed numeric cells; the underlying subscription cost values carry provenance already

### Seed data verification

With the seed workbook (`seed/workbook-seed.json`) loaded, from today (2026-05-14):
- `sub-hubspot` → renewal 2026-10-31 (170 days → ≤180 days, no urgency flag)
- `sub-miro` → renewal 2026-11-30 (200 days → no urgency flag)
- `sub-m365-basic` → renewal 2027-01-31 (262 days → no urgency flag)
- `sub-m365-standard` → renewal 2027-01-31 (262 days → no urgency flag)

All four fall within 365 days. HubSpot should be highlighted regardless of urgency.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No issues.

### Completion Notes List

`renewals-view.js`: `RenewalsView` reads `workbook.subscriptions`, filters to non-archived subs with `renewal_date` in the next 365 days, maps each to an item object computing `daysUntil`, `urgencyBand`, `annualCostAud` (summing `computeForecast()` over the 12 months from today via `ALL_MONTHS`), HubSpot discount/expected-new-pricing from assumptions, and decision deadline (30 days before renewal). Sorted ascending by `renewal_date`. `UrgencyBadge` chip renders inline in the date cell. HubSpot row gets both `--highlight` class and a "Key renewal" badge. Empty states for no-workbook and no-upcoming-renewals.

`app.js`: Added `import { RenewalsView }` and `case '/renewals'` in the `RouteContent` switch. Removed the now-unused `routes` object from the default branch.

`app.css`: New `/* ── Renewals ──` section with row urgency modifiers (urgent/warning/soon), highlight row for HubSpot, urgency badges, column widths, and pre-written sections for Story 5.2 (status/notes) and 5.3 (documents) CSS.

### File List

- `cost-tracker/src/components/renewals/renewals-view.js` — NEW
- `cost-tracker/src/app.js` — added RenewalsView import and `/renewals` case
- `cost-tracker/public/css/app.css` — Renewals section added before Utility

## Change Log

- 2026-05-14: Story created
- 2026-05-14: Implemented and marked review
