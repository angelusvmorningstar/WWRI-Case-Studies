/**
 * revenue-pipeline.js — Finance Revenue Pipeline tab
 *
 * Displays all revenue lines with client, project, status, amount, fees, and FX.
 * Supports inline editing of status, amounts, and dates.
 * Monthly projections added in Story 3.6.
 */

import { get, set } from '../shared/store.js';
import { formatCurrency, formatDate, formatMonthYear } from '../shared/format.js';
import { convertToAUD } from '../shared/fx.js';

const STATUS_LABELS = { 1: 'Contracted', 2: 'Certain', 3: 'Uncertain' };
const STATUS_CLASSES = { 1: 'contracted', 2: 'certain', 3: 'uncertain' };

/**
 * Render the Revenue Pipeline tab.
 * @param {HTMLElement} container - The content area to render into
 */
function render(container) {
  const revenue = get('revenue') || [];
  const clientDefaults = get('clientDefaults') || {};

  if (revenue.length === 0) {
    container.innerHTML = `
      <div class="revenue-pipeline">
        <h2 class="revenue-pipeline__heading">Revenue Pipeline</h2>
        <p class="revenue-pipeline__empty">No revenue data imported yet.
          <a href="#" class="revenue-pipeline__link">Go to Controls</a> to import data.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="revenue-pipeline">
      <h2 class="revenue-pipeline__heading">Revenue Pipeline</h2>
      <div class="data-table-wrap">
        <table class="data-table" id="revenue-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Project</th>
              <th>Status</th>
              <th>Entity</th>
              <th class="num">Amount</th>
              <th class="num">Currency</th>
              <th class="num">AUD Value</th>
              <th class="num">IE Fee</th>
              <th class="num">Ref Fee</th>
              <th class="num">WWRI Margin</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            ${revenue.map((line, idx) => renderRevenueLine(line, idx)).join('')}
          </tbody>
          <tfoot class="data-table__footer">
            ${renderTotals(revenue)}
          </tfoot>
        </table>
      </div>
      <div id="projection-area" class="revenue-pipeline__section">
        <h3 class="revenue-pipeline__subheading">Monthly Revenue Projections</h3>
        ${renderProjectionTable(revenue)}
      </div>
    </div>
  `;

  bindEditing(container, revenue);
}

// ── Revenue Line Rendering ───────────────────────────────────────────────────

function renderRevenueLine(line, idx) {
  const audValue = convertToAUD(line.rev || 0, line.cur || 'AUD');
  const ieFee = audValue * (line.iePct || 0);
  const refFee = audValue * (line.refPct || 0);
  const margin = audValue - ieFee - refFee;
  const statusLabel = STATUS_LABELS[line.status] || 'Unknown';
  const statusClass = STATUS_CLASSES[line.status] || '';

  return `
    <tr data-rev-idx="${idx}">
      <td>${line.client || ''}</td>
      <td>${line.project || ''}</td>
      <td>
        <select class="status-badge status-badge--${statusClass}" data-field="status" data-idx="${idx}">
          <option value="1" ${line.status === 1 ? 'selected' : ''}>Contracted</option>
          <option value="2" ${line.status === 2 ? 'selected' : ''}>Certain</option>
          <option value="3" ${line.status === 3 ? 'selected' : ''}>Uncertain</option>
        </select>
      </td>
      <td>${line.entity || ''}</td>
      <td class="data-table__cell--editable num">
        <input class="form-input" type="number" step="0.01"
               data-field="rev" data-idx="${idx}"
               value="${line.rev || 0}">
      </td>
      <td class="num">${line.cur || 'AUD'}</td>
      <td class="num">${formatCurrency(audValue)}</td>
      <td class="num">${formatCurrency(ieFee)}</td>
      <td class="num">${formatCurrency(refFee)}</td>
      <td class="num ${margin < 0 ? 'num--negative' : ''}">${formatCurrency(margin)}</td>
      <td class="data-table__cell--editable">
        <input class="form-input" type="date"
               data-field="due" data-idx="${idx}"
               value="${line.due || ''}">
      </td>
    </tr>
  `;
}

function renderTotals(revenue) {
  let totalAUD = 0;
  let totalIE = 0;
  let totalRef = 0;
  let totalMargin = 0;

  for (const line of revenue) {
    const aud = convertToAUD(line.rev || 0, line.cur || 'AUD');
    const ie = aud * (line.iePct || 0);
    const ref = aud * (line.refPct || 0);
    totalAUD += aud;
    totalIE += ie;
    totalRef += ref;
    totalMargin += aud - ie - ref;
  }

  return `
    <tr>
      <td colspan="6">Total</td>
      <td class="num">${formatCurrency(totalAUD)}</td>
      <td class="num">${formatCurrency(totalIE)}</td>
      <td class="num">${formatCurrency(totalRef)}</td>
      <td class="num">${formatCurrency(totalMargin)}</td>
      <td></td>
    </tr>
  `;
}

// ── Inline Editing ───────────────────────────────────────────────────────────

function bindEditing(container, revenue) {
  // Status dropdown changes
  container.querySelectorAll('select[data-field="status"]').forEach(select => {
    select.addEventListener('change', () => {
      const idx = parseInt(select.dataset.idx, 10);
      revenue[idx].status = parseInt(select.value, 10);
      set('revenue', revenue);

      // Update badge class
      const cls = STATUS_CLASSES[revenue[idx].status] || '';
      select.className = `status-badge status-badge--${cls}`;

      recalcRow(container, revenue, idx);
      recalcTotals(container, revenue);
    });
  });

  // Amount editing
  container.querySelectorAll('input[data-field="rev"]').forEach(input => {
    input.addEventListener('blur', () => {
      const idx = parseInt(input.dataset.idx, 10);
      revenue[idx].rev = parseFloat(input.value) || 0;
      set('revenue', revenue);
      recalcRow(container, revenue, idx);
      recalcTotals(container, revenue);
    });
  });

  // Due date editing
  container.querySelectorAll('input[data-field="due"]').forEach(input => {
    input.addEventListener('change', () => {
      const idx = parseInt(input.dataset.idx, 10);
      revenue[idx].due = input.value;
      set('revenue', revenue);
    });
  });
}

function recalcRow(container, revenue, idx) {
  const line = revenue[idx];
  const row = container.querySelector(`tr[data-rev-idx="${idx}"]`);
  if (!row) {
    return;
  }

  const audValue = convertToAUD(line.rev || 0, line.cur || 'AUD');
  const ieFee = audValue * (line.iePct || 0);
  const refFee = audValue * (line.refPct || 0);
  const margin = audValue - ieFee - refFee;

  const cells = row.querySelectorAll('td');
  // cells[6]=AUD Value, [7]=IE Fee, [8]=Ref Fee, [9]=WWRI Margin
  cells[6].textContent = formatCurrency(audValue);
  cells[6].className = 'num';
  cells[7].textContent = formatCurrency(ieFee);
  cells[7].className = 'num';
  cells[8].textContent = formatCurrency(refFee);
  cells[8].className = 'num';
  cells[9].textContent = formatCurrency(margin);
  cells[9].className = margin < 0 ? 'num num--negative' : 'num';
}

function recalcTotals(container, revenue) {
  const tfoot = container.querySelector('#revenue-table tfoot');
  if (tfoot) {
    tfoot.innerHTML = renderTotals(revenue);
  }
}

// ── Monthly Projections ──────────────────────────────────────────────────────

function generateMonthColumns() {
  const now = new Date();
  const columns = [];
  for (let i = 0; i < 9; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const iso = date.toISOString().slice(0, 10);
    columns.push({
      label: formatMonthYear(iso),
      year: date.getFullYear(),
      month: date.getMonth()
    });
  }
  return columns;
}

function renderProjectionTable(revenue) {
  if (revenue.length === 0) {
    return '';
  }

  const months = generateMonthColumns();

  // Build projection grid: for each revenue line, place AUD value in the month it's due
  const rows = revenue.map(line => {
    const audValue = convertToAUD(line.rev || 0, line.cur || 'AUD');
    const dueDate = line.due ? new Date(line.due) : null;
    const statusLabel = STATUS_LABELS[line.status] || '';

    const cells = months.map(m => {
      if (dueDate && dueDate.getFullYear() === m.year && dueDate.getMonth() === m.month) {
        return audValue;
      }
      return 0;
    });

    return { client: line.client || '', project: line.project || '', status: statusLabel, cells };
  });

  // Totals per month
  const totals = months.map((_, i) => rows.reduce((sum, row) => sum + row.cells[i], 0));

  const headerCells = months.map(m => `<th class="num">${m.label}</th>`).join('');

  const bodyRows = rows.map(row => {
    const cells = row.cells.map(v => {
      if (v === 0) {
        return '<td class="num">—</td>';
      }
      return `<td class="num">${formatCurrency(v)}</td>`;
    }).join('');
    return `<tr><td>${row.client}</td><td>${row.status}</td>${cells}</tr>`;
  }).join('');

  const totalCells = totals.map(v => {
    const cls = v < 0 ? 'num num--negative' : 'num';
    return `<td class="${cls}">${v === 0 ? '—' : formatCurrency(v)}</td>`;
  }).join('');

  return `
    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Client</th><th>Status</th>${headerCells}</tr>
        </thead>
        <tbody>${bodyRows}</tbody>
        <tfoot class="data-table__footer">
          <tr><td colspan="2">Total</td>${totalCells}</tr>
        </tfoot>
      </table>
    </div>
  `;
}

export { render };
