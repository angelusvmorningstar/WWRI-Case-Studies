const { html, useState, useMemo } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { getAuthor } from '../../state/identity.js';
import { fmt } from '../../shared/format.js';

const STATUS_ORDER = ['Proposed', 'Validated', 'Applied', 'Declined'];

const STATUS_TRANSITIONS = {
  Proposed:  [{ label: 'Validate', next: 'Validated' }, { label: 'Decline', next: 'Declined' }],
  Validated: [{ label: 'Apply',    next: 'Applied'   }, { label: 'Decline', next: 'Declined' }],
  Applied:   [],
  Declined:  [],
};

const STATUS_CLASS = {
  Proposed:  'savings__status--proposed',
  Validated: 'savings__status--validated',
  Applied:   'savings__status--applied',
  Declined:  'savings__status--declined',
};

function emptyForm(author) {
  return {
    title: '',
    description: '',
    estimatedSaving: '',
    classification: 'indicative',
    owner: author || '',
    relatedSubscriptionId: '',
    relatedArchitecture: '',
  };
}

function AppliedBadge({ opp, subscriptions }) {
  if (opp.relatedSubscriptionId) {
    const sub = subscriptions[opp.relatedSubscriptionId];
    const label = sub ? `${sub.vendor} ${sub.product}` : opp.relatedSubscriptionId;
    return html`<span class="savings__applied-badge" title="Linked to subscription toggle">${label}</span>`;
  }
  if (opp.relatedArchitecture) {
    return html`<span class="savings__applied-badge savings__applied-badge--arch" title="Linked to HubSpot architecture">Architecture ${opp.relatedArchitecture}</span>`;
  }
  return html`<span class="savings__applied-badge savings__applied-badge--none">—</span>`;
}

function OpportunityRow({ opp, subscriptions, onTransition }) {
  const transitions = STATUS_TRANSITIONS[opp.status] || [];
  const sub = opp.relatedSubscriptionId ? subscriptions[opp.relatedSubscriptionId] : null;
  const relatedLabel = sub
    ? `${sub.vendor} ${sub.product}`
    : opp.relatedArchitecture
      ? `Architecture ${opp.relatedArchitecture}`
      : '—';

  return html`
    <tr class="savings__row">
      <td class="savings__title-cell">
        <div class="savings__opp-title">${opp.title}</div>
        ${opp.description && html`<div class="savings__opp-desc">${opp.description}</div>`}
      </td>
      <td class="savings__saving-cell">
        ${opp.estimatedSaving > 0 ? fmt.aud(opp.estimatedSaving) : '—'}
      </td>
      <td class="savings__classification-cell">
        <span class=${'savings__class-badge ' + (opp.classification === 'firm' ? 'savings__class-badge--firm' : 'savings__class-badge--indicative')}>
          ${opp.classification === 'firm' ? 'Firm' : 'Indicative'}
        </span>
      </td>
      <td class="savings__status-cell">
        <span class=${'savings__status ' + (STATUS_CLASS[opp.status] || '')}>
          ${opp.status}
        </span>
      </td>
      <td class="savings__owner-cell">${opp.owner || '—'}</td>
      <td class="savings__related-cell">${relatedLabel}</td>
      <td class="savings__actions-cell">
        ${transitions.map(t => html`
          <button
            key=${t.next}
            class=${'btn btn--sm btn--ghost savings__transition-btn'}
            onClick=${() => onTransition(opp.id, t.next)}
            title=${'Move to ' + t.next}
          >
            ${t.label}
          </button>
        `)}
      </td>
    </tr>
  `;
}

export function SavingsView() {
  const { workbook, dispatch } = useWorkbook();
  const opportunities = workbook.opportunities || {};
  const subscriptions = workbook.subscriptions || {};

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(() => emptyForm(getAuthor()));
  const [errors, setErrors] = useState({});

  const opps = useMemo(
    () => Object.values(opportunities).sort((a, b) => {
      const si = STATUS_ORDER.indexOf(a.status);
      const sj = STATUS_ORDER.indexOf(b.status);
      if (si !== sj) return si - sj;
      return new Date(b.createdAt) - new Date(a.createdAt);
    }),
    [opportunities],
  );

  const subs = useMemo(
    () => Object.values(subscriptions).filter(s => s.status !== 'archived'),
    [subscriptions],
  );

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
  }

  function handleSubmit() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const opp = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      description: form.description.trim(),
      estimatedSaving: parseFloat(form.estimatedSaving) || 0,
      classification: form.classification,
      status: 'Proposed',
      owner: form.owner.trim() || getAuthor() || 'Unknown',
      relatedSubscriptionId: form.relatedSubscriptionId || null,
      relatedArchitecture: form.relatedArchitecture || null,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'OPPORTUNITY_SAVED', payload: opp });
    setForm(emptyForm(getAuthor()));
    setShowForm(false);
    setErrors({});
  }

  function handleTransition(id, status) {
    dispatch({ type: 'OPPORTUNITY_STATUS_CHANGED', payload: { id, status } });
  }

  return html`
    <div class="savings">
      <div class="page-header">
        <h1 class="page-header__title">Savings register</h1>
        <span class="page-header__count">${opps.length} opportunit${opps.length !== 1 ? 'ies' : 'y'}</span>
        <button
          class=${'btn btn--sm ' + (showForm ? 'btn--ghost' : 'btn--primary')}
          style=${{ marginLeft: 'auto' }}
          onClick=${() => setShowForm(s => !s)}
        >
          ${showForm ? 'Cancel' : '+ Add opportunity'}
        </button>
      </div>

      ${showForm && html`
        <div class="savings__form">
          <h2 class="savings__form-title">New savings opportunity</h2>
          <div class="savings__form-grid">
            <div class="form-field ${errors.title ? 'form-field--error' : ''}">
              <label class="form-label">Title <span class="form-required">*</span></label>
              <input
                class="form-input"
                type="text"
                value=${form.title}
                onInput=${e => setField('title', e.target.value)}
                placeholder="e.g. Switch HubSpot to Architecture 1"
              />
              ${errors.title && html`<span class="form-error">${errors.title}</span>`}
            </div>

            <div class="form-field">
              <label class="form-label">Estimated saving (AUD)</label>
              <input
                class="form-input"
                type="number"
                min="0"
                step="1"
                value=${form.estimatedSaving}
                onInput=${e => setField('estimatedSaving', e.target.value)}
                placeholder="0"
              />
            </div>

            <div class="form-field">
              <label class="form-label">Classification</label>
              <select class="form-select" value=${form.classification} onChange=${e => setField('classification', e.target.value)}>
                <option value="indicative">Indicative</option>
                <option value="firm">Firm</option>
              </select>
            </div>

            <div class="form-field">
              <label class="form-label">Owner</label>
              <input
                class="form-input"
                type="text"
                value=${form.owner}
                onInput=${e => setField('owner', e.target.value)}
                placeholder="Name"
              />
            </div>

            <div class="form-field savings__form-field--full">
              <label class="form-label">Description</label>
              <textarea
                class="form-input savings__form-textarea"
                value=${form.description}
                onInput=${e => setField('description', e.target.value)}
                placeholder="Context, rationale, or how the saving would be achieved"
                rows="2"
              ></textarea>
            </div>

            <div class="form-field">
              <label class="form-label">Related subscription</label>
              <select class="form-select" value=${form.relatedSubscriptionId} onChange=${e => setField('relatedSubscriptionId', e.target.value)}>
                <option value="">None</option>
                ${subs.map(s => html`
                  <option key=${s.id} value=${s.id}>${s.vendor} — ${s.product}</option>
                `)}
              </select>
            </div>

            <div class="form-field">
              <label class="form-label">Related architecture</label>
              <select class="form-select" value=${form.relatedArchitecture} onChange=${e => setField('relatedArchitecture', e.target.value)}>
                <option value="">None</option>
                <option value="F">Architecture F (Current)</option>
                <option value="1">Architecture 1</option>
                <option value="2">Architecture 2</option>
                <option value="3">Architecture 3</option>
              </select>
            </div>
          </div>
          <div class="savings__form-actions">
            <button class="btn btn--primary btn--sm" onClick=${handleSubmit}>Add opportunity</button>
            <button class="btn btn--ghost btn--sm" onClick=${() => { setShowForm(false); setErrors({}); }}>Cancel</button>
          </div>
        </div>
      `}

      ${opps.length === 0 && !showForm && html`
        <div class="empty-state">
          No savings opportunities recorded yet. Click "+ Add opportunity" to start tracking.
        </div>
      `}

      ${opps.length > 0 && html`
        <table class="data-table savings__table">
          <thead>
            <tr>
              <th class="savings__title-col">Opportunity</th>
              <th class="savings__saving-col">Est. saving</th>
              <th class="savings__class-col">Classification</th>
              <th class="savings__status-col">Status</th>
              <th class="savings__owner-col">Owner</th>
              <th class="savings__related-col">Related</th>
              <th class="savings__actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${opps.map(opp => html`
              <${OpportunityRow}
                key=${opp.id}
                opp=${opp}
                subscriptions=${subscriptions}
                onTransition=${handleTransition}
              />
            `)}
          </tbody>
        </table>
      `}
    </div>
  `;
}
