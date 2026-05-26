---
story_key: 4-10-absorb-inventory-into-subscriptions
status: review
epic: 4
story_number: 4.10
---

# Story 4.10: Absorb Inventory into Subscriptions View

Status: review

## Story

As Angelus (driver),
I want the Inventory page removed and its Add/Edit/Archive and search/filter capabilities folded into the Subscriptions view,
So that subscription management lives in one place instead of two.

## Acceptance Criteria

**Given** I navigate to `#/decisions` (Subscriptions),
**When** the page renders,
**Then** the page header contains an **Add subscription** button alongside the existing "Firm only" and "Decision log →" controls.

**And** a filter/search bar is visible below the page header (same controls as the old Inventory page: text search, category select, currency select, entity select, show-archived checkbox, clear-filters button).

**And** each row in all three subscription groups (Per IE, Bespoke, Company) has an **Edit** button and — when the subscription is not archived — an **Archive** button in a new rightmost actions cell.

**And** clicking **Add subscription** opens the `SubscriptionForm` dialog in "add" mode; submitting it dispatches `SUBSCRIPTION_SAVED` and closes the dialog.

**And** clicking **Edit** on a row opens `SubscriptionForm` in "edit" mode pre-filled with that subscription's data; submitting dispatches `SUBSCRIPTION_SAVED` and closes the dialog.

**And** clicking **Archive** prompts "Archive this subscription? Historical data and assumptions are preserved." and, on confirm, dispatches `SUBSCRIPTION_ARCHIVED` with the subscription's id.

**And** the search/filter bar filters the rows shown in each group table while the summary strip (FY 26/27 status quo, savings, adjusted total) always reflects the full unfiltered non-archived subscription set.

**And** when showArchived is checked, archived subscriptions appear in the group tables with the same `decisions__row--inactive` visual treatment.

**And** a count indicator ("X subscriptions" or "X subscriptions (filtered)") is shown next to the page title, consistent with the old inventory count.

**And** `#/inventory` is removed from the nav bar and no longer renders (navigating to it falls through to the default placeholder); the "Inventory" nav item disappears.

**And** the old `InventoryView` import and route case are removed from `app.js`.

## Tasks / Subtasks

- [x] Task 1: Add state and handlers to `DecisionsView`
  - [x] Add imports: `SubscriptionForm` from `'../inventory/subscription-form.js'`; `AssumptionMarker` from `'../provenance/assumption-marker.js'` (needed by filter bar's unit cost cells in future; import now to avoid drift)
  - [x] Add state: `showForm`, `editTarget`, `search`, `category`, `currency`, `entity`, `showArchived` (all `useState`)
  - [x] Replace the existing `subs` derivation (currently filters `status !== 'archived'`) with two derived values:
    - `allSubs = useMemo(() => Object.values(workbook.subscriptions || {}), [workbook.subscriptions])` — no status filter
    - `subs` (for summary strip) keeps `allSubs.filter(s => s.status !== 'archived')`
  - [x] Add `filteredSubs = useMemo(...)` — applies `showArchived`, `search`, `category`, `currency`, `entity` filters on `allSubs`; mirrors the filter logic in `inventory-view.js` exactly
  - [x] Change `cohortSubs`, `bespokeSubs`, `companySubs` to derive from `filteredSubs` instead of `subs`
  - [x] Add `handleSave({ subscription, costAssumption })` — same as `InventoryView.handleSave`: dispatch `SUBSCRIPTION_SAVED`, then `setShowForm(false)`, `setEditTarget(null)`
  - [x] Add `handleArchive(id)` — same as `InventoryView.handleArchive`: `confirm(...)` → dispatch `SUBSCRIPTION_ARCHIVED`

- [x] Task 2: Add filter bar and form dialog to `DecisionsView` render
  - [x] Render `<${SubscriptionForm} .../>` dialog when `showForm` is true (same conditional pattern as `InventoryView`)
  - [x] In `page-header`, add **Add subscription** button (class `btn btn--primary btn--sm`) immediately before the "Firm only" button; `onClick` sets `setEditTarget(null)`, `setShowForm(true)`
  - [x] Change the count indicator from `${subs.length} subscription...` to `${filteredSubs.length} subscription... ${hasFilters ? '(filtered)' : ''}` where `hasFilters = search || category || currency || entity`
  - [x] Add `<div class="filter-bar">` block after the `page-header` div and before `decisions__summary` — copy the filter bar markup from `inventory-view.js` (search input, category select, currency select, entity select, show-archived checkbox, conditional clear-filters button); wire each control to its state

- [x] Task 3: Add actions column to `SubscriptionGroup` (Bespoke + Company)
  - [x] Add `onEdit` and `onArchive` props to `SubscriptionGroup`
  - [x] Add a 5th `<th>` header cell (empty, class `decisions__actions-col`) in `SubscriptionGroup`
  - [x] Update the empty-state `colspan` from `4` to `5`
  - [x] Thread `onEdit` and `onArchive` through to `SubRow`
  - [x] Add `onEdit` and `onArchive` props to `SubRow`
  - [x] Add a 5th `<td class="decisions__actions-cell">` to `SubRow` containing:
    - Edit button: `<button class="btn btn--ghost btn--sm" onClick=${() => onEdit(sub)}>Edit</button>`
    - Archive button (only when `sub.status !== 'archived'`): `<button class="btn btn--ghost btn--sm decisions__archive-btn" onClick=${() => onArchive(sub.id)}>Archive</button>`
  - [x] Update `DecisionsView` render: pass `onEdit=${e => { setEditTarget(e); setShowForm(true); }}` and `onArchive=${handleArchive}` to both `<SubscriptionGroup>` renders

- [x] Task 4: Add actions column to `CohortSubscriptionGroup` (Per IE)
  - [x] Add `onEdit` and `onArchive` props to `CohortSubscriptionGroup`
  - [x] Add a 7th `<th>` header cell (empty, class `decisions__actions-col`) in `CohortSubscriptionGroup`
  - [x] Update the empty-state `colspan` from `6` to `7`
  - [x] Thread `onEdit` and `onArchive` through to `CohortSubRow`
  - [x] Add `onEdit` and `onArchive` props to `CohortSubRow`
  - [x] Add a 7th `<td class="decisions__actions-cell">` to `CohortSubRow` with same Edit + conditional Archive buttons
  - [x] Update `DecisionsView` render: pass `onEdit` and `onArchive` to `<CohortSubscriptionGroup>`

- [x] Task 5: Remove inventory from routing and nav
  - [x] In `cost-tracker/src/app.js`: remove `import { InventoryView }` line; remove `case '/inventory':` from `RouteContent`; remove `'/inventory': 'Inventory'` entry from `resolveRoute`
  - [x] In `cost-tracker/src/components/shell/nav-bar.js`: remove `{ href: '#/inventory', label: 'Inventory' }` from `NAV_LINKS`

- [x] Task 6: Add CSS to `app.css`
  - [x] `.decisions__actions-col` — `width: 8%; text-align: right;`
  - [x] `.decisions__actions-cell` — `padding: var(--space-2) var(--space-4); text-align: right; white-space: nowrap; vertical-align: middle;`
  - [x] `.decisions__archive-btn` — `color: var(--color-text-secondary);` (subdued, not urgent-red)
  - [x] Rebalance `decisions__table` 4-column widths to sum to 100% after adding actions col: `.decisions__sub-col { width: 42%; }` (was 50%), `.subs__detail-col { width: 22%; }` (existing), `.decisions__saving-col { width: 14%; }` (was 25%), `.decisions__toggle-col { width: 14%; }` (was 25%), `.decisions__actions-col { width: 8%; }`
  - [x] For cohort table, update scoped overrides: `.decisions__table--cohort .decisions__sub-col { width: 32%; }` (was 36%), `.decisions__rate-col { width: 9%; }` (was 10%), `.decisions__seats-col { width: 9%; }` (was 10%), `.decisions__unitcost-col { width: 16%; }` (was 18%), `.decisions__table--cohort .decisions__saving-col { width: 12%; }` (was 13%), `.decisions__table--cohort .decisions__toggle-col { width: 12%; }` (was 13%), `.decisions__table--cohort .decisions__actions-col { width: 10%; }` (new, overrides base 8%)

## Dev Notes

### Files to modify

1. `cost-tracker/src/components/decisions/decisions-view.js` — all logic and render changes
2. `cost-tracker/src/app.js` — remove InventoryView import and route
3. `cost-tracker/src/components/shell/nav-bar.js` — remove Inventory nav link
4. `cost-tracker/public/css/app.css` — new actions column classes and width rebalancing

### Files NOT to change

- `cost-tracker/src/components/inventory/inventory-view.js` — leave as-is (dead code, do not delete)
- `cost-tracker/src/components/inventory/subscription-form.js` — no changes, just import into decisions-view
- `cost-tracker/seed/workbook-seed.json` — no changes
- All compute, cohort, assumptions state files — no changes

### Current decisions-view.js summary (post-4.8/4.9)

Key top-level state in `DecisionsView`:
```js
const { workbook, dispatch } = useWorkbook();
const assumptions = workbook.assumptions || {};
const scenario = workbook.scenarios?.[workbook.activeScenarioId] ?? null;
const monthlyEntries = workbook.monthlyEntries || {};
const [firmOnly, setFirmOnly] = useState(false);
const model = useMemo(() => runForecastModel(assumptions), [assumptions]);
const avgCohortSize = useMemo(() => { ... }, [model]);
const subs = useMemo(
  () => Object.values(workbook.subscriptions || {}).filter(s => s.status !== 'archived'),
  [workbook.subscriptions],
);
```

The `subs` derivation is what changes in Task 1. Split into `allSubs` (no status filter) → `subs` (non-archived, for summary) → `filteredSubs` (for groups).

### Existing filter bar markup (from inventory-view.js)

```js
html`<div class="filter-bar">
  <input
    class="filter-bar__search field__input"
    type="search"
    placeholder="Search vendor or product..."
    value=${search}
    onInput=${e => setSearch(e.target.value)}
    aria-label="Search subscriptions"
  />
  <select class="filter-bar__select" value=${category} onChange=${e => setCategory(e.target.value)}>
    <option value="">All categories</option>
    ${CATEGORIES.map(c => html\`<option key=${c} value=${c}>${c}</option>\`)}
  </select>
  <select class="filter-bar__select" value=${currency} onChange=${e => setCurrency(e.target.value)}>
    <option value="">All currencies</option>
    ${CURRENCIES.map(c => html\`<option key=${c} value=${c}>${c}</option>\`)}
  </select>
  <select class="filter-bar__select" value=${entity} onChange=${e => setEntity(e.target.value)}>
    <option value="">All entities</option>
    ${ENTITIES.map(e => html\`<option key=${e} value=${e}>${e}</option>\`)}
  </select>
  <label class="filter-bar__toggle">
    <input
      type="checkbox"
      checked=${showArchived}
      onChange=${e => setShowArchived(e.target.checked)}
    />
    Show archived
  </label>
  ${hasFilters && html\`
    <button class="btn btn--ghost btn--sm"
      onClick=${() => { setSearch(''); setCategory(''); setCurrency(''); setEntity(''); }}>
      Clear filters
    </button>
  \`}
</div>`
```

Note: the CATEGORIES, CURRENCIES, ENTITIES constants already exist in `inventory-view.js` — copy them to the top of `decisions-view.js`.

### handleSave dispatch (copy from inventory-view.js)

```js
function handleSave({ subscription, costAssumption }) {
  dispatch({ type: 'SUBSCRIPTION_SAVED', payload: { subscription, costAssumption } });
  setShowForm(false);
  setEditTarget(null);
}
```

### handleArchive dispatch (copy from inventory-view.js)

```js
function handleArchive(id) {
  if (confirm('Archive this subscription? Historical data and assumptions are preserved.')) {
    dispatch({ type: 'SUBSCRIPTION_ARCHIVED', payload: id });
  }
}
```

### filteredSubs logic (mirrors inventory-view.js filter)

```js
const filteredSubs = useMemo(() => {
  return allSubs.filter(s => {
    if (!showArchived && s.status === 'archived') return false;
    const text = search.toLowerCase();
    if (text && !s.vendor.toLowerCase().includes(text) && !s.product.toLowerCase().includes(text)) return false;
    if (category && s.category !== category) return false;
    if (currency && s.currency !== currency) return false;
    if (entity   && s.billing_entity !== entity) return false;
    return true;
  });
}, [allSubs, search, category, currency, entity, showArchived]);
```

### Count indicator update

The existing count in the page-header is:
```js
<span class="page-header__count">${subs.length} subscription${subs.length !== 1 ? 's' : ''}</span>
```

Change to reflect filtered state:
```js
const hasFilters = search || category || currency || entity;
// ...
<span class="page-header__count">
  ${filteredSubs.length} subscription${filteredSubs.length !== 1 ? 's' : ''}
  ${hasFilters ? ' (filtered)' : ''}
</span>
```

### Technical stack reminders

- `const { html, useMemo, useState } = window.__WWCT__` — always from here
- `style=${{ ... }}` for inline styles (object, not string)
- `SUBSCRIPTION_SAVED` payload shape: `{ subscription, costAssumption }` — match exactly as in inventory-view.js
- `SUBSCRIPTION_ARCHIVED` payload: just the subscription id string

### Empty state guard

The current empty-state guard in `DecisionsView`:
```js
if (subs.length === 0) {
  return html`
    <div class="page-header">...</div>
    <div class="empty-state">Load a workbook to view decisions.</div>
  `;
}
```
Keep this check using `subs` (unfiltered non-archived). Even if `filteredSubs` is empty (all filtered out), the full view should still render.

### Column width arithmetic — must sum to 100%

Current 4-column `decisions__table` (company/bespoke) — **before** this story:
- `.decisions__sub-col`: 50%
- `.subs__detail-col`: ~25% (inferred)
- `.decisions__saving-col`: 25%
- `.decisions__toggle-col`: 25%
Total = ~125% — this means the widths were set as "hints" not strict; the browser accommodates. After adding a 5th column, set explicit values that sum to 100%.

Current 6-column `decisions__table--cohort` (cohort) — post-4.9 CSS fix:
- `.decisions__table--cohort .decisions__sub-col`: 36%
- `.decisions__rate-col`: 10%
- `.decisions__seats-col`: 10%
- `.decisions__unitcost-col`: 18%
- `.decisions__table--cohort .decisions__saving-col`: 13%
- `.decisions__table--cohort .decisions__toggle-col`: 13%
Total = 100%

When adding a 7th column (actions at ~10%), reduce existing columns proportionally. The suggested widths in Task 6 are a starting point — verify they sum to 100%.

### Existing CSS for filter-bar (already present in app.css)

The `.filter-bar`, `.filter-bar__search`, `.filter-bar__select`, `.filter-bar__toggle` classes already exist in `app.css` from the Inventory view. No new filter-bar CSS needed.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Added CATEGORIES, CURRENCIES, ENTITIES constants to decisions-view.js (copied from inventory-view.js)
- Added SubscriptionForm and AssumptionMarker imports
- Split subs derivation into allSubs (unfiltered) → subs (non-archived, for summary strip) → filteredSubs (search/filter/archived applied, for group tables)
- Added showForm, editTarget, search, category, currency, entity, showArchived state; handleSave and handleArchive handlers
- Added filter bar (after page-header, before summary) and SubscriptionForm dialog conditional render
- Added Add subscription button to page-header; updated count indicator to show filteredSubs.length with (filtered) label
- Added 5th actions column (onEdit/onArchive) to SubscriptionGroup and SubRow
- Added 7th actions column (onEdit/onArchive) to CohortSubscriptionGroup and CohortSubRow
- Removed InventoryView import, `/inventory` route case, and `/inventory` resolveRoute entry from app.js
- Removed Inventory nav link from nav-bar.js
- Added decisions__actions-col, decisions__actions-cell, decisions__archive-btn CSS classes
- Rebalanced all column widths (5-col company/bespoke: 42+22+14+14+8=100%; 7-col cohort: 32+9+9+16+12+12+10=100%)

### File List

- `cost-tracker/src/components/decisions/decisions-view.js`
- `cost-tracker/src/app.js`
- `cost-tracker/src/components/shell/nav-bar.js`
- `cost-tracker/public/css/app.css`

## Change Log

- 2026-05-14: Story created — absorb #/inventory into #/decisions (Subscriptions); user request to consolidate subscription management into one view
- 2026-05-14: Story implemented — all 6 tasks complete; status set to review
