/**
 * cash-forecast.js — Finance Cash Forecast tab
 *
 * Displays a 9-month rolling forecast table with:
 * - Revenue projections from the revenue pipeline (by status and due date)
 * - Cost of sales (IE fees + referral fees from revenue pipeline)
 * - Editable operating expense line items
 * - Net cash movement and rolling opening/closing cash positions
 * - SVG chart placeholder (Story 3.4)
 */

import { get, set } from '../shared/store.js';
import { formatCurrency, formatMonthYear } from '../shared/format.js';
import { convertToAUD } from '../shared/fx.js';
import { renderDualLineChart } from '../shared/charts.js';

/**
 * Render the Cash Forecast tab.
 * @param {HTMLElement} container - The content area to render into
 */
function render(container) {
  const months = generateMonthColumns();
  const expenses = get('expenses') || { categories: [] };
  const revenue  = flattenProjectsToLines(get('projects') || []);
  const bs = get('balanceSheet') || {};

  const projections = calculateProjections(revenue, months);
  const expenseTotals = calculateExpenseTotals(expenses, months);
  const cashFlow = calculateCashFlow(projections, expenseTotals, bs, months);

  container.innerHTML = `
    <div class="cash-forecast">
      <h2 class="cash-forecast__heading">Cash Forecast</h2>

      <div id="forecast-chart-area" class="cash-forecast__section">
        <div class="chart-area">
          <div class="chart-area__title">Cash Forecast</div>
          ${renderForecastChart(cashFlow, months)}
        </div>
      </div>

      <div class="cash-forecast__section">
        <h3 class="cash-forecast__subheading">Cash Flow Summary</h3>
        <div class="data-table-wrap">
          <table class="data-table" id="cashflow-table">
            <thead>
              <tr>
                <th></th>
                ${months.map(m => `<th class="num">${m.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${renderCashFlowRows(cashFlow, months)}
            </tbody>
          </table>
        </div>
      </div>

      <div class="cash-forecast__section">
        <div class="cash-forecast__section-topbar">
          <h3 class="cash-forecast__subheading">Operating Expenses</h3>
          <button class="btn btn--ghost btn--sm" type="button" id="btn-roll-forward">Roll forward 1 month</button>
        </div>
        <div class="data-table-wrap">
          <table class="data-table" id="expense-table">
            <thead>
              <tr>
                <th>Expense</th>
                ${months.map(m => `<th class="num">${m.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${renderExpenseRows(expenses, months)}
            </tbody>
            <tfoot class="data-table__footer">
              ${renderRowCells('Total Operating Expenses', expenseTotals)}
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  `;

  bindExpenseEditing(container, expenses, months, bs);
}

// ── Projects → flat revenue lines ────────────────────────────────────────────

function deriveInstallments(phase) {
  const { split, total, startDate, weeks, avgPay, customSplit } = phase;
  const DAY_MS  = 24 * 60 * 60 * 1000;
  const startMs = new Date(startDate).getTime();
  const endMs   = startMs + (weeks || 0) * 7 * DAY_MS;
  const midMs   = Math.round((startMs + endMs) / 2);
  const payMs   = (avgPay || 30) * DAY_MS;
  const due     = ms => new Date(ms + payMs).toISOString().slice(0, 10);

  if (split === '5050') {
    const a = Math.round(total / 2);
    return [
      { amount: a,         due: due(startMs) },
      { amount: total - a, due: due(endMs)   },
    ];
  }
  if (split === 'single') {
    return [{ amount: total, due: due(startMs) }];
  }
  if (split === '252550') {
    const a = Math.round(total * 0.25);
    const b = Math.round(total * 0.25);
    return [
      { amount: a,             due: due(startMs) },
      { amount: b,             due: due(midMs)   },
      { amount: total - a - b, due: due(endMs)   },
    ];
  }
  if (split === 'custom') {
    const [pA = 33, pB = 33] = customSplit || [];
    const a = Math.round(total * pA / 100);
    const b = Math.round(total * pB / 100);
    return [
      { amount: a,             due: due(startMs) },
      { amount: b,             due: due(midMs)   },
      { amount: total - a - b, due: due(endMs)   },
    ];
  }
  const a = Math.round(total * 0.30);
  const b = Math.round(total * 0.30);
  return [
    { amount: a,             due: due(startMs) },
    { amount: b,             due: due(midMs)   },
    { amount: total - a - b, due: due(endMs)   },
  ];
}

function effectiveDue(dueStr, paid) {
  if (paid || !dueStr) return dueStr;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueStr);
  if (!isNaN(due) && due < today) {
    const rolled = new Date(today);
    rolled.setDate(rolled.getDate() + 7);
    return rolled.toISOString().slice(0, 10);
  }
  return dueStr;
}

function flattenProjectsToLines(projects) {
  const lines = [];
  for (const project of projects) {
    const iePct  = project.iePct  || 0;
    const refPct = project.refPct || 0;
    for (const phase of (project.phases || [])) {
      const installments = deriveInstallments(phase);
      for (let i = 0; i < installments.length; i++) {
        const paid = (phase.paid || [])[i] === true;
        if (paid) continue; // already received — skip from forecast
        const inst = installments[i];
        lines.push({
          rev:    inst.amount,
          cur:    phase.currency || 'AUD',
          due:    effectiveDue(inst.due, false),
          iePct,
          refPct,
          status: phase.status,
        });
      }
    }
  }
  return lines;
}

// ── Month Columns ────────────────────────────────────────────────────────────

function generateMonthColumns() {
  const now = new Date();
  const columns = [];
  for (let i = 0; i < 9; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const iso = date.toISOString().slice(0, 10);
    columns.push({
      index: i,
      label: formatMonthYear(iso),
      year: date.getFullYear(),
      month: date.getMonth(),
      isActual: i === 0
    });
  }
  return columns;
}

// ── Revenue Projections ──────────────────────────────────────────────────────

function calculateProjections(revenueLines, months) {
  const revByMonth = new Array(9).fill(0);
  const cosByMonth = new Array(9).fill(0);

  for (const line of revenueLines) {
    if (!line.due) {
      continue;
    }

    const dueDate = new Date(line.due);
    const colIdx = findMonthIndex(dueDate, months);
    if (colIdx === -1) {
      continue;
    }

    const amount = convertToAUD(line.rev || 0, line.cur || 'AUD');
    revByMonth[colIdx] += amount;

    // Cost of sales: IE fees + referral fees
    const ieFee = amount * (line.iePct || 0);
    const refFee = amount * (line.refPct || 0);
    cosByMonth[colIdx] += ieFee + refFee;
  }

  return { revenue: revByMonth, costOfSales: cosByMonth };
}

function findMonthIndex(date, months) {
  for (let i = 0; i < months.length; i++) {
    if (date.getFullYear() === months[i].year && date.getMonth() === months[i].month) {
      return i;
    }
  }
  return -1;
}

// ── Expense Totals ───────────────────────────────────────────────────────────

function calculateExpenseTotals(expenses, months) {
  const totals = new Array(months.length).fill(0);
  for (const category of (expenses.categories || [])) {
    for (const line of category.lines) {
      for (let i = 0; i < months.length; i++) {
        totals[i] += line.defaults[i] || 0;
      }
    }
  }
  return totals;
}

// ── Cash Flow Calculation ────────────────────────────────────────────────────

function calculateCashFlow(projections, expenseTotals, bs, months) {
  const grossProfit = months.map((_, i) => projections.revenue[i] - projections.costOfSales[i]);
  const netCash = months.map((_, i) => grossProfit[i] - expenseTotals[i]);

  // Opening balance: first month uses bank balance from balance sheet
  const auBank = (bs.au && bs.au.bank) || 0;
  const euBank = convertToAUD((bs.eu && bs.eu.bank) || 0, 'EUR');
  const openingBalance = auBank + euBank;

  const opening = new Array(9).fill(0);
  const closing = new Array(9).fill(0);
  opening[0] = openingBalance;
  closing[0] = openingBalance + netCash[0];

  for (let i = 1; i < 9; i++) {
    opening[i] = closing[i - 1];
    closing[i] = opening[i] + netCash[i];
  }

  return {
    revenue: projections.revenue,
    costOfSales: projections.costOfSales,
    grossProfit,
    opex: expenseTotals,
    netCash,
    opening,
    closing
  };
}

// ── Cash Flow Table Rendering ────────────────────────────────────────────────

function renderCashFlowRows(cf, months) {
  return [
    renderRowCells('Opening Cash', cf.opening, true),
    renderRowCells('Revenue', cf.revenue),
    renderRowCells('Cost of Sales', cf.costOfSales),
    renderRowCells('Gross Profit', cf.grossProfit, true),
    renderRowCells('Operating Expenses', cf.opex),
    renderRowCells('Net Cash Movement', cf.netCash, true),
    renderRowCells('Closing Cash', cf.closing, true)
  ].join('');
}

function renderRowCells(label, values, bold) {
  const cells = values.map(v => {
    let cls = 'num';
    if (v < 0) {
      cls += ' num--negative';
    }
    const style = bold ? ' style="font-weight:var(--font-weight-semibold)"' : '';
    return `<td class="${cls}"${style}>${formatCurrency(v)}</td>`;
  }).join('');

  const labelStyle = bold ? ' style="font-weight:var(--font-weight-semibold)"' : '';
  return `<tr><td${labelStyle}>${label}</td>${cells}</tr>`;
}

// ── Expense Rows ─────────────────────────────────────────────────────────────

function renderExpenseRows(expenses, months) {
  const categories = expenses.categories || [];
  let html = '';
  for (const category of categories) {
    html += `<tr><td colspan="${months.length + 1}" class="cash-forecast__category">${category.name}</td></tr>`;
    for (const line of category.lines) {
      html += renderExpenseLine(line, months);
    }
  }
  return html;
}

function renderExpenseLine(line, months) {
  const cells = months.map((month, colIdx) => {
    const value = line.defaults[colIdx] || 0;
    if (month.index > 0) {
      return `
        <td class="data-table__cell--editable num">
          <input class="form-input" type="number" step="1"
                 data-expense-id="${line.id}" data-col="${colIdx}"
                 value="${value}">
        </td>
      `;
    }
    const cls = value < 0 ? 'num num--negative' : 'num';
    return `<td class="${cls}">${formatCurrency(value)}</td>`;
  }).join('');

  return `<tr><td>${line.label}</td>${cells}</tr>`;
}

// ── Expense Editing ──────────────────────────────────────────────────────────

function bindExpenseEditing(container, expenses, months, bs) {
  container.querySelector('#btn-roll-forward')?.addEventListener('click', () => {
    if (!confirm('Roll all expense values forward by one month? The last month\'s value will repeat in the new final slot.')) return;

    for (const category of (expenses.categories || [])) {
      for (const line of category.lines) {
        const last = line.defaults[line.defaults.length - 1] || 0;
        line.defaults.shift();
        line.defaults.push(last);
      }
    }

    set('expenses', expenses);
    render(container);
  });

  container.querySelectorAll('[data-expense-id]').forEach(input => {
    input.addEventListener('blur', () => {
      const expenseId = input.dataset.expenseId;
      const colIdx = parseInt(input.dataset.col, 10);
      const value = parseFloat(input.value) || 0;

      for (const category of (expenses.categories || [])) {
        for (const line of category.lines) {
          if (line.id === expenseId) {
            line.defaults[colIdx] = value;
            break;
          }
        }
      }

      set('expenses', expenses);

      // Recalculate and re-render summary
      const revenue = flattenProjectsToLines(get('projects') || []);
      const expenseTotals = calculateExpenseTotals(expenses, months);
      const projections = calculateProjections(revenue, months);
      const cashFlow = calculateCashFlow(projections, expenseTotals, bs, months);

      const tfoot = container.querySelector('#expense-table tfoot');
      if (tfoot) {
        tfoot.innerHTML = renderRowCells('Total Operating Expenses', expenseTotals);
      }

      const cashBody = container.querySelector('#cashflow-table tbody');
      if (cashBody) {
        cashBody.innerHTML = renderCashFlowRows(cashFlow, months);
      }

      // Re-render chart
      const chartArea = container.querySelector('#forecast-chart-area .chart-area');
      if (chartArea) {
        chartArea.innerHTML = `
          <div class="chart-area__title">Cash Forecast</div>
          ${renderForecastChart(cashFlow, months)}
        `;
      }
    });
  });
}

// ── Chart Rendering ──────────────────────────────────────────────────────────

function renderForecastChart(cashFlow, months) {
  // Forecast = closing cash, Potential = closing + uncertain revenue (simplified as closing for now)
  return renderDualLineChart({
    labels: months.map(m => m.label),
    line1: cashFlow.closing,
    line2: cashFlow.closing.map((v, i) => v + (cashFlow.revenue[i] * 0.3)),
    line1Label: 'Forecast Cash',
    line2Label: 'Potential Cash'
  });
}

export { render };
