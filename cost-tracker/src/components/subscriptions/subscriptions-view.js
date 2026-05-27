const { html, useMemo, useState, useCallback } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { lookupValue, createAssumption, resolveAssumption, STATUS } from '../../state/assumptions.js';
import { fmt } from '../../shared/format.js';
import { AssumptionMarker } from '../provenance/assumption-marker.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toAudUnitCost(sub, assumptions) {
  const unitCost = lookupValue(assumptions, sub.unit_cost_assumption_key, 0);
  if (!sub.currency || sub.currency === 'AUD') return unitCost;
  const fxKey  = 'scenario.fx_rate.aud_' + sub.currency.toLowerCase();
  const fxRate = lookupValue(assumptions, fxKey, 1);
  return fxRate > 0 ? unitCost / fxRate : unitCost;
}

function perIECost(sub, assumptions) {
  const unitAud  = toAudUnitCost(sub, assumptions);
  const attrRate = lookupValue(assumptions, sub.attribution_assumption_key, 0);
  return unitAud * attrRate;
}

function fmtRenewal(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function billingLabel(cycle) {
  if (!cycle) return '—';
  return cycle === 'annual' ? 'Annual' : 'Monthly';
}

function pendingStatus(assumptions, key) {
  const a = Object.values(assumptions).find(x => x.key === key);
  return a?.status === 'Pending' || a?.status === 'pending';
}

function genId() {
  return 'sub-' + Math.random().toString(36).slice(2, 10);
}

// ── Attribution edit dialog ───────────────────────────────────────────────────

function AttributionEditDialog({ sub, assumptions, dispatch, onClose }) {
  const key        = sub.attribution_assumption_key;
  const currentRaw = lookupValue(assumptions, key, 0);
  const currentPct = Math.round(currentRaw * 1000) / 10;
  const [pct, setPct]       = useState(String(currentPct));
  const [rationale, setRat] = useState('');
  const [source, setSrc]    = useState('');
  const [errors, setErrors] = useState({});

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
        payload: { ...existing, value: stored, status: STATUS.RESOLVED, rationale: rationale.trim(), source: source.trim(), decided_on: new Date().toISOString() },
      });
    } else {
      const draft = createAssumption({ key, label: `${sub.vendor} ${sub.product} — IE attribution rate`, value: stored, unit: 'proportion', category: 'Subscription costing', rationale: rationale.trim(), source: source.trim(), confidence: 'medium' });
      dispatch({ type: 'ASSUMPTION_PROPOSED', payload: resolveAssumption(draft, { rationale: rationale.trim(), source: source.trim() }) });
    }
    onClose();
  }

  return html`
    <div class="dialog-overlay" onClick=${handleOverlayClick}>
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="attr-edit-title">
        <h2 class="dialog__title" id="attr-edit-title">Edit attribution — ${sub.vendor} ${sub.product}</h2>
        <p class="dialog__body">What proportion of newly onboarded IEs will use this subscription? Current: <strong>${currentPct}%</strong></p>
        <form onSubmit=${handleSubmit}>
          <div class="field" style=${{ marginBottom: 'var(--space-3)' }}>
            <label class="field__label" for="attr-pct">Attribution rate (%) <span class="field__required">*</span></label>
            <input id="attr-pct" type="number" min="0" max="100" step="0.1" class="field__input"
              value=${pct} onInput=${e => { setPct(e.target.value); setErrors(p => ({ ...p, pct: '' })); }} autoFocus />
            ${errors.pct && html`<span class="field__error">${errors.pct}</span>`}
          </div>
          <div class="field" style=${{ marginBottom: 'var(--space-3)' }}>
            <label class="field__label" for="attr-rationale">Rationale <span class="field__required">*</span></label>
            <textarea id="attr-rationale" class="field__input" rows="3" placeholder="Why is this the right attribution rate?"
              value=${rationale} onInput=${e => { setRat(e.target.value); setErrors(p => ({ ...p, rationale: '' })); }}></textarea>
            ${errors.rationale && html`<span class="field__error">${errors.rationale}</span>`}
          </div>
          <div class="field" style=${{ marginBottom: 'var(--space-4)' }}>
            <label class="field__label" for="attr-source">Source <span class="field__required">*</span></label>
            <input id="attr-source" type="text" class="field__input" placeholder="e.g. Ops meeting 2026-05-20 (Niel Malan)"
              value=${source} onInput=${e => { setSrc(e.target.value); setErrors(p => ({ ...p, source: '' })); }} />
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

// ── Sub edit dialog (used for both Add and Edit) ──────────────────────────────

const EMPTY_FORM = {
  vendor: '', product: '', category: 'Productivity & IT', currency: 'AUD',
  unit_cost: '', billing_cycle: 'monthly', renewal_date: '', end_date: '',
  cohort_driven: false, status: 'active',
  attribution_pct: '0', attribution_rationale: '', attribution_source: '',
};

function SubEditDialog({ existing, defaultCohort, assumptions, dispatch, onClose }) {
  const isNew = !existing;
  const [form, setForm] = useState(() => {
    if (isNew) return { ...EMPTY_FORM, cohort_driven: defaultCohort };
    return {
      vendor:                 existing.vendor || '',
      product:                existing.product || '',
      category:               existing.category || 'Productivity & IT',
      currency:               existing.currency || 'AUD',
      unit_cost:              existing.unit_cost_assumption_key ? String(lookupValue(assumptions, existing.unit_cost_assumption_key, '')) : '',
      billing_cycle:          existing.billing_cycle || 'monthly',
      renewal_date:           existing.renewal_date || '',
      end_date:               existing.end_date || '',
      cohort_driven:          !!existing.cohort_driven,
      status:                 existing.status || 'active',
      attribution_pct:        existing.attribution_assumption_key ? String(Math.round(lookupValue(assumptions, existing.attribution_assumption_key, 0) * 1000) / 10) : '0',
      attribution_rationale:  '',
      attribution_source:     '',
    };
  });
  const [errors, setErrors] = useState({});

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); setErrors(e => ({ ...e, [field]: '' })); }

  function validate() {
    const errs = {};
    if (!form.vendor.trim())  errs.vendor  = 'Required';
    if (!form.product.trim()) errs.product = 'Required';
    const cost = parseFloat(form.unit_cost);
    if (form.unit_cost !== '' && (isNaN(cost) || cost < 0)) errs.unit_cost = 'Enter a valid number';
    if (form.cohort_driven) {
      const attr = parseFloat(form.attribution_pct);
      if (isNaN(attr) || attr < 0 || attr > 100) errs.attribution_pct = '0–100';
      if (isNew || form.attribution_pct !== String(Math.round(lookupValue(assumptions, existing?.attribution_assumption_key, 0) * 1000) / 10)) {
        if (form.cohort_driven && !form.attribution_rationale.trim()) errs.attribution_rationale = 'Required';
        if (form.cohort_driven && !form.attribution_source.trim())    errs.attribution_source    = 'Required';
      }
    }
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const id = existing?.id || genId();
    const costKey   = `subscription.${id.replace('sub-', '')}.unit_cost`;
    const attrKey   = `subscription.${id.replace('sub-', '')}.attribution_rate`;
    const cost      = form.unit_cost !== '' ? parseFloat(form.unit_cost) : null;

    // Build subscription object
    const sub = {
      ...(existing || {}),
      id,
      vendor:                  form.vendor.trim(),
      product:                 form.product.trim(),
      category:                form.category,
      currency:                form.currency,
      cohort_driven:           form.cohort_driven,
      billing_cycle:           form.billing_cycle || null,
      renewal_date:            form.renewal_date || null,
      end_date:                form.end_date || null,
      status:                  form.status,
      unit_cost_assumption_key: cost !== null ? (existing?.unit_cost_assumption_key || costKey) : (existing?.unit_cost_assumption_key || null),
      attribution_assumption_key: form.cohort_driven ? (existing?.attribution_assumption_key || attrKey) : null,
    };

    // Build cost assumption if cost provided
    let costAssumption = null;
    if (cost !== null) {
      const cKey = sub.unit_cost_assumption_key;
      const cExisting = Object.values(assumptions).find(a => a.key === cKey);
      if (cExisting) {
        costAssumption = { ...cExisting, value: cost, status: STATUS.RESOLVED, decided_on: new Date().toISOString() };
      } else {
        costAssumption = { id: 'a-' + id.replace('sub-', '') + '-cost', key: cKey, label: `${form.vendor.trim()} ${form.product.trim()} — unit cost`, value: cost, unit: form.currency + '/month', category: 'Subscription costing', status: STATUS.RESOLVED, author: 'Angelus', decided_on: new Date().toISOString(), rationale: 'Set on subscription creation', source: 'Manual entry', confidence: 'medium', supersedes: null, superseded_by: null };
      }
    }

    dispatch({ type: 'SUBSCRIPTION_SAVED', payload: { subscription: sub, costAssumption } });

    // Handle attribution assumption separately if IE-linked
    if (form.cohort_driven && form.attribution_rationale.trim()) {
      const aKey = sub.attribution_assumption_key;
      const stored = parseFloat(form.attribution_pct) / 100;
      const aExisting = Object.values(assumptions).find(a => a.key === aKey);
      if (aExisting) {
        dispatch({ type: 'ASSUMPTION_UPDATED', payload: { ...aExisting, value: stored, status: STATUS.RESOLVED, rationale: form.attribution_rationale.trim(), source: form.attribution_source.trim(), decided_on: new Date().toISOString() } });
      } else {
        const draft = createAssumption({ key: aKey, label: `${form.vendor.trim()} ${form.product.trim()} — IE attribution rate`, value: stored, unit: 'proportion', category: 'Subscription costing', rationale: form.attribution_rationale.trim(), source: form.attribution_source.trim(), confidence: 'medium' });
        dispatch({ type: 'ASSUMPTION_PROPOSED', payload: resolveAssumption(draft, { rationale: form.attribution_rationale.trim(), source: form.attribution_source.trim() }) });
      }
    }

    onClose();
  }

  function handleOverlayClick(e) { if (e.target === e.currentTarget) onClose(); }

  const showAttrProvenance = form.cohort_driven;

  return html`
    <div class="dialog-overlay" onClick=${handleOverlayClick}>
      <div class="dialog dialog--wide" role="dialog" aria-modal="true" aria-labelledby="sub-edit-title">
        <h2 class="dialog__title" id="sub-edit-title">${isNew ? 'Add subscription' : 'Edit subscription'}</h2>
        <form onSubmit=${handleSubmit}>

          <div class="sub-edit__row">
            <div class="field">
              <label class="field__label" for="se-vendor">Vendor <span class="field__required">*</span></label>
              <input id="se-vendor" type="text" class="field__input" value=${form.vendor} onInput=${e => set('vendor', e.target.value)} autoFocus />
              ${errors.vendor && html`<span class="field__error">${errors.vendor}</span>`}
            </div>
            <div class="field">
              <label class="field__label" for="se-product">Product <span class="field__required">*</span></label>
              <input id="se-product" type="text" class="field__input" value=${form.product} onInput=${e => set('product', e.target.value)} />
              ${errors.product && html`<span class="field__error">${errors.product}</span>`}
            </div>
          </div>

          <div class="sub-edit__row">
            <div class="field">
              <label class="field__label" for="se-category">Category</label>
              <select id="se-category" class="field__input" value=${form.category} onChange=${e => set('category', e.target.value)}>
                <option value="Productivity & IT">Productivity &amp; IT</option>
                <option value="Recruitment">Recruitment</option>
                <option value="Finance & Admin">Finance &amp; Admin</option>
                <option value="Sales & CRM">Sales &amp; CRM</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="field">
              <label class="field__label" for="se-currency">Currency</label>
              <select id="se-currency" class="field__input" value=${form.currency} onChange=${e => set('currency', e.target.value)}>
                <option value="AUD">AUD</option>
                <option value="USD">USD</option>
                <option value="NZD">NZD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          <div class="sub-edit__row">
            <div class="field">
              <label class="field__label" for="se-cost">Unit cost / month</label>
              <input id="se-cost" type="number" min="0" step="0.01" class="field__input" placeholder="e.g. 21.10"
                value=${form.unit_cost} onInput=${e => set('unit_cost', e.target.value)} />
              ${errors.unit_cost && html`<span class="field__error">${errors.unit_cost}</span>`}
            </div>
            <div class="field">
              <label class="field__label" for="se-billing">Billing cycle</label>
              <select id="se-billing" class="field__input" value=${form.billing_cycle} onChange=${e => set('billing_cycle', e.target.value)}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>

          <div class="sub-edit__row">
            <div class="field">
              <label class="field__label" for="se-renewal">Renewal date</label>
              <input id="se-renewal" type="date" class="field__input"
                value=${form.renewal_date} onInput=${e => set('renewal_date', e.target.value)} />
            </div>
            <div class="field">
              <label class="field__label" for="se-end">Subscription end date</label>
              <input id="se-end" type="date" class="field__input"
                value=${form.end_date} onInput=${e => set('end_date', e.target.value)} />
            </div>
          </div>

          <div class="field sub-edit__toggle-row">
            <label class="field__label">Type</label>
            <div class="sub-edit__toggle">
              <button type="button"
                class=${'sub-edit__type-btn' + (!form.cohort_driven ? ' sub-edit__type-btn--active' : '')}
                onClick=${() => set('cohort_driven', false)}>Platform (whole-of-company)</button>
              <button type="button"
                class=${'sub-edit__type-btn' + (form.cohort_driven ? ' sub-edit__type-btn--active' : '')}
                onClick=${() => set('cohort_driven', true)}>IE-linked (per cohort)</button>
            </div>
          </div>

          ${showAttrProvenance && html`
            <div class="sub-edit__attr-section">
              <div class="field">
                <label class="field__label" for="se-attr-pct">Attribution rate (% of IEs)</label>
                <input id="se-attr-pct" type="number" min="0" max="100" step="0.1" class="field__input"
                  value=${form.attribution_pct} onInput=${e => set('attribution_pct', e.target.value)} />
                ${errors.attribution_pct && html`<span class="field__error">${errors.attribution_pct}</span>`}
              </div>
              <p class="text-muted" style=${{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>
                If changing attribution, rationale and source are required.
              </p>
              <div class="sub-edit__row">
                <div class="field">
                  <label class="field__label" for="se-attr-rat">Rationale</label>
                  <textarea id="se-attr-rat" class="field__input" rows="2"
                    placeholder="Why this attribution rate?"
                    value=${form.attribution_rationale} onInput=${e => set('attribution_rationale', e.target.value)}></textarea>
                  ${errors.attribution_rationale && html`<span class="field__error">${errors.attribution_rationale}</span>`}
                </div>
                <div class="field">
                  <label class="field__label" for="se-attr-src">Source</label>
                  <input id="se-attr-src" type="text" class="field__input"
                    placeholder="e.g. Ops meeting 2026-05-27"
                    value=${form.attribution_source} onInput=${e => set('attribution_source', e.target.value)} />
                  ${errors.attribution_source && html`<span class="field__error">${errors.attribution_source}</span>`}
                </div>
              </div>
            </div>
          `}

          <div class="dialog__actions">
            <button type="button" class="btn btn--ghost" onClick=${onClose}>Cancel</button>
            <button type="submit" class="btn btn--primary">${isNew ? 'Add subscription' : 'Save changes'}</button>
          </div>

        </form>
      </div>
    </div>
  `;
}

// ── Confirm remove dialog ─────────────────────────────────────────────────────

function ConfirmRemoveDialog({ sub, dispatch, onClose }) {
  function handleOverlayClick(e) { if (e.target === e.currentTarget) onClose(); }
  function handleConfirm() {
    dispatch({ type: 'SUBSCRIPTION_ARCHIVED', payload: sub.id });
    onClose();
  }
  return html`
    <div class="dialog-overlay" onClick=${handleOverlayClick}>
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="remove-title">
        <h2 class="dialog__title" id="remove-title">Remove subscription?</h2>
        <p class="dialog__body">
          <strong>${sub.vendor} — ${sub.product}</strong> will be archived and removed from all views.
          Historical cost data is preserved.
        </p>
        <div class="dialog__actions">
          <button type="button" class="btn btn--ghost" onClick=${onClose}>Cancel</button>
          <button type="button" class="btn btn--danger" onClick=${handleConfirm}>Remove</button>
        </div>
      </div>
    </div>
  `;
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function SubscriptionsView() {
  const { workbook, dispatch } = useWorkbook();
  const assumptions = workbook.assumptions || {};

  const [editingSub, setEditingSub]     = useState(null);  // sub object → open AttributionEditDialog
  const [addingTo, setAddingTo]         = useState(null);  // 'ie' | 'platform' | null → SubEditDialog (new)
  const [editingFull, setEditingFull]   = useState(null);  // sub object → SubEditDialog (edit)
  const [removingSub, setRemovingSub]   = useState(null);  // sub object → ConfirmRemoveDialog

  const allSubs = useMemo(
    () => Object.values(workbook.subscriptions || {}).filter(s => s.status !== 'archived'),
    [workbook.subscriptions],
  );

  const cohortSubs  = useMemo(() => allSubs.filter(s => s.cohort_driven),  [allSubs]);
  const companySubs = useMemo(() => allSubs.filter(s => !s.cohort_driven), [allSubs]);

  const totalPerIE = useMemo(
    () => cohortSubs.reduce((sum, s) => sum + perIECost(s, assumptions), 0),
    [cohortSubs, assumptions],
  );

  const moveToCompany = useCallback((sub) => {
    dispatch({ type: 'SUBSCRIPTION_SAVED', payload: { subscription: { ...sub, cohort_driven: false } } });
  }, [dispatch]);

  const moveToIE = useCallback((sub) => {
    dispatch({ type: 'SUBSCRIPTION_SAVED', payload: { subscription: { ...sub, cohort_driven: true } } });
  }, [dispatch]);

  if (allSubs.length === 0) {
    return html`
      <div class="page-header"><h1 class="page-header__title">Subscriptions</h1></div>
      <div class="empty-state">Load a workbook to view subscriptions.</div>
    `;
  }

  return html`
    <div class="subscriptions-page">
      <div class="page-header">
        <h1 class="page-header__title">Subscriptions</h1>
      </div>

      <!-- IE-linked section -->
      <section class="panel subscriptions__panel">
        <div class="panel__header-row">
          <h2 class="panel__title">IE-linked subscriptions</h2>
          <button class="btn btn--sm btn--ghost" onClick=${() => setAddingTo('ie')}>+ Add</button>
        </div>
        <p class="subscriptions__hint text-muted">Click an attribution rate to edit it. Rationale and source required.</p>

        <div class="table-wrapper">
          <table class="data-table subscriptions__table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Product</th>
                <th>Unit cost</th>
                <th>Curr.</th>
                <th>Billing</th>
                <th>Renewal</th>
                <th>End date</th>
                <th class="subscriptions__col-attr">Attribution</th>
                <th class="subscriptions__col-cost">Cost / IE / mo</th>
                <th class="subscriptions__col-actions"></th>
              </tr>
            </thead>
            <tbody>
              ${cohortSubs.map(sub => {
                const attrRaw   = lookupValue(assumptions, sub.attribution_assumption_key, 0);
                const attrPct   = Math.round(attrRaw * 1000) / 10;
                const costPerIE = perIECost(sub, assumptions);
                const isPending = pendingStatus(assumptions, sub.attribution_assumption_key);

                return html`
                  <tr key=${sub.id} class="subscriptions__row">
                    <td class="subscriptions__vendor">${sub.vendor}</td>
                    <td class="subscriptions__product">
                      ${sub.product}
                      ${isPending && html`<span class="badge badge--pending" style=${{ marginLeft: '6px' }}>Pending</span>`}
                    </td>
                    <td>
                      ${sub.unit_cost_assumption_key
                        ? html`<${AssumptionMarker} assumptionKey=${sub.unit_cost_assumption_key}>
                            <span>${lookupValue(assumptions, sub.unit_cost_assumption_key, '—')}</span>
                          <//>`
                        : '—'}
                    </td>
                    <td>${sub.currency || '—'}</td>
                    <td>${billingLabel(sub.billing_cycle)}</td>
                    <td>${fmtRenewal(sub.renewal_date)}</td>
                    <td>${fmtRenewal(sub.end_date)}</td>
                    <td class="subscriptions__col-attr">
                      <button class="subscriptions__attr-btn" onClick=${() => setEditingSub(sub)} title="Edit attribution">
                        ${attrPct}%
                      </button>
                    </td>
                    <td class=${'subscriptions__col-cost' + (costPerIE === 0 ? ' text-muted' : '')}>
                      ${costPerIE === 0 ? '—' : fmt.aud(costPerIE)}
                    </td>
                    <td class="subscriptions__col-actions">
                      <button class="btn btn--xs btn--ghost" onClick=${() => setEditingFull(sub)} title="Edit">✎</button>
                      <button class="btn btn--xs btn--ghost" onClick=${() => moveToCompany(sub)} title="Move to Platform">↓ Platform</button>
                      <button class="btn btn--xs btn--danger-ghost" onClick=${() => setRemovingSub(sub)} title="Remove">✕</button>
                    </td>
                  </tr>
                `;
              })}
            </tbody>
            <tfoot>
              <tr class="subscriptions__total-row">
                <td colspan="8" class="subscriptions__total-label">Cost per additional IE / month</td>
                <td class="subscriptions__total-value">${fmt.aud(totalPerIE)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <!-- Platform section -->
      <section class="panel subscriptions__company-panel">
        <div class="panel__header-row">
          <h2 class="panel__title">Platform subscriptions</h2>
          <button class="btn btn--sm btn--ghost" onClick=${() => setAddingTo('platform')}>+ Add</button>
        </div>

        <div class="table-wrapper">
          <table class="data-table subscriptions__company-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Product</th>
                <th>Unit cost</th>
                <th>Curr.</th>
                <th>Billing</th>
                <th>Renewal</th>
                <th>End date</th>
                <th class="subscriptions__col-actions"></th>
              </tr>
            </thead>
            <tbody>
              ${companySubs.map(sub => html`
                <tr key=${sub.id} class="subscriptions__row">
                  <td>${sub.vendor}</td>
                  <td>${sub.product}</td>
                  <td>
                    ${sub.unit_cost_assumption_key
                      ? html`<${AssumptionMarker} assumptionKey=${sub.unit_cost_assumption_key}>
                          <span>${lookupValue(assumptions, sub.unit_cost_assumption_key, '—')}</span>
                        <//>`
                      : '—'}
                  </td>
                  <td>${sub.currency || '—'}</td>
                  <td>${billingLabel(sub.billing_cycle)}</td>
                  <td>${fmtRenewal(sub.renewal_date)}</td>
                  <td>${fmtRenewal(sub.end_date)}</td>
                  <td class="subscriptions__col-actions">
                    <button class="btn btn--xs btn--ghost" onClick=${() => setEditingFull(sub)} title="Edit">✎</button>
                    <button class="btn btn--xs btn--ghost" onClick=${() => moveToIE(sub)} title="Move to IE-linked">↑ IE-linked</button>
                    <button class="btn btn--xs btn--danger-ghost" onClick=${() => setRemovingSub(sub)} title="Remove">✕</button>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Dialogs -->
      ${editingSub && html`
        <${AttributionEditDialog} sub=${editingSub} assumptions=${assumptions} dispatch=${dispatch} onClose=${() => setEditingSub(null)} />
      `}
      ${addingTo && html`
        <${SubEditDialog} existing=${null} defaultCohort=${addingTo === 'ie'} assumptions=${assumptions} dispatch=${dispatch} onClose=${() => setAddingTo(null)} />
      `}
      ${editingFull && html`
        <${SubEditDialog} existing=${editingFull} defaultCohort=${editingFull.cohort_driven} assumptions=${assumptions} dispatch=${dispatch} onClose=${() => setEditingFull(null)} />
      `}
      ${removingSub && html`
        <${ConfirmRemoveDialog} sub=${removingSub} dispatch=${dispatch} onClose=${() => setRemovingSub(null)} />
      `}
    </div>
  `;
}
