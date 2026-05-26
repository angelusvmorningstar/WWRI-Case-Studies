const { html, useMemo, useState } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { lookupValue, createAssumption, resolveAssumption, buildSupersessionPayload, STATUS } from '../../state/assumptions.js';
import { fmt } from '../../shared/format.js';
import { AssumptionMarker } from '../provenance/assumption-marker.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toAudUnitCost(sub, assumptions) {
  const unitCost = lookupValue(assumptions, sub.unit_cost_assumption_key, 0);
  if (sub.currency === 'AUD') return unitCost;
  const fxKey  = 'scenario.fx_rate.aud_' + sub.currency.toLowerCase();
  const fxRate = lookupValue(assumptions, fxKey, 1);
  return fxRate > 0 ? unitCost / fxRate : unitCost;
}

function perIECost(sub, assumptions) {
  const unitAud  = toAudUnitCost(sub, assumptions);
  const attrRate = lookupValue(assumptions, sub.attribution_assumption_key, 0);
  return unitAud * attrRate;
}

// ── Attribution edit dialog ───────────────────────────────────────────────────

function AttributionEditDialog({ sub, assumptions, dispatch, onClose }) {
  const key          = sub.attribution_assumption_key;
  const currentRaw   = lookupValue(assumptions, key, 0);
  const currentPct   = Math.round(currentRaw * 1000) / 10;
  const [pct, setPct]         = useState(String(currentPct));
  const [rationale, setRat]   = useState('');
  const [source, setSrc]      = useState('');
  const [errors, setErrors]   = useState({});

  function handleOverlayClick(e) { if (e.target === e.currentTarget) onClose(); }

  function handleSubmit(e) {
    e.preventDefault();
    const parsed = parseFloat(pct);
    const errs = {};
    if (isNaN(parsed) || parsed < 0 || parsed > 100) errs.pct = 'Enter a percentage between 0 and 100';
    if (!rationale.trim()) errs.rationale = 'Rationale is required';
    if (!source.trim())    errs.source    = 'Source is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const stored = parsed / 100;
    const existing = Object.values(assumptions).find(a => a.key === key);
    if (existing) {
      dispatch({
        type: 'ASSUMPTION_UPDATED',
        payload: {
          ...existing,
          value: stored,
          status: STATUS.RESOLVED,
          rationale: rationale.trim(),
          source: source.trim(),
          decided_on: new Date().toISOString(),
        },
      });
    } else {
      const draft = createAssumption({
        key,
        label: `${sub.vendor} ${sub.product} — IE attribution rate`,
        value: stored,
        unit: 'proportion',
        category: 'Subscription costing',
        rationale: rationale.trim(),
        source: source.trim(),
        confidence: 'medium',
      });
      dispatch({ type: 'ASSUMPTION_PROPOSED', payload: resolveAssumption(draft, { rationale: rationale.trim(), source: source.trim() }) });
    }
    onClose();
  }

  return html`
    <div class="dialog-overlay" onClick=${handleOverlayClick}>
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="attr-edit-title">
        <h2 class="dialog__title" id="attr-edit-title">Edit attribution — ${sub.vendor} ${sub.product}</h2>
        <p class="dialog__body">
          What proportion of newly onboarded IEs will use this subscription?
          Current: <strong>${currentPct}%</strong>
        </p>
        <form onSubmit=${handleSubmit}>
          <div class="field" style=${{ marginBottom: 'var(--space-3)' }}>
            <label class="field__label" for="attr-pct">Attribution rate (%) <span class="field__required">*</span></label>
            <input
              id="attr-pct"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="field__input"
              value=${pct}
              onInput=${e => { setPct(e.target.value); setErrors(p => ({ ...p, pct: '' })); }}
              autoFocus
            />
            ${errors.pct && html`<span class="field__error">${errors.pct}</span>`}
          </div>
          <div class="field" style=${{ marginBottom: 'var(--space-3)' }}>
            <label class="field__label" for="attr-rationale">Rationale <span class="field__required">*</span></label>
            <textarea
              id="attr-rationale"
              class="field__input"
              rows="3"
              placeholder="Why is this the right attribution rate?"
              value=${rationale}
              onInput=${e => { setRat(e.target.value); setErrors(p => ({ ...p, rationale: '' })); }}
            ></textarea>
            ${errors.rationale && html`<span class="field__error">${errors.rationale}</span>`}
          </div>
          <div class="field" style=${{ marginBottom: 'var(--space-4)' }}>
            <label class="field__label" for="attr-source">Source <span class="field__required">*</span></label>
            <input
              id="attr-source"
              type="text"
              class="field__input"
              placeholder="e.g. Ops meeting 2026-05-20 (Niel Malan)"
              value=${source}
              onInput=${e => { setSrc(e.target.value); setErrors(p => ({ ...p, source: '' })); }}
            />
            ${errors.source && html`<span class="field__error">${errors.source}</span>`}
          </div>
          <div class="dialog__actions">
            <button type="button" class="btn btn--ghost" onClick=${onClose}>Cancel</button>
            <button type="submit" class="btn btn--primary">Save attribution</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function PerIECostsView() {
  const { workbook, dispatch } = useWorkbook();
  const assumptions = workbook.assumptions || {};
  const [editingSub, setEditingSub] = useState(null);

  const allSubs = useMemo(
    () => Object.values(workbook.subscriptions || {}).filter(s => s.status !== 'archived'),
    [workbook.subscriptions],
  );

  const cohortSubs = useMemo(
    () => allSubs.filter(s => s.cohort_driven),
    [allSubs],
  );

  const companySubs = useMemo(
    () => allSubs.filter(s => !s.cohort_driven),
    [allSubs],
  );

  const totalPerIE = useMemo(
    () => cohortSubs.reduce((sum, s) => sum + perIECost(s, assumptions), 0),
    [cohortSubs, assumptions],
  );

  if (allSubs.length === 0) {
    return html`
      <div class="page-header"><h1 class="page-header__title">Per-IE Costs</h1></div>
      <div class="empty-state">Load a workbook to view Per-IE Costs.</div>
    `;
  }

  return html`
    <div class="per-ie-costs-page">
      <div class="page-header">
        <h1 class="page-header__title">Per-IE Costs</h1>
        <span class="page-header__count">${cohortSubs.length} IE-linked subscription${cohortSubs.length !== 1 ? 's' : ''}</span>
      </div>

      <section class="panel per-ie-costs__panel">
        <h2 class="panel__title">IE-linked subscriptions</h2>
        <p class="per-ie-costs__hint text-muted">Click an attribution rate to edit it. Rationale and source required.</p>

        <div class="table-wrapper">
          <table class="data-table per-ie-costs__table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Product</th>
                <th>Unit cost</th>
                <th>Currency</th>
                <th class="per-ie-costs__col-attr">Attribution</th>
                <th class="per-ie-costs__col-cost">Cost / IE / mo</th>
              </tr>
            </thead>
            <tbody>
              ${cohortSubs.map(sub => {
                const attrRaw  = lookupValue(assumptions, sub.attribution_assumption_key, 0);
                const attrPct  = Math.round(attrRaw * 1000) / 10;
                const costPerIE = perIECost(sub, assumptions);
                const isPending = (() => {
                  const a = Object.values(assumptions).find(x => x.key === sub.attribution_assumption_key);
                  return a?.status === 'Pending' || a?.status === 'pending';
                })();

                return html`
                  <tr key=${sub.id} class="per-ie-costs__row">
                    <td class="per-ie-costs__vendor">${sub.vendor}</td>
                    <td class="per-ie-costs__product">
                      ${sub.product}
                      ${isPending && html`<span class="badge badge--pending" style=${{ marginLeft: '6px' }}>Pending</span>`}
                    </td>
                    <td>
                      ${sub.unit_cost_assumption_key
                        ? html`<${AssumptionMarker} assumptionKey=${sub.unit_cost_assumption_key}>
                            <span>${lookupValue(assumptions, sub.unit_cost_assumption_key, '—')}</span>
                          <//>`
                        : '—'
                      }
                    </td>
                    <td>${sub.currency}</td>
                    <td class="per-ie-costs__col-attr">
                      <button
                        class="per-ie-costs__attr-btn"
                        onClick=${() => setEditingSub(sub)}
                        title="Click to edit attribution rate"
                      >
                        ${attrPct}%
                      </button>
                    </td>
                    <td class=${'per-ie-costs__col-cost' + (costPerIE === 0 ? ' text-muted' : '')}>
                      ${costPerIE === 0 ? '—' : fmt.aud(costPerIE)}
                    </td>
                  </tr>
                `;
              })}
            </tbody>
            <tfoot>
              <tr class="per-ie-costs__total-row">
                <td colspan="5" class="per-ie-costs__total-label">Cost per additional IE / month</td>
                <td class="per-ie-costs__total-value">${fmt.aud(totalPerIE)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section class="panel per-ie-costs__company-panel">
        <h2 class="panel__title">Platform subscriptions (not IE-linked)</h2>
        <div class="table-wrapper">
          <table class="data-table per-ie-costs__company-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Product</th>
                <th>Unit cost</th>
                <th>Currency</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              ${companySubs.map(sub => html`
                <tr key=${sub.id}>
                  <td>${sub.vendor}</td>
                  <td>${sub.product}</td>
                  <td>
                    ${sub.unit_cost_assumption_key
                      ? html`<${AssumptionMarker} assumptionKey=${sub.unit_cost_assumption_key}>
                          <span>${lookupValue(assumptions, sub.unit_cost_assumption_key, '—')}</span>
                        <//>`
                      : '—'
                    }
                  </td>
                  <td>${sub.currency}</td>
                  <td>${sub.subscription_type || '—'}</td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </section>

      ${editingSub && html`
        <${AttributionEditDialog}
          sub=${editingSub}
          assumptions=${assumptions}
          dispatch=${dispatch}
          onClose=${() => setEditingSub(null)}
        />
      `}
    </div>
  `;
}
