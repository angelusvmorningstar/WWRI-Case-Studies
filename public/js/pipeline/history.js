/**
 * history.js — Pipeline History tab
 * 24-month rolling pipeline history (stacked area chart) and baseline comparison.
 */

import { get } from '../shared/store.js';
import { formatCurrency } from '../shared/format.js';

function render(container) {
  const snapshots = get('snapshots') || [];
  const baseline = get('baselines') || null;
  const deals = get('deals') || {};

  container.innerHTML = `
    <div>
      <h2 style="font-size:var(--font-size-xl);font-weight:var(--font-weight-semibold);margin-bottom:var(--space-6)">Pipeline History</h2>
      ${renderHistoryChart(snapshots)}
      ${renderSnapshotTable(snapshots)}
      ${renderBaselineComparison(deals, baseline)}
    </div>
  `;
}

function renderHistoryChart(allSnapshots) {
  if (allSnapshots.length === 0) {
    return '<div class="chart-area"><div class="chart-area__title">Pipeline History</div><div class="chart-placeholder">No history data. Import rolling monthly totals from Controls.</div></div>';
  }

  // Last 12 months only
  const snapshots = allSnapshots.slice(-12);

  const width = 800;
  const height = 300;
  const pad = { top: 30, right: 30, bottom: 50, left: 80 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  // Max is the highest total stack (m12 + m34 + active projects)
  const maxVal = Math.max(...snapshots.map(s => (s.m12 || 0) + (s.m34 || 0) + (s.active || 0)), 1);
  const xStep = cw / Math.max(snapshots.length - 1, 1);
  const sy = (v) => pad.top + ch - ((v || 0) / maxVal) * ch;
  const sx = (i) => pad.left + i * xStep;

  const baseY = pad.top + ch;
  const lastIdx = snapshots.length - 1;

  // Stacked from baseline (matching monolith): Active on bottom, M3-M4 middle, M1-M2 top
  // Polygons drawn back-to-front: largest (full stack) first, then smaller layers on top
  const layer1Top = snapshots.map(s => s.active || 0);                                  // Active
  const layer2Top = snapshots.map((s, i) => layer1Top[i] + (s.m34 || 0));               // + M3-M4
  const layer3Top = snapshots.map((s, i) => layer2Top[i] + (s.m12 || 0));               // + M1-M2

  // Build polygon points (forward across top, then baseline corners)
  const polyPoints = (topValues) => {
    const fwd = topValues.map((v, i) => `${sx(i)},${sy(v)}`).join(' ');
    return `${fwd} ${sx(lastIdx)},${baseY} ${sx(0)},${baseY}`;
  };

  const fullPoly = polyPoints(layer3Top);   // M1-M2 (outermost — light peach)
  const midPoly = polyPoints(layer2Top);    // M3-M4 (middle — burnt orange)
  const innerPoly = polyPoints(layer1Top);  // Active (innermost — dark navy)

  // X-axis labels
  const xLabels = snapshots.map((s, i) =>
    `<text x="${sx(i)}" y="${height - 10}" text-anchor="middle" fill="var(--color-text-muted)" font-size="10">${s.label}</text>`
  ).join('');

  // Y-axis grid
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const val = (maxVal * i) / 4;
    const y = sy(val);
    gridLines.push(`<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="var(--color-border)" stroke-width="1" />`);
    const label = val >= 1000000 ? `$${(val / 1000000).toFixed(1)}M` : `$${(val / 1000).toFixed(0)}K`;
    gridLines.push(`<text x="${pad.left - 8}" y="${y + 4}" text-anchor="end" fill="var(--color-text-muted)" font-size="10" font-family="var(--font-mono)">${label}</text>`);
  }

  return `
    <div class="chart-area">
      <div class="chart-area__title">Pipeline History (12 months)</div>
      <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        ${gridLines.join('')}
        <polygon points="${fullPoly}" fill="var(--color-chart-m12)" />
        <polygon points="${midPoly}" fill="var(--color-chart-m34)" />
        <polygon points="${innerPoly}" fill="var(--color-chart-active)" />
        ${xLabels}
        <text x="${width - pad.right}" y="15" text-anchor="end" fill="var(--color-text-secondary)" font-size="11">
          <rect width="10" height="10" fill="var(--color-chart-m12)" />
        </text>
        <text x="${width - pad.right - 52}" y="24" text-anchor="start" fill="var(--color-text-muted)" font-size="10">
          <tspan><tspan fill="var(--color-chart-m12)">■</tspan> M1–M2</tspan>
          <tspan dx="16"><tspan fill="var(--color-chart-m34)">■</tspan> M3–M4</tspan>
          <tspan dx="16"><tspan fill="var(--color-chart-active)">■</tspan> Active</tspan>
        </text>
      </svg>
    </div>
  `;
}

function renderSnapshotTable(snapshots) {
  if (snapshots.length === 0) {
    return '';
  }
  const rows = [...snapshots].reverse().map(s =>
    `<tr><td>${s.label}</td><td class="num">${formatCurrency(s.active || 0, 'USD')}</td><td class="num">${formatCurrency(s.m34 || 0, 'USD')}</td><td class="num">${formatCurrency(s.m12 || 0, 'USD')}</td></tr>`
  ).join('');
  return `<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:var(--space-6) 0 var(--space-4)">Monthly Snapshots</h3>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Month</th><th class="num">Active</th><th class="num">M3-M4</th><th class="num">M1-M2</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderBaselineComparison(deals, baseline) {
  if (!baseline || !baseline.data) {
    return '<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:var(--space-6) 0 var(--space-4)">Baseline Comparison</h3><p style="color:var(--color-text-muted);font-style:italic">No baseline saved. Save one from Controls tab.</p>';
  }

  const currentActive = Object.values(deals).filter(d => d.sk);
  const baselineActive = Object.values(baseline.data).filter(d => d.sk);

  const currentTotal = currentActive.reduce((s, d) => s + d.amt, 0);
  const baselineTotal = baselineActive.reduce((s, d) => s + d.amt, 0);
  const diff = currentTotal - baselineTotal;
  const diffClass = diff < 0 ? 'num--negative' : 'num--positive';

  const savedDate = baseline.savedAt ? new Date(baseline.savedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown';

  return `<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:var(--space-6) 0 var(--space-4)">Baseline Comparison (saved ${savedDate})</h3>
    <div class="data-table-wrap"><table class="data-table">
      <thead><tr><th></th><th class="num">Current</th><th class="num">Baseline</th><th class="num">Change</th></tr></thead>
      <tbody>
        <tr><td>Active Deals</td><td class="num">${currentActive.length}</td><td class="num">${baselineActive.length}</td><td class="num">${currentActive.length - baselineActive.length}</td></tr>
        <tr><td>Pipeline Value</td><td class="num">${formatCurrency(currentTotal, 'USD')}</td><td class="num">${formatCurrency(baselineTotal, 'USD')}</td><td class="num ${diffClass}">${formatCurrency(diff, 'USD')}</td></tr>
      </tbody>
    </table></div>`;
}

export { render };
