const { html, useMemo, useState } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { computeForecast, ALL_MONTHS, FY_GROUPS, registeredActiveCurrent } from '../../state/compute.js';
import { lookupValue } from '../../state/assumptions.js';
import { AssumptionMarker } from '../provenance/assumption-marker.js';
import { DecisionDrawer } from '../provenance/decision-drawer.js';
import { CellActionPicker } from './cell-action-picker.js';
import { OverrideForm } from './override-form.js';
import { XeroImport } from './xero-import.js';
import { YoYView } from './yoy-view.js';
import { LicenceForecastView } from '../scenarios/licence-forecast-view.js';
import { fmt } from '../../shared/format.js';

function monthLabel(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month - 1, 1)
    .toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
}

function forecastTitle(cell) {
  if (cell.nativeCurrency && cell.nativeCurrency !== 'AUD') {
    return `${cell.nativeCurrency} ${(cell.nativeValue ?? 0).toFixed(2)} — click to override forecast`;
  }
  return 'Click to override forecast';
}

function CostCell({ cell, onOverrideClick }) {
  function handleClick(e) {
    onOverrideClick?.(e.clientX, e.clientY);
  }

  if (cell.isActual) {
    return html`
      <td class="cost-register__cell cost-register__cell--actual" title="Xero actual">
        ${fmt.aud(cell.value)}
      </td>
    `;
  }

  if (cell.isOverride) {
    return html`
      <td
        class="cost-register__cell cost-register__cell--override cost-register__cell--editable"
        onClick=${handleClick}
        title="Overridden — click to re-override"
      >
        ${cell.assumptionKey
          ? html`<${AssumptionMarker} assumptionKey=${cell.assumptionKey} passive=${true}><span>${fmt.aud(cell.value)}</span><//>`
          : html`<span>${fmt.aud(cell.value ?? 0)}</span>`
        }
      </td>
    `;
  }

  return html`
    <td
      class="cost-register__cell cost-register__cell--forecast cost-register__cell--editable"
      onClick=${handleClick}
      title=${forecastTitle(cell)}
    >
      ${cell.assumptionKey
        ? html`<${AssumptionMarker} assumptionKey=${cell.assumptionKey} passive=${true}><span>${fmt.aud(cell.value)}</span><//>`
        : html`<span>${fmt.aud(cell.value ?? 0)}</span>`
      }
    </td>
  `;
}

export function CostRegisterView() {
  const { workbook } = useWorkbook();
  const subs = useMemo(
    () => Object.values(workbook.subscriptions || {}).filter(s => s.status !== 'archived'),
    [workbook.subscriptions],
  );
  const assumptions = workbook.assumptions || {};
  const entries = workbook.monthlyEntries || {};
  const [activeOverride, setActiveOverride] = useState(null);
  const [activePicker, setActivePicker] = useState(null);
  const [activeDrawerAssumptionId, setActiveDrawerAssumptionId] = useState(null);
  const [showXeroImport, setShowXeroImport] = useState(false);
  const [view, setView] = useState('grid'); // 'grid' | 'yoy'
  const scenario = workbook.scenarios?.[workbook.activeScenarioId] ?? null;
  const ieCount  = registeredActiveCurrent(workbook.ieRegister);

  const grid = useMemo(() => {
    return subs.map(sub => {
      const cells = ALL_MONTHS.map(ym => {
        const entryKey = `${sub.id}_${ym}`;
        const entry = entries[entryKey];

        if (entry?.isActual) {
          return { isActual: true, isOverride: false, value: entry.costAud, yearMonth: ym };
        }

        if (entry?.overrideAssumptionKey) {
          const overrideValue = lookupValue(assumptions, entry.overrideAssumptionKey);
          if (overrideValue !== null) {
            return {
              isActual: false,
              isOverride: true,
              value: overrideValue,
              yearMonth: ym,
              assumptionKey: entry.overrideAssumptionKey,
            };
          }
        }

        const { value, nativeValue, nativeCurrency, primaryAssumptionKey } = computeForecast(sub, ym, assumptions, scenario, ieCount);
        return { isActual: false, isOverride: false, value, yearMonth: ym, assumptionKey: primaryAssumptionKey, nativeValue, nativeCurrency };
      });

      const total = cells.reduce((s, c) => s + (c.value ?? 0), 0);
      return { sub, cells, total };
    });
  }, [subs, assumptions, entries, scenario, ieCount]);

  const monthlyTotals = useMemo(
    () => ALL_MONTHS.map((_, mi) => grid.reduce((s, row) => s + (row.cells[mi].value ?? 0), 0)),
    [grid],
  );

  const grandTotal = monthlyTotals.reduce((s, v) => s + v, 0);

  if (subs.length === 0) {
    return html`
      <div class="page-header">
        <h1 class="page-header__title">Cost register</h1>
      </div>
      <div class="empty-state">Load a workbook to view the cost register.</div>
    `;
  }

  return html`
    <div class="cost-register">
      <div class="page-header">
        <h1 class="page-header__title">Cost register</h1>
        <span class="page-header__count">${subs.length} subscription${subs.length !== 1 ? 's' : ''} · FY 25/26 – FY 26/27</span>
        <button class="btn btn--secondary btn--sm" style=${{ marginLeft: 'auto' }} onClick=${() => setShowXeroImport(true)}>
          Import Xero CSV
        </button>
      </div>
      <div class="cost-register__tabs">
        <button
          class=${'cost-register__tab' + (view === 'grid' ? ' cost-register__tab--active' : '')}
          onClick=${() => setView('grid')}
        >Monthly grid</button>
        <button
          class=${'cost-register__tab' + (view === 'yoy' ? ' cost-register__tab--active' : '')}
          onClick=${() => setView('yoy')}
        >YoY comparison</button>
        <button
          class=${'cost-register__tab' + (view === 'licences' ? ' cost-register__tab--active' : '')}
          onClick=${() => setView('licences')}
        >Licence forecast</button>
      </div>
      ${view === 'yoy' && html`<${YoYView} />`}
      ${view === 'licences' && html`<${LicenceForecastView} />`}
      ${view === 'grid' && html`
      <div class="cost-register__legend">
        <span class="cost-register__legend-item cost-register__legend-item--actual">Actual (Xero)</span>
        <span class="cost-register__legend-item cost-register__legend-item--forecast">Forecast (click to override)</span>
        <span class="cost-register__legend-item cost-register__legend-item--override">Overridden</span>
      </div>
      <div class="table-wrapper cost-register__wrapper">
        <table class="data-table cost-register__grid">
          <thead>
            <tr class="cost-register__fy-row">
              <th class="cost-register__sub-col cost-register__sticky-col"></th>
              ${FY_GROUPS.map(({ label, months }) => html`
                <th colspan=${months.length} class="cost-register__fy-header">${label}</th>
              `)}
              <th class="cost-register__total-header">24-month total</th>
            </tr>
            <tr class="cost-register__month-row">
              <th class="cost-register__sub-col cost-register__sticky-col">Subscription</th>
              ${ALL_MONTHS.map(ym => html`
                <th key=${ym} class="cost-register__month-th">${monthLabel(ym)}</th>
              `)}
              <th class="cost-register__total-header">Total</th>
            </tr>
          </thead>
          <tbody>
            ${grid.map(({ sub, cells, total }) => html`
              <tr key=${sub.id}>
                <td class="cost-register__sub-cell cost-register__sticky-col">
                  <div class="cost-register__vendor">${sub.vendor}</div>
                  <div class="cost-register__product">${sub.product}</div>
                </td>
                ${cells.map((cell, i) => html`
                  <${CostCell}
                    key=${i}
                    cell=${cell}
                    onOverrideClick=${(x, y) => {
                      if (cell.isActual) return;
                      setActivePicker({ sub, yearMonth: cell.yearMonth, primaryAssumptionKey: cell.assumptionKey ?? null, currentValue: cell.value, anchorX: x, anchorY: y });
                    }}
                  />
                `)}
                <td class="cost-register__cell cost-register__total-cell">${fmt.aud(total)}</td>
              </tr>
            `)}
          </tbody>
          <tfoot>
            <tr class="cost-register__totals-row">
              <td class="cost-register__sub-cell cost-register__sticky-col">Monthly total</td>
              ${monthlyTotals.map((t, i) => html`
                <td key=${i} class="cost-register__cell cost-register__total-cell">${fmt.aud(t)}</td>
              `)}
              <td class="cost-register__cell cost-register__total-cell">${fmt.aud(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      `}
      ${activePicker && html`
        <${CellActionPicker}
          assumptions=${assumptions}
          primaryAssumptionKey=${activePicker.primaryAssumptionKey}
          currentValue=${activePicker.currentValue}
          anchorX=${activePicker.anchorX}
          anchorY=${activePicker.anchorY}
          onEditAssumption=${(assumptionId) => {
            setActivePicker(null);
            if (assumptionId) setActiveDrawerAssumptionId(assumptionId);
          }}
          onOverride=${() => {
            setActivePicker(null);
            setActiveOverride({ sub: activePicker.sub, yearMonth: activePicker.yearMonth });
          }}
          onClose=${() => setActivePicker(null)}
        />
      `}
      ${activeOverride && html`
        <${OverrideForm}
          subscription=${activeOverride.sub}
          yearMonth=${activeOverride.yearMonth}
          onClose=${() => setActiveOverride(null)}
        />
      `}
      ${activeDrawerAssumptionId && html`
        <${DecisionDrawer}
          assumptionId=${activeDrawerAssumptionId}
          onClose=${() => setActiveDrawerAssumptionId(null)}
        />
      `}
      ${showXeroImport && html`
        <${XeroImport} onClose=${() => setShowXeroImport(false)} />
      `}
    </div>
  `;
}
