const { html, useState, useMemo, useRef, useEffect } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';

const ONBOARDING = [
  { key: 'nda',      label: 'NDA'      },
  { key: 'contract', label: 'Contract' },
  { key: 'training', label: 'Training' },
];

const SUBSCRIPTIONS = [
  { key: 'm365_basic',    label: 'M365 Basic',    short: 'M365-B'   },
  { key: 'm365_standard', label: 'M365 Standard', short: 'M365-S'   },
  { key: 'copilot',       label: 'Copilot',       short: 'Copilot'  },
  { key: 'hubspot',       label: 'HubSpot',       short: 'HubSpot'  },
  { key: 'miro',          label: 'Miro',          short: 'Miro'     },
];

function ieStatus(ie) {
  if (!ie.active) return { label: 'Inactive',   cls: 'inactive'   };
  if (ie.training) return { label: 'Active',     cls: 'active'     };
  if (ie.contract) return { label: 'Contracted', cls: 'contracted' };
  if (ie.nda)      return { label: 'NDA signed', cls: 'nda'        };
  return                   { label: 'Pending',   cls: 'pending'    };
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEAR_RANGE  = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

const COHORT_OPTIONS = [
  { value: 'ch14', label: 'CH14' }, { value: 'ch15', label: 'CH15' },
  { value: 'ch16', label: 'CH16' }, { value: 'ch17', label: 'CH17' },
  { value: 'ch18', label: 'CH18' }, { value: 'ch19', label: 'CH19' },
  { value: 'ch20', label: 'CH20' }, { value: 'ch21', label: 'CH21' },
  { value: 'ch22', label: 'CH22' }, { value: 'ch23', label: 'CH23' },
];

const REGION_OPTIONS = [
  { value: 'apac',     label: 'APAC'     },
  { value: 'americas', label: 'Americas' },
  { value: 'emea',     label: 'EMEA'     },
];

function TagSelect({ value, options, onChange, placeholder = '—', cls }) {
  return html`
    <select
      class=${'ie-register__tag-select' + (value ? ` ie-register__tag-select--${value}` : ' ie-register__tag-select--empty') + (cls ? ' ' + cls : '')}
      value=${value || ''}
      onChange=${e => onChange(e.target.value || null)}
    >
      <option value="">${placeholder}</option>
      ${options.map(o => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
    </select>
  `;
}

// Renders two <select> dropdowns (month + year) for a YYYY-MM value.
function MonthYearPicker({ value, onChange, cls }) {
  const [year, month] = value ? value.split('-').map(Number) : [2026, 7];
  function update(newYear, newMonth) {
    onChange(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  }
  return html`
    <span class=${'ie-register__month-picker' + (cls ? ' ' + cls : '')}>
      <select
        class="ie-register__month-select"
        value=${month}
        onChange=${e => update(year, Number(e.target.value))}
      >
        ${MONTH_NAMES.map((m, i) => html`<option key=${i+1} value=${i+1}>${m}</option>`)}
      </select>
      <select
        class="ie-register__year-select"
        value=${year}
        onChange=${e => update(Number(e.target.value), month)}
      >
        ${YEAR_RANGE.map(y => html`<option key=${y} value=${y}>${y}</option>`)}
      </select>
    </span>
  `;
}

// ── Add form ──────────────────────────────────────────────────────────────────

function AddIEForm({ onAdd, onCancel }) {
  const [name, setName] = useState('');
  const [startMonth, setStartMonth] = useState('2026-07');

  function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, startMonth });
    setName('');
  }

  return html`
    <form class="ie-register__add-form" onSubmit=${submit}>
      <input
        class="ie-register__add-name"
        type="text"
        placeholder="Full name"
        value=${name}
        onInput=${e => setName(e.target.value)}
        required
        autoFocus
      />
      <label class="ie-register__add-month-label">Start month</label>
      <${MonthYearPicker} value=${startMonth} onChange=${setStartMonth} />
      <button class="btn btn--primary btn--sm" type="submit">Add</button>
      <button class="btn btn--ghost btn--sm" type="button" onClick=${onCancel}>Cancel</button>
    </form>
  `;
}

// ── Table row with inline editing ─────────────────────────────────────────────

function IERow({ ie, onSave, onDeactivate, onReactivate, onDelete, onToggleFlag, onToggleSub, onTagChange }) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(ie.name);
  const [draftMonth, setDraftMonth] = useState(ie.startMonth || '');
  const nameRef = useRef(null);

  useEffect(() => {
    if (editing && nameRef.current) nameRef.current.focus();
  }, [editing]);

  function startEdit() {
    setDraftName(ie.name);
    setDraftMonth(ie.startMonth || '');
    setEditing(true);
  }

  function save() {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    onSave({ ...ie, name: trimmed, startMonth: draftMonth });
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') cancel();
  }

  const isInactive = ie.active === false;
  const { label: statusLabel, cls: statusCls } = ieStatus(ie);

  return html`
    <tr class=${'ie-register__row' + (isInactive ? ' ie-register__row--inactive' : ie.training ? ' ie-register__row--active' : '') + (editing ? ' ie-register__row--editing' : '')}>

      <!-- Name -->
      <td class="ie-register__col-name">
        ${editing
          ? html`<input
              ref=${nameRef}
              class="ie-register__inline-input"
              type="text"
              value=${draftName}
              onInput=${e => setDraftName(e.target.value)}
              onKeyDown=${handleKeyDown}
              required
            />`
          : ie.name
        }
      </td>

      <!-- Start month -->
      <td class="ie-register__col-month">
        ${editing
          ? html`<${MonthYearPicker} value=${draftMonth} onChange=${setDraftMonth} />`
          : ie.startMonth
        }
      </td>

      <!-- Onboarding checkboxes -->
      ${ONBOARDING.map(step => html`
        <td key=${step.key} class="ie-register__col-flag">
          <input
            type="checkbox"
            class="ie-register__check"
            checked=${!!ie[step.key]}
            disabled=${isInactive || editing}
            onChange=${() => onToggleFlag(ie, step.key)}
            aria-label=${step.label + ' for ' + ie.name}
          />
        </td>
      `)}

      <td class="ie-register__col-divider"></td>

      <!-- Subscription checkboxes -->
      ${SUBSCRIPTIONS.map(sub => html`
        <td key=${sub.key} class="ie-register__col-sub">
          <input
            type="checkbox"
            class="ie-register__check"
            checked=${!!(ie.subscriptions?.[sub.key])}
            disabled=${isInactive || editing}
            onChange=${() => onToggleSub(ie, sub.key)}
            aria-label=${sub.label + ' for ' + ie.name}
          />
        </td>
      `)}

      <!-- Cohort tag -->
      <td class="ie-register__col-tag">
        <${TagSelect}
          value=${ie.cohort || null}
          options=${COHORT_OPTIONS}
          onChange=${v => onTagChange(ie, 'cohort', v)}
          placeholder="—"
        />
      </td>

      <!-- Region tag -->
      <td class="ie-register__col-tag">
        <${TagSelect}
          value=${ie.region || null}
          options=${REGION_OPTIONS}
          onChange=${v => onTagChange(ie, 'region', v)}
          placeholder="—"
        />
      </td>

      <!-- Status -->
      <td class="ie-register__col-status">
        <span class=${'ie-register__badge ie-register__badge--' + statusCls}>${statusLabel}</span>
      </td>

      <!-- Actions -->
      <td class="ie-register__col-actions">
        ${editing
          ? html`
            <div class="ie-register__action-group">
              <button class="btn btn--primary btn--sm ie-register__action-btn" onClick=${save}>Save</button>
              <button class="btn btn--ghost btn--sm ie-register__action-btn" onClick=${cancel}>Cancel</button>
            </div>
          `
          : html`
            <div class="ie-register__action-group">
              <button
                class="btn btn--ghost btn--sm ie-register__action-btn"
                onClick=${startEdit}
                disabled=${isInactive}
                title="Edit name or start month"
              >Edit</button>
              ${isInactive
                ? html`<button class="btn btn--ghost btn--sm ie-register__action-btn" onClick=${() => onReactivate(ie)}>Reactivate</button>`
                : html`<button class="btn btn--ghost btn--sm ie-register__action-btn ie-register__action-btn--deactivate" onClick=${() => onDeactivate(ie)}>Deactivate</button>`
              }
              <button
                class="btn btn--ghost btn--sm ie-register__action-btn ie-register__action-btn--delete"
                onClick=${() => { if (confirm('Delete ' + ie.name + '? This cannot be undone.')) onDelete(ie); }}
              >Delete</button>
            </div>
          `
        }
      </td>
    </tr>
  `;
}

// ── Main view ─────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { key: 'start',  label: 'Start date' },
  { key: 'name',   label: 'Name'       },
  { key: 'cohort', label: 'Cohort'     },
];

function sortIEs(list, sortKey) {
  const copy = [...list];
  if (sortKey === 'name') {
    copy.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortKey === 'cohort') {
    copy.sort((a, b) =>
      (a.cohort || 'zzz').localeCompare(b.cohort || 'zzz') ||
      (a.startMonth || '').localeCompare(b.startMonth || '') ||
      a.name.localeCompare(b.name)
    );
  } else {
    copy.sort((a, b) =>
      (a.startMonth || '').localeCompare(b.startMonth || '') ||
      a.name.localeCompare(b.name)
    );
  }
  return copy;
}

export function IERegisterView() {
  const { workbook, dispatch } = useWorkbook();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [sortKey, setSortKey] = useState('start');

  const ieList = useMemo(
    () => sortIEs(Object.values(workbook.ieRegister || {}), sortKey),
    [workbook.ieRegister, sortKey],
  );

  const stats = useMemo(() => {
    const all = Object.values(workbook.ieRegister || {});
    const active = all.filter(ie => ie.active !== false);
    return {
      total:      all.length,
      nda:        active.filter(ie => ie.nda).length,
      contracted: active.filter(ie => ie.contract).length,
      onboarded:  active.filter(ie => ie.training).length,
      inactive:   all.filter(ie => ie.active === false).length,
    };
  }, [workbook.ieRegister]);

  const visibleList = useMemo(
    () => showInactive ? ieList : ieList.filter(ie => ie.active !== false),
    [ieList, showInactive],
  );

  function handleAdd({ name, startMonth }) {
    dispatch({ type: 'IE_SAVED', payload: {
      id: crypto.randomUUID(),
      name,
      startMonth,
      active: true,
      nda: false,
      contract: false,
      training: false,
      subscriptions: { m365_basic: false, m365_standard: false, copilot: false, hubspot: false, miro: false },
    }});
    setShowAddForm(false);
  }

  const handleSave        = ie  => dispatch({ type: 'IE_SAVED',       payload: ie     });
  const handleToggleFlag  = (ie, flag)   => dispatch({ type: 'IE_SAVED', payload: { ...ie, [flag]: !ie[flag] } });
  const handleToggleSub   = (ie, subKey) => dispatch({ type: 'IE_SAVED', payload: { ...ie, subscriptions: { ...ie.subscriptions, [subKey]: !(ie.subscriptions?.[subKey]) } } });
  const handleTagChange   = (ie, field, value) => dispatch({ type: 'IE_SAVED', payload: { ...ie, [field]: value } });
  const handleDeactivate  = ie  => dispatch({ type: 'IE_DEACTIVATED',  payload: ie.id });
  const handleReactivate  = ie  => dispatch({ type: 'IE_REACTIVATED',  payload: ie.id });
  const handleDelete      = ie  => dispatch({ type: 'IE_DELETED',       payload: ie.id });

  return html`
    <div class="page-header">
      <h1 class="page-header__title">IE Register</h1>
      <div style=${{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <div class="ie-register__sort-group">
          <span class="ie-register__sort-label">Sort:</span>
          ${SORT_OPTIONS.map(opt => html`
            <button
              key=${opt.key}
              class=${'btn btn--sm ' + (sortKey === opt.key ? 'btn--primary' : 'btn--ghost')}
              onClick=${() => setSortKey(opt.key)}
            >${opt.label}</button>
          `)}
        </div>
        <div style=${{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          ${stats.inactive > 0 && html`
            <button
              class="btn btn--ghost btn--sm"
              onClick=${() => setShowInactive(v => !v)}
            >${showInactive ? 'Hide inactive' : `Show inactive (${stats.inactive})`}</button>
          `}
          <button class="btn btn--primary btn--sm" onClick=${() => setShowAddForm(v => !v)}>
            ${showAddForm ? 'Cancel' : '+ Add IE'}
          </button>
        </div>
      </div>
    </div>

    <div class="ie-register">

      <div class="ie-register__summary">
        <div class="ie-register__stat">
          <span class="ie-register__stat-value">${stats.total}</span>
          <span class="ie-register__stat-label">Total</span>
        </div>
        <div class="ie-register__stat">
          <span class="ie-register__stat-value">${stats.nda}</span>
          <span class="ie-register__stat-label">NDA signed</span>
        </div>
        <div class="ie-register__stat">
          <span class="ie-register__stat-value">${stats.contracted}</span>
          <span class="ie-register__stat-label">Contracted</span>
        </div>
        <div class="ie-register__stat ie-register__stat--highlight">
          <span class="ie-register__stat-value">${stats.onboarded}</span>
          <span class="ie-register__stat-label">Active (trained)</span>
        </div>
      </div>

      ${showAddForm && html`
        <${AddIEForm} onAdd=${handleAdd} onCancel=${() => setShowAddForm(false)} />
      `}

      ${ieList.length === 0
        ? html`<div class="empty-state">No IEs registered yet. Click "+ Add IE" to get started.</div>`
        : html`
          <div class="table-wrapper">
            <table class="data-table ie-register__table">
              <thead>
                <tr>
                  <th class="ie-register__col-name">Name</th>
                  <th class="ie-register__col-month">Start</th>
                  <th class="ie-register__col-flag" title="NDA signed">NDA</th>
                  <th class="ie-register__col-flag" title="Contract signed">Contract</th>
                  <th class="ie-register__col-flag" title="Training completed — counts as active">Training</th>
                  <th class="ie-register__col-divider"></th>
                  ${SUBSCRIPTIONS.map(sub => html`
                    <th key=${sub.key} class="ie-register__col-sub" title=${sub.label}>${sub.short}</th>
                  `)}
                  <th class="ie-register__col-tag">Cohort</th>
                  <th class="ie-register__col-tag">Region</th>
                  <th class="ie-register__col-status">Status</th>
                  <th class="ie-register__col-actions"></th>
                </tr>
              </thead>
              <tbody>
                ${visibleList.map(ie => html`
                  <${IERow}
                    key=${ie.id}
                    ie=${ie}
                    onSave=${handleSave}
                    onToggleFlag=${handleToggleFlag}
                    onToggleSub=${handleToggleSub}
                    onTagChange=${handleTagChange}
                    onDeactivate=${handleDeactivate}
                    onReactivate=${handleReactivate}
                    onDelete=${handleDelete}
                  />
                `)}
              </tbody>
            </table>
          </div>
        `
      }
    </div>
  `;
}
