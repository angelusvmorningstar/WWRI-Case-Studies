const { html, useMemo, useState } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { computeForecast, ALL_MONTHS, registeredActiveCurrent } from '../../state/compute.js';
import { lookupValue } from '../../state/assumptions.js';
import { getAuthor } from '../../state/identity.js';
import { fmt } from '../../shared/format.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(isoDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate + 'T00:00:00');
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function urgencyBand(days) {
  if (days <= 30) return 'urgent';
  if (days <= 60) return 'warning';
  if (days <= 90) return 'soon';
  return null;
}

function computeAnnualCostAud(sub, assumptions, scenario, ieCount) {
  const today = new Date();
  const currentYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const months = ALL_MONTHS.filter(ym => ym >= currentYM).slice(0, 12);
  let total = 0;
  for (const ym of months) {
    total += computeForecast(sub, ym, assumptions, scenario, ieCount).value ?? 0;
  }
  return total;
}

function decisionDeadline(renewalDate) {
  const d = new Date(renewalDate + 'T00:00:00');
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function emptyRenewalRecord(subId) {
  return { subId, status: 'pending', notes: '', statusLog: [], documents: [] };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UrgencyBadge({ days }) {
  const band = urgencyBand(days);
  if (!band) return null;
  return html`<span class=${'renewals__urgency-badge renewals__urgency-badge--' + band}>${days}d</span>`;
}

function StatusChip({ status }) {
  return html`<span class=${'renewals__status-chip renewals__status-chip--' + status}>${status}</span>`;
}

function DocumentList({ docs, onRemove }) {
  if (!docs || docs.length === 0) return null;
  return html`
    <div class="renewals__documents">
      ${docs.map(doc => html`
        <div key=${doc.id} class="renewals__doc-item">
          <a
            href=${doc.url}
            target="_blank"
            rel="noopener noreferrer"
            class="renewals__doc-link"
          >${doc.label}</a>
          <span class="renewals__doc-meta">Added ${fmt.date(doc.attached_at)} by ${doc.attached_by}</span>
          <button
            class="btn btn--ghost btn--sm"
            onClick=${() => onRemove(doc.id)}
            title="Remove this document link"
          >Remove</button>
        </div>
      `)}
    </div>
  `;
}

function AddDocForm({ onAdd }) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [errors, setErrors] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!label.trim()) errs.label = 'Label is required.';
    if (!url.trim()) errs.url = 'URL is required.';
    else if (!url.trim().startsWith('https://')) errs.url = 'Only HTTPS URLs are supported.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onAdd({ label: label.trim(), url: url.trim() });
    setLabel('');
    setUrl('');
    setErrors({});
  }

  return html`
    <form class="renewals__add-doc-form" onSubmit=${handleSubmit}>
      <div>
        <input
          class="field__input"
          type="text"
          placeholder="Label (e.g. HubSpot renewal quote)"
          value=${label}
          onInput=${e => { setLabel(e.target.value); setErrors(p => ({ ...p, label: '' })); }}
        />
        ${errors.label && html`<span class="field__error">${errors.label}</span>`}
      </div>
      <div>
        <input
          class="field__input"
          type="url"
          placeholder="https://…"
          value=${url}
          onInput=${e => { setUrl(e.target.value); setErrors(p => ({ ...p, url: '' })); }}
        />
        ${errors.url && html`<span class="field__error">${errors.url}</span>`}
      </div>
      <button type="submit" class="btn btn--primary btn--sm">Add link</button>
    </form>
  `;
}

function DetailsPanel({ sub, record, onStatusChange, onNotesSave, onDocAdd, onDocRemove }) {
  const [notesValue, setNotesValue] = useState(record.notes || '');
  const [notesDirty, setNotesDirty] = useState(false);

  function handleNotesChange(e) {
    setNotesValue(e.target.value);
    setNotesDirty(true);
  }

  function handleNotesSave() {
    onNotesSave(notesValue);
    setNotesDirty(false);
  }

  const STATUS_OPTIONS = ['pending', 'prepared', 'negotiated', 'signed'];

  return html`
    <div class="renewals__details-panel">
      <div class="renewals__details-section">
        <span class="renewals__details-label">Renewal status</span>
        <div class="renewals__status-row">
          <select
            class="renewals__status-select"
            value=${record.status}
            onChange=${e => onStatusChange(e.target.value)}
          >
            ${STATUS_OPTIONS.map(s => html`<option key=${s} value=${s}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`)}
          </select>
          ${record.statusLog?.length > 0 && html`
            <div class="renewals__status-log">
              ${record.statusLog.slice(-3).reverse().map((entry, i) => html`
                <span key=${i} class="renewals__log-entry">
                  → ${entry.status} · ${fmt.date(entry.changedAt)} · ${entry.author}
                </span>
              `)}
            </div>
          `}
        </div>
      </div>

      <div class="renewals__details-section">
        <span class="renewals__details-label">Notes</span>
        <textarea
          class="renewals__notes-textarea"
          value=${notesValue}
          onInput=${handleNotesChange}
          placeholder="Add negotiation notes, contact details, or context…"
        ></textarea>
        ${notesDirty && html`
          <button class="btn btn--primary btn--sm" onClick=${handleNotesSave} style=${{ marginTop: '4px', width: 'fit-content' }}>
            Save notes
          </button>
        `}
      </div>

      <div class="renewals__details-section">
        <span class="renewals__details-label">Documents</span>
        <${DocumentList} docs=${record.documents || []} onRemove=${onDocRemove} />
        <${AddDocForm} onAdd=${onDocAdd} />
      </div>
    </div>
  `;
}

function RenewalRow({ item, record, expanded, onToggle, onStatusChange, onNotesSave, onDocAdd, onDocRemove }) {
  const { sub, days, annualCost, discount, expectedNewPricing, deadline, isHubSpot } = item;
  const band = urgencyBand(days);
  const rowClasses = [
    'renewals__row',
    band ? `renewals__row--${band}` : '',
    isHubSpot ? 'renewals__row--highlight' : '',
  ].filter(Boolean).join(' ');

  const COLS = 9;

  return html`
    <tr class=${rowClasses}>
      <td class="renewals__sub-cell">
        <div class="renewals__vendor">${sub.vendor}</div>
        <div class="renewals__product">${sub.product}</div>
        ${isHubSpot && html`<span class="renewals__material-badge">Key renewal</span>`}
      </td>
      <td class="renewals__date-cell">
        ${fmt.date(sub.renewal_date)}
        <${UrgencyBadge} days=${days} />
      </td>
      <td class="renewals__cost-cell">${fmt.aud(annualCost)}</td>
      <td class="renewals__discount-cell">
        ${discount !== null ? `${Math.round(discount * 100)}%` : '—'}
      </td>
      <td class="renewals__new-cell">
        ${expectedNewPricing !== null ? fmt.aud(expectedNewPricing) : '—'}
      </td>
      <td class="renewals__deadline-cell">${fmt.date(deadline)}</td>
      <td class="renewals__owner-cell">${sub.cardholder || '—'}</td>
      <td class="renewals__status-cell">
        <${StatusChip} status=${record.status} />
      </td>
      <td class="renewals__expand-cell">
        <button
          class="renewals__expand-btn"
          onClick=${onToggle}
          title=${expanded ? 'Collapse details' : 'Expand details'}
          aria-expanded=${expanded}
        >${expanded ? '▲' : '▼'}</button>
      </td>
    </tr>
    ${expanded && html`
      <tr class="renewals__details-row">
        <td colspan=${COLS}>
          <${DetailsPanel}
            sub=${sub}
            record=${record}
            onStatusChange=${onStatusChange}
            onNotesSave=${onNotesSave}
            onDocAdd=${onDocAdd}
            onDocRemove=${onDocRemove}
          />
        </td>
      </tr>
    `}
  `;
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function RenewalsView() {
  const { workbook, dispatch } = useWorkbook();
  const assumptions = workbook.assumptions || {};
  const scenario = workbook.scenarios?.[workbook.activeScenarioId] ?? null;
  const renewalsMap = workbook.renewals || {};
  const ieCount = registeredActiveCurrent(workbook.ieRegister);

  const [expandedSubId, setExpandedSubId] = useState(null);

  const items = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + 365);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    return Object.values(workbook.subscriptions || {})
      .filter(s =>
        s.status !== 'archived' &&
        s.renewal_date &&
        s.renewal_date >= todayStr &&
        s.renewal_date <= cutoffStr,
      )
      .map(s => {
        const isHubSpot = s.id === 'sub-hubspot' || s.vendor === 'HubSpot';
        return {
          sub: s,
          days: daysUntil(s.renewal_date),
          annualCost: computeAnnualCostAud(s, assumptions, scenario, ieCount),
          discount: isHubSpot
            ? lookupValue(assumptions, 'hubspot.discount_rate', 0.40)
            : null,
          expectedNewPricing: s.id === 'sub-hubspot'
            ? lookupValue(assumptions, 'subscription.hubspot.renewal_monthly_aud', 1101.60) * 12
            : null,
          deadline: decisionDeadline(s.renewal_date),
          isHubSpot,
        };
      })
      .sort((a, b) => a.sub.renewal_date.localeCompare(b.sub.renewal_date));
  }, [workbook.subscriptions, assumptions, scenario]);

  function getRecord(subId) {
    return renewalsMap[subId] || emptyRenewalRecord(subId);
  }

  function handleStatusChange(subId, newStatus) {
    const existing = getRecord(subId);
    const logEntry = {
      status: newStatus,
      changedAt: new Date().toISOString(),
      author: getAuthor() || 'Unknown',
    };
    dispatch({
      type: 'RENEWAL_UPSERTED',
      payload: {
        ...existing,
        status: newStatus,
        statusLog: [...(existing.statusLog || []), logEntry],
      },
    });
  }

  function handleNotesSave(subId, notes) {
    const existing = getRecord(subId);
    dispatch({ type: 'RENEWAL_UPSERTED', payload: { ...existing, notes } });
  }

  function handleDocAdd(subId, { label, url }) {
    const doc = {
      id: crypto.randomUUID(),
      label,
      url,
      attached_at: new Date().toISOString(),
      attached_by: getAuthor() || 'Unknown',
    };
    dispatch({ type: 'RENEWAL_DOCUMENT_ADDED', payload: { subId, doc } });
  }

  function handleDocRemove(subId, docId) {
    dispatch({ type: 'RENEWAL_DOCUMENT_REMOVED', payload: { subId, docId } });
  }

  if (Object.keys(workbook.subscriptions || {}).length === 0) {
    return html`
      <div class="page-header">
        <h1 class="page-header__title">Renewals</h1>
      </div>
      <div class="empty-state">Load a workbook to view upcoming renewals.</div>
    `;
  }

  if (items.length === 0) {
    return html`
      <div class="renewals">
        <div class="page-header">
          <h1 class="page-header__title">Renewals</h1>
        </div>
        <div class="empty-state">No renewals due in the next 12 months.</div>
      </div>
    `;
  }

  return html`
    <div class="renewals">
      <div class="page-header">
        <h1 class="page-header__title">Renewals</h1>
        <span class="page-header__count">${items.length} upcoming renewal${items.length !== 1 ? 's' : ''}</span>
      </div>
      <table class="data-table renewals__table">
        <thead>
          <tr>
            <th class="renewals__col-sub">Subscription</th>
            <th class="renewals__col-date">Renewal date</th>
            <th class="renewals__col-cost">Annual cost</th>
            <th class="renewals__col-discount">Discount</th>
            <th class="renewals__col-new">Expected new pricing</th>
            <th class="renewals__col-deadline">Decision deadline</th>
            <th class="renewals__col-owner">Owner</th>
            <th class="renewals__col-status">Status</th>
            <th class="renewals__col-expand"></th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => html`
            <${RenewalRow}
              key=${item.sub.id}
              item=${item}
              record=${getRecord(item.sub.id)}
              expanded=${expandedSubId === item.sub.id}
              onToggle=${() => setExpandedSubId(id => id === item.sub.id ? null : item.sub.id)}
              onStatusChange=${newStatus => handleStatusChange(item.sub.id, newStatus)}
              onNotesSave=${notes => handleNotesSave(item.sub.id, notes)}
              onDocAdd=${({ label, url }) => handleDocAdd(item.sub.id, { label, url })}
              onDocRemove=${docId => handleDocRemove(item.sub.id, docId)}
            />
          `)}
        </tbody>
      </table>
    </div>
  `;
}
