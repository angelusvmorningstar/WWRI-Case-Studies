/**
 * pipeline.js — Pipeline tab: funnel chart and sortable deal table
 */

import { get, set } from '../shared/store.js';
import { formatCurrency } from '../shared/format.js';

const STAGE_ORDER = ['M4', 'M3', 'M2.5', 'M2', 'M1.5', 'M1'];
const STAGE_COLORS = {
  'M4': 'var(--color-stage-m4)', 'M3': 'var(--color-stage-m3)',
  'M2.5': 'var(--color-stage-m2-5)', 'M2': 'var(--color-stage-m2)',
  'M1.5': 'var(--color-stage-m1-5)', 'M1': 'var(--color-stage-m1)'
};

let sortCol = 'stage';
let sortAsc = true;

function render(container) {
  const deals = get('deals') || {};
  const dealList = Object.values(deals);
  const active = dealList.filter(d => d.sk);

  if (dealList.length === 0) {
    container.innerHTML = '<div class="pipeline-tab"><h2>Pipeline</h2><p class="pipeline-tab__empty">No pipeline data. Go to Controls to import HubSpot data.</p></div>';
    return;
  }

  container.innerHTML = `
    <div class="pipeline-tab">
      <h2 class="pipeline-tab__heading">Pipeline</h2>
      <div class="pipeline-tab__section">${renderFunnel(active)}</div>
      <div class="pipeline-tab__section">
        <h3 class="pipeline-tab__subheading">All Deals (${dealList.length})</h3>
        <div class="data-table-wrap" id="deal-table-wrap">${renderDealTable(dealList)}</div>
      </div>
    </div>
  `;

  bindSorting(container, dealList);
  bindStaleActions(container);
}

function renderFunnel(active) {
  const stages = STAGE_ORDER.map(sk => {
    const deals = active.filter(d => d.sk === sk);
    return { sk, count: deals.length, value: deals.reduce((s, d) => s + d.amt, 0) };
  }).filter(s => s.count > 0);

  if (stages.length === 0) {
    return '<div class="chart-placeholder">No active deals in pipeline</div>';
  }

  const maxVal = Math.max(...stages.map(s => s.value));
  const barHeight = 36;
  const height = stages.length * (barHeight + 8) + 20;

  const bars = stages.map((s, i) => {
    const width = maxVal > 0 ? (s.value / maxVal) * 600 : 0;
    const y = i * (barHeight + 8) + 10;
    const color = STAGE_COLORS[s.sk] || 'var(--color-primary)';
    return `
      <rect x="80" y="${y}" width="${width}" height="${barHeight}" rx="4" fill="${color}" />
      <text x="75" y="${y + barHeight / 2 + 4}" text-anchor="end" fill="var(--color-text-secondary)" font-size="12" font-weight="600">${s.sk}</text>
      <text x="${85 + width}" y="${y + barHeight / 2 + 4}" fill="var(--color-text-secondary)" font-size="11">${s.count} deals · ${formatCurrency(s.value, 'USD')}</text>
    `;
  }).join('');

  return `<div class="chart-area"><div class="chart-area__title">Pipeline Funnel</div><svg viewBox="0 0 800 ${height}" xmlns="http://www.w3.org/2000/svg">${bars}</svg></div>`;
}

function renderDealTable(dealList) {
  const sorted = [...dealList].sort((a, b) => {
    let va, vb;
    if (sortCol === 'stage') { va = STAGE_ORDER.indexOf(a.sk); vb = STAGE_ORDER.indexOf(b.sk); if (va === -1) va = 99; if (vb === -1) vb = 99; }
    else if (sortCol === 'amt') { va = a.amt; vb = b.amt; }
    else if (sortCol === 'name') { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
    else if (sortCol === 'company') { va = (a.company || '').toLowerCase(); vb = (b.company || '').toLowerCase(); }
    else if (sortCol === 'close') { va = a.close || ''; vb = b.close || ''; }
    else { va = a[sortCol] || ''; vb = b[sortCol] || ''; }
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  const indicator = (col) => sortCol === col ? (sortAsc ? ' ▲' : ' ▼') : '';
  const rows = sorted.map(d => {
    const staleClass = d.sk && d._stale ? ' deal-row--stale' : '';
    const lostClass = !d.sk ? ' deal-row--lost' : '';
    return `
      <tr class="${staleClass}${lostClass}" data-deal-id="${d.id}">
        <td>${d.name}</td>
        <td>${d.company || ''}</td>
        <td><span class="status-badge status-badge--${(d.sk || 'none').toLowerCase().replace('.', '-')}">${d.sk || 'Closed'}</span></td>
        <td>${d.lead || ''}</td>
        <td class="num">${formatCurrency(d.amt, 'USD')}</td>
        <td>${d.close || ''}</td>
        <td>${d.act || ''}</td>
        ${d._stale ? `<td><button class="btn btn--ghost btn--sm" data-dismiss="${d.id}">Dismiss</button> <button class="btn btn--danger btn--sm" data-mark-lost="${d.id}">Lost</button></td>` : '<td></td>'}
      </tr>
    `;
  }).join('');

  return `
    <table class="data-table">
      <thead><tr>
        <th data-sortable data-sort-col="name">Deal${indicator('name')}</th>
        <th data-sortable data-sort-col="company">Company${indicator('company')}</th>
        <th data-sortable data-sort-col="stage">Stage${indicator('stage')}</th>
        <th>IE Lead</th>
        <th class="num" data-sortable data-sort-col="amt">Amount${indicator('amt')}</th>
        <th data-sortable data-sort-col="close">Close Date${indicator('close')}</th>
        <th>Last Activity</th>
        <th>Actions</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function bindSorting(container, dealList) {
  container.querySelectorAll('[data-sort-col]').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sortCol;
      if (sortCol === col) { sortAsc = !sortAsc; } else { sortCol = col; sortAsc = true; }
      const wrap = container.querySelector('#deal-table-wrap');
      if (wrap) { wrap.innerHTML = renderDealTable(dealList); bindSorting(container, dealList); bindStaleActions(container); }
    });
  });
}

function bindStaleActions(container) {
  container.querySelectorAll('[data-dismiss]').forEach(btn => {
    btn.addEventListener('click', () => {
      const deals = get('deals') || {};
      const id = btn.dataset.dismiss;
      if (deals[id]) { delete deals[id]._stale; set('deals', deals); render(container); }
    });
  });
  container.querySelectorAll('[data-mark-lost]').forEach(btn => {
    btn.addEventListener('click', () => {
      const deals = get('deals') || {};
      const id = btn.dataset.markLost;
      if (deals[id]) { deals[id].sk = null; deals[id].stage = 'Closed Lost'; delete deals[id]._stale; set('deals', deals); render(container); }
    });
  });
}

export { render };
