# Cost Tracker — UX Issues Log

## UX-01: Override form exposes total, not variables

**Observed:** 2026-05-14, smoke test of 2-2 (manual forecast override)  
**Screen:** Cost Register → click forecast cell → Override forecast dialog

**Issue:**  
The override form shows the computed monthly total (e.g. AUD 918.00) as a single editable field. For formula-driven rows, this total is derived from inputs (bundle rate, seat count × unit cost, FX rate, etc.). Overriding the total discards that structure.

**What users expect:**  
When a cell's forecast is driven by specific variables (e.g. HubSpot: bundle rate + cohort seats × per-seat rate; Miro: headcount × attribution × unit cost × FX), the edit surface should let them adjust those variables directly — changing an assumption that flows to all months — rather than stamping a one-off total that becomes stale as other inputs change.

**Impact:**  
- Overrides created this way need re-overriding every month, defeating the model
- The assumption key (`subscription.<id>.monthly_override.<yyyy_mm>`) records a total with no connection to the underlying drivers
- Particularly misleading for HubSpot post-Nov 2026, where the total changes month-by-month due to cohort additions

**Suggested direction (do not implement without scoping):**  
Rather than a generic "enter a number" form, the override surface should expose the key input assumptions for that subscription type with their current values editable inline, plus a rationale field. The resulting change would supersede the relevant assumption (e.g. a specific cohort's seat count or the renewal rate) rather than write a month-specific override total.

**Workaround in current build:**  
Users can open the Decision Drawer on any assumption marker and use "Propose new value" to change a specific assumption. This works but is not discoverable from the cell click flow.

---

## UX-02: Source field required on override form — may be too strict

**Observed:** 2026-05-14, smoke test of 2-2  
**Screen:** Cost Register → Override forecast dialog

**Issue:**  
The override form requires both Rationale and Source before submitting. For quick modelling adjustments (e.g. testing a different rate, what-if scenarios), forcing a cited source creates friction. Source is meaningful when recording an actual or a formally agreed number, but less so for exploratory overrides.

**Relationship to UX-01:**  
If the override surface is redesigned to edit underlying assumption variables (UX-01), the source requirement becomes more appropriate at the assumption level, not the cell level. Resolve UX-01 first and then reconsider whether source is still needed on the resulting form.

**Suggested direction (do not implement without scoping):**  
Make Source optional on the override form, or distinguish between "exploratory" (no source needed, low confidence auto-set) and "confirmed" overrides (source required, high confidence).
