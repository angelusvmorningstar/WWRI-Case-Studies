/**
 * dashboard.js — Finance Dashboard tab
 *
 * Displays KPI cards (revenue, gross profit, operating profit, cash position)
 * and a revenue-by-entity table (AU, EU, combined) with month and YTD figures.
 */

import { get } from '../shared/store.js';
import { formatCurrency } from '../shared/format.js';
import { convertToAUD } from '../shared/fx.js';

/**
 * Render the Finance Dashboard tab.
 * @param {HTMLElement} container - The content area to render into
 */
function render(container) {
  const pl = get('profitLoss') || {};
  const bs = get('balanceSheet') || {};

  const hasData = pl.auMo || pl.euMo || bs.au || bs.eu;

  container.innerHTML = `
    <div class="dashboard">
      <h2 class="dashboard__heading">Finance Dashboard</h2>
      ${renderKPICards(pl, bs)}
      ${hasData ? renderEntityTable(pl) : renderEmptyTable()}
    </div>
  `;
}

// ── KPI Cards ────────────────────────────────────────────────────────────────

function renderKPICards(pl, bs) {
  const auMo = pl.auMo || {};
  const euMo = pl.euMo || {};
  const auBs = bs.au || {};
  const euBs = bs.eu || {};

  const revenue = (auMo.revenue || 0) + convertToAUD(euMo.revenue || 0, 'EUR');
  const grossProfit = (auMo.gp || 0) + convertToAUD(euMo.gp || 0, 'EUR');
  const operatingProfit = (auMo.net || 0) + convertToAUD(euMo.net || 0, 'EUR');
  const cashPosition = (auBs.bank || 0) + convertToAUD(euBs.bank || 0, 'EUR');

  return `
    <div class="kpi-grid">
      ${renderKPICard('Revenue', revenue)}
      ${renderKPICard('Gross Profit', grossProfit)}
      ${renderKPICard('Operating Profit', operatingProfit)}
      ${renderKPICard('Cash Position', cashPosition)}
    </div>
  `;
}

function renderKPICard(label, value) {
  const formatted = value === 0 ? '—' : formatCurrency(value);
  const changeClass = value < 0 ? 'kpi-card__change--negative' : '';

  return `
    <div class="kpi-card">
      <div class="kpi-card__label">${label}</div>
      <div class="kpi-card__value">${formatted}</div>
      ${value < 0 ? '<div class="kpi-card__change kpi-card__change--negative">↓ negative</div>' : ''}
    </div>
  `;
}

// ── Entity Table ─────────────────────────────────────────────────────────────

function renderEntityTable(pl) {
  const auMo = pl.auMo || {};
  const euMo = pl.euMo || {};
  const auYtd = pl.auYtd || {};
  const euYtd = pl.euYtd || {};

  // AU values (already in AUD)
  const au = {
    moRev: auMo.revenue || 0,
    moGP: auMo.gp || 0,
    moNet: auMo.net || 0,
    ytdRev: auYtd.revenue || 0,
    ytdGP: auYtd.gp || 0,
    ytdNet: auYtd.net || 0
  };

  // EU values (convert to AUD)
  const eu = {
    moRev: convertToAUD(euMo.revenue || 0, 'EUR'),
    moGP: convertToAUD(euMo.gp || 0, 'EUR'),
    moNet: convertToAUD(euMo.net || 0, 'EUR'),
    ytdRev: convertToAUD(euYtd.revenue || 0, 'EUR'),
    ytdGP: convertToAUD(euYtd.gp || 0, 'EUR'),
    ytdNet: convertToAUD(euYtd.net || 0, 'EUR')
  };

  // Combined
  const combined = {
    moRev: au.moRev + eu.moRev,
    moGP: au.moGP + eu.moGP,
    moNet: au.moNet + eu.moNet,
    ytdRev: au.ytdRev + eu.ytdRev,
    ytdGP: au.ytdGP + eu.ytdGP,
    ytdNet: au.ytdNet + eu.ytdNet
  };

  const period = pl.period || '';

  return `
    <div class="dashboard__section">
      <h3 class="dashboard__subheading">Revenue by Entity${period ? ` — ${period}` : ''}</h3>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Entity</th>
              <th class="num">Month Revenue</th>
              <th class="num">Month GP</th>
              <th class="num">Month Net</th>
              <th class="num">YTD Revenue</th>
              <th class="num">YTD GP</th>
              <th class="num">YTD Net</th>
            </tr>
          </thead>
          <tbody>
            ${renderEntityRow('AU', au)}
            ${renderEntityRow('EU', eu)}
          </tbody>
          <tfoot class="data-table__footer">
            ${renderEntityRow('Combined', combined)}
          </tfoot>
        </table>
      </div>
    </div>
  `;
}

function renderEntityRow(label, data) {
  const numClass = (val) => {
    let cls = 'num';
    if (val < 0) {
      cls += ' num--negative';
    }
    return cls;
  };

  return `
    <tr>
      <td>${label}</td>
      <td class="${numClass(data.moRev)}">${formatCurrency(data.moRev)}</td>
      <td class="${numClass(data.moGP)}">${formatCurrency(data.moGP)}</td>
      <td class="${numClass(data.moNet)}">${formatCurrency(data.moNet)}</td>
      <td class="${numClass(data.ytdRev)}">${formatCurrency(data.ytdRev)}</td>
      <td class="${numClass(data.ytdGP)}">${formatCurrency(data.ytdGP)}</td>
      <td class="${numClass(data.ytdNet)}">${formatCurrency(data.ytdNet)}</td>
    </tr>
  `;
}

function renderEmptyTable() {
  return `
    <div class="dashboard__section">
      <h3 class="dashboard__subheading">Revenue by Entity</h3>
      <p class="dashboard__empty">No data imported yet. <a href="#" class="dashboard__link" data-action="go-controls">Go to Controls</a> to import your first CSV.</p>
    </div>
  `;
}

export { render };
