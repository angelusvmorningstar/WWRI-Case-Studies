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

function renderHistoryChart(snapshots) {
  if (snapshots.length === 0) {
    return '<div class="chart-area"><div class="chart-area__title">24-Month Pipeline History</div><div class="chart-placeholder">No history data. Import rolling monthly totals from Controls.</div></div>';
  }

  const width = 800;
  const height = 300;
  const pad = { top: 30, right: 30, bottom: 50, left: 80 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const maxVal = Math.max(...snapshots.map(s => s.active || 0), 1);
  const xStep = cw / Math.max(snapshots.length - 1, 1);
  const sy = (v) => pad.top + ch - ((v || 0) / maxVal) * ch;
  const sx = (i) => pad.left + i * xStep;

  // Stacked areas: M1-M2 on bottom, M3-M4 on top
  const m12Points = snapshots.map((s, i) => `${sx(i)},${sy(s.m12 || 0)}`);
  const m34Points = snapshots.map((s, i) => `${sx(i)},${sy((s.m12 || 0) + (s.m34 || 0))}`);
  const activePoints = snapshots.map((s, i) => `${sx(i)},${sy(s.active || 0)}`);

  const baseline = `${sx(0)},${pad.top + ch}`;
  const baselineEnd = `${sx(snapshots.length - 1)},${pad.top + ch}`;

  const activeFill = `M ${activePoints.join(' L ')} L ${baselineEnd} L ${baseline} Z`;
  const m34Fill = `M ${m34Points.join(' L ')} L ${baselineEnd} L ${baseline} Z`;
  const m12Fill = `M ${m12Points.join(' L ')} L ${baselineEnd} L ${baseline} Z`;

  // X-axis labels (every 3rd)
  const xLabels = snapshots.map((s, i) =>
    i % 3 === 0 ? `<text x="${sx(i)}" y="${height - 10}" text-anchor="middle" fill="var(--color-text-muted)" font-size="10">${s.label}</text>` : ''
  ).join('');

  // Y-axis
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
      <div class="chart-area__title">24-Month Pipeline History</div>
      <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        ${gridLines.join('')}
        <path d="${activeFill}" fill="var(--color-accent-amber)" opacity="0.2" />
        <path d="${m34Fill}" fill="var(--color-stage-m3)" opacity="0.3" />
        <path d="${m12Fill}" fill="var(--color-stage-m1)" opacity="0.3" />
        <path d="M ${activePoints.join(' L ')}" fill="none" stroke="var(--color-accent-amber)" stroke-width="2" />
        ${xLabels}
        <text x="${pad.left}" y="15" fill="var(--color-text-secondary)" font-size="11">
          <tspan fill="var(--color-accent-amber)">■</tspan> Active
          <tspan dx="12" fill="var(--color-stage-m3)">■</tspan> M3-M4
          <tspan dx="12" fill="var(--color-stage-m1)">■</tspan> M1-M2
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
