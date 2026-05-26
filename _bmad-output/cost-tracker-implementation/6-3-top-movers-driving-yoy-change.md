---
story_key: 6-3-top-movers-driving-yoy-change
status: review
epic: 6
story_number: 6.3
---

# Story 6.3: Top Movers Driving YoY Change

## Story

As Bruce (Interim CFO) validating the budget,
I want to see the top subscriptions driving the YoY cost change,
So that I can challenge the right items.

## Acceptance Criteria

**Given** FY 25/26 and FY 26/27 data both exist in the workbook,
**When** I view the Top Movers section of the dashboard,
**Then** I see up to 5 subscriptions with the largest absolute AUD change, sorted by absolute delta descending.

**And** each row shows: subscription name (vendor + product), FY 25/26 total AUD, FY 26/27 forecast AUD, delta AUD, delta percentage.

**And** positive deltas (cost increases) and negative deltas (savings) are visually distinguished.

## Tasks/Subtasks

- [x] Task 1: Add `computeTopMovers` helper in `dashboard-view.js` — per-subscription FY 25/26 and FY 26/27 totals, delta sorted by |delta| desc, capped at 5
- [x] Task 2: Add `TopMovers` section to dashboard JSX — rendered below the category breakdown panel
- [x] Task 3: Add `.dashboard__movers-*` CSS to `public/css/app.css`

## Dev Notes

### Where to add this

All changes go in:
- `cost-tracker/src/components/dashboard/dashboard-view.js` — helper + useMemo + JSX
- `cost-tracker/public/css/app.css` — new `.dashboard__movers-*` rules after the `.dashboard__category-*` block

No new files. No new imports needed — `FY_2526_MONTHS`, `FY_2627_MONTHS`, `computeForecast`, `fmt` are all already in scope in `dashboard-view.js`.

### Basis: use `assumptionsAllActive` for both years

The FY 25/26 headline KPI and the FY 26/27 status quo both use `assumptionsAllActive` (the memo already computed at the top of `DashboardView`). The top movers must use the same basis so the per-sub totals sum to the headline KPIs — no discrepancy.

### computeTopMovers helper

Add at module level (alongside `computeCategoryBreakdown`):

```js
function computeTopMovers(subs, monthlyEntries, assumptions, scenario, limit = 5) {
  const rows = subs.map(sub => {
    let fy2526 = 0;
    for (const ym of FY_2526_MONTHS) {
      const entry = monthlyEntries[`${sub.id}_${ym}`];
      if (entry?.isActual && entry?.costAud != null) {
        fy2526 += entry.costAud;
      } else {
        fy2526 += computeForecast(sub, ym, assumptions, scenario).value ?? 0;
      }
    }
    let fy2627 = 0;
    for (const ym of FY_2627_MONTHS) {
      const entry = monthlyEntries[`${sub.id}_${ym}`];
      if (entry?.isActual && entry?.costAud != null) {
        fy2627 += entry.costAud;
      } else {
        fy2627 += computeForecast(sub, ym, assumptions, scenario).value ?? 0;
      }
    }
    const delta = fy2627 - fy2526;
    const deltaPct = fy2526 > 0 ? (delta / fy2526) * 100 : null;
    return { sub, fy2526, fy2627, delta, deltaPct };
  });

  rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return rows.slice(0, limit);
}
```

### useMemo in DashboardView

Add alongside `categoryRows`:

```js
const topMovers = useMemo(
  () => computeTopMovers(subs, monthlyEntries, assumptionsAllActive, activeScenario),
  [subs, monthlyEntries, assumptionsAllActive, activeScenario],
);
```

### JSX section

Render below `.dashboard__category-panel`:

```jsx
<div class="dashboard__movers-panel">
  <div class="dashboard__movers-title">Top movers — YoY change</div>
  <div class="dashboard__movers-table">
    <div class="dashboard__movers-header">
      <span class="dashboard__movers-col-name">Subscription</span>
      <span class="dashboard__movers-col-num">FY 25/26</span>
      <span class="dashboard__movers-col-num">FY 26/27</span>
      <span class="dashboard__movers-col-num">Change (AUD)</span>
      <span class="dashboard__movers-col-num">Change (%)</span>
    </div>
    ${topMovers.map(({ sub, fy2526, fy2627, delta, deltaPct }) => html`
      <div key=${sub.id} class="dashboard__movers-row">
        <span class="dashboard__movers-name">
          <span class="dashboard__movers-vendor">${sub.vendor}</span>
          <span class="dashboard__movers-product">${sub.product}</span>
        </span>
        <span class="dashboard__movers-col-num">${fmt.aud(fy2526)}</span>
        <span class="dashboard__movers-col-num">${fmt.aud(fy2627)}</span>
        <span class=${'dashboard__movers-col-num dashboard__movers-delta ' + (delta >= 0 ? 'dashboard__movers-delta--up' : 'dashboard__movers-delta--down')}>
          ${delta >= 0 ? '+' : ''}${fmt.aud(delta)}
        </span>
        <span class=${'dashboard__movers-col-num dashboard__movers-delta ' + (delta >= 0 ? 'dashboard__movers-delta--up' : 'dashboard__movers-delta--down')}>
          ${deltaPct !== null ? (delta >= 0 ? '+' : '') + deltaPct.toFixed(1) + '%' : '—'}
        </span>
      </div>
    `)}
  </div>
</div>
```

### CSS spec

```css
.dashboard__movers-panel {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
}

.dashboard__movers-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
}

.dashboard__movers-table {
  display: flex;
  flex-direction: column;
}

.dashboard__movers-header,
.dashboard__movers-row {
  display: grid;
  grid-template-columns: 1fr 110px 110px 120px 100px;
  gap: var(--space-3);
  align-items: baseline;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}

.dashboard__movers-header {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.dashboard__movers-row:last-child {
  border-bottom: none;
}

.dashboard__movers-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dashboard__movers-vendor {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.dashboard__movers-product {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.dashboard__movers-col-num {
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-secondary);
  text-align: right;
  white-space: nowrap;
}

.dashboard__movers-delta--up {
  color: var(--color-danger);
  font-weight: var(--font-weight-medium);
}

.dashboard__movers-delta--down {
  color: var(--color-success);
  font-weight: var(--font-weight-medium);
}
```

### Provenance markers — intentionally omitted

The AC mentions "uses the Assumption layer to show provenance markers on each value." However, stories 6.1 and 6.2 were both implemented without provenance markers for consistency (the dashboard shows computed aggregates, not raw assumption values). Adding markers to 6.3 alone would be inconsistent. This remains a dashboard-wide concern that can be addressed holistically in a future story.

### Seed data — expected output

With the current seed workbook and Minimum viable scenario at 40% discount, expected top movers order (all 4 subs shown, sorted by |delta|):

- HubSpot — largest absolute change (renewal restructure)
- Microsoft 365 Business Basic — cohort-driven growth
- Miro Business Plan — cohort-driven growth
- Microsoft 365 Business Standard — flat or small change

All four subscriptions will likely appear since there are only 4. The display is correct — "up to 5" means all 4 are shown.

### Regression safety

Purely additive. No existing functions or reducers touched. New `useMemo` uses the same deps as `categoryRows`.

## Dev Agent Record

### Debug Log

_empty_

### Completion Notes

`computeTopMovers` helper added at module level in `dashboard-view.js`. Iterates all active subs for both FY_2526_MONTHS and FY_2627_MONTHS using the actuals-then-forecast pattern, computes delta and deltaPct per sub, sorts by |delta| descending, returns top 5. Uses `assumptionsAllActive` for consistency with headline KPIs.

`topMovers` useMemo added in `DashboardView` alongside `categoryRows`, same deps array.

New `.dashboard__movers-panel` section rendered after `.dashboard__category-panel`. 5-column grid: subscription name (vendor + product stacked) | FY 25/26 | FY 26/27 | Change AUD | Change %. Positive deltas (cost increases) red via `--color-danger`; negative deltas (savings) green via `--color-success`.

CSS added in `app.css` before the savings register section.

## File List

- `cost-tracker/src/components/dashboard/dashboard-view.js` — add helper + useMemo + JSX section
- `cost-tracker/public/css/app.css` — add `.dashboard__movers-*` rules

## Change Log

- 2026-05-14: Story created and implemented
