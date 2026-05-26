# Story 7.1 — Four-Tab UI Restructure

**Status:** review  
**Epic:** 7 — Seat-Intake-Driven Redesign  
**Date:** 2026-05-20

---

## User Story

As Angelus running the ops meeting, I want the Cost Tracker to open on a clear executive summary and navigate through four focused tabs (Dashboard → IE Intake → Per-IE Costs → Forecast), so that Niel and Nicolette can follow the recruitment-to-cost logic without needing any explanation.

---

## Context and Motivation

The app currently has 5 tabs in a mixed-concern structure — the Recruitment tab and the Cost Register both exist but use disconnected models. This story restructures the UI into 4 tabs that tell a single coherent story: how many IEs are we recruiting, what does each IE cost, and what is the total range.

**This story is UI-only. No calculation logic changes.** Existing compute functions (`computeForecast`, `activeCohortIEs`, `runForecastModel`) stay exactly as they are. Story 7.2 will wire the recruitment model to the cost model. Story 7.1 just restructures the UI shell and builds each view against the existing data.

The old version has been archived at `cost-tracker/archive/cost-tracker-v1-pre-redesign-2026-05-20.html` and tagged in git as `cost-tracker-v1-pre-redesign`. The old route handlers are NOT deleted — they're left in place for reference. Only the `NAV_LINKS` array and `RouteContent` are updated.

---

## Acceptance Criteria

### AC1 — Navigation restructured to 4 tabs
- `NAV_LINKS` in `src/components/shell/nav-bar.js` contains exactly:
  - `{ href: '#/dashboard', label: 'Dashboard' }`
  - `{ href: '#/ie-intake', label: 'IE Intake' }`
  - `{ href: '#/per-ie-costs', label: 'Per-IE Costs' }`
  - `{ href: '#/forecast', label: 'Forecast' }`
- Old links (`#/scenarios`, `#/decisions`, `#/cost-register`, `#/hubspot`) are removed from `NAV_LINKS` but their route handlers in `app.js` remain unchanged (deep links still work).
- `resolveRoute()` in `app.js` includes all four new paths. The default route is still `#/dashboard`.

### AC2 — Dashboard is a self-contained executive summary
The new `DashboardView` (`src/components/dashboard/dashboard-view.js`) renders:

**Section 1 — Stat cards (3 cards, full width, above the fold):**
- Card 1: "FY 26/27 Total (Primary)" — the Primary scenario FY 26/27 total in AUD. Use the existing `computeFYTotal` helper with `FY_2627_MONTHS` and the Primary scenario.
- Card 2: "Per-IE Monthly Cost" — sum of `(unitCost × attributionRate)` for all `cohort_driven === true` subscriptions. See computation note below.
- Card 3: "Active IEs (FY27 target)" — `lookupValue(assumptions, 'forecast.model.target.fy27', 60)`.
- Each card: large value, small label below, no charts.

**Section 2 — Scenario range tiles (3 tiles, side by side):**
- Minimum Viable | Primary Target | Optimal Maximum
- Each tile shows: scenario label + FY 26/27 total (AUD, annual) + monthly average
- Mark the active scenario tile with a `--active` modifier class
- Reuse the existing `scenarioList` computation from the old dashboard (the three scenario objects from `workbook.scenarios`)
- Compute FY 26/27 total for each scenario using `computeFYTotal(subs, FY_2627_MONTHS, monthlyEntries, assumptions, scenario)` — this already works.

**Section 3 — Two-panel row:**
- Left panel: "IE Headcount (FY27)" — compact block showing global target (60) and the three regional targets as a mini-summary: APAC / Americas / EMEA. Use `runForecastModel(assumptions)` to get `globalTotals[27].activeIEs` and `activeIEs[region][27]`. This is already computed in `ScenariosView` — bring the import across.
- Right panel: "Category Breakdown" — reuse `computeCategoryBreakdown` from the old dashboard. Keep it as-is.

**Print functionality (must be preserved):**
- Print controls (mode buttons + "Print board pack" button) remain on Dashboard.
- Print footnotes and appendix sections remain.
- `RenewalsView` is **removed** from the Dashboard (it has its own route `#/renewals`).
- `NeedsDecisionTray` stays in the app shell (not in Dashboard).
- The `EXPORT_LOG_APPENDED` dispatch and `exportPrintView` calls stay.

**Removed from Dashboard:**
- Savings panel (`dashboard__savings-panel`) — removed entirely
- Top movers panel (`dashboard__movers-panel`) — removed entirely
- YoY comparison headline column — removed (the three stat cards replace the old 3-column headline)

**Per-IE Monthly Cost computation (for Card 2):**
```js
function computePerIEMonthlyCost(subs, assumptions) {
  return subs
    .filter(s => s.cohort_driven && s.unit_cost_assumption_key && s.attribution_assumption_key)
    .reduce((total, s) => {
      const unitCost = lookupValue(assumptions, s.unit_cost_assumption_key, 0);
      const attrRate = lookupValue(assumptions, s.attribution_assumption_key, 0);
      const fxKey    = 'scenario.fx_rate.aud_' + (s.currency || 'aud').toLowerCase();
      const fxRate   = s.currency === 'AUD' ? 1 : lookupValue(assumptions, fxKey, 1);
      const unitAud  = s.currency === 'AUD' ? unitCost : unitCost / fxRate;
      return total + (unitAud * attrRate);
    }, 0);
}
```
Apply `fmt.aud(result)` for display. Note: with Miro at 100% and Claude at 0%, the result is approximately AUD 26–30/IE/month depending on FX.

### AC3 — IE Intake view (new file)
Create `src/components/ie-intake/ie-intake-view.js`. Route: `#/ie-intake`.

**Layout:**

**Section 1 — Global parameters (compact form, NOT a table):**
- FY headcount targets: FY26 actual (read-only, 22), FY27 (editable), FY28 (editable), FY29 (editable)
- Pipeline rates: Vetted→Shortlist, Shortlist→Onboarded, Cohorts per year
- These use the same `ParamInput` and `updateForecastParam` helpers from `ScenariosView`. Copy them into the new file.
- No regional weights in this section — they live in the regional cards.

**Section 2 — Totals pinned row (always visible):**
- A summary row above the regional cards: "Global total: X active IEs | APAC Y | Americas Z | EMEA W" for FY27.
- Source: `runForecastModel(assumptions).globalTotals[27].activeIEs` and `activeIEs[region][27]` for each region.
- Style as a highlighted summary band, not part of the card grid.

**Section 3 — Regional cards (2-column grid):**
- Three cards: APAC, Americas, EMEA.
- Each card shows:
  - Region name (heading)
  - FY27 target Active IEs (large number)
  - FY27 Attrition (smaller, labelled "Attrition")
  - FY27 Shortlist (labelled "Need to shortlist")
  - FY27 Sourced (labelled "Need to source")
  - Regional weight (editable via `ParamInput`, labelled "Regional weight", isPercent, suffix="%")
  - Attrition rate (editable via `ParamInput`, labelled "Attrition rate", isPercent, suffix="%")
- All values from `runForecastModel(assumptions)` output — `activeIEs[region][27]`, `attrition[region][27]`, `shortlist[region][27]`, `sourced[region][27]`.
- The third card (EMEA) sits in the left column of a second row (or spans both — a 2-col grid with 3 items leaves the 4th slot empty).

**Section 4 — Sanity check:**
- Reuse the sanity row from `ForecastResultsPanel` in the old ScenariosView.
- Show: FY27, FY28, FY29 avg onboards per cohort + band status.
- Keep the styling (green/amber).

**What is NOT in IE Intake:**
- Scenario envelope (Min/Primary/Max) — moved to Forecast tab
- The full backward pipeline table (Sourced/Longlist/Shortlist/Attrition for all regions × all FYs) — removed from the UI. The data is computed internally but only FY27 is shown in the cards.

### AC4 — Per-IE Costs view (new file)
Create `src/components/per-ie-costs/per-ie-costs-view.js`. Route: `#/per-ie-costs`.

**Layout:**

**Section 1 — IE-linked subscriptions table:**
Filter: `subs.filter(s => s.cohort_driven && s.status !== 'archived')`.

Columns:
| Column | Source |
|---|---|
| Vendor | `sub.vendor` |
| Product | `sub.product` |
| Unit cost | `lookupValue(assumptions, sub.unit_cost_assumption_key)` via `AssumptionMarker` |
| Currency | `sub.currency` |
| Attribution | `lookupValue(assumptions, sub.attribution_assumption_key, 0)` displayed as % |
| Cost per IE / mo | `(unitCost / fxRate) × attribution` in AUD |

- Attribution cell must be clickable to open a provenance-gated edit form (same pattern as `LicenceOverrideForm` — inline `<dialog>` or drawer). Editing attribution updates the assumption via `createAssumption → resolveAssumption → dispatch`. Rationale + source required.
- The HubSpot bundle row is NOT cohort-driven — it won't appear here. The HubSpot cohort row IS cohort-driven and will appear.
- A **total row** at the bottom: "Cost per additional IE / month" = sum of all per-IE cost column values. Label it prominently. This is the number John flagged as the accountability metric.
- Format: `fmt.aud(total)` for the total row.

**Section 2 — Company/platform subscriptions (below a divider):**
Filter: `subs.filter(s => !s.cohort_driven && s.status !== 'archived')`.

Simple list — vendor, product, unit cost, seat count (or "N/A"), purpose. Read-only in this view. Label the section: "Platform subscriptions (not IE-linked)". This is for completeness/budget awareness — Angelus asked that all 20 subs be visible, even those with 0% attribution.

**No CRUD in this view.** The full subscription form remains accessible only through the old Subscriptions route (`#/decisions`). This view is read-optimised.

### AC5 — Forecast view (new file)
Create `src/components/forecast/forecast-view.js`. Route: `#/forecast`.

**Zone 1 — Headline scenario tiles (top of page):**
Three cards: Minimum Viable | Primary Target | Optimal Maximum.

Each card shows:
- Scenario label
- FY27 active IEs (from `runForecastModel`, with ±20% variance for Min/Max — use `lookupValue(assumptions, 'forecast.model.variance.min', 0.80)` etc.)
- FY 26/27 total cost (AUD annual) — computed via `computeFYTotal(subs, FY_2627_MONTHS, monthlyEntries, assumptions, scenario)` for each scenario object

Use the existing three scenario objects from `workbook.scenarios`:
```js
const scenarioList = ['scenario-minimum-viable', 'scenario-primary-target', 'scenario-optimal-maximum']
  .map(id => workbook.scenarios?.[id]).filter(Boolean);
```

Mark the active scenario card with a visible `--active` modifier.

**Zone 2 — Monthly breakdown table:**
Always visible below Zone 1. Covers `FY_2627_MONTHS` (Jul 2026 – Jun 2027).

Columns: Month | Min | Primary | Max | Δ (month-on-month change in Primary)

- Min/Primary/Max cost for each month: `computeForecast(sub, ym, assumptions, scenario).value` summed across all subs for that month and scenario.
- Delta = `primaryCost[ym] - primaryCost[prevMonth]` (zero for first month, show `—`). Colour: positive = red (cost going up), negative = green, zero = neutral.
- FY group headers (FY 25/26 and FY 26/27) as spanning header rows — reuse the `FY_GROUPS` pattern from `CostRegisterView`.
- Monthly cost cells formatted with `fmt.aud()`.

**Regional headcount sub-section (below the monthly table):**
A compact table showing APAC / Americas / EMEA active IE headcount per FY (not per month — just FY27, FY28, FY29 from `runForecastModel`). This is read-only context for why the costs grow. Label: "Headcount reference".

### AC6 — Seed data updates

**Update `a-miro-attribution` in `seed/workbook-seed.json`:**
```json
"value": 1,
"rationale": "Operations meeting 2026-05-20 — Niel confirmed all new IEs should have Miro access (100% attribution)",
"source": "Ops meeting 2026-05-20 (Niel Malan)",
"decided_on": "2026-05-20T00:00:00.000Z"
```

**Add new subscription `sub-claude-cohort`:**
```json
"sub-claude-cohort": {
  "id": "sub-claude-cohort",
  "vendor": "Anthropic",
  "product": "Claude.ai Pro — IE cohort",
  "category": "Productivity & IT",
  "currency": "USD",
  "cohort_driven": true,
  "subscription_type": "cohort",
  "unit_cost_assumption_key": "subscription.claude_cohort.unit_cost",
  "attribution_assumption_key": "subscription.claude_cohort.attribution_rate",
  "seat_count_assumption_key": "subscription.claude_cohort.baseline_seats",
  "billing_entity": "AU",
  "cardholder": "Angelus Morningstar",
  "tier": "Pro",
  "renewal_date": null,
  "status": "active",
  "note": "Premium IE cohort subscription. Attribution currently 0% — not yet agreed. Placeholder for future decision."
}
```

**Add three new assumptions for Claude cohort:**
```json
"a-claude-cohort-attribution": {
  "id": "a-claude-cohort-attribution",
  "key": "subscription.claude_cohort.attribution_rate",
  "label": "Claude.ai Pro — IE attribution rate",
  "value": 0,
  "unit": "proportion",
  "category": "Subscription costing",
  "status": "Pending",
  "rationale": "Not yet agreed — placeholder. Premium IEs (revenue-generating) only. Decision deferred.",
  "source": "Ops meeting 2026-05-20",
  "confidence": "low",
  "decided_on": null
},
"a-claude-cohort-unit-cost": {
  "id": "a-claude-cohort-unit-cost",
  "key": "subscription.claude_cohort.unit_cost",
  "label": "Claude.ai Pro — unit cost per seat",
  "value": 20,
  "unit": "USD/month",
  "category": "Subscription costing",
  "status": "Pending",
  "rationale": "Claude Pro is USD 20/month per seat. Indicative only.",
  "source": "Anthropic pricing page",
  "confidence": "medium",
  "decided_on": null
},
"a-claude-cohort-baseline-seats": {
  "id": "a-claude-cohort-baseline-seats",
  "key": "subscription.claude_cohort.baseline_seats",
  "label": "Claude.ai Pro — baseline seats",
  "value": 0,
  "unit": "seats",
  "category": "Subscription costing",
  "status": "Resolved",
  "rationale": "No baseline seats — cohort additions only.",
  "source": "Ops meeting 2026-05-20",
  "confidence": "high",
  "decided_on": "2026-05-20T00:00:00.000Z"
}
```

Because Claude attribution is 0% and pending, it contributes AUD 0 to all cost computations. It appears in Per-IE Costs tab with `0%` attribution and a `Pending` badge, clearly communicating to Niel/Nicolette that it's a placeholder.

### AC7 — Build passes
- `npm run build` in `cost-tracker/` produces a new `dist/cost-tracker.html` with no errors.
- The file opens from `file://` without console errors (the benign ReactDOM iframe warning is acceptable).
- All four tabs are navigable.
- `#/dashboard` is the default route.
- Old routes (`#/scenarios`, `#/decisions`, `#/cost-register`, `#/hubspot`) still render their existing views via deep link.

---

## File Map

| Action | File |
|---|---|
| UPDATE | `src/components/shell/nav-bar.js` — update `NAV_LINKS` |
| UPDATE | `src/app.js` — add new routes to `RouteContent` and `resolveRoute` |
| REWRITE | `src/components/dashboard/dashboard-view.js` |
| CREATE | `src/components/ie-intake/ie-intake-view.js` |
| CREATE | `src/components/per-ie-costs/per-ie-costs-view.js` |
| CREATE | `src/components/forecast/forecast-view.js` |
| UPDATE | `seed/workbook-seed.json` — Miro attribution + Claude cohort subscription |
| PRESERVE | All files in `src/state/` — zero changes |
| PRESERVE | `src/components/scenarios/scenarios-view.js` — not deleted, route kept alive |
| PRESERVE | `src/components/cost-register/cost-register-view.js` — not deleted |
| PRESERVE | `src/components/hubspot-arch/hubspot-arch-view.js` — not deleted |

---

## Dev Notes and Guardrails

### Critical: window.__WWCT__ destructuring
```js
const { html, useState, useMemo, useRef, useCallback } = window.__WWCT__;
```
**Never** `import { useState } from 'react'` or similar. All React globals come from `window.__WWCT__`.

### Critical: style props must be objects
```js
// CORRECT
style=${{ marginLeft: 'auto' }}
// WRONG — will not compile
style="margin-left: auto"
```

### Critical: useWorkbook pattern
```js
const { workbook, dispatch } = useWorkbook();
const assumptions = workbook.assumptions || {};
const subs = Object.values(workbook.subscriptions || {}).filter(s => s.status !== 'archived');
const scenario = workbook.scenarios?.[workbook.activeScenarioId] ?? null;
```

### Reusable helpers — import these, don't rewrite
- `lookupValue(assumptions, key, fallback)` from `../../state/assumptions.js`
- `computeForecast(sub, ym, assumptions, scenario)` from `../../state/compute.js`
- `ALL_MONTHS, FY_2526_MONTHS, FY_2627_MONTHS, FY_GROUPS` from `../../state/compute.js`
- `runForecastModel(assumptions)` from `../../state/cohort.js`
- `fmt.aud(n)`, `fmt.aud2(n)`, `fmt.date(iso)` from `../../shared/format.js`
- `AssumptionMarker` from `../provenance/assumption-marker.js`
- `createAssumption`, `resolveAssumption`, `buildSupersessionPayload`, `STATUS` from `../../state/assumptions.js`

### Assumption lifecycle for attribution edits (Per-IE Costs tab)
Attribution rates are assumptions — editing them must go through the provenance system:
```js
const existing = Object.values(assumptions).find(a => a.key === key);
if (existing) {
  dispatch({ type: 'ASSUMPTION_UPDATED', payload: { ...existing, value: newValue, status: STATUS.RESOLVED, rationale, source, decided_on: new Date().toISOString() } });
} else {
  const draft = createAssumption({ key, label, value: newValue, category: 'Subscription costing', rationale, source });
  dispatch({ type: 'ASSUMPTION_PROPOSED', payload: resolveAssumption(draft, { rationale, source }) });
}
```
Do NOT allow free editing of attribution rates without a rationale+source dialog. This is a non-negotiable PRD constraint.

### FX convention
`scenario.fx_rate.aud_<iso>` = FCY per 1 AUD.
To convert FCY → AUD: `audAmount = fcyAmount / rate`.
Example: `aud_usd = 0.645` means 1 AUD = 0.645 USD, so USD 16 = 16 / 0.645 ≈ AUD 24.80.

### HubSpot special case
`sub-hubspot-bundle` is `cohort_driven: false` — it will NOT appear in the IE-linked table in Per-IE Costs.
`sub-hubspot-cohort` IS `cohort_driven: true` — it WILL appear. Its `attribution_assumption_key` is `subscription.hubspot_core.attribution_rate` (value: 0.5). Its unit cost is `subscription.hubspot.per_seat_rate_aud_discounted` (value: 48 AUD).

### CSS class conventions
All new views should use CSS classes prefixed by view name:
- `ie-intake__*`, `per-ie-costs__*`, `forecast__*`
- Reuse existing design tokens: `--color-primary`, `--color-border`, `--space-*`, `--font-size-*`
- Card pattern: `class="panel"` with `class="panel__title"` header — same as existing panels in `ScenariosView`
- Button pattern: `btn btn--primary`, `btn btn--ghost`, `btn btn--sm`

### computeFYTotal (copy from dashboard-view.js or import)
```js
function computeFYTotal(subs, months, monthlyEntries, assumptions, scenario) {
  let total = 0;
  for (const sub of subs) {
    for (const ym of months) {
      const entry = monthlyEntries[`${sub.id}_${ym}`];
      if (entry?.isActual && entry?.costAud != null) {
        total += entry.costAud;
      } else {
        total += computeForecast(sub, ym, assumptions, scenario).value ?? 0;
      }
    }
  }
  return total;
}
```
This helper is currently inlined in `dashboard-view.js`. Either import it from a shared location or copy it into each new view that needs it. Do NOT extract it to `compute.js` in this story — that's a Story 7.2 concern.

### Print functionality
The `exportPrintView`, `EXPORT_LOG_APPENDED` dispatch, and the three print mode buttons must stay on Dashboard. Do not move them or break the print stylesheet (`print-board.css`). The print sections (`dashboard__print-header`, `dashboard__print-footnotes`, `dashboard__print-appendix`, `dashboard__print-footer`) must be preserved with their existing class names — the print stylesheet depends on them.

### Seed file format
The seed JSON uses object-keyed maps (not arrays) for `subscriptions` and `assumptions`:
```json
{
  "subscriptions": { "sub-m365-basic": { ... }, "sub-miro": { ... } },
  "assumptions": { "a-miro-attribution": { ... } }
}
```
Add new entries under their respective keys. Do not convert to arrays.

### Build command
```
cd cost-tracker
npm run build
```
Output: `dist/cost-tracker.html`. The file must be under ~600KB after build. Check: `(Get-Item dist/cost-tracker.html).length / 1KB`.

---

## Out of Scope (Story 7.2)

- Replacing `activeCohortIEs` with `monthlyHeadcountByRegion` as the cost driver
- Connecting `runForecastModel` output to monthly subscription seat counts
- ±20% scenario variance driving real per-month IE headcount in the cost register
- Xero actuals overlay on the Dashboard
- Deleting old view components and routes

---

## Definition of Done

- [x] Four tabs visible in nav, correct labels, correct default route
- [x] Dashboard: 3 stat cards, 3 scenario tiles, 2-panel row (IE headcount + category breakdown), print controls
- [x] IE Intake: global params form, totals pinned row, 3 regional cards with all FY27 pipeline values + editable weights/attrition
- [x] Per-IE Costs: cohort-driven subs table with attribution-edit dialog, total row, company subs list below divider
- [x] Forecast: 3 scenario tiles (Zone 1), monthly table with Delta column (Zone 2), headcount reference (Zone 3)
- [x] Miro attribution updated to 1.0 in seed
- [x] Claude cohort subscription added to seed with attribution 0 and status Pending
- [x] `npm run build` passes (485.9 KB), HTML opens from `file://`, all 4 tabs render
- [x] Old routes still reachable via direct hash (no regressions)

---

## Dev Agent Record

**Implemented:** 2026-05-20  
**Build output:** `dist/cost-tracker.html` 485.9 KB ✓

### Files changed
| Action | File |
|---|---|
| UPDATE | `cost-tracker/src/components/shell/nav-bar.js` |
| UPDATE | `cost-tracker/src/app.js` |
| REWRITE | `cost-tracker/src/components/dashboard/dashboard-view.js` |
| CREATE | `cost-tracker/src/components/ie-intake/ie-intake-view.js` |
| CREATE | `cost-tracker/src/components/per-ie-costs/per-ie-costs-view.js` |
| CREATE | `cost-tracker/src/components/forecast/forecast-view.js` |
| UPDATE | `cost-tracker/seed/workbook-seed.json` |
| ARCHIVE | `cost-tracker/archive/cost-tracker-v1-pre-redesign-2026-05-20.html` |

### Completion notes
- Nav updated to 4 tabs; old routes preserved with comments in RouteContent
- Dashboard rewritten: removed savings panel, top movers, renewals embed, YoY column. Added stat cards (FY total/per-IE cost/active IEs), scenario tiles (clickable, dispatch SCENARIO_SWITCHED), IE headcount panel (from runForecastModel), category breakdown. Print functionality fully preserved.
- IE Intake: builds on runForecastModel directly. Global params form (FY targets, pipeline rates, cohort count), totals pinned row, 3 regional cards (APAC/Americas/EMEA) each showing FY27 active IEs + pipeline numbers + editable weight/attrition. Sanity check section at bottom.
- Per-IE Costs: cohort-driven subs table with provenance-gated attribution edit dialog. Total per-IE row in tfoot. Company subs list below divider (read-only). Claude shows 0% + Pending badge.
- Forecast: 3 scenario tiles (Zone 1) with FY27 IE count + annual cost. Monthly table (Zone 2) with Min/Primary/Max columns + Delta (MoM primary change), colour-coded. Headcount reference table (Zone 3).
- computeFYTotal inlined in dashboard-view.js and forecast-view.js (not extracted — Story 7.2 concern).
- Seed: Miro attribution 0.333 → 1 with provenance. Claude cohort sub added (21 subs total, 86 assumptions).

### Change log
- 2026-05-20: Story 7.1 implemented. 4-tab UI restructure complete. Build passes at 485.9 KB.
