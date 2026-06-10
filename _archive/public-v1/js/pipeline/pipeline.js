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
  const allDeals = Object.values(deals);
  // Active pipeline deals always show; closed (won/lost) deals only if they
  // closed within the last 30 days, to keep the table from accumulating
  // historical clutter.
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const dealList = allDeals.filter(d => d.sk || (d.close && d.close >= cutoff));
  const active = dealList.filter(d => d.sk);

  if (allDeals.length === 0) {
    container.innerHTML = '<div class="pipeline-tab"><h2>Pipeline</h2><p class="pipeline-tab__empty">No pipeline data. Go to Controls to import HubSpot data.</p></div>';
    return;
  }

  container.innerHTML = `
    <div class="pipeline-tab">
      <h2 class="pipeline-tab__heading">Pipeline</h2>
      <div class="pipeline-tab__section">${renderFunnel(active)}</div>
      <div class="pipeline-tab__section">
        <h3 class="pipeline-tab__subheading">Deals — active + closed in last 30 days (${dealList.length})</h3>
        <div class="data-table-wrap" id="deal-table-wrap">${renderDealTable(dealList)}</div>
      </div>
    </div>
  `;

  bindSorting(container, dealList);
  bindStaleActions(container);
}

function renderFunnel(active) {
  const order = ['M1', 'M1.5', 'M2', 'M2.5', 'M3', 'M4'];
  const colors = {
    'M1': 'var(--color-stage-m1)', 'M1.5': 'var(--color-stage-m1-5)',
    'M2': 'var(--color-stage-m2)', 'M2.5': 'var(--color-stage-m2-5)',
    'M3': 'var(--color-stage-m3)', 'M4': 'var(--color-stage-m4)'
  };

  const sum = {};
  let tot = 0;
  for (const d of active) {
    if (!d.sk) { continue; }
    if (!sum[d.sk]) { sum[d.sk] = { count: 0, total: 0 }; }
    sum[d.sk].count++;
    sum[d.sk].total += d.amt;
    tot += d.amt;
  }

  if (tot <= 0) {
    return '<div class="chart-placeholder">No active deals in pipeline</div>';
  }

  // Funnel geometry — triangle with bands
  const TY = 40, BY = 420, CX = 260, TLX = 60, TRX = 460, H = 380, HALF = 200;
  const VW = 680, VH = 460;

  const rX = (y) => CX + (BY - y) / H * HALF;

  // Build bands proportional to value
  let y = TY;
  const bands = order.map(k => {
    const val = sum[k] ? sum[k].total : 0;
    const cnt = sum[k] ? sum[k].count : 0;
    const bh = val / tot * H;
    const band = { key: k, val, count: cnt, y, h: bh, color: colors[k] };
    y += bh;
    return band;
  });

  let svg = `<svg width="100%" viewBox="0 0 ${VW} ${VH}" xmlns="http://www.w3.org/2000/svg">`;

  // Clip path — triangle
  svg += `<defs><clipPath id="fc"><polygon points="${CX},${BY} ${TLX},${TY} ${TRX},${TY}"/></clipPath></defs>`;

  // Coloured bands clipped to triangle
  svg += '<g clip-path="url(#fc)">';
  for (const b of bands) {
    if (b.h > 0) {
      svg += `<rect x="${TLX}" y="${b.y.toFixed(1)}" width="${TRX - TLX}" height="${Math.ceil(b.h + 1)}" fill="${b.color}"/>`;
    }
  }
  svg += '</g>';

  // White separator lines between bands
  for (let i = 1; i < bands.length; i++) {
    const b = bands[i];
    if (b.h <= 0) { continue; }
    const lx = CX - (BY - b.y) / H * HALF + 2;
    const rx = CX + (BY - b.y) / H * HALF - 2;
    if (rx > lx) {
      svg += `<line x1="${lx.toFixed(1)}" y1="${b.y.toFixed(1)}" x2="${rx.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="white" stroke-width="1" opacity="0.5"/>`;
    }
  }

  // Triangle outline
  svg += `<polygon points="${CX},${BY} ${TLX},${TY} ${TRX},${TY}" fill="none" stroke="var(--color-border)" stroke-width="1.2"/>`;

  // Labels with leader lines
  const LX = 475, MIN_GAP = 26;
  const visible = bands.filter(b => b.h >= 1);
  const labelY = visible.map(b => b.y + b.h / 2);

  // Space labels to avoid overlap
  for (let pass = 0; pass < 10; pass++) {
    for (let i = labelY.length - 2; i >= 0; i--) {
      if (labelY[i + 1] - labelY[i] < MIN_GAP) { labelY[i] = labelY[i + 1] - MIN_GAP; }
    }
    for (let j = 1; j < labelY.length; j++) {
      if (labelY[j] - labelY[j - 1] < MIN_GAP) { labelY[j] = labelY[j - 1] + MIN_GAP; }
    }
  }

  for (let i = 0; i < labelY.length; i++) {
    labelY[i] = Math.max(TY + 8, Math.min(BY - 8, labelY[i]));
  }

  visible.forEach((b, idx) => {
    const midY = b.y + b.h / 2;
    const ly = labelY[idx];
    const pct = Math.round(b.val / tot * 100);
    const rx = rX(midY);

    svg += `<line x1="${rx.toFixed(1)}" y1="${midY.toFixed(1)}" x2="${LX - 4}" y2="${ly.toFixed(1)}" stroke="var(--color-text-muted)" stroke-width="0.8" stroke-dasharray="3 2"/>`;
    svg += `<text font-size="11" font-weight="700" font-family="var(--font-ui)" x="${LX}" y="${(ly + 2)}" fill="var(--color-text-primary)">${b.key}</text>`;
    svg += `<text font-size="10" font-family="var(--font-ui)" x="${LX}" y="${(ly + 14)}" fill="var(--color-text-secondary)">${formatCurrency(b.val, 'USD')}  ${b.count} deals  ${pct}%</text>`;
  });

  // Total at bottom
  svg += `<text font-size="10" font-family="var(--font-ui)" x="${CX}" y="${VH - 8}" text-anchor="middle" fill="var(--color-text-muted)">Total: ${formatCurrency(tot, 'USD')}</text>`;
  svg += '</svg>';

  return `<div class="chart-area"><div class="chart-area__title">Pipeline Funnel</div>${svg}</div>`;
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
      if (deals[id]) { deals[id].sk = null; deals[id].stage = 'Closed Lost'; deals[id].close = new Date().toISOString().slice(0, 10); delete deals[id]._stale; set('deals', deals); render(container); }
    });
  });
}

export { render };
