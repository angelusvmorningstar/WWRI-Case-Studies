const { html, useMemo, useState } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import {
  lookupValue, lookupAssumption,
  createAssumption, resolveAssumption, buildSupersessionPayload,
} from '../../state/assumptions.js';
import { activeCohortIEs } from '../../state/cohort.js';
import { ALL_MONTHS, FY_GROUPS } from '../../state/compute.js';

const COHORT_DEFS = [
  { label: 'CH17', key: 'cohort.timing.ch17.start_month' },
  { label: 'CH18', key: 'cohort.timing.ch18.start_month' },
  { label: 'CH19', key: 'cohort.timing.ch19.start_month' },
  { label: 'CH20', key: 'cohort.timing.ch20.start_month' },
  { label: 'CH21', key: 'cohort.timing.ch21.start_month' },
  { label: 'CH22', key: 'cohort.timing.ch22.start_month' },
];

function toShortId(id) {
  return id.replace(/^sub-/, '').replace(/-/g, '_');
}

function monthLabel(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month - 1, 1)
    .toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
}

function getLicenceCount(sub, yearMonth, scenario, assumptions) {
  if (sub.cohort_driven) {
    const baselineSeats = lookupValue(assumptions, sub.seat_count_assumption_key, 0);
    const cohortIntake = activeCohortIEs(yearMonth, scenario, assumptions);
    const attrRate = lookupValue(assumptions, sub.attribution_assumption_key, 1);
    return baselineSeats + Math.round(cohortIntake * attrRate);
  }
  if (!sub.seat_count_assumption_key) return null;
  const overrideKey = `licences.${toShortId(sub.id)}.headcount.${yearMonth.replace('-', '_')}`;
  const override = lookupValue(assumptions, overrideKey, null);
  if (override !== null) return override;
  return lookupValue(assumptions, sub.seat_count_assumption_key, 0);
}

export function LicenceForecastView() {
  const { workbook } = useWorkbook();
  const assumptions = workbook.assumptions || {};
  const scenario = workbook.scenarios?.[workbook.activeScenarioId] ?? null;

  const subs = useMemo(
    () => Object.values(workbook.subscriptions || {}).filter(s => s.status !== 'archived'),
    [workbook.subscriptions],
  );

  const [editingCohort, setEditingCohort] = useState(null);
  const [editingCell, setEditingCell] = useState(null);

  const cohortMarkers = useMemo(() => {
    const markers = {};
    for (const c of COHORT_DEFS) {
      const month = lookupValue(assumptions, c.key, null);
      if (month) {
        if (!markers[month]) markers[month] = [];
        markers[month].push(c);
      }
    }
    return markers;
  }, [assumptions]);

  const grid = useMemo(() => subs.map(sub => {
    const cells = ALL_MONTHS.map(ym => {
      const count = getLicenceCount(sub, ym, scenario, assumptions);
      const overrideKey = `licences.${toShortId(sub.id)}.headcount.${ym.replace('-', '_')}`;
      const isOverride = !sub.cohort_driven && !!lookupAssumption(assumptions, overrideKey);
      return { yearMonth: ym, count, isOverride };
    });
    return { sub, cells };
  }), [subs, assumptions, scenario]);

  if (subs.length === 0) {
    return html`
      <div class="page-header">
        <h1 class="page-header__title">Licence forecast</h1>
      </div>
      <div class="empty-state">Load a workbook to view the licence forecast.</div>
    `;
  }

  return html`
    <div class="licence-forecast">
      <div class="page-header">
        <h1 class="page-header__title">Licence forecast</h1>
        <span class="page-header__count">
          ${subs.length} subscription${subs.length !== 1 ? 's' : ''} · ${scenario?.label ?? 'No scenario'} scenario
        </span>
      </div>
      <p class="licence-forecast__hint text-muted">
        Click a cohort badge to edit its billing start month.
        Click a non-cohort seat count to enter a manual override.
      </p>
      <div class="table-wrapper licence-forecast__wrapper">
        <table class="data-table licence-forecast__grid">
          <thead>
            <tr>
              <th class="licence-forecast__sub-col licence-forecast__sticky-col"></th>
              ${FY_GROUPS.map(({ label, months }) => html`
                <th key=${label} colspan=${months.length} class="cost-register__fy-header">${label}</th>
              `)}
            </tr>
            <tr>
              <th class="licence-forecast__sub-col licence-forecast__sticky-col">Subscription</th>
              ${ALL_MONTHS.map(ym => html`
                <th key=${ym} class="licence-forecast__month-th">
                  <div>${monthLabel(ym)}</div>
                  ${cohortMarkers[ym] && html`
                    <div class="licence-forecast__markers">
                      ${cohortMarkers[ym].map(def => html`
                        <button
                          key=${def.label}
                          class="licence-forecast__cohort-badge"
                          title=${'Edit ' + def.label + ' start month'}
                          onClick=${() => setEditingCohort(def)}
                        >${def.label}</button>
                      `)}
                    </div>
                  `}
                </th>
              `)}
            </tr>
          </thead>
          <tbody>
            ${grid.map(({ sub, cells }) => html`
              <tr key=${sub.id}>
                <td class="licence-forecast__sub-cell licence-forecast__sticky-col">
                  <div class="cost-register__vendor">${sub.vendor}</div>
                  <div class="cost-register__product">${sub.product}</div>
                  ${sub.cohort_driven && html`
                    <span class="badge" style=${{ marginTop: '2px', display: 'inline-block' }}>Cohort</span>
                  `}
                </td>
                ${cells.map((cell, i) => {
                  const isBundle = cell.count === null;
                  const isEditable = !sub.cohort_driven && !isBundle;
                  return html`
                    <td
                      key=${i}
                      class=${
                        'licence-forecast__cell' +
                        (sub.cohort_driven ? ' licence-forecast__cell--cohort' : '') +
                        (cell.isOverride ? ' licence-forecast__cell--override' : '') +
                        (isEditable ? ' licence-forecast__cell--editable' : '')
                      }
                      onClick=${isEditable ? (() => setEditingCell({ sub, yearMonth: cell.yearMonth })) : undefined}
                      title=${
                        isBundle ? 'Bundle — no per-seat count' :
                        sub.cohort_driven ? 'Cohort-derived seat count' :
                        cell.isOverride ? 'Manual override — click to edit' :
                        'Click to override'
                      }
                    >
                      ${isBundle
                        ? html`<span class="text-muted">—</span>`
                        : cell.count
                      }
                    </td>
                  `;
                })}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
      ${editingCohort && html`
        <${CohortTimingForm}
          cohortDef=${editingCohort}
          onClose=${() => setEditingCohort(null)}
        />
      `}
      ${editingCell && html`
        <${LicenceOverrideForm}
          sub=${editingCell.sub}
          yearMonth=${editingCell.yearMonth}
          onClose=${() => setEditingCell(null)}
        />
      `}
    </div>
  `;
}

function CohortTimingForm({ cohortDef, onClose }) {
  const { workbook, dispatch } = useWorkbook();
  const assumptions = workbook.assumptions || {};
  const currentValue = lookupValue(assumptions, cohortDef.key, '');

  const [newMonth, setNewMonth] = useState(currentValue);
  const [rationale, setRationale] = useState('');
  const [source, setSource] = useState('');
  const [errors, setErrors] = useState({});

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!newMonth.match(/^\d{4}-\d{2}$/)) errs.newMonth = 'Enter a valid YYYY-MM date (e.g. 2026-09)';
    if (!rationale.trim()) errs.rationale = 'Rationale is required';
    if (!source.trim()) errs.source = 'Source is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const draft = createAssumption({
      key: cohortDef.key,
      label: `${cohortDef.label} cohort — billing start month`,
      value: newMonth,
      unit: 'YYYY-MM',
      category: 'Scenario input',
      rationale: rationale.trim(),
      source: source.trim(),
      confidence: 'medium',
    });
    const resolved = resolveAssumption(draft, { rationale: rationale.trim(), source: source.trim() });
    const payload = buildSupersessionPayload(assumptions, resolved);
    if (payload) {
      dispatch({ type: 'ASSUMPTION_SUPERSEDED', payload });
    } else {
      dispatch({ type: 'ASSUMPTION_PROPOSED', payload: resolved });
    }
    onClose();
  }

  return html`
    <div class="dialog-overlay" onClick=${handleOverlayClick}>
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="cohort-edit-title">
        <h2 class="dialog__title" id="cohort-edit-title">Edit ${cohortDef.label} start month</h2>
        <p class="dialog__body">
          Changing the start month shifts the billing step-up in the cost register and licence forecast.
          Current value: <strong>${currentValue || '—'}</strong>
        </p>
        <form onSubmit=${handleSubmit}>
          <div class="field" style=${{ marginBottom: 'var(--space-3)' }}>
            <label class="field__label" for="cohort-month">
              New start month (YYYY-MM) <span class="field__required">*</span>
            </label>
            <input
              id="cohort-month"
              type="text"
              class="field__input"
              placeholder="e.g. 2026-09"
              value=${newMonth}
              onInput=${e => { setNewMonth(e.target.value); setErrors(p => ({ ...p, newMonth: '' })); }}
              autoFocus
            />
            ${errors.newMonth && html`<span class="field__error">${errors.newMonth}</span>`}
          </div>
          <div class="field" style=${{ marginBottom: 'var(--space-3)' }}>
            <label class="field__label" for="cohort-rationale">
              Rationale <span class="field__required">*</span>
            </label>
            <textarea
              id="cohort-rationale"
              class="field__input"
              rows="3"
              placeholder="Why is the cohort start month changing?"
              value=${rationale}
              onInput=${e => { setRationale(e.target.value); setErrors(p => ({ ...p, rationale: '' })); }}
            ></textarea>
            ${errors.rationale && html`<span class="field__error">${errors.rationale}</span>`}
          </div>
          <div class="field" style=${{ marginBottom: 'var(--space-4)' }}>
            <label class="field__label" for="cohort-source">
              Source <span class="field__required">*</span>
            </label>
            <input
              id="cohort-source"
              type="text"
              class="field__input"
              placeholder="e.g. Updated recruitment calendar, Niel email 2026-05-15"
              value=${source}
              onInput=${e => { setSource(e.target.value); setErrors(p => ({ ...p, source: '' })); }}
            />
            ${errors.source && html`<span class="field__error">${errors.source}</span>`}
          </div>
          <div class="dialog__actions">
            <button type="button" class="btn btn--ghost" onClick=${onClose}>Cancel</button>
            <button type="submit" class="btn btn--primary">Resolve new start month</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function LicenceOverrideForm({ sub, yearMonth, onClose }) {
  const { workbook, dispatch } = useWorkbook();
  const assumptions = workbook.assumptions || {};
  const shortId = toShortId(sub.id);
  const overrideKey = `licences.${shortId}.headcount.${yearMonth.replace('-', '_')}`;
  const currentCount = lookupValue(assumptions, overrideKey, null)
    ?? lookupValue(assumptions, sub.seat_count_assumption_key, 0);

  const [count, setCount] = useState(String(currentCount));
  const [rationale, setRationale] = useState('');
  const [source, setSource] = useState('');
  const [errors, setErrors] = useState({});

  const mLabel = (() => {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  })();

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const parsedCount = parseInt(count, 10);
    const errs = {};
    if (isNaN(parsedCount) || parsedCount < 0) errs.count = 'Enter a valid seat count (0 or more)';
    if (!rationale.trim()) errs.rationale = 'Rationale is required';
    if (!source.trim()) errs.source = 'Source is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const draft = createAssumption({
      key: overrideKey,
      label: `${sub.vendor} ${sub.product} — licence count override for ${mLabel}`,
      value: parsedCount,
      unit: 'seats',
      category: 'Licence count',
      rationale: rationale.trim(),
      source: source.trim(),
      confidence: 'high',
      applies_to: [sub.id],
    });
    const resolved = resolveAssumption(draft, { rationale: rationale.trim(), source: source.trim() });
    const payload = buildSupersessionPayload(assumptions, resolved);
    if (payload) {
      dispatch({ type: 'ASSUMPTION_SUPERSEDED', payload });
    } else {
      dispatch({ type: 'ASSUMPTION_PROPOSED', payload: resolved });
    }
    onClose();
  }

  return html`
    <div class="dialog-overlay" onClick=${handleOverlayClick}>
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="licence-override-title">
        <h2 class="dialog__title" id="licence-override-title">Override licence count — ${mLabel}</h2>
        <p class="dialog__body">
          Override the seat count for <strong>${sub.vendor} ${sub.product}</strong> for ${mLabel}.
        </p>
        <form onSubmit=${handleSubmit}>
          <div class="field" style=${{ marginBottom: 'var(--space-3)' }}>
            <label class="field__label" for="licence-count">
              Seat count <span class="field__required">*</span>
            </label>
            <input
              id="licence-count"
              type="number"
              step="1"
              min="0"
              class="field__input"
              value=${count}
              onInput=${e => { setCount(e.target.value); setErrors(p => ({ ...p, count: '' })); }}
              autoFocus
            />
            ${errors.count && html`<span class="field__error">${errors.count}</span>`}
          </div>
          <div class="field" style=${{ marginBottom: 'var(--space-3)' }}>
            <label class="field__label" for="licence-rationale">
              Rationale <span class="field__required">*</span>
            </label>
            <textarea
              id="licence-rationale"
              class="field__input"
              rows="3"
              placeholder="Why does this month have a different seat count?"
              value=${rationale}
              onInput=${e => { setRationale(e.target.value); setErrors(p => ({ ...p, rationale: '' })); }}
            ></textarea>
            ${errors.rationale && html`<span class="field__error">${errors.rationale}</span>`}
          </div>
          <div class="field" style=${{ marginBottom: 'var(--space-4)' }}>
            <label class="field__label" for="licence-source">
              Source <span class="field__required">*</span>
            </label>
            <input
              id="licence-source"
              type="text"
              class="field__input"
              placeholder="e.g. Operations meeting 2026-05-13, vendor invoice"
              value=${source}
              onInput=${e => { setSource(e.target.value); setErrors(p => ({ ...p, source: '' })); }}
            />
            ${errors.source && html`<span class="field__error">${errors.source}</span>`}
          </div>
          <div class="dialog__actions">
            <button type="button" class="btn btn--ghost" onClick=${onClose}>Cancel</button>
            <button type="submit" class="btn btn--primary">Resolve override</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
