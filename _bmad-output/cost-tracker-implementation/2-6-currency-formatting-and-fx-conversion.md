---
story_key: 2-6-currency-formatting-and-fx-conversion
status: review
epic: 2
story_number: 2.6
---

# Story 2.6: Currency formatting and FX conversion

## Story

As any user,
I want all costs displayed in AUD with the FX conversion happening behind the scenes,
So that the dashboard makes sense to a finance audience without me thinking about currency.

## Acceptance Criteria

**Given** a subscription has currency USD, EUR, or GBP,
**When** its monthly cost is rendered,
**Then** the displayed value is converted to AUD using the FX rate Assumption (e.g. `scenario.fx_rate.aud_usd`).
**And** HubSpot subscriptions billed in AUD direct skip the FX conversion (no double-conversion bug).
**And** the FX rate is editable as an Assumption with rationale.
**And** the underlying native-currency value is preserved in `cost_native`; the displayed AUD value is computed.

## Tasks/Subtasks

- [x] Task 1: Add EUR and GBP FX rate assumptions to seed workbook
- [x] Task 2: Update `compute.js` to handle EUR/GBP via `scenario.fx_rate.aud_<currency>` assumptions
  - [x] Refactor FX conversion into `toAud(nativeAmount, currency, assumptions)` helper
  - [x] Return `{ value, nativeValue, nativeCurrency, primaryAssumptionKey }` from `computeForecast`
  - [x] HubSpot: already bypasses FX (uses bundle_annual_aud directly) — no change needed, add assertion comment
- [x] Task 3: Show native currency value in grid cell title attribute for non-AUD subscriptions
- [x] Task 4: Update `docs/assumption-key-namespace.md` to document FX rate key convention

## Dev Notes

- FX convention: `scenario.fx_rate.aud_<iso>` value = AUD/FCY rate (how many FCY per 1 AUD). To convert FCY→AUD: amount / rate
  - Example: `scenario.fx_rate.aud_usd = 0.645` means 1 AUD = 0.645 USD → 1 USD = 1/0.645 ≈ 1.55 AUD
  - EUR: `scenario.fx_rate.aud_eur` ≈ 0.58 (indicative, placeholder confidence)
  - GBP: `scenario.fx_rate.aud_gbp` ≈ 0.50 (indicative, placeholder confidence)
- HubSpot: `sub-hubspot` check in computeForecast already routes to AUD-direct bundle cost — this MUST NOT receive FX treatment
- `nativeValue` in computeForecast return is only meaningful for non-AUD currencies; for AUD subscriptions nativeValue === value
- Native value display: cell title attribute showing "USD 464.00" on hover for USD-billed cells
- No EUR or GBP subscriptions in current seed — EUR/GBP support is infrastructure for future additions

## Dev Agent Record

### Implementation Plan

1. Add EUR/GBP seed assumptions
2. Refactor compute.js FX helper, update return shape
3. Update CostCell to show native value in title
4. Update assumption-key-namespace.md

### Debug Log

FX conversion verified: Miro (USD, cohort_driven). With aud_usd = 0.645, 86 IEs × 0.333 attr = 29 seats, 29 × USD 16 = USD 464 native, USD 464 / 0.645 = AUD 719.38. Matches Apr 2026 Xero actual. HubSpot bypassed — bundle_annual_aud = 11016 / 12 = AUD 918/month, no FX path taken.

### Completion Notes

All ACs satisfied. `toAud(nativeAmount, currency, assumptions)` helper centralises FX logic using `scenario.fx_rate.aud_<iso>` convention. `computeForecast` now returns `{ value, nativeValue, nativeCurrency, primaryAssumptionKey }`. HubSpot bypass is explicitly commented. EUR/GBP assumptions seeded as low-confidence indicative placeholders (no live EUR/GBP subs in current inventory). `CostCell` shows native currency on hover (e.g. "USD 464.00 — click to override forecast") for non-AUD cells. `docs/assumption-key-namespace.md` created documenting all namespace prefixes and FX rate convention. AUD subscriptions: nativeValue === value. No double-conversion risk for HubSpot (confirmed by comment in compute.js and bypass check on id === 'sub-hubspot').

## File List

- cost-tracker/src/state/compute.js
- cost-tracker/src/components/cost-register/cost-register-view.js
- cost-tracker/seed/workbook-seed.json
- cost-tracker/docs/assumption-key-namespace.md
- _bmad-output/cost-tracker-implementation/2-6-currency-formatting-and-fx-conversion.md
- _bmad-output/cost-tracker-implementation/sprint-status.yaml

## Change Log

| Date | Change |
|---|---|
| 2026-05-13 | Story created, implementation started |
| 2026-05-13 | All tasks complete, all ACs verified, status set to review |
