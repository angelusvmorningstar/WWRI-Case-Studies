/**
 * pipeline-report.js — Pipeline Print tab
 * Print layout for pipeline board report with basic/advanced options.
 */

import { get } from '../shared/store.js';
import { formatCurrency, formatDate } from '../shared/format.js';
import { triggerPrint } from '../shared/print.js';

const STAGE_ORDER = ['M4', 'M3', 'M2.5', 'M2', 'M1.5', 'M1'];

let printMode = 'basic';

function render(container) {
  const deals = Object.values(get('deals') || {});
  const active = deals.filter(d => d.sk);
  const today = new Date().toISOString().slice(0, 10);

  container.innerHTML = `
    <div class="pipeline-print-tab">
      <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-6)">
        <h2 style="font-size:var(--font-size-xl);font-weight:var(--font-weight-semibold)">Pipeline Report — Print Preview</h2>
        <label style="font-size:var(--font-size-sm)">
          <input type="radio" name="print-mode" value="basic" ${printMode === 'basic' ? 'checked' : ''}> Basic
        </label>
        <label style="font-size:var(--font-size-sm)">
          <input type="radio" name="print-mode" value="advanced" ${printMode === 'advanced' ? 'checked' : ''}> Advanced
        </label>
        <button class="btn btn--primary" type="button" id="btn-print-pipeline">Print Report</button>
      </div>

      <div class="print-header print-only">
        <img class="print-header__logo" src="./assets/WWT-Logo.jpg" alt="Whitewater Logo">
        <span class="print-header__title">Pipeline Report</span>
        <span class="print-header__date">${formatDate(today)}</span>
      </div>

      <div class="print-section">
        <div class="print-section__title">Pipeline Summary</div>
        ${renderStageSummary(active)}
      </div>

      <div class="print-section">
        <div class="print-section__title">Deal Table</div>
        ${renderDealTable(printMode === 'advanced' ? deals : active)}
      </div>

      ${printMode === 'advanced' ? renderAdvancedSections(deals, active) : ''}
    </div>
  `;

  container.querySelector('#btn-print-pipeline').addEventListener('click', triggerPrint);
  container.querySelectorAll('input[name="print-mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      printMode = radio.value;
      render(container);
    });
  });
}

function renderStageSummary(active) {
  const rows = STAGE_ORDER.map(sk => {
    const stageDeals = active.filter(d => d.sk === sk);
    const value = stageDeals.reduce((s, d) => s + d.amt, 0);
    return `<tr><td>${sk}</td><td class="num">${stageDeals.length}</td><td class="num">${formatCurrency(value, 'USD')}</td></tr>`;
  }).join('');
  const total = active.reduce((s, d) => s + d.amt, 0);
  return `<table class="data-table"><thead><tr><th>Stage</th><th class="num">Deals</th><th class="num">Value (USD)</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot class="data-table__footer"><tr><td>Total Active</td><td class="num">${active.length}</td><td class="num">${formatCurrency(total, 'USD')}</td></tr></tfoot></table>`;
}

function renderDealTable(deals) {
  const sorted = [...deals].sort((a, b) => {
    const ia = STAGE_ORDER.indexOf(a.sk);
    const ib = STAGE_ORDER.indexOf(b.sk);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  const rows = sorted.map(d =>
    `<tr><td>${d.name}</td><td>${d.company || ''}</td><td>${d.sk || 'Closed'}</td><td>${d.lead || ''}</td><td class="num">${formatCurrency(d.amt, 'USD')}</td><td>${d.close || ''}</td></tr>`
  ).join('');
  return `<table class="data-table"><thead><tr><th>Deal</th><th>Company</th><th>Stage</th><th>IE Lead</th><th class="num">Amount</th><th>Close</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderAdvancedSections(deals, active) {
  // IE Lead breakdown
  const byLead = {};
  for (const d of active) {
    const lead = d.lead || 'Unassigned';
    if (!byLead[lead]) { byLead[lead] = { count: 0, value: 0 }; }
    byLead[lead].count++;
    byLead[lead].value += d.amt;
  }
  const leadRows = Object.entries(byLead).sort((a, b) => b[1].value - a[1].value)
    .map(([lead, data]) => `<tr><td>${lead}</td><td class="num">${data.count}</td><td class="num">${formatCurrency(data.value, 'USD')}</td></tr>`).join('');

  // Client breakdown
  const byClient = {};
  for (const d of active) {
    const co = d.company || 'Unknown';
    if (!byClient[co]) { byClient[co] = { count: 0, value: 0 }; }
    byClient[co].count++;
    byClient[co].value += d.amt;
  }
  const clientRows = Object.entries(byClient).sort((a, b) => b[1].value - a[1].value).slice(0, 10)
    .map(([co, data]) => `<tr><td>${co}</td><td class="num">${data.count}</td><td class="num">${formatCurrency(data.value, 'USD')}</td></tr>`).join('');

  return `
    <div class="print-section print-page-break">
      <div class="print-section__title">IE Lead Breakdown</div>
      <table class="data-table"><thead><tr><th>IE Lead</th><th class="num">Deals</th><th class="num">Value</th></tr></thead><tbody>${leadRows}</tbody></table>
    </div>
    <div class="print-section">
      <div class="print-section__title">Top Clients</div>
      <table class="data-table"><thead><tr><th>Client</th><th class="num">Deals</th><th class="num">Value</th></tr></thead><tbody>${clientRows}</tbody></table>
    </div>
  `;
}

export { render };
