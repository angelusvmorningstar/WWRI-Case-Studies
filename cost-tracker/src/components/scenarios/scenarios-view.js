const { html, useMemo } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { lookupValue, createAssumption, resolveAssumption, STATUS } from '../../state/assumptions.js';
import { runForecastModel } from '../../state/cohort.js';
import { registeredActiveCurrent } from '../../state/compute.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function updateForecastParam(key, value, assumptions, dispatch) {
  const existing = Object.values(assumptions).find(a => a.key === key);
  if (existing) {
    dispatch({
      type: 'ASSUMPTION_UPDATED',
      payload: {
        ...existing,
        value: Number(value),
        status: STATUS.RESOLVED,
        rationale: existing.rationale || 'Set via Scenarios panel',
        source: existing.source || 'Manual edit',
        decided_on: new Date().toISOString(),
      },
    });
  } else {
    const draft = createAssumption({
      key,
      label: key,
      value: Number(value),
      category: 'Scenario input',
      rationale: 'Set via Scenarios panel',
      source: 'Manual edit',
    });
    dispatch({ type: 'ASSUMPTION_PROPOSED', payload: resolveAssumption(draft, { rationale: 'Set via Scenarios panel', source: 'Manual edit' }) });
  }
}

function fmt1dp(n) {
  return Number.isFinite(n) ? n.toFixed(1) : '—';
}

// ── Shared input component ────────────────────────────────────────────────────

function ParamInput({ label, assumptionKey, rawValue, isPercent, readOnly, suffix, assumptions, dispatch }) {
  const displayValue = isPercent
    ? Math.round(rawValue * 1000) / 10  // 0.333 → 33.3
    : rawValue;

  function handleBlur(e) {
    if (readOnly) return;
    const raw = parseFloat(e.target.value);
    if (Number.isNaN(raw)) return;
    const stored = isPercent ? raw / 100 : raw;
    updateForecastParam(assumptionKey, stored, assumptions, dispatch);
  }

  return html`
    <div class="forecast-params__field">
      <span class="forecast-params__label">${label}</span>
      <div class="forecast-params__input-wrap">
        <input
          key=${`${assumptionKey}:${displayValue}`}
          class="forecast-params__input field__input"
          type="number"
          defaultValue=${displayValue}
          disabled=${readOnly}
          step=${isPercent ? '0.1' : '1'}
          onBlur=${handleBlur}
        />
        ${suffix && html`<span class="forecast-params__unit">${suffix}</span>`}
      </div>
    </div>
  `;
}

// ── ModelParamsPanel ──────────────────────────────────────────────────────────

function ModelParamsPanel({ assumptions, dispatch }) {
  const wApac     = lookupValue(assumptions, 'forecast.model.region_weight.apac',     0.333);
  const wAmericas = lookupValue(assumptions, 'forecast.model.region_weight.americas', 0.333);
  const wEmea     = lookupValue(assumptions, 'forecast.model.region_weight.emea',     0.334);
  const weightSum = Math.round((wApac + wAmericas + wEmea) * 1000) / 10;
  const weightOk  = Math.abs(weightSum - 100) < 0.2;

  return html`
    <section class="panel forecast-params">
      <h2 class="panel__title">Model parameters</h2>

      <div class="forecast-params__sections">

        <div class="forecast-params__section">
          <h3 class="forecast-params__section-title">Headcount targets (FY-end active IEs)</h3>
          <div class="forecast-params__grid">
            <div class="forecast-params__field forecast-params__field--readonly">
              <span class="forecast-params__label">FY26 (actual)</span>
              <div class="forecast-params__input-wrap">
                <input class="forecast-params__input field__input" type="number" value="22" disabled />
              </div>
            </div>
            <${ParamInput}
              label="FY27 target"
              assumptionKey="forecast.model.target.fy27"
              rawValue=${lookupValue(assumptions, 'forecast.model.target.fy27', 60)}
              assumptions=${assumptions}
              dispatch=${dispatch}
            />
            <${ParamInput}
              label="FY28 target"
              assumptionKey="forecast.model.target.fy28"
              rawValue=${lookupValue(assumptions, 'forecast.model.target.fy28', 99)}
              assumptions=${assumptions}
              dispatch=${dispatch}
            />
            <${ParamInput}
              label="FY29 target"
              assumptionKey="forecast.model.target.fy29"
              rawValue=${lookupValue(assumptions, 'forecast.model.target.fy29', 150)}
              assumptions=${assumptions}
              dispatch=${dispatch}
            />
          </div>
        </div>

        <div class="forecast-params__section">
          <h3 class="forecast-params__section-title">
            Regional weights
            ${!weightOk && html`<span class="forecast-params__weight-warning">Sum = ${weightSum}% (must be 100%)</span>`}
          </h3>
          <div class="forecast-params__grid">
            <${ParamInput}
              label="APAC"
              assumptionKey="forecast.model.region_weight.apac"
              rawValue=${wApac}
              isPercent
              suffix="%"
              assumptions=${assumptions}
              dispatch=${dispatch}
            />
            <${ParamInput}
              label="Americas"
              assumptionKey="forecast.model.region_weight.americas"
              rawValue=${wAmericas}
              isPercent
              suffix="%"
              assumptions=${assumptions}
              dispatch=${dispatch}
            />
            <${ParamInput}
              label="EMEA"
              assumptionKey="forecast.model.region_weight.emea"
              rawValue=${wEmea}
              isPercent
              suffix="%"
              assumptions=${assumptions}
              dispatch=${dispatch}
            />
          </div>
        </div>

        <div class="forecast-params__section">
          <h3 class="forecast-params__section-title">Annual attrition rates</h3>
          <div class="forecast-params__grid">
            <${ParamInput}
              label="APAC"
              assumptionKey="forecast.model.attrition_rate.apac"
              rawValue=${lookupValue(assumptions, 'forecast.model.attrition_rate.apac', 0.10)}
              isPercent
              suffix="%"
              assumptions=${assumptions}
              dispatch=${dispatch}
            />
            <${ParamInput}
              label="Americas"
              assumptionKey="forecast.model.attrition_rate.americas"
              rawValue=${lookupValue(assumptions, 'forecast.model.attrition_rate.americas', 0.10)}
              isPercent
              suffix="%"
              assumptions=${assumptions}
              dispatch=${dispatch}
            />
            <${ParamInput}
              label="EMEA"
              assumptionKey="forecast.model.attrition_rate.emea"
              rawValue=${lookupValue(assumptions, 'forecast.model.attrition_rate.emea', 0.10)}
              isPercent
              suffix="%"
              assumptions=${assumptions}
              dispatch=${dispatch}
            />
          </div>
        </div>

        <div class="forecast-params__section">
          <h3 class="forecast-params__section-title">Pipeline rates & cohorts</h3>
          <div class="forecast-params__grid">
            <${ParamInput}
              label="Vetted → Shortlist"
              assumptionKey="forecast.model.vet_to_short_rate"
              rawValue=${lookupValue(assumptions, 'forecast.model.vet_to_short_rate', 0.40)}
              isPercent
              suffix="%"
              assumptions=${assumptions}
              dispatch=${dispatch}
            />
            <${ParamInput}
              label="Shortlist → Onboarded"
              assumptionKey="forecast.model.short_to_onboard_rate"
              rawValue=${lookupValue(assumptions, 'forecast.model.short_to_onboard_rate', 0.50)}
              isPercent
              suffix="%"
              assumptions=${assumptions}
              dispatch=${dispatch}
            />
            <${ParamInput}
              label="Cohorts per year"
              assumptionKey="forecast.model.cohorts_per_year"
              rawValue=${lookupValue(assumptions, 'forecast.model.cohorts_per_year', 5)}
              assumptions=${assumptions}
              dispatch=${dispatch}
            />
          </div>
        </div>

      </div>
    </section>
  `;
}

// ── ForecastResultsPanel ──────────────────────────────────────────────────────

const REGION_LABELS = { apac: 'APAC', americas: 'Americas', emea: 'EMEA' };

const STAGE_ROWS = [
  { key: 'sourced',   label: 'Sourced' },
  { key: 'longlist',  label: 'Longlist + Reachout' },
  { key: 'shortlist', label: 'Shortlist + Vetting' },
  { key: 'attrition', label: 'Attrition' },
  { key: 'activeIEs', label: 'Active IEs' },
];

function ForecastResultsPanel({ model }) {
  const { fys, regions, globalTotals, sanity } = model;
  const computedFys = [27, 28, 29];

  function cellVal(stageKey, region, fy) {
    if (fy === 26) {
      // FY26 only has activeIEs; other stages are actuals not modelled
      return stageKey === 'activeIEs' ? model.activeIEs[region][26] : '—';
    }
    return model[stageKey][region][fy];
  }

  function globalCellVal(stageKey, fy) {
    if (fy === 26) {
      if (stageKey !== 'activeIEs') return '—';
      return regions.reduce((s, r) => s + model.activeIEs[r][26], 0);
    }
    return globalTotals[fy][stageKey];
  }

  return html`
    <section class="panel forecast-results">
      <h2 class="panel__title">Forecast results</h2>
      <div class="table-wrapper">
        <table class="data-table forecast-results__table">
          <thead>
            <tr>
              <th class="forecast-results__col-region">Region</th>
              <th class="forecast-results__col-stage">Stage</th>
              ${fys.map(fy => html`
                <th key=${fy} class="forecast-results__col-fy">
                  FY${fy}${fy === 26 ? html`<span class="forecast-results__actual-tag"> actual</span>` : ''}
                </th>
              `)}
            </tr>
          </thead>
          <tbody>
            ${regions.map(region => html`
              ${STAGE_ROWS.map((stage, i) => html`
                <tr key=${`${region}-${stage.key}`} class=${i === 0 ? 'forecast-results__region-first' : ''}>
                  ${i === 0 && html`
                    <td class="forecast-results__region-cell" rowspan="5">${REGION_LABELS[region]}</td>
                  `}
                  <td class="forecast-results__stage-cell">${stage.label}</td>
                  ${fys.map(fy => html`
                    <td key=${fy} class="forecast-results__val-cell">${cellVal(stage.key, region, fy)}</td>
                  `)}
                </tr>
              `)}
            `)}
            <tr class="forecast-results__global-header">
              <td colspan="2" class="forecast-results__global-label">Global total</td>
              ${fys.map(fy => html`<td key=${fy}></td>`)}
            </tr>
            ${STAGE_ROWS.map(stage => html`
              <tr key=${`global-${stage.key}`}>
                <td></td>
                <td class="forecast-results__stage-cell">${stage.label}</td>
                ${fys.map(fy => html`
                  <td key=${fy} class="forecast-results__val-cell forecast-results__val-cell--total">
                    ${globalCellVal(stage.key, fy)}
                  </td>
                `)}
              </tr>
            `)}
            <tr class="forecast-results__sanity-header">
              <td colspan=${2 + fys.length} class="forecast-results__sanity-label">Sanity check — avg onboards per cohort (target: 10–15)</td>
            </tr>
            <tr class="forecast-results__sanity-row">
              <td></td>
              <td class="forecast-results__stage-cell">Avg onboards / cohort</td>
              <td class="forecast-results__val-cell text-muted">—</td>
              ${computedFys.map(fy => html`
                <td key=${fy} class=${'forecast-results__val-cell forecast-results__sanity-val forecast-results__sanity-val--' + (sanity[fy].withinBand ? 'ok' : 'warn')}>
                  ${fmt1dp(sanity[fy].avgOnboards)}
                  <span class="forecast-results__band-tag">${sanity[fy].band}</span>
                </td>
              `)}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// ── ScenarioEnvelopePanel ─────────────────────────────────────────────────────

const ENVELOPE_DEFS = [
  { id: 'scenario-minimum-viable',  label: 'Minimum viable',  variantKey: 'min',  cssClass: 'min'     },
  { id: 'scenario-primary-target',  label: 'Primary target',  variantKey: null,   cssClass: 'primary' },
  { id: 'scenario-optimal-maximum', label: 'Optimal maximum', variantKey: 'max',  cssClass: 'max'     },
];

function ScenarioEnvelopePanel({ model, activeScenarioId, assumptions }) {
  const targets = model.params.targets;
  const computedFys = [27, 28, 29];

  function activeIEsForScenario(variantKey, fy) {
    if (variantKey === 'min') {
      const factor = lookupValue(assumptions, 'forecast.model.variance.min', 0.80);
      return Math.round(targets[fy] * factor);
    }
    if (variantKey === 'max') {
      const factor = lookupValue(assumptions, 'forecast.model.variance.max', 1.20);
      return Math.round(targets[fy] * factor);
    }
    return targets[fy];
  }

  return html`
    <section class="panel forecast-envelope">
      <h2 class="panel__title">Scenario envelope</h2>
      <p class="panel__subtitle">Active IE headcount at FY-end, derived from ±20% variance on the base forecast.</p>
      <div class="forecast-envelope__grid">
        ${ENVELOPE_DEFS.map(def => html`
          <div
            key=${def.id}
            class=${'forecast-envelope__card forecast-envelope__card--' + def.cssClass + (activeScenarioId === def.id ? ' forecast-envelope__card--active' : '')}
          >
            <div class="forecast-envelope__card-title">${def.label}</div>
            <table class="forecast-envelope__table">
              <thead>
                <tr>
                  ${computedFys.map(fy => html`<th key=${fy}>FY${fy}</th>`)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  ${computedFys.map(fy => html`
                    <td key=${fy} class="forecast-envelope__ies">${activeIEsForScenario(def.variantKey, fy)}</td>
                  `)}
                </tr>
              </tbody>
            </table>
          </div>
        `)}
      </div>
    </section>
  `;
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function ScenariosView() {
  const { workbook, dispatch } = useWorkbook();
  const assumptions = workbook.assumptions || {};
  const activeLabel = workbook.scenarios?.[workbook.activeScenarioId]?.label ?? 'None';
  const ieCount = useMemo(() => registeredActiveCurrent(workbook.ieRegister), [workbook.ieRegister]);

  const model = useMemo(() => runForecastModel(assumptions, ieCount), [assumptions, ieCount]);

  return html`
    <div class="scenarios-page">
      <div class="page-header">
        <h1 class="page-header__title">Recruitment</h1>
        <span class="page-header__count">Active: ${activeLabel}</span>
      </div>
      <${ModelParamsPanel} assumptions=${assumptions} dispatch=${dispatch} />
      <${ForecastResultsPanel} model=${model} />
      <${ScenarioEnvelopePanel}
        model=${model}
        activeScenarioId=${workbook.activeScenarioId}
        assumptions=${assumptions}
      />
    </div>
  `;
}
