const { html, useMemo, useState } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import {
  lookupValue, lookupAssumption,
  createAssumption, buildSupersessionPayload, STATUS,
} from '../../state/assumptions.js';
import { computeForecast, activeStatusKey, FY_2627_MONTHS, registeredActiveCurrent } from '../../state/compute.js';
import { computeArchitectureMetrics } from '../hubspot-arch/hubspot-arch-compute.js';
import { runForecastModel } from '../../state/cohort.js';
import { getAuthor } from '../../state/identity.js';
import { fmt } from '../../shared/format.js';
import { SubscriptionForm } from '../inventory/subscription-form.js';
import { AssumptionMarker } from '../provenance/assumption-marker.js';
import { SavingsView } from '../savings/savings-view.js';
import { DecisionLog } from '../provenance/decision-log.js';

const CATEGORIES = [
  'Sales & Marketing', 'Productivity & IT',
  'Collaboration & Docs', 'Training & Development', 'Infrastructure',
];
const CURRENCIES = ['AUD', 'USD', 'EUR', 'GBP'];
const ENTITIES   = ['AU', 'EU', 'US'];

function makeActiveStatusAssumption(subId, subLabel, value) {
  const key = activeStatusKey(subId);
  const verb = value === 'not_active' ? 'Paused' : 'Reactivated';
  return {
    id: crypto.randomUUID(),
    key,
    label: `${subLabel} — active status`,
    value,
    unit: '',
    category: 'Governance',
    rationale: `${verb} via Decisions view. Edit in Decision Drawer to add context.`,
    source: 'Decisions view toggle',
    confidence: 'high',
    status: STATUS.RESOLVED,
    author: getAuthor() || 'Unknown',
    decided_on: new Date().toISOString(),
    effective_from: new Date().toISOString().slice(0, 10),
    effective_to: null,
    applies_to: [subId],
    tags: ['active-status'],
    supersedes: null,
    superseded_by: null,
  };
}

function makeAttributionAssumption(sub, pct) {
  return {
    id: crypto.randomUUID(),
    key: sub.attribution_assumption_key,
    label: `${sub.vendor} ${sub.product} — demand rate`,
    value: pct / 100,
    unit: '%',
    category: 'Subscription cost',
    rationale: `Demand rate set to ${pct}% via Subscriptions view.`,
    source: 'Subscriptions view',
    confidence: 'high',
    status: STATUS.RESOLVED,
    author: getAuthor() || 'Unknown',
    decided_on: new Date().toISOString(),
    effective_from: new Date().toISOString().slice(0, 10),
    effective_to: null,
    applies_to: [sub.id],
    tags: ['demand-rate', 'subscription'],
    supersedes: null,
    superseded_by: null,
  };
}

function makeClassificationAssumption(value) {
  const label = value === 'firm'
    ? 'Confirmed contract or quote — treat as committed saving'
    : 'Estimate based on pricing — treat as indicative only';
  return {
    id: crypto.randomUUID(),
    key: 'hubspot.arch.saving_classification',
    label: 'HubSpot architecture saving — classification',
    value,
    unit: '',
    category: 'HubSpot',
    rationale: label,
    source: 'Decisions view',
    confidence: value === 'firm' ? 'high' : 'medium',
    status: STATUS.RESOLVED,
    author: getAuthor() || 'Unknown',
    decided_on: new Date().toISOString(),
    effective_from: new Date().toISOString().slice(0, 10),
    effective_to: null,
    applies_to: [],
    tags: ['hubspot', 'savings', 'classification'],
    supersedes: null,
    superseded_by: null,
  };
}

function ClassificationBadge({ classification }) {
  const isFirm = classification === 'firm';
  return html`
    <span
      class=${'decisions__classification-badge ' + (isFirm ? 'decisions__classification-badge--firm' : 'decisions__classification-badge--indicative')}
      title=${isFirm
        ? 'Firm: based on a confirmed contract or quote'
        : 'Indicative: based on forecast estimates, not a confirmed contract'}
    >
      ${isFirm ? 'Firm' : 'Indicative'}
    </span>
  `;
}

function inferSubType(sub) {
  if (sub.subscription_type) return sub.subscription_type;
  return sub.cohort_driven ? 'cohort' : 'company';
}

function computeGroupTotal(subsArray, monthlyEntries, assumptions, scenario, ieCount = null) {
  let total = 0;
  for (const sub of subsArray) {
    for (const ym of FY_2627_MONTHS) {
      const entryKey = `${sub.id}_${ym}`;
      const entry = monthlyEntries[entryKey];
      if (entry?.isActual) continue;
      const { value } = computeForecast(sub, ym, assumptions, scenario, ieCount);
      total += value ?? 0;
    }
  }
  return total;
}

function CostDetail({ sub, assumptions, avgCohortSize }) {
  const type = inferSubType(sub);
  const unitCost = lookupValue(assumptions, sub.unit_cost_assumption_key, 0);

  if (type === 'cohort') {
    const demandRate    = lookupValue(assumptions, sub.attribution_assumption_key, 1);
    const seatsPerCohort = Math.round(demandRate * avgCohortSize);
    const costPerCohort  = seatsPerCohort * unitCost;
    return html`
      <span class="subs__cost-detail">
        <span>${Math.round(demandRate * 100)}% of cohort · ~${Math.round(avgCohortSize)} IEs/cohort → ~${seatsPerCohort} seats/cohort</span>
        <span>${sub.currency} ${unitCost.toFixed(2)}/seat · ~${sub.currency} ${costPerCohort.toFixed(2)}/cohort</span>
      </span>
    `;
  }

  if (type === 'bespoke') {
    return html`
      <span class="subs__cost-detail">
        ${sub.cardholder ? html`<span>Cardholder: ${sub.cardholder}</span>` : null}
        <span>${sub.currency} ${unitCost.toFixed(2)}/mo</span>
      </span>
    `;
  }

  // company
  if (!sub.unit_cost_assumption_key && !sub.seat_count_assumption_key) {
    return html`<span class="subs__cost-detail">Fixed monthly cost — see HubSpot architecture view</span>`;
  }
  const seatCount = sub.seat_count_assumption_key
    ? lookupValue(assumptions, sub.seat_count_assumption_key, 0)
    : null;
  return html`
    <span class="subs__cost-detail">
      ${seatCount !== null ? html`<span>${seatCount} fixed seats</span>` : null}
      <span>${sub.currency} ${unitCost.toFixed(2)}/seat</span>
    </span>
  `;
}

function CohortSubRow({ sub, assumptions, scenario, monthlyEntries, avgCohortSize, ieCount, onToggle, onRateChange, onEdit, onArchive }) {
  const key = activeStatusKey(sub.id);
  const isActive = lookupValue(assumptions, key, 'active') !== 'not_active';
  const demandRate    = lookupValue(assumptions, sub.attribution_assumption_key, 1);
  const unitCost      = lookupValue(assumptions, sub.unit_cost_assumption_key, 0);
  const seatsPerCohort = Math.round(demandRate * avgCohortSize);
  const demandPct     = Math.round(demandRate * 100);

  const fy2627Total = useMemo(() => {
    let total = 0;
    for (const ym of FY_2627_MONTHS) {
      const entryKey = `${sub.id}_${ym}`;
      const entry = monthlyEntries[entryKey];
      if (entry?.isActual) continue;
      const { value } = computeForecast(sub, ym, assumptions, scenario, ieCount);
      total += value ?? 0;
    }
    return total;
  }, [sub, assumptions, scenario, monthlyEntries, ieCount]);

  return html`
    <tr class=${'decisions__row' + (!isActive ? ' decisions__row--inactive' : '')}>
      <td class="decisions__sub-cell">
        <div class="decisions__vendor">${sub.vendor}</div>
        <div class="decisions__product">${sub.product}</div>
      </td>
      <td class="decisions__rate-cell">
        <input
          key=${demandPct}
          type="number"
          class="decisions__rate-input"
          defaultValue=${demandPct}
          min=0
          max=100
          onBlur=${e => {
            const pct = Math.min(100, Math.max(0, Number(e.target.value) || 0));
            if (pct !== demandPct) onRateChange(sub, pct);
          }}
          onKeyDown=${e => { if (e.key === 'Enter') e.target.blur(); }}
        />
        <span class="decisions__rate-pct">%</span>
      </td>
      <td class="decisions__seats-cell">~${seatsPerCohort}</td>
      <td class="decisions__unitcost-cell">${sub.currency} ${unitCost.toFixed(2)}/seat</td>
      <td class="decisions__saving-cell">
        ${isActive ? fmt.aud(fy2627Total) : html`<span class="decisions__paused-label">Paused</span>`}
      </td>
      <td class="decisions__toggle-cell">
        <button
          class=${'decisions__toggle btn btn--sm ' + (isActive ? 'btn--secondary' : 'btn--ghost')}
          onClick=${() => onToggle(sub, isActive ? 'not_active' : 'active')}
          title=${isActive ? 'Click to pause this subscription' : 'Click to reactivate this subscription'}
        >
          ${isActive ? 'Active' : 'Not active'}
        </button>
      </td>
      <td class="decisions__actions-cell">
        <button class="btn btn--ghost btn--sm" onClick=${() => onEdit(sub)}>Edit</button>
        ${sub.status !== 'archived' && html`
          <button class="btn btn--ghost btn--sm decisions__archive-btn" onClick=${() => onArchive(sub.id)}>Archive</button>
        `}
      </td>
    </tr>
  `;
}

function SubRow({ sub, assumptions, scenario, monthlyEntries, onToggle, avgCohortSize, ieCount, onEdit, onArchive }) {
  const key = activeStatusKey(sub.id);
  const isActive = lookupValue(assumptions, key, 'active') !== 'not_active';

  const fy2627Total = useMemo(() => {
    let total = 0;
    for (const ym of FY_2627_MONTHS) {
      const entryKey = `${sub.id}_${ym}`;
      const entry = monthlyEntries[entryKey];
      if (entry?.isActual) continue;
      const { value } = computeForecast(sub, ym, assumptions, scenario, ieCount);
      total += value ?? 0;
    }
    return total;
  }, [sub, assumptions, scenario, monthlyEntries, ieCount]);

  return html`
    <tr class=${'decisions__row' + (!isActive ? ' decisions__row--inactive' : '')}>
      <td class="decisions__sub-cell">
        <div class="decisions__vendor">${sub.vendor}</div>
        <div class="decisions__product">${sub.product}</div>
      </td>
      <td class="subs__detail-cell">
        <${CostDetail} sub=${sub} assumptions=${assumptions} avgCohortSize=${avgCohortSize} />
      </td>
      <td class="decisions__saving-cell">
        ${isActive ? fmt.aud(fy2627Total) : html`<span class="decisions__paused-label">Paused</span>`}
      </td>
      <td class="decisions__toggle-cell">
        <button
          class=${'decisions__toggle btn btn--sm ' + (isActive ? 'btn--secondary' : 'btn--ghost')}
          onClick=${() => onToggle(sub, isActive ? 'not_active' : 'active')}
          title=${isActive ? 'Click to pause this subscription' : 'Click to reactivate this subscription'}
        >
          ${isActive ? 'Active' : 'Not active'}
        </button>
      </td>
      <td class="decisions__actions-cell">
        <button class="btn btn--ghost btn--sm" onClick=${() => onEdit(sub)}>Edit</button>
        ${sub.status !== 'archived' && html`
          <button class="btn btn--ghost btn--sm decisions__archive-btn" onClick=${() => onArchive(sub.id)}>Archive</button>
        `}
      </td>
    </tr>
  `;
}

function CohortSubscriptionGroup({ title, subs, groupTotal, assumptions, scenario, monthlyEntries, avgCohortSize, ieCount, onToggle, onRateChange, onEdit, onArchive }) {
  return html`
    <div class="subs__group">
      <h2 class="subs__group-title">
        ${title}
        <span class="subs__group-total">${fmt.aud(groupTotal)} FY 26/27</span>
      </h2>
      <table class="data-table decisions__table decisions__table--cohort">
        <thead>
          <tr>
            <th class="decisions__sub-col">Subscription</th>
            <th class="decisions__rate-col">% of Cohort</th>
            <th class="decisions__seats-col">~Seats/Cohort</th>
            <th class="decisions__unitcost-col">Unit Cost</th>
            <th class="decisions__saving-col">FY 26/27</th>
            <th class="decisions__toggle-col">Status</th>
            <th class="decisions__actions-col"></th>
          </tr>
        </thead>
        <tbody>
          ${subs.length === 0
            ? html`<tr><td colspan="7" class="subs__empty">None</td></tr>`
            : subs.map(sub => html`
                <${CohortSubRow}
                  key=${sub.id}
                  sub=${sub}
                  assumptions=${assumptions}
                  scenario=${scenario}
                  monthlyEntries=${monthlyEntries}
                  avgCohortSize=${avgCohortSize}
                  ieCount=${ieCount}
                  onToggle=${onToggle}
                  onRateChange=${onRateChange}
                  onEdit=${onEdit}
                  onArchive=${onArchive}
                />
              `)
          }
        </tbody>
      </table>
    </div>
  `;
}

function SubscriptionGroup({ title, subs, groupTotal, assumptions, scenario, monthlyEntries, onToggle, avgCohortSize, ieCount, onEdit, onArchive }) {
  return html`
    <div class="subs__group">
      <h2 class="subs__group-title">
        ${title}
        <span class="subs__group-total">${fmt.aud(groupTotal)} FY 26/27</span>
      </h2>
      <table class="data-table decisions__table">
        <thead>
          <tr>
            <th class="decisions__sub-col">Subscription</th>
            <th class="subs__detail-col">Cost detail</th>
            <th class="decisions__saving-col">FY 26/27</th>
            <th class="decisions__toggle-col">Status</th>
            <th class="decisions__actions-col"></th>
          </tr>
        </thead>
        <tbody>
          ${subs.length === 0
            ? html`<tr><td colspan="5" class="subs__empty">None</td></tr>`
            : subs.map(sub => html`
                <${SubRow}
                  key=${sub.id}
                  sub=${sub}
                  assumptions=${assumptions}
                  scenario=${scenario}
                  monthlyEntries=${monthlyEntries}
                  onToggle=${onToggle}
                  avgCohortSize=${avgCohortSize}
                  ieCount=${ieCount}
                  onEdit=${onEdit}
                  onArchive=${onArchive}
                />
              `)
          }
        </tbody>
      </table>
    </div>
  `;
}

export function DecisionsView() {
  const { workbook, dispatch } = useWorkbook();
  const assumptions = workbook.assumptions || {};
  const ieRegister  = workbook.ieRegister  || {};
  const scenario = workbook.scenarios?.[workbook.activeScenarioId] ?? null;
  const monthlyEntries = workbook.monthlyEntries || {};

  const [firmOnly,     setFirmOnly]     = useState(false);
  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [search,       setSearch]       = useState('');
  const [category,     setCategory]     = useState('');
  const [currency,     setCurrency]     = useState('');
  const [entity,       setEntity]       = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const ieCount = useMemo(() => registeredActiveCurrent(ieRegister), [ieRegister]);
  const model = useMemo(() => runForecastModel(assumptions, ieCount), [assumptions, ieCount]);
  const avgCohortSize = useMemo(() => {
    const nowFy = new Date().getMonth() >= 6 ? new Date().getFullYear() + 1 : new Date().getFullYear();
    const fyShort = nowFy % 100;
    return model.sanity[fyShort]?.avgOnboards ?? model.sanity[27]?.avgOnboards ?? 0;
  }, [model]);

  const allSubs = useMemo(
    () => Object.values(workbook.subscriptions || {}),
    [workbook.subscriptions],
  );

  // Summary strip always uses full non-archived set
  const subs = useMemo(
    () => allSubs.filter(s => s.status !== 'archived'),
    [allSubs],
  );

  // Group tables use the filtered set
  const filteredSubs = useMemo(() => {
    return allSubs.filter(s => {
      if (!showArchived && s.status === 'archived') return false;
      const text = search.toLowerCase();
      if (text && !s.vendor.toLowerCase().includes(text) && !s.product.toLowerCase().includes(text)) return false;
      if (category && s.category !== category) return false;
      if (currency && s.currency !== currency) return false;
      if (entity   && s.billing_entity !== entity) return false;
      return true;
    });
  }, [allSubs, search, category, currency, entity, showArchived]);

  const hasFilters = search || category || currency || entity;

  const { statusQuoTotal, toggleSaving, archSaving, archClassification } = useMemo(() => {
    let statusQuo = 0;
    let saving = 0;
    for (const sub of subs) {
      const key = activeStatusKey(sub.id);
      const isInactive = lookupValue(assumptions, key, 'active') === 'not_active';
      let subTotal = 0;
      for (const ym of FY_2627_MONTHS) {
        const entryKey = `${sub.id}_${ym}`;
        const entry = monthlyEntries[entryKey];
        if (entry?.isActual) continue;
        const { value } = computeForecast(sub, ym, assumptions, scenario, ieCount);
        subTotal += value ?? 0;
      }
      if (!isInactive) statusQuo += subTotal;
      else saving += subTotal;
    }

    const selectedArchId = lookupValue(assumptions, 'hubspot.selected_architecture', 'F');
    let archSavingVal = 0;
    if (selectedArchId !== 'F') {
      const archs = computeArchitectureMetrics(assumptions, scenario);
      const archF = archs.find(a => a.id === 'F');
      const archSel = archs.find(a => a.id === selectedArchId);
      if (archF && archSel) {
        archSavingVal = Math.max(0, archF.yearOneTotal - archSel.yearOneTotal);
      }
    }

    const archClass = lookupValue(assumptions, 'hubspot.arch.saving_classification', 'indicative');

    return {
      statusQuoTotal: statusQuo,
      toggleSaving: saving,
      archSaving: archSavingVal,
      archClassification: archClass,
    };
  }, [subs, assumptions, scenario, monthlyEntries, ieCount]);

  const effectiveArchSaving = firmOnly
    ? (archClassification === 'firm' ? archSaving : 0)
    : archSaving;
  const effectiveToggleSaving = firmOnly ? 0 : toggleSaving;
  const adjustedTotal = statusQuoTotal - effectiveArchSaving - effectiveToggleSaving;

  const cohortSubs  = useMemo(() => filteredSubs.filter(s => inferSubType(s) === 'cohort'),  [filteredSubs]);
  const bespokeSubs = useMemo(() => filteredSubs.filter(s => inferSubType(s) === 'bespoke'), [filteredSubs]);
  const companySubs = useMemo(() => filteredSubs.filter(s => inferSubType(s) === 'company'), [filteredSubs]);

  const cohortTotal  = useMemo(
    () => computeGroupTotal(cohortSubs,  monthlyEntries, assumptions, scenario, ieCount),
    [cohortSubs,  monthlyEntries, assumptions, scenario, ieCount],
  );
  const bespokeTotal = useMemo(
    () => computeGroupTotal(bespokeSubs, monthlyEntries, assumptions, scenario, ieCount),
    [bespokeSubs, monthlyEntries, assumptions, scenario, ieCount],
  );
  const companyTotal = useMemo(
    () => computeGroupTotal(companySubs, monthlyEntries, assumptions, scenario, ieCount),
    [companySubs, monthlyEntries, assumptions, scenario, ieCount],
  );

  function handleToggle(sub, newValue) {
    const subLabel = `${sub.vendor} ${sub.product}`;
    const newAssumption = makeActiveStatusAssumption(sub.id, subLabel, newValue);
    const key = activeStatusKey(sub.id);
    const existing = lookupAssumption(assumptions, key);

    if (existing) {
      const payload = buildSupersessionPayload(assumptions, newAssumption);
      if (payload) {
        dispatch({ type: 'ASSUMPTION_SUPERSEDED', payload });
      } else {
        dispatch({ type: 'ASSUMPTION_PROPOSED', payload: newAssumption });
      }
    } else {
      dispatch({ type: 'ASSUMPTION_PROPOSED', payload: newAssumption });
    }
  }

  function handleRateChange(sub, pct) {
    const newAssumption = makeAttributionAssumption(sub, pct);
    const existing = lookupAssumption(assumptions, sub.attribution_assumption_key);
    if (existing) {
      const payload = buildSupersessionPayload(assumptions, newAssumption);
      if (payload) {
        dispatch({ type: 'ASSUMPTION_SUPERSEDED', payload });
      } else {
        dispatch({ type: 'ASSUMPTION_PROPOSED', payload: newAssumption });
      }
    } else {
      dispatch({ type: 'ASSUMPTION_PROPOSED', payload: newAssumption });
    }
  }

  function handleClassificationToggle() {
    const nextClass = archClassification === 'firm' ? 'indicative' : 'firm';
    const newAssumption = makeClassificationAssumption(nextClass);
    const existing = lookupAssumption(assumptions, 'hubspot.arch.saving_classification');
    if (existing) {
      const payload = buildSupersessionPayload(assumptions, newAssumption);
      if (payload) {
        dispatch({ type: 'ASSUMPTION_SUPERSEDED', payload });
      } else {
        dispatch({ type: 'ASSUMPTION_PROPOSED', payload: newAssumption });
      }
    } else {
      dispatch({ type: 'ASSUMPTION_PROPOSED', payload: newAssumption });
    }
  }

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

  if (subs.length === 0) {
    return html`
      <div class="page-header">
        <h1 class="page-header__title">Subscriptions</h1>
      </div>
      <div class="empty-state">Load a workbook to view decisions.</div>
    `;
  }

  const hasArchSaving = archSaving > 0;

  return html`
    <div class="decisions">
      ${showForm && html`
        <${SubscriptionForm}
          initial=${editTarget}
          onSave=${handleSave}
          onCancel=${() => { setShowForm(false); setEditTarget(null); }}
        />
      `}
      <div class="page-header">
        <h1 class="page-header__title">Subscriptions</h1>
        <span class="page-header__count">
          ${filteredSubs.length} subscription${filteredSubs.length !== 1 ? 's' : ''}
          ${hasFilters ? ' (filtered)' : ''}
        </span>
        <button
          class="btn btn--primary btn--sm"
          onClick=${() => { setEditTarget(null); setShowForm(true); }}
        >
          Add subscription
        </button>
        <button
          class=${'decisions__firm-filter btn btn--sm ' + (firmOnly ? 'btn--primary' : 'btn--ghost')}
          onClick=${() => setFirmOnly(f => !f)}
          title="When active, only firm-classified savings count toward the adjusted total"
        >
          ${firmOnly ? 'Firm only ✓' : 'Firm only'}
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
      <div class="decisions__summary">
        <div class="decisions__summary-row">
          <span class="decisions__summary-label">FY 26/27 status quo forecast</span>
          <span class="decisions__summary-value">${fmt.aud(statusQuoTotal)}</span>
        </div>
        <div class="decisions__summary-row decisions__summary-row--saving">
          <span class="decisions__summary-label">
            Architecture saving (HubSpot negotiation)
            ${hasArchSaving && html`
              <${ClassificationBadge} classification=${archClassification} />
              <button
                class="decisions__classify-btn btn btn--sm btn--ghost"
                onClick=${handleClassificationToggle}
                title=${archClassification === 'firm' ? 'Mark as indicative' : 'Mark as firm (confirmed quote or contract)'}
              >
                ${archClassification === 'firm' ? 'Mark indicative' : 'Mark as firm'}
              </button>
            `}
          </span>
          <span class="decisions__summary-value decisions__summary-saving">
            ${effectiveArchSaving > 0 ? `− ${fmt.aud(effectiveArchSaving)}` : '—'}
            ${firmOnly && hasArchSaving && archClassification !== 'firm' ? html`<span class="decisions__excluded-hint">(excluded)</span>` : ''}
          </span>
        </div>
        <div class="decisions__summary-row decisions__summary-row--saving">
          <span class="decisions__summary-label">
            Toggle saving (subscription cuts)
            <${ClassificationBadge} classification="indicative" />
          </span>
          <span class="decisions__summary-value decisions__summary-saving">
            ${effectiveToggleSaving > 0 ? `− ${fmt.aud(effectiveToggleSaving)}` : '—'}
            ${firmOnly && toggleSaving > 0 ? html`<span class="decisions__excluded-hint">(excluded)</span>` : ''}
          </span>
        </div>
        <div class="decisions__summary-row decisions__summary-row--total">
          <span class="decisions__summary-label">Adjusted FY 26/27${firmOnly ? ' (firm only)' : ''}</span>
          <span class="decisions__summary-value">${fmt.aud(adjustedTotal)}</span>
        </div>
      </div>
      <${CohortSubscriptionGroup}
        title="Per IE subscriptions"
        subs=${cohortSubs}
        groupTotal=${cohortTotal}
        assumptions=${assumptions}
        scenario=${scenario}
        monthlyEntries=${monthlyEntries}
        avgCohortSize=${avgCohortSize}
        ieCount=${ieCount}
        onToggle=${handleToggle}
        onRateChange=${handleRateChange}
        onEdit=${e => { setEditTarget(e); setShowForm(true); }}
        onArchive=${handleArchive}
      />
      <${SubscriptionGroup}
        title="Bespoke subscriptions"
        subs=${bespokeSubs}
        groupTotal=${bespokeTotal}
        assumptions=${assumptions}
        scenario=${scenario}
        monthlyEntries=${monthlyEntries}
        onToggle=${handleToggle}
        avgCohortSize=${avgCohortSize}
        ieCount=${ieCount}
        onEdit=${e => { setEditTarget(e); setShowForm(true); }}
        onArchive=${handleArchive}
      />
      <${SubscriptionGroup}
        title="Company subscriptions"
        subs=${companySubs}
        groupTotal=${companyTotal}
        assumptions=${assumptions}
        scenario=${scenario}
        monthlyEntries=${monthlyEntries}
        onToggle=${handleToggle}
        avgCohortSize=${avgCohortSize}
        ieCount=${ieCount}
        onEdit=${e => { setEditTarget(e); setShowForm(true); }}
        onArchive=${handleArchive}
      />
      <hr class="section-divider" style=${{ margin: '48px 0 24px', border: 'none', borderTop: '1px solid var(--color-border)' }} />
      <${SavingsView} />
      <hr class="section-divider" style=${{ margin: '48px 0 24px', border: 'none', borderTop: '1px solid var(--color-border)' }} />
      <${DecisionLog} />
    </div>
  `;
}
