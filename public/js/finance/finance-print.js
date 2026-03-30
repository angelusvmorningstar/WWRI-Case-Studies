/**
 * finance-print.js — Finance Print tab
 *
 * Renders the board-ready finance report content for printing.
 * Includes: print header with logo, KPI summary, entity table,
 * cash forecast table, and SVG chart.
 */

import { get } from '../shared/store.js';
import { formatCurrency, formatDate, formatMonthYear } from '../shared/format.js';
import { convertToAUD } from '../shared/fx.js';
import { renderDualLineChart } from '../shared/charts.js';
import { triggerPrint } from '../shared/print.js';

/**
 * Render the Finance Print tab.
 * @param {HTMLElement} container - The content area to render into
 */
function render(container) {
  const pl = get('profitLoss') || {};
  const bs = get('balanceSheet') || {};
  const expenses = get('expenses') || { categories: [] };
  const revenue = get('revenue') || [];
  const today = new Date().toISOString().slice(0, 10);

  container.innerHTML = `
    <div class="finance-print-tab">
      <div class="finance-print-tab__actions">
        <h2 class="finance-print-tab__heading">Finance Report — Print Preview</h2>
        <button class="btn btn--primary" type="button" id="btn-print-finance">Print Report</button>
      </div>

      <div class="print-header print-only">
        <img class="print-header__logo" src="./assets/WWT-Logo.jpg" alt="Whitewater Logo">
        <span class="print-header__title">Finance Report</span>
        <span class="print-header__date">${formatDate(today)}</span>
      </div>

      <div class="print-section">
        <div class="print-section__title">Key Performance Indicators</div>
        ${renderPrintKPIs(pl, bs)}
      </div>

      <div class="print-section">
        <div class="print-section__title">Revenue by Entity</div>
        ${renderPrintEntityTable(pl)}
      </div>

      <div class="print-section">
        <div class="print-section__title">Cash Forecast</div>
        ${renderPrintCashForecast(expenses, revenue, bs)}
      </div>

      <div class="print-section">
        <div class="print-section__title">Cash Forecast Chart</div>
        <div class="chart-area">
          ${renderPrintChart(expenses, revenue, bs)}
        </div>
      </div>
    </div>
  `;

  container.querySelector('#btn-print-finance').addEventListener('click', triggerPrint);
}

// ── KPIs ─────────────────────────────────────────────────────────────────────

function renderPrintKPIs(pl, bs) {
  const auMo = pl.auMo || {};
  const euMo = pl.euMo || {};
  const auBs = bs.au || {};
  const euBs = bs.eu || {};

  const kpis = [
    { label: 'Revenue', value: (auMo.revenue || 0) + convertToAUD(euMo.revenue || 0, 'EUR') },
    { label: 'Gross Profit', value: (auMo.gp || 0) + convertToAUD(euMo.gp || 0, 'EUR') },
    { label: 'Operating Profit', value: (auMo.net || 0) + convertToAUD(euMo.net || 0, 'EUR') },
    { label: 'Cash Position', value: (auBs.bank || 0) + convertToAUD(euBs.bank || 0, 'EUR') }
  ];

  return `
    <div class="kpi-grid">
      ${kpis.map(k => `
        <div class="kpi-card">
          <div class="kpi-card__label">${k.label}</div>
          <div class="kpi-card__value">${k.value === 0 ? '—' : formatCurrency(k.value)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Entity Table ─────────────────────────────────────────────────────────────

function renderPrintEntityTable(pl) {
  const auMo = pl.auMo || {};
  const euMo = pl.euMo || {};
  const auYtd = pl.auYtd || {};
  const euYtd = pl.euYtd || {};

  const rows = [
    buildEntityRow('AU', auMo, auYtd, 'AUD'),
    buildEntityRow('EU', euMo, euYtd, 'EUR')
  ];

  // Combined
  const combined = {
    moRev: rows.reduce((s, r) => s + r.moRev, 0),
    moGP: rows.reduce((s, r) => s + r.moGP, 0),
    moNet: rows.reduce((s, r) => s + r.moNet, 0),
    ytdRev: rows.reduce((s, r) => s + r.ytdRev, 0),
    ytdGP: rows.reduce((s, r) => s + r.ytdGP, 0),
    ytdNet: rows.reduce((s, r) => s + r.ytdNet, 0)
  };

  const numCell = (v) => `<td class="num${v < 0 ? ' num--negative' : ''}">${formatCurrency(v)}</td>`;

  return `
    <table class="data-table">
      <thead>
        <tr><th>Entity</th><th class="num">Month Rev</th><th class="num">Month GP</th><th class="num">Month Net</th><th class="num">YTD Rev</th><th class="num">YTD GP</th><th class="num">YTD Net</th></tr>
      </thead>
      <tbody>
        ${rows.map(r => `<tr><td>${r.label}</td>${numCell(r.moRev)}${numCell(r.moGP)}${numCell(r.moNet)}${numCell(r.ytdRev)}${numCell(r.ytdGP)}${numCell(r.ytdNet)}</tr>`).join('')}
      </tbody>
      <tfoot class="data-table__footer">
        <tr><td>Combined</td>${numCell(combined.moRev)}${numCell(combined.moGP)}${numCell(combined.moNet)}${numCell(combined.ytdRev)}${numCell(combined.ytdGP)}${numCell(combined.ytdNet)}</tr>
      </tfoot>
    </table>
  `;
}

function buildEntityRow(label, mo, ytd, cur) {
  const fx = (v) => cur === 'AUD' ? (v || 0) : convertToAUD(v || 0, cur);
  return {
    label,
    moRev: fx(mo.revenue), moGP: fx(mo.gp), moNet: fx(mo.net),
    ytdRev: fx(ytd.revenue), ytdGP: fx(ytd.gp), ytdNet: fx(ytd.net)
  };
}

// ── Cash Forecast Summary ────────────────────────────────────────────────────

function renderPrintCashForecast(expenses, revenue, bs) {
  const months = generateMonths();

  // Calculate expense totals
  const expTotals = new Array(9).fill(0);
  for (const cat of (expenses.categories || [])) {
    for (const line of cat.lines) {
      for (let i = 0; i < 9; i++) {
        expTotals[i] += line.defaults[i] || 0;
      }
    }
  }

  // Revenue projections
  const revByMonth = new Array(9).fill(0);
  const cosByMonth = new Array(9).fill(0);
  for (const line of revenue) {
    if (!line.due) {
      continue;
    }
    const d = new Date(line.due);
    const idx = months.findIndex(m => m.year === d.getFullYear() && m.month === d.getMonth());
    if (idx === -1) {
      continue;
    }
    const aud = convertToAUD(line.rev || 0, line.cur || 'AUD');
    revByMonth[idx] += aud;
    cosByMonth[idx] += aud * ((line.iePct || 0) + (line.refPct || 0));
  }

  const gp = months.map((_, i) => revByMonth[i] - cosByMonth[i]);
  const net = months.map((_, i) => gp[i] - expTotals[i]);

  const auBank = (bs.au && bs.au.bank) || 0;
  const euBank = convertToAUD((bs.eu && bs.eu.bank) || 0, 'EUR');
  const opening = [auBank + euBank];
  const closing = [opening[0] + net[0]];
  for (let i = 1; i < 9; i++) {
    opening.push(closing[i - 1]);
    closing.push(opening[i] + net[i]);
  }

  const headerCells = months.map(m => `<th class="num">${m.label}</th>`).join('');
  const row = (label, vals, bold) => {
    const s = bold ? ' style="font-weight:600"' : '';
    return `<tr><td${s}>${label}</td>${vals.map(v => `<td class="num${v < 0 ? ' num--negative' : ''}"${s}>${formatCurrency(v)}</td>`).join('')}</tr>`;
  };

  return `
    <table class="data-table">
      <thead><tr><th></th>${headerCells}</tr></thead>
      <tbody>
        ${row('Opening Cash', opening, true)}
        ${row('Revenue', revByMonth, false)}
        ${row('Cost of Sales', cosByMonth, false)}
        ${row('Gross Profit', gp, true)}
        ${row('Operating Expenses', expTotals, false)}
        ${row('Net Cash Movement', net, true)}
        ${row('Closing Cash', closing, true)}
      </tbody>
    </table>
  `;
}

// ── Chart ────────────────────────────────────────────────────────────────────

function renderPrintChart(expenses, revenue, bs) {
  const months = generateMonths();

  // Same calculations as above (simplified for print)
  const expTotals = new Array(9).fill(0);
  for (const cat of (expenses.categories || [])) {
    for (const line of cat.lines) {
      for (let i = 0; i < 9; i++) {
        expTotals[i] += line.defaults[i] || 0;
      }
    }
  }

  const revByMonth = new Array(9).fill(0);
  const cosByMonth = new Array(9).fill(0);
  for (const line of revenue) {
    if (!line.due) {
      continue;
    }
    const d = new Date(line.due);
    const idx = months.findIndex(m => m.year === d.getFullYear() && m.month === d.getMonth());
    if (idx === -1) {
      continue;
    }
    const aud = convertToAUD(line.rev || 0, line.cur || 'AUD');
    revByMonth[idx] += aud;
    cosByMonth[idx] += aud * ((line.iePct || 0) + (line.refPct || 0));
  }

  const net = months.map((_, i) => revByMonth[i] - cosByMonth[i] - expTotals[i]);
  const auBank = (bs.au && bs.au.bank) || 0;
  const euBank = convertToAUD((bs.eu && bs.eu.bank) || 0, 'EUR');
  const closing = [];
  let prev = auBank + euBank;
  for (let i = 0; i < 9; i++) {
    prev = prev + net[i];
    closing.push(prev);
  }

  return renderDualLineChart({
    labels: months.map(m => m.label),
    line1: closing,
    line2: closing.map((v, i) => v + revByMonth[i] * 0.3),
    line1Label: 'Forecast Cash',
    line2Label: 'Potential Cash'
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateMonths() {
  const now = new Date();
  const columns = [];
  for (let i = 0; i < 9; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    columns.push({
      label: formatMonthYear(date.toISOString().slice(0, 10)),
      year: date.getFullYear(),
      month: date.getMonth()
    });
  }
  return columns;
}

export { render };
