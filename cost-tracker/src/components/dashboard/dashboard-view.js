const { html, useMemo, useState, useEffect } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { computeForecast, FY_2526_MONTHS, FY_2627_MONTHS, registeredActiveAtMonth, registeredActiveCurrent } from '../../state/compute.js';
import { lookupValue } from '../../state/assumptions.js';
import { runForecastModel, activeCohortIEs } from '../../state/cohort.js';
import { fmt } from '../../shared/format.js';
import { exportPrintView } from '../../state/file-io.js';
import { getAuthor } from '../../state/identity.js';

const CATEGORY_ORDER = [
  'Sales & Marketing',
  'Productivity & IT',
  'Collaboration & Docs',
  'Training & Development',
  'Infrastructure',
];

const SCENARIO_DEFS = [
  { id: 'scenario-minimum-viable',  label: 'Minimum Viable',  cls: 'min'     },
  { id: 'scenario-primary-target',  label: 'Primary Target',  cls: 'primary' },
  { id: 'scenario-optimal-maximum', label: 'Optimal Maximum', cls: 'max'     },
];

function fmtMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
}


function computeFYTotal(subs, months, monthlyEntries, assumptions, scenario, ieRegister) {
  let total = 0;
  for (const ym of months) {
    const ieCount = registeredActiveAtMonth(ieRegister, ym);
    for (const sub of subs) {
      const entry = monthlyEntries[`${sub.id}_${ym}`];
      if (entry?.isActual && entry?.costAud != null) {
        total += entry.costAud;
      } else {
        total += computeForecast(sub, ym, assumptions, scenario, ieCount).value ?? 0;
      }
    }
  }
  return total;
}

function computePerIEMonthlyCost(subs, assumptions) {
  return subs
    .filter(s => s.cohort_driven && s.unit_cost_assumption_key && s.attribution_assumption_key)
    .reduce((total, s) => {
      const unitCost = lookupValue(assumptions, s.unit_cost_assumption_key, 0);
      const attrRate = lookupValue(assumptions, s.attribution_assumption_key, 0);
      const fxKey    = 'scenario.fx_rate.aud_' + (s.currency || 'aud').toLowerCase();
      const fxRate   = s.currency === 'AUD' ? 1 : lookupValue(assumptions, fxKey, 1);
      const unitAud  = s.currency === 'AUD' ? unitCost : unitCost / fxRate;
      return total + (unitAud * attrRate);
    }, 0);
}

function computeCategoryBreakdown(subs, monthlyEntries, assumptions, scenario, ieRegister) {
  const byCategory = {};
  for (const sub of subs) {
    let subTotal = 0;
    for (const ym of FY_2627_MONTHS) {
      const entry = monthlyEntries[`${sub.id}_${ym}`];
      if (entry?.isActual && entry?.costAud != null) {
        subTotal += entry.costAud;
      } else {
        const ieCount = registeredActiveAtMonth(ieRegister, ym);
        subTotal += computeForecast(sub, ym, assumptions, scenario, ieCount).value ?? 0;
      }
    }
    const cat = sub.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = { total: 0, vendors: new Set() };
    byCategory[cat].total += subTotal;
    byCategory[cat].vendors.add(sub.vendor);
  }
  const grandTotal = Object.values(byCategory).reduce((s, c) => s + c.total, 0);
  return CATEGORY_ORDER.map(cat => {
    const entry = byCategory[cat] || { total: 0, vendors: new Set() };
    return {
      category: cat,
      vendors: [...entry.vendors].sort(),
      total: entry.total,
      pct: grandTotal > 0 ? (entry.total / grandTotal) * 100 : 0,
    };
  }).sort((a, b) => b.pct - a.pct);
}

function computeVersionHash(workbook) {
  const str = JSON.stringify(workbook);
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h).toString(16).padStart(8, '0').slice(0, 8);
}

// ── Scenario selector ─────────────────────────────────────────────────────────

function ScenarioSelector({ activeScenarioId, onSwitch }) {
  return html`
    <div class="dashboard__scene-sel">
      <span class="dashboard__scene-sel-label">Scenario</span>
      <div class="dashboard__scene-sel-btns">
        ${SCENARIO_DEFS.map(def => html`
          <button
            key=${def.id}
            class=${'dashboard__scene-btn' + (activeScenarioId === def.id ? ' dashboard__scene-btn--active' : '')}
            onClick=${() => onSwitch(def.id)}
          >${def.label}</button>
        `)}
      </div>
    </div>
  `;
}

// ── Hero stat ─────────────────────────────────────────────────────────────────

function HeroStat({ total, scenarioLabel, perIECost, fy27Target, registeredActive }) {
  return html`
    <div class="dashboard__hero">
      <div class="dashboard__hero-main">
        <div class="dashboard__hero-value">${fmt.aud(total)}</div>
        <div class="dashboard__hero-label">FY 26/27 projected · ${scenarioLabel}</div>
        <div class="dashboard__hero-monthly">${fmt.aud(total / 12)} avg / mo</div>
      </div>
      <div class="dashboard__hero-aside">
        <div class="dashboard__hero-stat">
          <span class="dashboard__hero-stat-value">${fmt.aud(perIECost)}</span>
          <span class="dashboard__hero-stat-label">per IE / mo</span>
        </div>
        <div class="dashboard__hero-divider"></div>
        <div class="dashboard__hero-stat">
          <span class="dashboard__hero-stat-value">${fy27Target}</span>
          <span class="dashboard__hero-stat-label">IE target FY27</span>
        </div>
        ${registeredActive > 0 && html`
          <div class="dashboard__hero-divider"></div>
          <div class="dashboard__hero-stat">
            <span class="dashboard__hero-stat-value dashboard__hero-stat-value--accent">${registeredActive}</span>
            <span class="dashboard__hero-stat-label">registered active</span>
          </div>
        `}
      </div>
    </div>
  `;
}

// ── FY Timeline ───────────────────────────────────────────────────────────────

function FYTimeline({ subs, monthlyEntries, assumptions, scenario, target, ieRegister }) {
  const rows = useMemo(() => {
    const hasRegister = Object.keys(ieRegister).length > 0;

    // Fallback when no register data: cohort model with pre-ch17 baseline
    const fy26Total = lookupValue(assumptions, 'forecast.model.target.fy26', 22);
    const ch17Contribution = activeCohortIEs('2026-06', scenario, assumptions);
    const preExisting = Math.max(0, fy26Total - ch17Contribution);

    let prevIECount = null;
    let targetReached = false;
    return FY_2627_MONTHS.map(ym => {
      const regCount = registeredActiveAtMonth(ieRegister, ym);
      const modelCount = preExisting + activeCohortIEs(ym, scenario, assumptions);
      const ieCount = hasRegister ? regCount : modelCount;

      const monthlyCost = subs.reduce((sum, s) => {
        const entry = monthlyEntries[`${s.id}_${ym}`];
        if (entry?.isActual && entry?.costAud != null) return sum + entry.costAud;
        return sum + (computeForecast(s, ym, assumptions, scenario, regCount).value ?? 0);
      }, 0);

      const ieDelta = prevIECount !== null ? ieCount - prevIECount : null;
      const isFirstTarget = !targetReached && ieCount >= target;
      if (ieCount >= target) targetReached = true;
      prevIECount = ieCount;
      return { ym, ieCount, monthlyCost, ieDelta, isFirstTarget };
    });
  }, [subs, monthlyEntries, assumptions, scenario, target, ieRegister]);

  return html`
    <section class="panel dashboard__fy-timeline">
      <h2 class="panel__title">FY 26/27 — Recruitment & Cost</h2>
      <div class="dashboard__fy-tl-head">
        <span class="dashboard__fy-tl-col-month"></span>
        <span class="dashboard__fy-tl-col-bar">Active IEs → ${target} target</span>
        <span class="dashboard__fy-tl-col-ies"></span>
        <span class="dashboard__fy-tl-col-cost">Monthly cost</span>
        <span class="dashboard__fy-tl-col-event"></span>
      </div>
      <div class="dashboard__fy-tl-rows">
        ${rows.map(({ ym, ieCount, monthlyCost, ieDelta, isFirstTarget }) => {
          const pct = target > 0 ? Math.min(ieCount / target * 100, 100) : 0;
          const isStep = ieDelta !== null && ieDelta > 0;
          return html`
            <div key=${ym} class=${'dashboard__fy-tl-row' + (isStep ? ' dashboard__fy-tl-row--step' : '')}>
              <span class="dashboard__fy-tl-col-month">${fmtMonth(ym)}</span>
              <span class="dashboard__fy-tl-col-bar">
                <span class="dashboard__fy-tl-bar-wrap">
                  <span class="dashboard__fy-tl-bar" style=${{ width: pct.toFixed(1) + '%' }}></span>
                </span>
              </span>
              <span class="dashboard__fy-tl-col-ies">
                ${ieCount}<span class="dashboard__fy-tl-of"> / ${target}</span>
              </span>
              <span class="dashboard__fy-tl-col-cost">${fmt.aud(monthlyCost)}</span>
              <span class="dashboard__fy-tl-col-event">
                ${isFirstTarget
                  ? html`<span class="dashboard__fy-tl-badge dashboard__fy-tl-badge--target">✓ Target</span>`
                  : (ieDelta !== null && ieDelta > 0)
                    ? html`<span class="dashboard__fy-tl-badge">+${ieDelta} IEs</span>`
                    : null
                }
              </span>
            </div>
          `;
        })}
      </div>
    </section>
  `;
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function DashboardView() {
  const { workbook, dispatch } = useWorkbook();
  const assumptions = workbook.assumptions || {};
  const monthlyEntries = workbook.monthlyEntries || {};
  const scenarios = workbook.scenarios || {};
  const activeScenarioId = workbook.activeScenarioId;
  const activeScenario = scenarios[activeScenarioId] ?? null;

  const subs = useMemo(
    () => Object.values(workbook.subscriptions || {}).filter(s => s.status !== 'archived'),
    [workbook.subscriptions],
  );

  const ieRegister = workbook.ieRegister || {};

  const activeTotal = useMemo(
    () => computeFYTotal(subs, FY_2627_MONTHS, monthlyEntries, assumptions, activeScenario, ieRegister),
    [subs, monthlyEntries, assumptions, activeScenario, ieRegister],
  );

  const perIECost = useMemo(
    () => computePerIEMonthlyCost(subs, assumptions),
    [subs, assumptions],
  );

  const fy27Target = lookupValue(assumptions, 'forecast.model.target.fy27', 60);
  const activeLabel = SCENARIO_DEFS.find(d => d.id === activeScenarioId)?.label ?? 'Primary Target';

  const registeredActive = useMemo(
    () => Object.values(workbook.ieRegister || {})
      .filter(ie => ie.active !== false && ie.training)
      .length,
    [workbook.ieRegister],
  );

  const categoryRows = useMemo(
    () => computeCategoryBreakdown(subs, monthlyEntries, assumptions, activeScenario, ieRegister),
    [subs, monthlyEntries, assumptions, activeScenario, ieRegister],
  );

  const resolvedAssumptions = useMemo(
    () => Object.values(assumptions)
      .filter(a => a.status === 'Resolved')
      .sort((a, b) =>
        (a.category || '').localeCompare(b.category || '') ||
        (a.label || '').localeCompare(b.label || '')
      ),
    [assumptions],
  );

  const [printMode, setPrintMode] = useState('print-with-footnotes');
  const [printMeta, setPrintMeta] = useState(null);

  useEffect(() => {
    const cleanup = () => {
      ['print-numbers-only', 'print-with-footnotes', 'print-full-provenance']
        .forEach(m => document.body.classList.remove(m));
    };
    window.addEventListener('afterprint', cleanup);
    return () => window.removeEventListener('afterprint', cleanup);
  }, []);

  const handlePrint = () => {
    const timestamp = new Date().toISOString();
    const user = getAuthor() || 'Unknown';
    const scenarioId = workbook.activeScenarioId || '—';
    const versionHash = computeVersionHash(workbook);
    const entry = { id: crypto.randomUUID(), timestamp, user, mode: printMode, scenario_id: scenarioId };
    setPrintMeta({ timestamp, user, scenarioId, versionHash, mode: printMode });
    dispatch({ type: 'EXPORT_LOG_APPENDED', payload: entry });
    requestAnimationFrame(() => exportPrintView(printMode));
  };

  const handleScenarioSwitch = scenarioId => dispatch({ type: 'SCENARIO_SWITCHED', payload: scenarioId });

  if (subs.length === 0) {
    return html`
      <div class="page-header"><h1 class="page-header__title">Dashboard</h1></div>
      <div class="empty-state">Load a workbook to view the dashboard.</div>
    `;
  }

  return html`
    <div class="page-header">
      <h1 class="page-header__title">Dashboard</h1>
      <div class="dashboard__print-controls">
        <span class="dashboard__print-mode-label">Print mode</span>
        <div class="dashboard__print-mode-btns">
          ${[
            { mode: 'print-numbers-only',    label: 'Numbers only'    },
            { mode: 'print-with-footnotes',  label: 'With footnotes'  },
            { mode: 'print-full-provenance', label: 'Full provenance' },
          ].map(({ mode, label }) => html`
            <button
              key=${mode}
              class=${'dashboard__print-mode-btn' + (printMode === mode ? ' dashboard__print-mode-btn--active' : '')}
              onClick=${() => setPrintMode(mode)}
            >${label}</button>
          `)}
        </div>
        <button class="btn btn--outline dashboard__print-btn" onClick=${handlePrint}>
          Print board pack
        </button>
      </div>
    </div>

    <div class="dashboard">

      <div class="dashboard__print-header">
        <img class="dashboard__print-header-logo" src="public/assets/logo.svg" alt="Whitewater Reinventions" />
        <span class="dashboard__print-header-title">Subscription Cost Tracker</span>
        <span class="dashboard__print-header-date">${new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      <${ScenarioSelector} activeScenarioId=${activeScenarioId} onSwitch=${handleScenarioSwitch} />

      <${HeroStat}
        total=${activeTotal}
        scenarioLabel=${activeLabel}
        perIECost=${perIECost}
        fy27Target=${fy27Target}
        registeredActive=${registeredActive}
      />

      <${FYTimeline}
        subs=${subs}
        monthlyEntries=${monthlyEntries}
        assumptions=${assumptions}
        scenario=${activeScenario}
        target=${fy27Target}
        ieRegister=${ieRegister}
      />

      <div class="panel dashboard__category-panel">
        <h2 class="panel__title">Category Breakdown — FY 26/27</h2>
        <div class="dashboard__category-rows">
          ${categoryRows.map(row => {
            const label = row.vendors.length > 0
              ? `${row.category} (${row.vendors.join(', ')})`
              : row.category;
            return html`
              <div key=${row.category} class=${'dashboard__category-row' + (row.total === 0 ? ' dashboard__category-row--empty' : '')}>
                <span class="dashboard__category-label" title=${label}>${label}</span>
                <span class="dashboard__category-bar-wrap">
                  <span class="dashboard__category-bar" style=${{ width: row.pct.toFixed(1) + '%' }}></span>
                </span>
                <span class="dashboard__category-pct">${row.pct.toFixed(1)}%</span>
                <span class="dashboard__category-amount">${fmt.aud(row.total)}</span>
              </div>
            `;
          })}
        </div>
      </div>

      <!-- Print sections (screen-hidden, print-visible) -->
      <div class="dashboard__print-footnotes">
        <div class="dashboard__print-section-title">Footnotes — assumption basis</div>
        ${resolvedAssumptions.length === 0
          ? html`<p class="dashboard__print-empty">No resolved assumptions in this workbook.</p>`
          : html`
            <div class="dashboard__print-fn-grid">
              <div class="dashboard__print-fn-header">
                <span class="dashboard__print-fn-cell dashboard__print-fn-cell--num">#</span>
                <span class="dashboard__print-fn-cell">Assumption</span>
                <span class="dashboard__print-fn-cell">Value</span>
                <span class="dashboard__print-fn-cell">Decided</span>
                <span class="dashboard__print-fn-cell dashboard__print-fn-cell--wide">Rationale</span>
              </div>
              ${resolvedAssumptions.map((a, i) => html`
                <div key=${a.id} class="dashboard__print-fn-row">
                  <span class="dashboard__print-fn-cell dashboard__print-fn-cell--num">${i + 1}</span>
                  <span class="dashboard__print-fn-cell">
                    <span class="dashboard__print-fn-label">${a.label}</span>
                    ${a.category ? html`<span class="dashboard__print-fn-cat">${a.category}</span>` : ''}
                  </span>
                  <span class="dashboard__print-fn-cell">
                    ${a.value}${a.unit ? html` <span class="dashboard__print-fn-unit">${a.unit}</span>` : ''}
                  </span>
                  <span class="dashboard__print-fn-cell">${fmt.date(a.decided_on)}</span>
                  <span class="dashboard__print-fn-cell dashboard__print-fn-cell--wide">${a.rationale || '—'}</span>
                </div>
              `)}
            </div>
          `}
      </div>

      <div class="dashboard__print-appendix">
        <div class="dashboard__print-section-title">Assumption appendix — full provenance</div>
        ${resolvedAssumptions.length === 0
          ? html`<p class="dashboard__print-empty">No resolved assumptions in this workbook.</p>`
          : resolvedAssumptions.map(a => html`
            <div key=${a.id} class="dashboard__print-appendix-entry">
              <div class="dashboard__print-appendix-header">
                <span class="dashboard__print-appendix-label">${a.label}</span>
                <span class="dashboard__print-appendix-key">${a.key}</span>
              </div>
              <table class="dashboard__print-appendix-table">
                <tbody>
                  <tr><td>Value</td><td>${a.value}${a.unit ? ' ' + a.unit : ''}</td></tr>
                  <tr><td>Category</td><td>${a.category || '—'}</td></tr>
                  <tr><td>Author</td><td>${a.author || '—'}</td></tr>
                  <tr><td>Decided on</td><td>${fmt.date(a.decided_on)}</td></tr>
                  <tr><td>Source</td><td>${a.source || '—'}</td></tr>
                  <tr><td>Rationale</td><td>${a.rationale || '—'}</td></tr>
                  <tr><td>Confidence</td><td>${a.confidence || '—'}</td></tr>
                  <tr><td>Effective from</td><td>${a.effective_from || '—'}</td></tr>
                  <tr><td>Effective to</td><td>${a.effective_to || '—'}</td></tr>
                  <tr><td>Applies to</td><td>${Array.isArray(a.applies_to) && a.applies_to.length ? a.applies_to.join(', ') : '—'}</td></tr>
                  ${a.supersedes ? html`<tr><td>Supersedes</td><td>${a.supersedes}</td></tr>` : ''}
                </tbody>
              </table>
            </div>
          `)
        }
      </div>

      ${printMeta && html`
        <div class="dashboard__print-footer">
          <span class="dashboard__print-footer-left">
            ${`${printMeta.timestamp} · ${printMeta.user} · Scenario: ${printMeta.scenarioId} · v.${printMeta.versionHash}`}
          </span>
          <span class="dashboard__print-footer-right">WWRI Subscription Cost Tracker</span>
        </div>
      `}

    </div>
  `;
}
