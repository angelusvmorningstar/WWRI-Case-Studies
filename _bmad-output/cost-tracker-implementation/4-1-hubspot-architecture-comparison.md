---
story_key: 4-1-hubspot-architecture-comparison
status: review
epic: 4
story_number: 4.1
---

# Story 4.1: HubSpot architecture comparison with composition strings

## Story

As Niel (strategic contributor),
I want a comparison of four HubSpot architecture options for the renewal negotiation,
So that I walk into the October 2026 call with quantified alternatives.

## Acceptance Criteria

**Given** I navigate to `#/hubspot`,
**When** the comparison renders,
**Then** I see four columns: F (status quo), 1 (Sales Hub Starter only), 2 (Mixed Pro and Core), 3 (Full Sales Hub Pro).

**And** each column shows:
- Bundle annualised cost (at the currently modelled discount rate)
- Cohort seat cost FY 26/27 (total additional seats across CH18–CH20 active months)
- Onboarding fee (AUD 0 for F and Arch 1; AUD 1,500 for Arch 2 and 3)
- Total Year 1 cost (bundle annualised + cohort seat cost + onboarding fee)
- Saving versus F (F total minus this architecture's total; shows 0 for column F itself)

**And** each column shows a dynamic composition string describing the seat plan at full year, e.g.:
- F: "5 Hub seats + 7 Pro Core seats (12 total) · AUD 80/seat/mo list · AUD 1,836/mo list"
- 1: "7 Sales Hub Starter Core seats · AUD 20/seat/mo list"
- 2: "1 Sales Pro seat + 6 Pro Core seats · AUD 100 + AUD 50/seat/mo list · AUD 1,500 onboarding"
- 3: "7 Sales Pro seats · AUD 100/seat/mo list · AUD 1,500 onboarding"

**And** all architecture pricing numbers are backed by Assumptions (the story adds new assumption entries to the seed).

**And** Architecture F's column is visually distinguished as "current" (e.g. highlighted header or "Current" badge).

**And** if no workbook is loaded, I see the empty-state message "Load a workbook to view HubSpot architectures."

## Tasks/Subtasks

- [x] Task 1: Add new HubSpot architecture assumptions to the seed workbook
  - [x] Add `hubspot.discount_rate` → 0.40 (fraction, will become interactive in Story 4.2)
  - [x] Add `hubspot.arch.f.bundle_list_monthly_aud` → 1836 (Arch F list price before discount)
  - [x] Add `hubspot.arch.f.core_seat_list_price_aud` → 80 (Pro Core seat list price)
  - [x] Add `hubspot.arch.f.base_seat_count` → 12
  - [x] Add `hubspot.arch.1.seat_list_price_aud` → 20 (Sales Hub Starter Core)
  - [x] Add `hubspot.arch.1.base_seat_count` → 7
  - [x] Add `hubspot.arch.2.pro_seat_list_price_aud` → 100 (Sales Pro seat)
  - [x] Add `hubspot.arch.2.core_seat_list_price_aud` → 50 (Pro Core seat)
  - [x] Add `hubspot.arch.2.pro_seat_count` → 1
  - [x] Add `hubspot.arch.2.core_seat_count` → 6
  - [x] Add `hubspot.arch.3.pro_seat_list_price_aud` → 100 (Sales Pro seat)
  - [x] Add `hubspot.arch.3.pro_seat_count` → 7
  - [x] Add `hubspot.arch.onboarding_fee_aud` → 1500 (applies to Arch 2 and 3)
  - [x] All new assumptions: status Resolved, category "HubSpot", confidence "medium", author "Angelus"
- [x] Task 2: Create `src/components/hubspot-arch/hubspot-arch-compute.js`
  - [x] Export `computeArchitectureMetrics(assumptions, scenario)` — pure function, no React
  - [x] Returns array of 4 architecture objects with: `{ id, label, bundleAnnual, cohortSeatCost, onboardingFee, yearOneTotal, savingVsF, compositionString }`
  - [x] Reads all pricing from `lookupValue(assumptions, key, fallback)` — never hardcode numbers
  - [x] Discount rate from `lookupValue(assumptions, 'hubspot.discount_rate', 0.40)`
  - [x] Cohort seat computation: for each of ch18/ch19/ch20, count months active within FY 26/27 (Jul 2026 – Jun 2027), multiply by `seatsPerCohort` (from scenario assumption) and per-seat discounted rate for that architecture
  - [x] Cohort start months from existing assumptions: `cohort.timing.hubspot.ch18.start_month`, `cohort.timing.hubspot.ch19.start_month`, `cohort.timing.hubspot.ch20.start_month`
  - [x] Seats per cohort from scenario: `scenario.<scenarioRoot>.hubspot_seats_per_cohort` (use same scenarioRoot logic as `compute.js`)
  - [x] Saving vs F = Architecture F Year 1 total minus this architecture's Year 1 total (negative = more expensive than F)
  - [x] Composition string built from assumption values, not from raw numbers
- [x] Task 3: Create `src/components/hubspot-arch/hubspot-arch-view.js`
  - [x] Reads `workbook.assumptions`, `workbook.scenarios`, `workbook.activeScenarioId` via `useWorkbook()`
  - [x] Calls `computeArchitectureMetrics(assumptions, scenario)` inside `useMemo`
  - [x] Renders four-column comparison table (see layout notes in Dev Notes)
  - [x] Column F has a "Current" badge or highlighted header
  - [x] Each column shows: composition string (top), bundle annualised, cohort seat cost, onboarding fee, total Year 1, saving vs F
  - [x] Currency values formatted with `fmt.aud()` from `../../shared/format.js`
  - [x] Saving vs F formatted as a positive saving (green) or negative (red/warning) — Arch F shows "—"
  - [x] Empty state if no subscriptions loaded
  - [x] Page header matching other views (`.page-header` + `.page-header__title`)
- [x] Task 4: Wire route in `src/app.js`
  - [x] Import `HubSpotArchView` from `./components/hubspot-arch/hubspot-arch-view.js`
  - [x] Add `case '/hubspot': return html\`<${HubSpotArchView} />\`` in `RouteContent` switch (replacing the PagePlaceholder fallback currently used)
- [x] Task 5: CSS for HubSpot arch view in `public/css/app.css`
  - [x] `.hubspot-arch` — page wrapper, standard padding
  - [x] `.hubspot-arch__grid` — four-column grid layout, responsive (stacks to 1 column on narrow viewports)
  - [x] `.hubspot-arch__col` — individual architecture column card (white background, border-radius, border 1px var(--color-border))
  - [x] `.hubspot-arch__col--current` — highlighted variant for Architecture F (teal left border or background tint)
  - [x] `.hubspot-arch__col-header` — architecture name + "Current" badge if applicable
  - [x] `.hubspot-arch__composition` — italic, colour-text-secondary, font-size-sm, margin-bottom
  - [x] `.hubspot-arch__metric` — flex row between label and value, border-bottom on all but last
  - [x] `.hubspot-arch__metric--total` — bold, larger font-size for Year 1 total row
  - [x] `.hubspot-arch__saving--positive` — green saving (var(--color-success) or #388e3c)
  - [x] `.hubspot-arch__saving--negative` — red (more expensive than F)

## Dev Notes

### Routing — no new route registration needed

`app.js` already has `case '/hubspot'` in `RouteContent` (line 32) but it falls through to the default `PagePlaceholder` branch. Replace it with `return html\`<${HubSpotArchView} />\``. The nav link already exists in `nav-bar.js`.

### Assumption key namespace

All new assumptions use the `hubspot.arch.*` namespace, distinct from `subscription.hubspot.*` (which drives the cost register computation). This separation is intentional — the arch view is a negotiation modelling tool, not a live cost register feed. The two views use different compute paths.

Existing assumption keys that this story READS (do not change these):
- `subscription.hubspot.bundle_monthly_aud` — 918 (current locked rate, not used in arch compute)
- `subscription.hubspot.renewal_monthly_aud` — 1,101.60 (Arch F renewal at 40%)
- `cohort.timing.hubspot.ch18.start_month` — 2026-12
- `cohort.timing.hubspot.ch19.start_month` — 2027-01
- `cohort.timing.hubspot.ch20.start_month` — 2027-05
- `scenario.<scenarioRoot>.hubspot_seats_per_cohort` — 5 (primary target)

### computeArchitectureMetrics algorithm

```
discount = lookupValue(assumptions, 'hubspot.discount_rate', 0.40)

// Arch F
fListMonthly = lookupValue(assumptions, 'hubspot.arch.f.bundle_list_monthly_aud', 1836)
fBundleAnnual = fListMonthly * (1 - discount) * 12
fCoreSeatList = lookupValue(assumptions, 'hubspot.arch.f.core_seat_list_price_aud', 80)
fCohortRate = fCoreSeatList * (1 - discount)

// Arch 1
a1SeatList = lookupValue(assumptions, 'hubspot.arch.1.seat_list_price_aud', 20)
a1SeatCount = lookupValue(assumptions, 'hubspot.arch.1.base_seat_count', 7)
a1BundleAnnual = a1SeatList * (1 - discount) * a1SeatCount * 12
a1CohortRate = a1SeatList * (1 - discount)

// Arch 2
a2ProList = lookupValue(assumptions, 'hubspot.arch.2.pro_seat_list_price_aud', 100)
a2CoreList = lookupValue(assumptions, 'hubspot.arch.2.core_seat_list_price_aud', 50)
a2ProCount = lookupValue(assumptions, 'hubspot.arch.2.pro_seat_count', 1)
a2CoreCount = lookupValue(assumptions, 'hubspot.arch.2.core_seat_count', 6)
a2BundleAnnual = (a2ProList * a2ProCount + a2CoreList * a2CoreCount) * (1 - discount) * 12
a2CohortRate = a2CoreList * (1 - discount)

// Arch 3
a3ProList = lookupValue(assumptions, 'hubspot.arch.3.pro_seat_list_price_aud', 100)
a3ProCount = lookupValue(assumptions, 'hubspot.arch.3.pro_seat_count', 7)
a3BundleAnnual = a3ProList * (1 - discount) * a3ProCount * 12
a3CohortRate = a3ProList * (1 - discount)

// Cohort seat cost (shared pattern, varies by cohort rate)
onboardingFee = lookupValue(assumptions, 'hubspot.arch.onboarding_fee_aud', 1500)
seatsPerCohort = lookupValue(assumptions, `scenario.${scenarioRoot}.hubspot_seats_per_cohort`, 5)

FY2627 = all months 2026-07 through 2027-06

cohortSeatCost(cohortRate) =
  for each cohort in [ch18, ch19, ch20]:
    startMonth = lookupValue(assumptions, `cohort.timing.hubspot.${cohort}.start_month`, null)
    activeMonths = count of FY2627 months where month >= startMonth (or 0 if startMonth null)
    cost += activeMonths * seatsPerCohort * cohortRate
  return total

// Year 1 total = bundleAnnual + cohortSeatCost + onboardingFee (0 for F and 1)
// Saving vs F = F yearOneTotal - this yearOneTotal
```

### scenarioRoot derivation (same as compute.js)

```js
const scenarioRoot = scenario
  ? scenario.id.replace('scenario-', '').replace(/-/g, '_')
  : 'primary_target';
```

The `scenario` object is `workbook.scenarios?.[workbook.activeScenarioId] ?? null`.

### FY 26/27 months

Import `FY_2627_MONTHS` from `../../state/compute.js`. This is the array of 12 YYYY-MM strings from 2026-07 to 2027-06. Use it to count active months per cohort.

### Composition string format

Build from assumption values looked up at render time — do not hardcode seat counts or prices into the string. Example for Arch F:

```js
const fCount = lookupValue(assumptions, 'hubspot.arch.f.base_seat_count', 12);
const fList = lookupValue(assumptions, 'hubspot.arch.f.core_seat_list_price_aud', 80);
`5 Hub seats + ${fCount - 5} Pro Core seats (${fCount} total) · AUD ${fList}/seat/mo list`
```

The "5 Hub seats" is fixed (one per Hub product — Marketing, Sales, Service, Content, Data) and could itself be an assumption, but for v1 hardcoding `5` in the composition string label is acceptable since it's a fact of the HubSpot product structure, not a business decision.

### Table layout

Use CSS grid (not an HTML `<table>`) for the four-column layout. Each column is an independent card so it can stack on narrow viewports. Metric rows within each card use flex row between label and value.

Suggested column structure:

```
[Architecture header + "Current" badge if F]
[Composition string — italic description]
---
Bundle annualised    AUD X,XXX
Cohort seat cost     AUD X,XXX
Onboarding fee       AUD X,XXX  (or "—" if zero)
---
Total Year 1         AUD XX,XXX  (bold)
Saving vs F          AUD X,XXX   (green) / — for F column
```

### No tests needed for v1

This project uses Playwright E2E but no test files exist yet. Do not create test files as part of this story — the architecture requires Playwright E2E which is not configured.

### Do not change compute.js or the cost register

The HubSpot arch view is a self-contained modelling panel that does NOT feed back into the cost register. `compute.js`'s `computeForecast` for `sub-hubspot` continues to use `subscription.hubspot.renewal_monthly_aud` (fixed at 1,101.60) — this is intentional. The arch view is a what-if tool, not a live forecast.

## Dev Agent Record

### Debug Log

No issues encountered. JSON seed validated after insertion (51 assumptions, valid JSON).

### Completion Notes

All 5 tasks complete. 13 new assumptions added to `seed/workbook-seed.json` under the `hubspot.arch.*` namespace. Pure compute module `hubspot-arch-compute.js` reads all pricing from assumptions with fallbacks — no hardcoded numbers in the compute path. Composition strings are built from looked-up assumption values. Cohort seat cost iterates FY_2627_MONTHS filtering by cohort start month, uses the scenarioRoot pattern matching compute.js. Route wired in app.js replacing the PagePlaceholder fallback. CSS uses 4-column grid with responsive breakpoints at 900px (2-col) and 560px (1-col). Architecture F column distinguished by teal left border and a "Current" badge. Saving vs F is colour-coded green (positive saving) / red (more expensive).

## File List

- `cost-tracker/seed/workbook-seed.json` — 13 new assumptions added (hubspot.arch.* namespace)
- `cost-tracker/src/components/hubspot-arch/hubspot-arch-compute.js` — NEW: pure compute function
- `cost-tracker/src/components/hubspot-arch/hubspot-arch-view.js` — NEW: HubSpot arch comparison view
- `cost-tracker/src/app.js` — wired /hubspot route, added HubSpotArchView import
- `cost-tracker/public/css/app.css` — added hubspot-arch CSS block (~90 lines)

## Change Log

- 2026-05-14: Story created from Epic 4 planning artifacts
- 2026-05-14: Implementation complete — all tasks checked, status set to review
