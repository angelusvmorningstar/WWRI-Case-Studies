/**
 * forecasting.js — Pipeline Forecasting tab
 * Weighted pipeline, win rate trends, loss analysis.
 */

import { get } from '../shared/store.js';
import { formatCurrency, formatPercent } from '../shared/format.js';

const STAGE_PROBS = { 'M4': 0.80, 'M3': 0.60, 'M2.5': 0.45, 'M2': 0.30, 'M1.5': 0.20, 'M1': 0.10 };

function render(container) {
  const deals = Object.values(get('deals') || {});
  const stageDefs = get('stageDefinitions') || {};

  if (deals.length === 0) {
    container.innerHTML = '<div><h2>Forecasting</h2><p style="color:var(--color-text-muted);font-style:italic">No deal data. Import pipeline from Controls.</p></div>';
    return;
  }

  const active = deals.filter(d => d.sk);
  const probs = {};
  if (stageDefs.pipeline) {
    for (const s of stageDefs.pipeline) {
      probs[s.label] = s.probability;
    }
  }

  container.innerHTML = `
    <div>
      <h2 style="font-size:var(--font-size-xl);font-weight:var(--font-weight-semibold);margin-bottom:var(--space-6)">Pipeline Forecasting</h2>
      ${renderWeightedPipeline(active, probs)}
      ${renderDealSizeAnalysis(active)}
      ${renderQuarterlyBreakdown(active)}
    </div>
  `;
}

function renderWeightedPipeline(active, probs) {
  const stages = ['M4', 'M3', 'M2.5', 'M2', 'M1.5', 'M1'];
  let totalRaw = 0;
  let totalWeighted = 0;

  const rows = stages.map(sk => {
    const stageDeals = active.filter(d => d.sk === sk);
    const raw = stageDeals.reduce((s, d) => s + d.amt, 0);
    const prob = probs[sk] || STAGE_PROBS[sk] || 0;
    const weighted = raw * prob;
    totalRaw += raw;
    totalWeighted += weighted;
    return `<tr><td>${sk}</td><td class="num">${stageDeals.length}</td><td class="num">${formatCurrency(raw, 'USD')}</td><td class="num">${formatPercent(prob)}</td><td class="num">${formatCurrency(weighted, 'USD')}</td></tr>`;
  }).join('');

  return `<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin-bottom:var(--space-4)">Weighted Pipeline</h3>
    <div class="data-table-wrap"><table class="data-table">
      <thead><tr><th>Stage</th><th class="num">Deals</th><th class="num">Raw Value</th><th class="num">Probability</th><th class="num">Weighted</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot class="data-table__footer"><tr><td>Total</td><td class="num">${active.length}</td><td class="num">${formatCurrency(totalRaw, 'USD')}</td><td></td><td class="num">${formatCurrency(totalWeighted, 'USD')}</td></tr></tfoot>
    </table></div>`;
}

function renderDealSizeAnalysis(active) {
  const buckets = [
    { label: '< $10K', min: 0, max: 10000 },
    { label: '$10K–$50K', min: 10000, max: 50000 },
    { label: '$50K–$100K', min: 50000, max: 100000 },
    { label: '$100K–$500K', min: 100000, max: 500000 },
    { label: '> $500K', min: 500000, max: Infinity }
  ];
  const rows = buckets.map(b => {
    const inBucket = active.filter(d => d.amt >= b.min && d.amt < b.max);
    const value = inBucket.reduce((s, d) => s + d.amt, 0);
    return `<tr><td>${b.label}</td><td class="num">${inBucket.length}</td><td class="num">${formatCurrency(value, 'USD')}</td></tr>`;
  }).join('');
  return `<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:var(--space-6) 0 var(--space-4)">Deal Size Distribution</h3>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Size</th><th class="num">Deals</th><th class="num">Value</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderQuarterlyBreakdown(active) {
  const quarters = {};
  for (const d of active) {
    if (!d.close) { continue; }
    const date = new Date(d.close);
    const q = `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`;
    if (!quarters[q]) { quarters[q] = { count: 0, value: 0 }; }
    quarters[q].count++;
    quarters[q].value += d.amt;
  }
  const rows = Object.entries(quarters).sort((a, b) => a[0].localeCompare(b[0]))
    .map(([q, data]) => `<tr><td>${q}</td><td class="num">${data.count}</td><td class="num">${formatCurrency(data.value, 'USD')}</td></tr>`).join('');
  if (!rows) { return ''; }
  return `<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:var(--space-6) 0 var(--space-4)">Close Date by Quarter</h3>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Quarter</th><th class="num">Deals</th><th class="num">Value</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export { render };
