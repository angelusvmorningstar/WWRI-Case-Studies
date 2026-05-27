const { html, useMemo, useState } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { computeForecast, activeStatusKey, FY_2627_MONTHS, registeredActiveAtMonth } from '../../state/compute.js';
import { lookupValue, lookupAssumption, buildSupersessionPayload, STATUS } from '../../state/assumptions.js';
import { intakeIEsAtMonth } from '../../state/cohort.js';
import { fmt } from '../../shared/format.js';
import { getAuthor } from '../../state/identity.js';

// ── Forecast models ───────────────────────────────────────────────────────────

const MODELS = {
  basic: {
    id: 'basic',
    label: 'Basic',
    description: 'M365 Basic only — no Copilot, no HubSpot cohort seat, no Miro',
    attrOverrides: {},
    // Whitelist: only these IDs are included — everything else is ignored
    includeSubs: ['sub-m365-basic'],
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    description: 'M365 Standard + Copilot · HubSpot core seat (1 per IE) · Miro standard',
    // Force 100% attribution so the Standard model shows full projected cost
    attrOverrides: {
      'subscription.m365_standard_ie.attribution_rate': 1.0,
      'subscription.copilot_ie.attribution_rate':       1.0,
      'subscription.miro.attribution_rate':             1.0,
      'subscription.hubspot_core.attribution_rate':     1.0,
    },
    includeSubs: ['sub-m365-standard-cohort', 'sub-copilot-cohort', 'sub-miro', 'sub-hubspot-cohort'],
  },
};

// Build a modified assumptions object with per-key value overrides
function buildModelAssumptions(assumptions, overrides) {
  const result = { ...assumptions };
  for (const [key, value] of Object.entries(overrides)) {
    const existing = Object.values(result).find(a => a.key === key);
    if (existing) {
      result[existing.id] = { ...existing, value };
    } else {
      const id = 'model-' + key.replace(/\./g, '-');
      result[id] = { id, key, value };
    }
  }
  return result;
}

function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
}

// Returns the first day of the month after renewalDate (YYYY-MM-DD), or today if none.
function pauseEffectiveFrom(renewalDate) {
  if (!renewalDate) return new Date().toISOString().slice(0, 10);
  const d = new Date(renewalDate + 'T00:00:00');
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function makeActiveStatusAssumption(subId, subLabel, value, effectiveFrom) {
  return {
    id: crypto.randomUUID(),
    key: activeStatusKey(subId),
    label: `${subLabel} — active status`,
    value,
    unit: '',
    category: 'Governance',
    rationale: `${value === 'not_active' ? 'Paused' : 'Reactivated'} via Forecast view.`,
    source: 'Forecast view toggle',
    confidence: 'high',
    status: STATUS.RESOLVED,
    author: getAuthor() || 'Unknown',
    decided_on: new Date().toISOString(),
    effective_from: effectiveFrom || new Date().toISOString().slice(0, 10),
    effective_to: null,
    applies_to: [subId],
    tags: ['active-status'],
    supersedes: null,
    superseded_by: null,
  };
}

// ── Section 1: Per-IE model forecast ─────────────────────────────────────────

function PerIEForecast({ cohortSubs, monthlyEntries, assumptions, primaryScenario, ieRegister, intakeSchedule }) {
  const [modelId, setModelId] = useState('basic');
  const model = MODELS[modelId];

  const { rows, annual, subBreakdown } = useMemo(() => {
    const modelAss  = buildModelAssumptions(assumptions, model.attrOverrides);
    const activeSubs = cohortSubs.filter(s => model.includeSubs.includes(s.id) && s.status !== 'archived');

    const fy26Baseline = lookupValue(assumptions, 'forecast.model.target.fy26', 22);
    const root = (primaryScenario?.id || 'scenario-primary-target').replace('scenario-', '').replace(/-/g, '_');
    const iesPerCohort = lookupValue(assumptions, `scenario.${root}.ies_per_cohort`, 10);
    const hasSchedule  = intakeSchedule && intakeSchedule.length > 0;

    let prev = null;
    const rows = FY_2627_MONTHS.map(ym => {
      const regCount   = registeredActiveAtMonth(ieRegister, ym);
      const schedCount = hasSchedule ? intakeIEsAtMonth(ym, fy26Baseline, iesPerCohort, intakeSchedule) : null;
      const ieCount    = regCount ?? schedCount;
      const intakeDelta = intakeSchedule.includes(ym) ? iesPerCohort : null;
      const total = activeSubs.reduce((sum, s) => {
        const entry = monthlyEntries[`${s.id}_${ym}`];
        if (entry?.isActual && entry?.costAud != null) return sum + entry.costAud;
        return sum + (computeForecast(s, ym, modelAss, primaryScenario, ieCount).value ?? 0);
      }, 0);
      const delta = prev !== null ? total - prev : null;
      prev = total;
      return { ym, total, delta, ieCount, intakeDelta };
    });

    const annual = rows.reduce((s, r) => s + r.total, 0);

    const subBreakdown = activeSubs.map(s => {
      const ann = FY_2627_MONTHS.reduce((sum, ym) => {
        const regCount   = registeredActiveAtMonth(ieRegister, ym);
        const schedCount = hasSchedule ? intakeIEsAtMonth(ym, fy26Baseline, iesPerCohort, intakeSchedule) : null;
        const ieCount    = regCount ?? schedCount;
        const entry = monthlyEntries[`${s.id}_${ym}`];
        if (entry?.isActual && entry?.costAud != null) return sum + entry.costAud;
        return sum + (computeForecast(s, ym, modelAss, primaryScenario, ieCount).value ?? 0);
      }, 0);
      return { id: s.id, label: `${s.vendor} — ${s.product}`, annual: ann };
    }).filter(r => r.annual > 0).sort((a, b) => b.annual - a.annual);

    return { rows, annual, subBreakdown };
  }, [cohortSubs, monthlyEntries, assumptions, primaryScenario, model, ieRegister, intakeSchedule]);

  return html`
    <section class="panel forecast__per-ie-panel">
      <div class="forecast__per-ie-header">
        <div>
          <h2 class="panel__title">Per-IE subscription cost — FY 26/27</h2>
          <p class="text-muted forecast__model-desc">${model.description}</p>
        </div>
        <div class="forecast__model-toggle">
          ${Object.values(MODELS).map(m => html`
            <button
              key=${m.id}
              class=${'btn btn--sm ' + (modelId === m.id ? 'btn--primary' : 'btn--ghost')}
              onClick=${() => setModelId(m.id)}
            >${m.label}</button>
          `)}
        </div>
      </div>

      <div class="forecast__per-ie-body">
        <div class="table-wrapper">
          <table class="data-table forecast__monthly-table">
            <thead>
              <tr>
                <th class="forecast__month-col">Month</th>
                <th class="forecast__ie-col">IEs</th>
                <th class="forecast__intake-col">Intake</th>
                <th class="forecast__cost-col forecast__cost-col--primary">Total cost</th>
                <th class="forecast__delta-col">Δ MoM</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(({ ym, total, delta, ieCount, intakeDelta }) => html`
                <tr key=${ym}>
                  <td class="forecast__month-cell">${monthLabel(ym)}</td>
                  <td class="forecast__ie-cell">${ieCount !== null ? ieCount : '—'}</td>
                  <td class=${'forecast__intake-cell' + (intakeDelta ? ' forecast__intake-cell--active' : '')}>
                    ${intakeDelta ? '+' + intakeDelta : '—'}
                  </td>
                  <td class="forecast__cost-cell forecast__cost-cell--primary">${fmt.aud(total)}</td>
                  <td class=${'forecast__delta-cell' + (delta === null ? '' : delta > 0 ? ' forecast__delta--up' : delta < 0 ? ' forecast__delta--down' : '')}>
                    ${delta === null || delta === 0 ? '—' : (delta > 0 ? '+' : '') + fmt.aud(delta)}
                  </td>
                </tr>
              `)}
            </tbody>
            <tfoot>
              <tr class="forecast__monthly-total">
                <td><strong>FY 26/27 total</strong></td>
                <td></td>
                <td class="forecast__cost-cell forecast__cost-cell--primary"><strong>${fmt.aud(annual)}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        ${subBreakdown.length > 0 && html`
          <div class="forecast__sub-breakdown">
            <div class="forecast__sub-breakdown-title">Included in this model</div>
            ${subBreakdown.map(r => html`
              <div key=${r.id} class="forecast__sub-breakdown-row">
                <span class="forecast__sub-breakdown-label">${r.label}</span>
                <span class="forecast__sub-breakdown-value">${fmt.aud(r.annual)} / yr</span>
              </div>
            `)}
          </div>
        `}
      </div>
    </section>
  `;
}

// ── Section 2: Platform subscription decisions ────────────────────────────────

const TODAY_YM = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
})();

function pauseStateFor(sub, assumptions) {
  const ass = lookupAssumption(assumptions, activeStatusKey(sub.id));
  if (!ass || ass.value !== 'not_active') return { state: 'active', pauseFromYM: null };
  const fromYM = ass.effective_from ? ass.effective_from.slice(0, 7) : null;
  if (fromYM && fromYM > TODAY_YM) return { state: 'scheduled', pauseFromYM: fromYM };
  return { state: 'paused', pauseFromYM: fromYM };
}

function fmtYM(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
}

function PlatformDecisions({ platformSubs, monthlyEntries, assumptions, dispatch, ieRegister }) {
  const rows = useMemo(() => {
    return platformSubs
      .map(s => {
        const { state, pauseFromYM } = pauseStateFor(s, assumptions);
        const annual = FY_2627_MONTHS.reduce((sum, ym) => {
          const entry = monthlyEntries[`${s.id}_${ym}`];
          if (entry?.isActual && entry?.costAud != null) return sum + entry.costAud;
          const ieCount = registeredActiveAtMonth(ieRegister, ym);
          return sum + (computeForecast(s, ym, assumptions, null, ieCount).value ?? 0);
        }, 0);
        return { sub: s, state, pauseFromYM, annual };
      })
      .sort((a, b) => b.annual - a.annual);
  }, [platformSubs, monthlyEntries, assumptions, ieRegister]);

  const runningTotal = rows.reduce((s, r) => s + r.annual, 0);
  const pausedTotal  = rows.filter(r => r.state === 'paused').reduce((s, r) => s + r.annual, 0);

  function dispatchPause(sub, newValue, effectiveFrom) {
    const newAss = makeActiveStatusAssumption(sub.id, `${sub.vendor} ${sub.product}`, newValue, effectiveFrom);
    const existing = lookupAssumption(assumptions, newAss.key);
    if (existing) {
      const payload = buildSupersessionPayload(assumptions, newAss);
      dispatch(payload
        ? { type: 'ASSUMPTION_SUPERSEDED', payload }
        : { type: 'ASSUMPTION_PROPOSED',   payload: newAss }
      );
    } else {
      dispatch({ type: 'ASSUMPTION_PROPOSED', payload: newAss });
    }
  }

  function handlePause(sub) {
    const effectiveFrom = pauseEffectiveFrom(sub.renewal_date);
    dispatchPause(sub, 'not_active', effectiveFrom);
  }

  function handleActivate(sub) {
    dispatchPause(sub, 'active', new Date().toISOString().slice(0, 10));
  }

  return html`
    <section class="panel forecast__platform-panel">
      <div class="forecast__platform-header">
        <h2 class="panel__title">Platform subscriptions — FY 26/27 impact</h2>
        <div class="forecast__platform-totals">
          <span>Total: <strong>${fmt.aud(runningTotal)}</strong></span>
          ${pausedTotal > 0 && html`
            <span class="forecast__platform-paused-total">Paused: <strong>${fmt.aud(pausedTotal)}</strong></span>
          `}
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table forecast__platform-table">
          <thead>
            <tr>
              <th>Subscription</th>
              <th>Category</th>
              <th class="ta-right">Renewal</th>
              <th class="ta-right">FY 26/27</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(({ sub, state, pauseFromYM, annual }) => html`
              <tr key=${sub.id} class=${state === 'paused' ? 'forecast__platform-row--paused' : ''}>
                <td>
                  <span class="forecast__platform-vendor">${sub.vendor}</span>
                  <span class="forecast__platform-product"> — ${sub.product}</span>
                  ${state === 'scheduled' && html`
                    <span class="forecast__platform-badge forecast__platform-badge--scheduled">
                      Cancels ${fmtYM(pauseFromYM)}
                    </span>
                  `}
                  ${state === 'paused' && html`
                    <span class="forecast__platform-badge forecast__platform-badge--paused">Paused</span>
                  `}
                </td>
                <td class="text-muted">${sub.category}</td>
                <td class="ta-right text-muted forecast__platform-renewal">
                  ${sub.renewal_date ? fmtYM(sub.renewal_date.slice(0, 7)) : '—'}
                </td>
                <td class=${'ta-right' + (state === 'paused' ? ' text-muted' : '')}>${fmt.aud(annual)}</td>
                <td class="ta-right">
                  ${state === 'active' && html`
                    <button
                      class="btn btn--sm btn--ghost forecast__platform-toggle"
                      onClick=${() => handlePause(sub)}
                    >${sub.renewal_date ? `Pause from ${fmtYM(pauseEffectiveFrom(sub.renewal_date).slice(0, 7))}` : 'Pause'}</button>
                  `}
                  ${state === 'scheduled' && html`
                    <button
                      class="btn btn--sm btn--ghost forecast__platform-toggle forecast__platform-toggle--undo"
                      onClick=${() => handleActivate(sub)}
                    >Undo</button>
                  `}
                  ${state === 'paused' && html`
                    <button
                      class="btn btn--sm btn--ghost forecast__platform-toggle forecast__platform-toggle--activate"
                      onClick=${() => handleActivate(sub)}
                    >Activate</button>
                  `}
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function ForecastView() {
  const { workbook, dispatch } = useWorkbook();
  const assumptions    = workbook.assumptions    || {};
  const monthlyEntries = workbook.monthlyEntries || {};
  const ieRegister     = workbook.ieRegister     || {};
  const intakeSchedule = workbook.intakeSchedule || [];
  const primaryScenario = workbook.scenarios?.['scenario-primary-target'] ?? null;

  const { cohortSubs, platformSubs } = useMemo(() => {
    const all = Object.values(workbook.subscriptions || {}).filter(s => s.status !== 'archived');
    return {
      cohortSubs:   all.filter(s =>  s.cohort_driven),
      platformSubs: all.filter(s => !s.cohort_driven),
    };
  }, [workbook.subscriptions]);

  const registeredActive = useMemo(
    () => Object.values(ieRegister).filter(ie => ie.active !== false && ie.training).length,
    [ieRegister],
  );

  return html`
    <div class="forecast-page">
      <div class="page-header">
        <h1 class="page-header__title">Forecast</h1>
        <span class="page-header__count">FY 26/27 · ${registeredActive > 0 ? `${registeredActive} active IEs` : 'Primary Target headcount'}</span>
      </div>
      <${PerIEForecast}
        cohortSubs=${cohortSubs}
        monthlyEntries=${monthlyEntries}
        assumptions=${assumptions}
        primaryScenario=${primaryScenario}
        ieRegister=${ieRegister}
        intakeSchedule=${intakeSchedule}
      />
      <${PlatformDecisions}
        platformSubs=${platformSubs}
        monthlyEntries=${monthlyEntries}
        assumptions=${assumptions}
        dispatch=${dispatch}
        ieRegister=${ieRegister}
      />
    </div>
  `;
}
