/**
 * performance.js — Pipeline Performance tab
 * IE Lead origination, client concentration, win rates, stage timing.
 */

import { get } from '../shared/store.js';
import { formatCurrency, formatPercent, formatNumber } from '../shared/format.js';

function render(container) {
  const deals = Object.values(get('deals') || {});
  if (deals.length === 0) {
    container.innerHTML = '<div><h2>Performance</h2><p style="color:var(--color-text-muted);font-style:italic">No deal data. Import pipeline from Controls.</p></div>';
    return;
  }

  const active = deals.filter(d => d.sk);
  const closed = deals.filter(d => !d.sk);

  container.innerHTML = `
    <div>
      <h2 style="font-size:var(--font-size-xl);font-weight:var(--font-weight-semibold);margin-bottom:var(--space-6)">Performance Analytics</h2>
      ${renderLeadOrigination(active)}
      ${renderClientConcentration(active)}
      ${renderWinRates(deals)}
      ${renderStageTiming(active)}
    </div>
  `;
}

function renderLeadOrigination(active) {
  const byLead = {};
  for (const d of active) {
    const lead = d.lead || 'Unassigned';
    if (!byLead[lead]) { byLead[lead] = { count: 0, value: 0 }; }
    byLead[lead].count++;
    byLead[lead].value += d.amt;
  }
  const rows = Object.entries(byLead).sort((a, b) => b[1].value - a[1].value)
    .map(([lead, data]) => `<tr><td>${lead}</td><td class="num">${data.count}</td><td class="num">${formatCurrency(data.value, 'USD')}</td></tr>`).join('');
  return `<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin-bottom:var(--space-4)">IE Lead Origination</h3>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>IE Lead</th><th class="num">Deals</th><th class="num">Value</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderClientConcentration(active) {
  const byClient = {};
  for (const d of active) {
    const co = d.company || 'Unknown';
    if (!byClient[co]) { byClient[co] = { count: 0, value: 0 }; }
    byClient[co].count++;
    byClient[co].value += d.amt;
  }
  const total = active.reduce((s, d) => s + d.amt, 0);
  const rows = Object.entries(byClient).sort((a, b) => b[1].value - a[1].value).slice(0, 10)
    .map(([co, data]) => `<tr><td>${co}</td><td class="num">${data.count}</td><td class="num">${formatCurrency(data.value, 'USD')}</td><td class="num">${total > 0 ? formatPercent(data.value / total) : '—'}</td></tr>`).join('');
  return `<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:var(--space-6) 0 var(--space-4)">Client Concentration (Top 10)</h3>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Client</th><th class="num">Deals</th><th class="num">Value</th><th class="num">% of Pipeline</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderWinRates(deals) {
  const stages = ['M4', 'M3', 'M2.5', 'M2', 'M1.5', 'M1'];
  const rows = stages.map(sk => {
    const inStage = deals.filter(d => d.sk === sk);
    const won = deals.filter(d => !d.sk && d.stage && d.stage.includes('Won') && d[`dm${sk.replace('.', '')}`]);
    return `<tr><td>${sk}</td><td class="num">${inStage.length}</td><td class="num">${formatCurrency(inStage.reduce((s, d) => s + d.amt, 0), 'USD')}</td></tr>`;
  }).join('');
  return `<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:var(--space-6) 0 var(--space-4)">Pipeline by Stage</h3>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Stage</th><th class="num">Deals</th><th class="num">Value</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderStageTiming(active) {
  const stages = [
    { key: 'dm1', label: 'M1' }, { key: 'dm15', label: 'M1.5' },
    { key: 'dm2', label: 'M2' }, { key: 'dm25', label: 'M2.5' },
    { key: 'dm3', label: 'M3' }, { key: 'dm4', label: 'M4' }
  ];
  const rows = stages.map(s => {
    const values = active.map(d => d[s.key]).filter(v => v !== null && v !== undefined && v > 0);
    const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;
    return `<tr><td>${s.label}</td><td class="num">${values.length}</td><td class="num">${avg} days</td><td class="num">${max} days</td></tr>`;
  }).join('');
  return `<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:var(--space-6) 0 var(--space-4)">Stage Timing</h3>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Stage</th><th class="num">Deals</th><th class="num">Avg Days</th><th class="num">Max Days</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export { render };
