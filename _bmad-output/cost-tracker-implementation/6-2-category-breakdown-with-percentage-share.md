---
story_key: 6-2-category-breakdown-with-percentage-share
status: review
epic: 6
story_number: 6.2
---

# Story 6.2: Category Breakdown with Percentage Share

## Story

As Niel (strategic contributor) preparing the narrative,
I want a category breakdown showing what percentage of total spend each category represents,
So that the board sees where the money goes.

## Acceptance Criteria

**Given** the dashboard is rendered with a workbook loaded,
**When** I view the Category Breakdown section,
**Then** I see each category (Sales & Marketing, Productivity & IT, Collaboration & Docs, Training & Development, Infrastructure) with a bracketed vendor list (e.g. "Sales & Marketing (HubSpot)").

**And** each row shows FY 26/27 total AUD and percentage share of total.

**And** rows are sorted by percentage share descending (zero-spend categories appear at the bottom).

**And** the percentages sum to 100% (within rounding).

## Tasks/Subtasks

- [x] Task 1: Add `computeCategoryBreakdown` helper in `dashboard-view.js` — groups active subs by category, computes FY 26/27 total per category, returns sorted array
- [x] Task 2: Add `CategoryBreakdown` section to dashboard JSX — rendered below the savings panel
- [x] Task 3: Add `.dashboard__category-*` CSS to `public/css/app.css`

## Dev Notes

### Where to add this

Add everything to the existing `dashboard-view.js` (`cost-tracker/src/components/dashboard/dashboard-view.js`). No new files needed. CSS goes in `public/css/app.css` under a `.dashboard__category-*` namespace, after the existing `.dashboard__savings-*` rules (around line 2055).

### Data available in scope

`dashboard-view.js` already has in scope:
- `subs` — active (non-archived) subscriptions from workbook
- `assumptionsAllActive` — assumptions with no `active_status` overrides (the "all active" basis — same as what drives `statusQuoTotal` in the headline)
- `activeScenario` — the selected scenario object
- `monthlyEntries` — workbook monthly entries
- `FY_2627_MONTHS` — imported from `compute.js`
- `computeForecast` — imported from `compute.js`
- `fmt.aud()` — AUD formatter from `../../shared/format.js`

### computeCategoryBreakdown helper

Add this function inside `dashboard-view.js` (not exported — local only):

```js
const CATEGORY_ORDER = [
  'Sales & Marketing',
  'Productivity & IT',
  'Collaboration & Docs',
  'Training & Development',
  'Infrastructure',
];

function computeCategoryBreakdown(subs, monthlyEntries, assumptions, scenario) {
  // Build per-subscription FY 26/27 totals
  const subTotals = {};
  for (const sub of subs) {
    let total = 0;
    for (const ym of FY_2627_MONTHS) {
      const entry = monthlyEntries[`${sub.id}_${ym}`];
      if (entry?.isActual && entry?.costAud != null) {
        total += entry.costAud;
      } else {
        total += computeForecast(sub, ym, assumptions, scenario).value ?? 0;
      }
    }
    subTotals[sub.id] = total;
  }

  // Group by category
  const byCategory = {};
  for (const sub of subs) {
    const cat = sub.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = { total: 0, vendors: new Set() };
    byCategory[cat].total += subTotals[sub.id];
    byCategory[cat].vendors.add(sub.vendor);
  }

  const grandTotal = Object.values(byCategory).reduce((s, c) => s + c.total, 0);

  // Build rows for all canonical categories (show zero-spend ones too)
  const rows = CATEGORY_ORDER.map(cat => {
    const entry = byCategory[cat] || { total: 0, vendors: new Set() };
    return {
      category: cat,
      vendors: [...entry.vendors].sort(),
      total: entry.total,
      pct: grandTotal > 0 ? (entry.total / grandTotal) * 100 : 0,
    };
  });

  // Sort by pct descending
  rows.sort((a, b) => b.pct - a.pct);
  return rows;
}
```

**Basis:** use `assumptionsAllActive` (not `assumptions`) — this matches the `statusQuoTotal` on the KPI panel so the numbers are consistent. Do NOT use the savings-adjusted figure.

### Bracketed vendor label

Format: `"Sales & Marketing (HubSpot)"` — the vendors array joined with ", " inside parens. If no vendors, just show the category name.

```js
const label = vendors.length > 0
  ? `${category} (${vendors.join(', ')})`
  : category;
```

### CategoryBreakdown JSX section

Render it as a new panel below `.dashboard__savings-panel`. Follow the same visual weight as the savings panel (surface card, border, rounded). Example structure:

```jsx
<div class="dashboard__category-panel">
  <div class="dashboard__category-title">Category breakdown — FY 26/27</div>
  <div class="dashboard__category-rows">
    ${rows.map(row => html`
      <div key=${row.category} class=${'dashboard__category-row' + (row.total === 0 ? ' dashboard__category-row--empty' : '')}>
        <span class="dashboard__category-label">${labelFor(row)}</span>
        <span class="dashboard__category-bar-wrap">
          <span class="dashboard__category-bar" style=${{ width: row.pct.toFixed(1) + '%' }}></span>
        </span>
        <span class="dashboard__category-pct">${row.pct.toFixed(1)}%</span>
        <span class="dashboard__category-amount">${fmt.aud(row.total)}</span>
      </div>
    `)}
  </div>
</div>
```

Use `useMemo` for the breakdown computation, keyed on `[subs, monthlyEntries, assumptionsAllActive, activeScenario]`.

### CSS spec

```css
/* category breakdown panel — same surface style as savings panel */
.dashboard__category-panel {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
}

.dashboard__category-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
}

.dashboard__category-rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.dashboard__category-row {
  display: grid;
  grid-template-columns: 220px 1fr 52px 100px;
  align-items: center;
  gap: var(--space-3);
}

.dashboard__category-row--empty {
  opacity: 0.45;
}

.dashboard__category-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard__category-bar-wrap {
  height: 8px;
  background: var(--color-bg-hover);
  border-radius: 4px;
  overflow: hidden;
}

.dashboard__category-bar {
  display: block;
  height: 100%;
  background: var(--color-primary);
  border-radius: 4px;
  transition: width var(--transition-normal);
  min-width: 0;
}

.dashboard__category-pct {
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-secondary);
  text-align: right;
}

.dashboard__category-amount {
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  text-align: right;
  white-space: nowrap;
}
```

### Seed data — actual categories in use

Current seed workbook has 4 subscriptions across 3 categories:
- `"Productivity & IT"` — sub-m365-basic, sub-m365-standard (vendor: Microsoft)
- `"Sales & Marketing"` — sub-hubspot (vendor: HubSpot)
- `"Collaboration & Docs"` — sub-miro (vendor: Miro)

Training & Development and Infrastructure will render as 0% / $0 rows at the bottom (greyed out via `--empty` modifier). This is correct and expected.

### Regression safety

The only file being modified for the first three tasks is `dashboard-view.js` and `app.css`. No existing compute functions, store reducers, or other views are touched. The new `useMemo` is purely additive.

The `assumptionsAllActive` memo and `subs` memo are already computed in `DashboardView()` — reuse them, don't recompute.

## Dev Agent Record

### Debug Log

_empty_

### Completion Notes

`CATEGORY_ORDER` constant and `computeCategoryBreakdown` helper added at module level in `dashboard-view.js`. Helper iterates subs × FY_2627_MONTHS using the same actuals-then-forecast pattern as `computeFYTotal`, groups by `sub.category`, dedupes vendor names per category, then maps to all 5 canonical categories (zero-spend categories included) and sorts by pct desc.

`categoryRows` useMemo added in `DashboardView`, keyed on `[subs, monthlyEntries, assumptionsAllActive, activeScenario]` — reuses existing memos, no extra computation overhead.

New `.dashboard__category-panel` section rendered after the savings panel. Each row is a 4-column grid: label (with bracketed vendors), proportional teal bar, percentage, and AUD amount. Zero-spend rows (Training & Development, Infrastructure) rendered with 40% opacity via `--empty` modifier.

CSS added in `app.css` before the savings register section.

## File List

- `cost-tracker/src/components/dashboard/dashboard-view.js` — add helper + section
- `cost-tracker/public/css/app.css` — add `.dashboard__category-*` rules

## Change Log

- 2026-05-14: Story created and implemented
