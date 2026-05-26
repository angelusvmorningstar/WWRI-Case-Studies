const { html, useState, useMemo } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { STATUS, CONFIDENCE, supersessionChain } from '../../state/assumptions.js';
import { fmt } from '../../shared/format.js';
import { DecisionDrawer } from './decision-drawer.js';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.values(STATUS).map(s => ({ value: s, label: s })),
];

const CONFIDENCE_OPTIONS = [
  { value: '', label: 'All confidence levels' },
  { value: CONFIDENCE.HIGH,        label: 'High' },
  { value: CONFIDENCE.MEDIUM,      label: 'Medium' },
  { value: CONFIDENCE.LOW,         label: 'Low' },
  { value: CONFIDENCE.PLACEHOLDER, label: 'Placeholder' },
];

const CATEGORIES = [
  '', 'Headcount', 'Subscription cost', 'Licence count',
  'Scenario input', 'FX rate', 'Attribution rate',
  'HubSpot', 'Renewal', 'Savings', 'Governance',
];

export function DecisionLog() {
  const { workbook } = useWorkbook();
  const assumptions = Object.values(workbook.assumptions || {});

  const [filterStatus,     setFilterStatus]     = useState('');
  const [filterConfidence, setFilterConfidence] = useState('');
  const [filterCategory,   setFilterCategory]   = useState('');
  const [filterAuthor,     setFilterAuthor]      = useState('');
  const [search,           setSearch]           = useState('');
  const [openDrawerId,     setOpenDrawerId]      = useState(null);

  const authors = useMemo(() => {
    const set = new Set(assumptions.map(a => a.author).filter(Boolean));
    return ['', ...Array.from(set).sort()];
  }, [assumptions]);

  const filtered = useMemo(() => {
    return assumptions
      .filter(a => {
        if (filterStatus     && a.status     !== filterStatus)     return false;
        if (filterConfidence && a.confidence !== filterConfidence) return false;
        if (filterCategory   && a.category   !== filterCategory)   return false;
        if (filterAuthor     && a.author     !== filterAuthor)     return false;
        if (search) {
          const q = search.toLowerCase();
          if (!a.label.toLowerCase().includes(q) &&
              !a.rationale.toLowerCase().includes(q) &&
              !a.key.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.decided_on) - new Date(a.decided_on));
  }, [assumptions, filterStatus, filterConfidence, filterCategory, filterAuthor, search]);

  const hasFilters = filterStatus || filterConfidence || filterCategory || filterAuthor || search;

  return html`
    <div class="decision-log">
      ${openDrawerId && html`
        <${DecisionDrawer}
          assumptionId=${openDrawerId}
          onClose=${() => setOpenDrawerId(null)}
        />
      `}

      <div class="page-header">
        <h1 class="page-header__title">Decision log</h1>
        <div class="page-header__count">
          ${filtered.length} assumption${filtered.length === 1 ? '' : 's'}
          ${hasFilters ? ' (filtered)' : ''}
        </div>
      </div>

      <div class="filter-bar">
        <input
          class="filter-bar__search field__input"
          type="search"
          placeholder="Search label, rationale, or key..."
          value=${search}
          onInput=${e => setSearch(e.target.value)}
        />
        <select class="filter-bar__select" value=${filterStatus}
          onChange=${e => setFilterStatus(e.target.value)}>
          ${STATUS_OPTIONS.map(o => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
        </select>
        <select class="filter-bar__select" value=${filterConfidence}
          onChange=${e => setFilterConfidence(e.target.value)}>
          ${CONFIDENCE_OPTIONS.map(o => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
        </select>
        <select class="filter-bar__select" value=${filterCategory}
          onChange=${e => setFilterCategory(e.target.value)}>
          ${CATEGORIES.map(c => html`<option key=${c} value=${c}>${c || 'All categories'}</option>`)}
        </select>
        <select class="filter-bar__select" value=${filterAuthor}
          onChange=${e => setFilterAuthor(e.target.value)}>
          ${authors.map(a => html`<option key=${a} value=${a}>${a || 'All authors'}</option>`)}
        </select>
        ${hasFilters && html`
          <button class="btn btn--ghost btn--sm"
            onClick=${() => { setFilterStatus(''); setFilterConfidence(''); setFilterCategory(''); setFilterAuthor(''); setSearch(''); }}>
            Clear
          </button>
        `}
      </div>

      ${filtered.length === 0
        ? html`<div class="empty-state">No assumptions match the current filters.</div>`
        : html`
          <div class="assumption-list">
            ${filtered.map(a => html`
              <div class="assumption-card" key=${a.id}
                onClick=${() => setOpenDrawerId(a.id)} role="button" tabIndex="0"
                onKeyDown=${e => { if (e.key === 'Enter' || e.key === ' ') setOpenDrawerId(a.id); }}>
                <div class="assumption-card__header">
                  <span class="assumption-card__key">${a.key}</span>
                  <span class=${'status-badge status-badge--' + a.status.toLowerCase().replace(' ', '-')}>
                    ${a.status}
                  </span>
                </div>
                <div class="assumption-card__label">${a.label}</div>
                <div class="assumption-card__value">${a.value} ${a.unit}</div>
                <div class="assumption-card__meta">
                  ${a.author} · ${fmt.date(a.decided_on)} · ${a.confidence} confidence · ${a.category}
                </div>
                ${a.rationale && html`
                  <p class="assumption-card__rationale">${a.rationale}</p>
                `}
              </div>
            `)}
          </div>
        `
      }
    </div>
  `;
}
