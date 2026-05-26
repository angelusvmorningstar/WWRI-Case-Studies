const { html, useState } = window.__WWCT__;
import { createAssumption, resolveAssumption } from '../../state/assumptions.js';
import { getAuthor } from '../../state/identity.js';

const CATEGORIES = [
  'Sales & Marketing', 'Productivity & IT',
  'Collaboration & Docs', 'Training & Development', 'Infrastructure',
];

const CURRENCIES = ['AUD', 'USD', 'EUR', 'GBP'];
const ENTITIES   = ['AU', 'EU', 'US'];

export function SubscriptionForm({ initial, onSave, onCancel }) {
  const editing = Boolean(initial?.id);

  const [fields, setFields] = useState({
    vendor:            initial?.vendor || '',
    product:           initial?.product || '',
    category:          initial?.category || CATEGORIES[0],
    currency:          initial?.currency || 'AUD',
    billing_entity:    initial?.billing_entity || 'AU',
    cardholder:        initial?.cardholder || '',
    tier:              initial?.tier || '',
    renewal_date:      initial?.renewal_date || '',
    status:            initial?.status || 'active',
    cohort_driven:     initial?.cohort_driven || false,
    subscription_type: initial?.subscription_type ?? 'cohort',
  });

  const [unitCost, setUnitCost] = useState('');
  const [rationale, setRationale] = useState('');
  const [source, setSource] = useState('');
  const [errors, setErrors] = useState({});

  function set(key, val) {
    setFields(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  }

  function validate() {
    const e = {};
    if (!fields.vendor.trim())  e.vendor  = 'Vendor is required.';
    if (!fields.product.trim()) e.product = 'Product is required.';
    if (!editing) {
      if (!unitCost || isNaN(Number(unitCost)) || Number(unitCost) <= 0)
        e.unitCost = 'A positive unit cost is required.';
      if (!rationale.trim()) e.rationale = 'Rationale is required.';
      if (!source.trim())    e.source    = 'Source is required.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const subId = initial?.id || crypto.randomUUID();
    const costKey = `subscription.${subId.slice(0, 8)}.unit_cost`;

    let costAssumption = null;
    if (!editing) {
      const draft = createAssumption({
        key:       costKey,
        label:     `${fields.vendor} ${fields.product} — unit cost`,
        value:     Number(unitCost),
        unit:      `${fields.currency}/seat/month`,
        category:  'Subscription cost',
        rationale,
        source,
      });
      costAssumption = resolveAssumption(draft, { rationale, source });
    }

    const subscription = {
      id:                subId,
      vendor:            fields.vendor.trim(),
      product:           fields.product.trim(),
      category:          fields.category,
      currency:          fields.currency,
      billing_entity:    fields.billing_entity,
      cardholder:        fields.cardholder.trim(),
      tier:              fields.tier.trim(),
      renewal_date:      fields.renewal_date || null,
      status:            fields.status,
      cohort_driven:     fields.cohort_driven,
      subscription_type: fields.subscription_type,
      unit_cost_assumption_key: costKey,
      ...(initial || {}),
    };

    onSave({ subscription, costAssumption });
  }

  return html`
    <div class="dialog-overlay" onClick=${onCancel} role="presentation">
      <div class="dialog dialog--wide" role="dialog" aria-modal="true"
           aria-labelledby="sub-form-title" onClick=${e => e.stopPropagation()}>
        <h2 class="dialog__title" id="sub-form-title">
          ${editing ? 'Edit subscription' : 'Add subscription'}
        </h2>
        <form onSubmit=${handleSubmit}>
          <div class="form-grid">
            <${Field} label="Vendor" error=${errors.vendor} required>
              <input class="field__input" value=${fields.vendor}
                onInput=${e => set('vendor', e.target.value)} />
            <//>
            <${Field} label="Product" error=${errors.product} required>
              <input class="field__input" value=${fields.product}
                onInput=${e => set('product', e.target.value)} />
            <//>
            <${Field} label="Subscription type" required>
              <select class="filter-bar__select" value=${fields.subscription_type}
                onChange=${e => set('subscription_type', e.target.value)}>
                <option value="cohort">Per IE (scales with cohort headcount)</option>
                <option value="bespoke">Bespoke (individual subscription)</option>
                <option value="company">Company (fixed seats)</option>
              </select>
            <//>
            <${Field} label="Category" required>
              <select class="filter-bar__select" value=${fields.category}
                onChange=${e => set('category', e.target.value)}>
                ${CATEGORIES.map(c => html`<option key=${c}>${c}</option>`)}
              </select>
            <//>
            <${Field} label="Currency" required>
              <select class="filter-bar__select" value=${fields.currency}
                onChange=${e => set('currency', e.target.value)}>
                ${CURRENCIES.map(c => html`<option key=${c}>${c}</option>`)}
              </select>
            <//>
            <${Field} label="Billing entity">
              <select class="filter-bar__select" value=${fields.billing_entity}
                onChange=${e => set('billing_entity', e.target.value)}>
                ${ENTITIES.map(e => html`<option key=${e}>${e}</option>`)}
              </select>
            <//>
            <${Field} label="Cardholder">
              <input class="field__input" value=${fields.cardholder}
                onInput=${e => set('cardholder', e.target.value)} />
            <//>
            <${Field} label="Tier">
              <input class="field__input" value=${fields.tier}
                onInput=${e => set('tier', e.target.value)} />
            <//>
            <${Field} label="Renewal date">
              <input class="field__input" type="date" value=${fields.renewal_date}
                onInput=${e => set('renewal_date', e.target.value)} />
            <//>
          </div>

          ${!editing && html`
            <div class="form-section">
              <h3 class="form-section__title">Unit cost (required for new subscriptions)</h3>
              <div class="form-grid">
                <${Field} label="Unit cost" error=${errors.unitCost} required>
                  <input class="field__input" type="number" min="0" step="0.01"
                    value=${unitCost}
                    onInput=${e => { setUnitCost(e.target.value); setErrors(p => ({ ...p, unitCost: '' })); }}
                    placeholder="e.g. 10.10" />
                <//>
                <${Field} label="Rationale" error=${errors.rationale} required>
                  <input class="field__input" value=${rationale}
                    onInput=${e => { setRationale(e.target.value); setErrors(p => ({ ...p, rationale: '' })); }}
                    placeholder="Why this value?" />
                <//>
                <${Field} label="Source" error=${errors.source} required>
                  <input class="field__input" value=${source}
                    onInput=${e => { setSource(e.target.value); setErrors(p => ({ ...p, source: '' })); }}
                    placeholder="e.g. Vendor invoice, May 2026" />
                <//>
              </div>
            </div>
          `}

          <div class="dialog__actions">
            <button type="button" class="btn btn--ghost" onClick=${onCancel}>Cancel</button>
            <button type="submit" class="btn btn--primary">
              ${editing ? 'Save changes' : 'Add subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function Field({ label, error, required, children }) {
  return html`
    <div class="field">
      <label class="field__label">
        ${label}${required ? html`<span class="field__required"> *</span>` : ''}
      </label>
      ${children}
      ${error && html`<span class="field__error">${error}</span>`}
    </div>
  `;
}
