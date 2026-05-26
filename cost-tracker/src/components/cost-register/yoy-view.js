const { html, useMemo } = window.__WWCT__;
import { useWorkbook } from '../../state/store.js';
import { computeForecast, FY_2526_MONTHS, FY_2627_MONTHS, registeredActiveCurrent } from '../../state/compute.js';
import { lookupValue } from '../../state/assumptions.js';
import { fmt } from '../../shared/format.js';

function cellValue(sub, ym, assumptions, entries, scenario, ieCount) {
  const entryKey = `${sub.id}_${ym}`;
  const entry = entries[entryKey];
  if (entry?.isActual) return entry.costAud;
  if (entry?.overrideAssumptionKey) {
    const val = lookupValue(assumptions, entry.overrideAssumptionKey);
    if (val !== null) return val;
  }
  return computeForecast(sub, ym, assumptions, scenario, ieCount).value;
}

function fyTotal(sub, months, assumptions, entries, scenario, ieCount) {
  return months.reduce((s, ym) => s + cellValue(sub, ym, assumptions, entries, scenario, ieCount), 0);
}

function DeltaCell({ delta, base }) {
  if (base === 0) {
    return html`<td class="text-right text-muted">N/A</td>`;
  }
  const pct = delta / base;
  const isIncrease = delta > 0;
  const cls = isIncrease ? 'yoy-delta--increase' : (delta < 0 ? 'yoy-delta--decrease' : '');
  return html`
    <td class=${'text-right ' + cls}>
      ${pct >= 0 ? '+' : ''}${fmt.pct(pct)}
    </td>
  `;
}

export function YoYView() {
  const { workbook } = useWorkbook();
  const assumptions = workbook.assumptions || {};
  const entries = workbook.monthlyEntries || {};
  const scenario = workbook.scenarios?.[workbook.activeScenarioId] ?? null;
  const ieCount = registeredActiveCurrent(workbook.ieRegister);
  const subs = useMemo(
    () => Object.values(workbook.subscriptions || {}).filter(s => s.status !== 'archived'),
    [workbook.subscriptions],
  );

  const rows = useMemo(() => {
    return subs.map(sub => ({
      sub,
      fy2526: fyTotal(sub, FY_2526_MONTHS, assumptions, entries, scenario, ieCount),
      fy2627: fyTotal(sub, FY_2627_MONTHS, assumptions, entries, scenario, ieCount),
    }));
  }, [subs, assumptions, entries, scenario, ieCount]);

  // Group by category
  const categories = useMemo(() => {
    const map = new Map();
    for (const row of rows) {
      const cat = row.sub.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(row);
    }
    return Array.from(map.entries()).map(([category, subRows]) => {
      const cat2526 = subRows.reduce((s, r) => s + r.fy2526, 0);
      const cat2627 = subRows.reduce((s, r) => s + r.fy2627, 0);
      return { category, subRows, cat2526, cat2627 };
    }).sort((a, b) => b.cat2627 - a.cat2627);
  }, [rows]);

  const grand2526 = categories.reduce((s, c) => s + c.cat2526, 0);
  const grand2627 = categories.reduce((s, c) => s + c.cat2627, 0);
  const grandDelta = grand2627 - grand2526;

  if (subs.length === 0) {
    return html`<div class="empty-state">Load a workbook to view the YoY comparison.</div>`;
  }

  return html`
    <div class="table-wrapper">
      <table class="data-table yoy-table">
        <thead>
          <tr>
            <th>Subscription</th>
            <th class="text-right">FY 25/26</th>
            <th class="text-right">FY 26/27</th>
            <th class="text-right">Change ($)</th>
            <th class="text-right">Change (%)</th>
          </tr>
        </thead>
        <tbody>
          ${categories.map(({ category, subRows, cat2526, cat2627 }) => html`
            <tr key=${category} class="yoy-table__category-row">
              <td colspan="5" class="yoy-table__category-label">${category}</td>
            </tr>
            ${subRows.map(({ sub, fy2526, fy2627 }) => {
              const delta = fy2627 - fy2526;
              return html`
                <tr key=${sub.id} class="yoy-table__sub-row">
                  <td class="yoy-table__sub-name">
                    <span class="cost-register__vendor">${sub.vendor}</span>
                    <span class="cost-register__product"> — ${sub.product}</span>
                  </td>
                  <td class="text-right">${fmt.aud(fy2526)}</td>
                  <td class="text-right">${fmt.aud(fy2627)}</td>
                  <td class=${'text-right ' + (delta > 0 ? 'yoy-delta--increase' : delta < 0 ? 'yoy-delta--decrease' : '')}>
                    ${delta >= 0 ? '+' : ''}${fmt.aud(delta)}
                  </td>
                  <${DeltaCell} delta=${delta} base=${fy2526} />
                </tr>
              `;
            })}
            <tr key=${category + '-total'} class="yoy-table__cat-total-row">
              <td class="yoy-table__cat-total-label">${category} total</td>
              <td class="text-right">${fmt.aud(cat2526)}</td>
              <td class="text-right">${fmt.aud(cat2627)}</td>
              <td class=${'text-right ' + (cat2627 - cat2526 > 0 ? 'yoy-delta--increase' : cat2627 - cat2526 < 0 ? 'yoy-delta--decrease' : '')}>
                ${cat2627 - cat2526 >= 0 ? '+' : ''}${fmt.aud(cat2627 - cat2526)}
              </td>
              <${DeltaCell} delta=${cat2627 - cat2526} base=${cat2526} />
            </tr>
          `)}
        </tbody>
        <tfoot>
          <tr class="yoy-table__grand-total-row">
            <td>Grand total</td>
            <td class="text-right">${fmt.aud(grand2526)}</td>
            <td class="text-right">${fmt.aud(grand2627)}</td>
            <td class=${'text-right ' + (grandDelta > 0 ? 'yoy-delta--increase' : grandDelta < 0 ? 'yoy-delta--decrease' : '')}>
              ${grandDelta >= 0 ? '+' : ''}${fmt.aud(grandDelta)}
            </td>
            <${DeltaCell} delta=${grandDelta} base=${grand2526} />
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}
