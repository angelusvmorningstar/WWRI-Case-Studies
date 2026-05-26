---
story_key: 4-2-discount-slider-for-renewal-modelling
status: review
epic: 4
story_number: 4.2
---

# Story 4.2: Discount slider for renewal modelling

## Story

As Niel (strategic contributor),
I want a discount slider that flexes the HubSpot pricing,
So that I can model "what if we keep 50%" vs "we drop to 40% on auto-renewal."

## Acceptance Criteria

**Given** the HubSpot comparison is rendered,
**When** I drag the discount slider (range 0–60%, default from `hubspot.discount_rate` assumption),
**Then** all four architecture columns recalculate within 1 second.
**And** the current slider value is shown numerically alongside the slider.
**And** the slider value is backed by the `hubspot.discount_rate` assumption — the resolved value is the default starting position.

## Tasks/Subtasks

- [x] Task 1: Update `hubspot-arch-compute.js` to accept optional discount override
  - [x] Change signature to `computeArchitectureMetrics(assumptions, scenario, discountOverride = null)`
  - [x] Use `discountOverride ?? lookupValue(assumptions, 'hubspot.discount_rate', 0.40)` as the effective discount rate
  - [x] No other changes to the compute logic
- [x] Task 2: Add slider UI to `hubspot-arch-view.js`
  - [x] Local `useState` for `discountPct` (integer 0–60), initialised from `lookupValue(assumptions, 'hubspot.discount_rate', 0.40) * 100`
  - [x] Pass `discountPct / 100` as `discountOverride` to `computeArchitectureMetrics` — include in `useMemo` deps
  - [x] Render a slider control above the architecture grid: label "Renewal discount", `<input type="range" min="0" max="60" step="1">`, numeric display of current value as e.g. "40%"
  - [x] Show the assumption provenance: small muted text "Assumption: `hubspot.discount_rate`" beneath the slider so Niel knows the locked value can be resolved via the Decision Drawer
- [x] Task 3: CSS for slider control in `public/css/app.css`
  - [x] `.hubspot-arch__slider-control` — flex row, align-items center, gap, margin-bottom
  - [x] `.hubspot-arch__slider-label` — font-size-sm, font-weight-medium
  - [x] `.hubspot-arch__slider` — flex 1, accent-color var(--color-primary)
  - [x] `.hubspot-arch__slider-value` — font-weight-semibold, min-width 40px, text-align right, tabular-nums
  - [x] `.hubspot-arch__slider-hint` — font-size-xs, color-text-muted, margin-top space-1

## Dev Notes

### Compute change — minimal

Only change signature + use of the override. Everything else in `hubspot-arch-compute.js` stays identical.

```js
export function computeArchitectureMetrics(assumptions, scenario, discountOverride = null) {
  const discount = discountOverride ?? lookupValue(assumptions, 'hubspot.discount_rate', 0.40);
  // ... rest unchanged
}
```

### View change — local state only

The slider does NOT dispatch to the workbook. It's a live modelling tool. Assumption `hubspot.discount_rate` provides the starting value; the formal "lock this in" path goes through the Decision Drawer (existing functionality).

```js
const [discountPct, setDiscountPct] = useState(
  () => Math.round(lookupValue(assumptions, 'hubspot.discount_rate', 0.40) * 100)
);

const architectures = useMemo(
  () => computeArchitectureMetrics(assumptions, scenario, discountPct / 100),
  [assumptions, scenario, discountPct],
);
```

### Slider HTML

```html
<div class="hubspot-arch__slider-control">
  <span class="hubspot-arch__slider-label">Renewal discount</span>
  <input
    class="hubspot-arch__slider"
    type="range" min="0" max="60" step="1"
    value=${discountPct}
    onInput=${e => setDiscountPct(Number(e.target.value))}
  />
  <span class="hubspot-arch__slider-value">${discountPct}%</span>
</div>
<p class="hubspot-arch__slider-hint">
  Assumption: hubspot.discount_rate (${lookupValue(assumptions, 'hubspot.discount_rate', 0.40) * 100}% resolved)
</p>
```

### No tests

No test framework configured — consistent with rest of project.

## Dev Agent Record

### Debug Log

No issues.

### Completion Notes

Slider uses local React state (integer 0–60) initialised from the resolved `hubspot.discount_rate` assumption. Passed as `discountOverride` to `computeArchitectureMetrics` which now accepts an optional third param — null falls back to the assumption value. All four architecture columns re-compute via `useMemo` whenever `discountPct` changes (instantaneous). Hint line shows the currently resolved assumption value so Niel knows what the "locked" baseline is vs. the live preview value. No workbook dispatch on drag — formal resolution remains through the Decision Drawer.

## File List

- `cost-tracker/src/components/hubspot-arch/hubspot-arch-compute.js` — added `discountOverride` param
- `cost-tracker/src/components/hubspot-arch/hubspot-arch-view.js` — slider state + UI added
- `cost-tracker/public/css/app.css` — slider CSS classes added

## Change Log

- 2026-05-14: Story created and implemented inline with dev-story workflow
