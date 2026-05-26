const { html, useMemo } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { lookupValue, createAssumption, resolveAssumption, STATUS } from '../../state/assumptions.js';
import { runForecastModel } from '../../state/cohort.js';
import { registeredActiveCurrent } from '../../state/compute.js';

const REGIONS = [
  { key: 'apac',     label: 'APAC'     },
  { key: 'americas', label: 'Americas' },
  { key: 'emea',     label: 'EMEA'     },
];

// ── Shared helpers ────────────────────────────────────────────────────────────

function updateForecastParam(key, value, assumptions, dispatch) {
  const existing = Object.values(assumptions).find(a => a.key === key);
  if (existing) {
    dispatch({
      type: 'ASSUMPTION_UPDATED',
      payload: {
        ...existing,
        value: Number(value),
        status: STATUS.RESOLVED,
        rationale: existing.rationale || 'Set via IE Intake panel',
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
      rationale: 'Set via IE Intake panel',
      source: 'Manual edit',
    });
    dispatch({ type: 'ASSUMPTION_PROPOSED', payload: resolveAssumption(draft, { rationale: 'Set via IE Intake panel', source: 'Manual edit' }) });
  }
}

function ParamInput({ label, assumptionKey, rawValue, isPercent, readOnly, suffix, assumptions, dispatch }) {
  const displayValue = isPercent ? Math.round(rawValue * 1000) / 10 : rawValue;

  function handleBlur(e) {
    if (readOnly) return;
    const raw = parseFloat(e.target.value);
    if (Number.isNaN(raw)) return;
    const stored = isPercent ? raw / 100 : raw;
    updateForecastParam(assumptionKey, stored, assumptions, dispatch);
  }

  return html`
    <div class="ie-intake__field">
      <span class="ie-intake__field-label">${label}</span>
      <div class="ie-intake__field-input-wrap">
        <input
          key=${`${assumptionKey}:${displayValue}`}
          class="ie-intake__field-input field__input"
          type="number"
          defaultValue=${displayValue}
          disabled=${readOnly}
          step=${isPercent ? '0.1' : '1'}
          onBlur=${handleBlur}
        />
        ${suffix && html`<span class="ie-intake__field-unit">${suffix}</span>`}
      </div>
    </div>
  `;
}

// ── Global params panel ───────────────────────────────────────────────────────

function GlobalParamsPanel({ assumptions, dispatch, ieCount }) {
  return html`
    <section class="panel ie-intake__global-panel">
      <h2 class="panel__title">Recruitment model parameters</h2>
      <div class="ie-intake__global-grid">

        <div class="ie-intake__param-group">
          <h3 class="ie-intake__group-title">Headcount targets (FY-end active IEs)</h3>
          <div class="ie-intake__field-row">
            <${ParamInput}
              label="FY26 (register)"
              assumptionKey="forecast.model.target.fy26"
              rawValue=${ieCount !== null ? ieCount : lookupValue(assumptions, 'forecast.model.target.fy26', 22)}
              readOnly=${true}
              assumptions=${assumptions}
              dispatch=${dispatch}
            />
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

        <div class="ie-intake__param-group">
          <h3 class="ie-intake__group-title">Pipeline rates &amp; cohorts</h3>
          <div class="ie-intake__field-row">
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

// ── Totals row ────────────────────────────────────────────────────────────────

function TotalsRow({ model }) {
  const global = model.globalTotals[27]?.activeIEs ?? 0;
  const regions = {
    APAC:     model.activeIEs.apac?.[27]     ?? 0,
    Americas: model.activeIEs.americas?.[27] ?? 0,
    EMEA:     model.activeIEs.emea?.[27]     ?? 0,
  };

  return html`
    <div class="ie-intake__totals-row">
      <span class="ie-intake__totals-label">FY27 Global total</span>
      <span class="ie-intake__totals-global">${global} active IEs</span>
      <span class="ie-intake__totals-divider">—</span>
      ${Object.entries(regions).map(([r, n]) => html`
        <span key=${r} class="ie-intake__totals-region"><strong>${r}:</strong> ${n}</span>
      `)}
    </div>
  `;
}

// ── Regional card ─────────────────────────────────────────────────────────────

function RegionCard({ region, model, assumptions, dispatch }) {
  const r = region.key;
  const activeIEs = model.activeIEs[r]?.[27]     ?? 0;
  const attrition = model.attrition[r]?.[27]     ?? 0;
  const shortlist = model.shortlist[r]?.[27]      ?? 0;
  const sourced   = model.sourced[r]?.[27]        ?? 0;

  return html`
    <div class="panel ie-intake__region-card">
      <h3 class="ie-intake__region-title">${region.label}</h3>

      <div class="ie-intake__region-kpi">
        <span class="ie-intake__region-kpi-value">${activeIEs}</span>
        <span class="ie-intake__region-kpi-label">Active IEs (FY27)</span>
      </div>

      <div class="ie-intake__region-pipeline">
        <div class="ie-intake__pipeline-row">
          <span class="ie-intake__pipeline-label">Need to source</span>
          <span class="ie-intake__pipeline-value">${sourced}</span>
        </div>
        <div class="ie-intake__pipeline-row">
          <span class="ie-intake__pipeline-label">Need to shortlist</span>
          <span class="ie-intake__pipeline-value">${shortlist}</span>
        </div>
        <div class="ie-intake__pipeline-row">
          <span class="ie-intake__pipeline-label">Attrition</span>
          <span class="ie-intake__pipeline-value">${attrition}</span>
        </div>
      </div>

      <div class="ie-intake__region-params">
        <${ParamInput}
          label="Regional weight"
          assumptionKey=${`forecast.model.region_weight.${r}`}
          rawValue=${lookupValue(assumptions, `forecast.model.region_weight.${r}`, 0.333)}
          isPercent
          suffix="%"
          assumptions=${assumptions}
          dispatch=${dispatch}
        />
        <${ParamInput}
          label="Attrition rate"
          assumptionKey=${`forecast.model.attrition_rate.${r}`}
          rawValue=${lookupValue(assumptions, `forecast.model.attrition_rate.${r}`, 0.10)}
          isPercent
          suffix="%"
          assumptions=${assumptions}
          dispatch=${dispatch}
        />
      </div>
    </div>
  `;
}

// ── Sanity check ──────────────────────────────────────────────────────────────

function SanityCheck({ model }) {
  const fys = [27, 28, 29];
  return html`
    <section class="panel ie-intake__sanity-panel">
      <h2 class="panel__title">Sanity check — avg onboards per cohort (target: 10–15)</h2>
      <div class="ie-intake__sanity-grid">
        ${fys.map(fy => {
          const s = model.sanity[fy];
          return html`
            <div key=${fy} class=${'ie-intake__sanity-card ie-intake__sanity-card--' + (s.withinBand ? 'ok' : 'warn')}>
              <div class="ie-intake__sanity-fy">FY${fy}</div>
              <div class="ie-intake__sanity-value">${s.avgOnboards.toFixed(1)}</div>
              <div class="ie-intake__sanity-band">${s.band}</div>
            </div>
          `;
        })}
      </div>
    </section>
  `;
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function IEIntakeView() {
  const { workbook, dispatch } = useWorkbook();
  const assumptions = workbook.assumptions || {};
  const ieCount = useMemo(() => registeredActiveCurrent(workbook.ieRegister), [workbook.ieRegister]);

  const model = useMemo(() => runForecastModel(assumptions, ieCount), [assumptions, ieCount]);

  const wApac     = lookupValue(assumptions, 'forecast.model.region_weight.apac',     0.333);
  const wAmericas = lookupValue(assumptions, 'forecast.model.region_weight.americas', 0.333);
  const wEmea     = lookupValue(assumptions, 'forecast.model.region_weight.emea',     0.334);
  const weightSum = Math.round((wApac + wAmericas + wEmea) * 1000) / 10;
  const weightOk  = Math.abs(weightSum - 100) < 0.2;

  return html`
    <div class="ie-intake-page">
      <div class="page-header">
        <h1 class="page-header__title">IE Intake</h1>
        <span class="page-header__count">FY27 target: ${lookupValue(assumptions, 'forecast.model.target.fy27', 60)} active IEs</span>
      </div>

      <${GlobalParamsPanel} assumptions=${assumptions} dispatch=${dispatch} ieCount=${ieCount} />

      ${!weightOk && html`
        <div class="banner banner--warn" role="alert">
          Regional weights sum to ${weightSum}% — must equal 100%.
        </div>
      `}

      <${TotalsRow} model=${model} />

      <div class="ie-intake__region-grid">
        ${REGIONS.map(region => html`
          <${RegionCard}
            key=${region.key}
            region=${region}
            model=${model}
            assumptions=${assumptions}
            dispatch=${dispatch}
          />
        `)}
      </div>

      <${SanityCheck} model=${model} />
    </div>
  `;
}
