/**
 * charts.js — SVG chart rendering utilities
 *
 * Generates SVG charts via string concatenation. No charting library.
 * Supports: dual-line chart (Cash Forecast), funnel chart (Pipeline),
 * stacked area chart (Pipeline History) — funnel and stacked area added in Epic 5.
 */

/**
 * Render a dual-line SVG chart with optional fill gradient.
 * @param {Object} options
 * @param {string[]} options.labels - X-axis labels (e.g., month names)
 * @param {number[]} options.line1 - First data series (solid line)
 * @param {number[]} options.line2 - Second data series (dashed line)
 * @param {string} options.line1Label - Legend label for line 1
 * @param {string} options.line2Label - Legend label for line 2
 * @param {string} [options.line1Color] - CSS custom property name for line 1
 * @param {string} [options.line2Color] - CSS custom property name for line 2
 * @returns {string} SVG markup string
 */
function renderDualLineChart(options) {
  const {
    labels,
    line1,
    line2,
    line1Label = 'Forecast',
    line2Label = 'Potential',
    line1Color = 'var(--color-primary)',
    line2Color = 'var(--color-accent-amber)'
  } = options;

  if (!labels || labels.length === 0) {
    return '<div class="chart-placeholder">No data available for chart</div>';
  }

  const width = 800;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 50, left: 80 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Calculate scale
  const allValues = [...line1, ...line2].filter(v => v !== null && v !== undefined);
  if (allValues.length === 0) {
    return '<div class="chart-placeholder">No data available for chart</div>';
  }

  const minVal = Math.min(0, ...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const numPoints = labels.length;

  const xStep = chartW / Math.max(numPoints - 1, 1);
  const scaleY = (v) => padding.top + chartH - ((v - minVal) / range) * chartH;
  const scaleX = (i) => padding.left + i * xStep;

  // Grid lines (5 horizontal)
  const gridLines = [];
  const gridCount = 5;
  for (let i = 0; i <= gridCount; i++) {
    const val = minVal + (range * i) / gridCount;
    const y = scaleY(val);
    const label = formatChartValue(val);
    gridLines.push(`<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="var(--color-border)" stroke-width="1" />`);
    gridLines.push(`<text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="var(--color-text-muted)" font-size="11" font-family="var(--font-mono)">${label}</text>`);
  }

  // X-axis labels
  const xLabels = labels.map((label, i) =>
    `<text x="${scaleX(i)}" y="${height - 10}" text-anchor="middle" fill="var(--color-text-muted)" font-size="11">${label}</text>`
  ).join('');

  // Line 1 path (solid) with fill gradient
  const line1Path = buildPath(line1, scaleX, scaleY);
  const line1Fill = buildFillPath(line1, scaleX, scaleY, chartH + padding.top);

  // Line 2 path (dashed)
  const line2Path = buildPath(line2, scaleX, scaleY);

  // Legend
  const legendY = 15;
  const legend = `
    <line x1="${padding.left}" y1="${legendY}" x2="${padding.left + 20}" y2="${legendY}" stroke="${line1Color}" stroke-width="2" />
    <text x="${padding.left + 25}" y="${legendY + 4}" fill="var(--color-text-secondary)" font-size="12">${line1Label}</text>
    <line x1="${padding.left + 120}" y1="${legendY}" x2="${padding.left + 140}" y2="${legendY}" stroke="${line2Color}" stroke-width="2" stroke-dasharray="6,3" />
    <text x="${padding.left + 145}" y="${legendY + 4}" fill="var(--color-text-secondary)" font-size="12">${line2Label}</text>
  `;

  return `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="line1Fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${line1Color}" stop-opacity="0.15" />
          <stop offset="100%" stop-color="${line1Color}" stop-opacity="0.02" />
        </linearGradient>
      </defs>
      ${gridLines.join('')}
      ${xLabels}
      <path d="${line1Fill}" fill="url(#line1Fill)" />
      <path d="${line1Path}" fill="none" stroke="${line1Color}" stroke-width="2" />
      <path d="${line2Path}" fill="none" stroke="${line2Color}" stroke-width="2" stroke-dasharray="6,3" />
      ${legend}
    </svg>
  `;
}

/**
 * Build an SVG path string from data points.
 */
function buildPath(data, scaleX, scaleY) {
  const points = data.map((v, i) => `${scaleX(i)},${scaleY(v || 0)}`);
  return `M ${points.join(' L ')}`;
}

/**
 * Build a closed fill path (line + bottom edge).
 */
function buildFillPath(data, scaleX, scaleY, baseline) {
  const points = data.map((v, i) => `${scaleX(i)},${scaleY(v || 0)}`);
  const lastX = scaleX(data.length - 1);
  const firstX = scaleX(0);
  return `M ${points.join(' L ')} L ${lastX},${baseline} L ${firstX},${baseline} Z`;
}

/**
 * Format a value for chart axis labels (compact notation).
 */
function formatChartValue(val) {
  if (Math.abs(val) >= 1000000) {
    return `$${(val / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(val) >= 1000) {
    return `$${(val / 1000).toFixed(0)}K`;
  }
  return `$${val.toFixed(0)}`;
}

export { renderDualLineChart };
