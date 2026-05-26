const { html, useState, useMemo } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { lookupValue } from '../../state/assumptions.js';
import { fmt } from '../../shared/format.js';
import { SubscriptionForm } from './subscription-form.js';
import { AssumptionMarker } from '../provenance/assumption-marker.js';

const CATEGORIES = [
  'Sales & Marketing', 'Productivity & IT',
  'Collaboration & Docs', 'Training & Development', 'Infrastructure',
];

const STATUSES   = ['all', 'active', 'paused', 'cancelled', 'archived'];
const ENTITIES   = ['AU', 'EU', 'US'];
const CURRENCIES = ['AUD', 'USD', 'EUR', 'GBP'];

function UnitCostCell({ sub, assumptions }) {
  if (!sub.unit_cost_assumption_key) return html`<span class="text-muted">--</span>`;
  const val = lookupValue(assumptions, sub.unit_cost_assumption_key);
  const display = val !== null
    ? (sub.currency === 'AUD' ? fmt.aud2(val) : val + ' ' + sub.currency)
    : '--';
  return html`
    <${AssumptionMarker} assumptionKey=${sub.unit_cost_assumption_key}>
      <span>${display}</span>
    <//>
  `;
}

function isWithin90Days(isoDate) {
  const diff = new Date(isoDate) - new Date();
  return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
}

export function InventoryView() {
  const { workbook, dispatch } = useWorkbook();
  const subs = Object.values(workbook.subscriptions || {});
  const assumptions = workbook.assumptions || {};

  const [search,       setSearch]       = useState('');
  const [category,     setCategory]     = useState('');
  const [currency,     setCurrency]     = useState('');
  const [entity,       setEntity]       = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);

  const filtered = useMemo(() => {
    return subs.filter(s => {
      if (!showArchived && s.status === 'archived') return false;
      const text = search.toLowerCase();
      if (text && !s.vendor.toLowerCase().includes(text) && !s.product.toLowerCase().includes(text)) return false;
      if (category && s.category !== category) return false;
      if (currency && s.currency !== currency) return false;
      if (entity   && s.billing_entity !== entity) return false;
      return true;
    });
  }, [subs, search, category, currency, entity, showArchived]);

  const hasFilters = search || category || currency || entity;

  function handleSave({ subscription, costAssumption }) {
    dispatch({ type: 'SUBSCRIPTION_SAVED', payload: { subscription, costAssumption } });
    setShowForm(false);
    setEditTarget(null);
  }

  function handleArchive(id) {
    if (confirm('Archive this subscription? Historical data and assumptions are preserved.')) {
      dispatch({ type: 'SUBSCRIPTION_ARCHIVED', payload: id });
    }
  }

  return html`
    <div class="inventory-view">
      ${showForm && html`
        <${SubscriptionForm}
          initial=${editTarget}
          onSave=${handleSave}
          onCancel=${() => { setShowForm(false); setEditTarget(null); }}
        />
      `}

      <div class="page-header">
        <h1 class="page-header__title">Subscription inventory</h1>
        <div class="page-header__count">
          ${filtered.length} subscription${filtered.length === 1 ? '' : 's'}
          ${hasFilters ? ' (filtered)' : ''}
        </div>
        <button class="btn btn--primary btn--sm"
          onClick=${() => { setEditTarget(null); setShowForm(true); }}>
          Add subscription
        </button>
      </div>

      <div class="filter-bar">
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
          ${CATEGORIES.map(c => html`<option key=${c} value=${c}>${c}</option>`)}
        </select>
        <select class="filter-bar__select" value=${currency} onChange=${e => setCurrency(e.target.value)}>
          <option value="">All currencies</option>
          ${CURRENCIES.map(c => html`<option key=${c} value=${c}>${c}</option>`)}
        </select>
        <select class="filter-bar__select" value=${entity} onChange=${e => setEntity(e.target.value)}>
          <option value="">All entities</option>
          ${ENTITIES.map(e => html`<option key=${e} value=${e}>${e}</option>`)}
        </select>
        <label class="filter-bar__toggle">
          <input
            type="checkbox"
            checked=${showArchived}
            onChange=${e => setShowArchived(e.target.checked)}
          />
          Show archived
        </label>
        ${hasFilters && html`
          <button class="btn btn--ghost btn--sm"
            onClick=${() => { setSearch(''); setCategory(''); setCurrency(''); setEntity(''); }}>
            Clear filters
          </button>
        `}
      </div>

      ${filtered.length === 0
        ? html`<div class="empty-state">No subscriptions match the current filters.</div>`
        : html`
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Currency</th>
                  <th class="text-right">Unit cost</th>
                  <th>Renewal</th>
                  <th>Entity</th>
                  <th>Cardholder</th>
                  <th>Tier</th>
                  <th>Status</th>
                  <th style=${{ width: '1px' }}></th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(s => html`
                  <tr key=${s.id} class=${'data-table__row data-table__row--' + s.status}>
                    <td class="data-table__vendor">${s.vendor}</td>
                    <td>${s.product}</td>
                    <td><span class="badge">${s.category}</span></td>
                    <td>${s.currency}</td>
                    <td class="text-right">
                      <${UnitCostCell} sub=${s} assumptions=${assumptions} />
                    </td>
                    <td class=${s.renewal_date && isWithin90Days(s.renewal_date) ? 'text-urgent' : ''}>
                      ${s.renewal_date ? fmt.date(s.renewal_date) : '--'}
                    </td>
                    <td>${s.billing_entity || '--'}</td>
                    <td class="text-muted">${s.cardholder || '--'}</td>
                    <td>${s.tier || '--'}</td>
                    <td>
                      <span class=${'status-dot status-dot--' + s.status}></span>
                      ${s.status}
                    </td>
                    <td class="data-table__actions">
                      <button class="btn btn--ghost btn--sm"
                        onClick=${() => { setEditTarget(s); setShowForm(true); }}>
                        Edit
                      </button>
                      ${s.status !== 'archived' && html`
                        <button class="btn btn--ghost btn--sm text-urgent"
                          onClick=${() => handleArchive(s.id)}>
                          Archive
                        </button>
                      `}
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        `
      }
    </div>
  `;
}
