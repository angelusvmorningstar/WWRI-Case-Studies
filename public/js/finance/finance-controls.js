/**
 * finance-controls.js — Finance Report Controls tab
 *
 * Provides CSV import areas for Xero data, reference data editors,
 * backup/restore, and activity log.
 */

import { get, set, getAll } from '../shared/store.js';
import { parseBalanceSheet, parseProfitLoss, parseInvoices } from './xero-parsers.js';

const IMPORT_TYPES = [
  { id: 'bs-au',       label: 'Balance Sheet AU',  placeholder: 'Paste Xero Balance Sheet AU CSV here' },
  { id: 'bs-eu',       label: 'Balance Sheet EU',  placeholder: 'Paste Xero Balance Sheet EU CSV here' },
  { id: 'pl-au-month', label: 'P&L AU Month',      placeholder: 'Paste Xero P&L AU Month CSV here' },
  { id: 'pl-au-ytd',   label: 'P&L AU YTD',        placeholder: 'Paste Xero P&L AU YTD CSV here' },
  { id: 'pl-eu-month', label: 'P&L EU Month',      placeholder: 'Paste Xero P&L EU Month CSV here' },
  { id: 'pl-eu-ytd',   label: 'P&L EU YTD',        placeholder: 'Paste Xero P&L EU YTD CSV here' },
  { id: 'invoices',    label: 'Invoices',           placeholder: 'Paste Xero Invoice CSV here' }
];

const IMPORT_DISPLAY_NAMES = {
  'bs-au': 'Balance Sheet AU',
  'bs-eu': 'Balance Sheet EU',
  'pl-au-month': 'P&L AU Month',
  'pl-au-ytd': 'P&L AU YTD',
  'pl-eu-month': 'P&L EU Month',
  'pl-eu-ytd': 'P&L EU YTD',
  'invoices': 'Invoices'
};

const IMPORT_HANDLERS = {
  'bs-au':       { parse: (text) => parseBalanceSheet('au', text), storeKey: 'balanceSheet', subKey: 'au' },
  'bs-eu':       { parse: (text) => parseBalanceSheet('eu', text), storeKey: 'balanceSheet', subKey: 'eu' },
  'pl-au-month': { parse: (text) => parseProfitLoss('au', 'mo', text), storeKey: 'profitLoss', subKey: 'auMo' },
  'pl-au-ytd':   { parse: (text) => parseProfitLoss('au', 'ytd', text), storeKey: 'profitLoss', subKey: 'auYtd' },
  'pl-eu-month': { parse: (text) => parseProfitLoss('eu', 'mo', text), storeKey: 'profitLoss', subKey: 'euMo' },
  'pl-eu-ytd':   { parse: (text) => parseProfitLoss('eu', 'ytd', text), storeKey: 'profitLoss', subKey: 'euYtd' },
  'invoices':    { parse: (text) => parseInvoices(text), storeKey: 'xeroImport', subKey: null }
};

// ── Render ───────────────────────────────────────────────────────────────────

/**
 * Render the Finance Controls tab.
 * @param {HTMLElement} container - The content area to render into
 */
function render(container) {
  container.innerHTML = `
    <div class="finance-controls">
      <h2 class="finance-controls__heading">Finance Controls</h2>

      <div id="import-feedback-area" class="finance-controls__section"></div>

      <section class="finance-controls__section">
        <h3 class="finance-controls__subheading">Data Import</h3>
        <p class="finance-controls__description">
          Paste Xero CSV exports below. Each import replaces the previous data for that type.
        </p>
        ${IMPORT_TYPES.map(type => renderImportArea(type)).join('')}
      </section>

      <section class="finance-controls__section" id="reference-data-section">
        <h3 class="finance-controls__subheading">Reference Data</h3>
        ${renderFxRates()}
        ${renderClientDefaults()}
      </section>

      <section class="finance-controls__section" id="backup-section">
        <h3 class="finance-controls__subheading">Data Management</h3>
        <div class="finance-controls__backup-row">
          <button class="btn btn--ghost" type="button" id="btn-export-backup">Export Backup</button>
          <span class="finance-controls__description" style="display:inline">Download a full JSON backup of all data.</span>
        </div>
        <div class="finance-controls__backup-row">
          <label class="form-label" for="restore-file">Restore from Backup</label>
          <input class="form-input" type="file" id="restore-file" accept=".json">
          <button class="btn btn--danger" type="button" id="btn-restore-backup">Restore</button>
          <div id="restore-confirm" class="confirm-row" hidden>
            <span class="confirm-row__message">This will replace all current data with the backup. Are you sure?</span>
            <button class="btn btn--danger" type="button" id="btn-restore-confirm">Confirm</button>
            <button class="btn btn--ghost" type="button" id="btn-restore-cancel">Cancel</button>
          </div>
        </div>
      </section>

      <section class="finance-controls__section" id="activity-log-section">
        <h3 class="finance-controls__subheading">Activity Log</h3>
        ${renderActivityLog()}
      </section>
    </div>
  `;

  bindImportButtons(container);
  bindReferenceData(container);
  bindBackupRestore(container);
}

function renderImportArea(type) {
  return `
    <div class="import-area" data-import-id="${type.id}">
      <label class="form-label" for="import-${type.id}">${type.label}</label>
      <textarea class="form-textarea"
                id="import-${type.id}"
                placeholder="${type.placeholder}"></textarea>
      <button class="btn btn--primary"
              type="button"
              data-import-type="${type.id}">Import</button>
    </div>
  `;
}

// ── Import Handling ──────────────────────────────────────────────────────────

function bindImportButtons(container) {
  container.querySelectorAll('[data-import-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      const importType = btn.dataset.importType;
      const textarea = container.querySelector(`#import-${importType}`);

      if (!textarea || !textarea.value.trim()) {
        return;
      }

      handleImport(importType, textarea, container);
    });
  });
}

function handleImport(importType, textarea, container) {
  const handler = IMPORT_HANDLERS[importType];
  if (!handler) {
    return;
  }

  const result = handler.parse(textarea.value);
  const displayName = IMPORT_DISPLAY_NAMES[importType] || importType;

  if (!result.ok) {
    addFeedbackBanner(container, false, displayName, result.error);
    logImport(importType, false, 0);
    refreshActivityLog(container);
    return;
  }

  // Store parsed data — merge for BS/PL, replace for invoices
  if (handler.subKey) {
    const existing = get(handler.storeKey) || {};
    existing[handler.subKey] = result.data;
    if (result.data.period) {
      existing.period = result.data.period;
    }
    set(handler.storeKey, existing);
  } else {
    set(handler.storeKey, result.data);
  }

  // Determine row count for logging
  const rowCount = result.rowCount || (result.data.bankDetail ? result.data.bankDetail.length : 1);

  addFeedbackBanner(container, true, displayName, `${rowCount} rows imported`);
  logImport(importType, true, rowCount);
  refreshActivityLog(container);

  textarea.value = '';
}

// ── Feedback Banners ─────────────────────────────────────────────────────────

function addFeedbackBanner(container, success, displayName, message) {
  const area = container.querySelector('#import-feedback-area');
  if (!area) {
    return;
  }

  const variant = success ? 'import-feedback--success' : 'import-feedback--error';
  const icon = success ? '✓' : '⚠';
  const text = success ? `${displayName} — ${message}` : `${displayName}: ${message}`;

  const banner = document.createElement('div');
  banner.className = `import-feedback ${variant}`;
  banner.innerHTML = `
    <span class="import-feedback__icon">${icon}</span>
    <span class="import-feedback__text">${text}</span>
    <span class="import-feedback__meta">just now</span>
  `;

  // Prepend — most recent on top
  area.insertBefore(banner, area.firstChild);
}

// ── Import Logging ───────────────────────────────────────────────────────────

function logImport(type, success, rowCount) {
  const log = get('importLog') || [];
  log.push({
    type,
    timestamp: new Date().toISOString(),
    rowCount,
    success
  });
  set('importLog', log);
}

// ── Activity Log Display ─────────────────────────────────────────────────────

function renderActivityLog() {
  const log = get('importLog') || [];

  if (log.length === 0) {
    return '<p class="finance-controls__placeholder">No imports recorded yet.</p>';
  }

  const rows = [...log].reverse().map(entry => {
    const name = IMPORT_DISPLAY_NAMES[entry.type] || entry.type;
    const date = new Date(entry.timestamp);
    const dateStr = date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    const status = entry.success ? '✓' : '✗';
    const statusClass = entry.success ? 'num--positive' : 'num--negative';

    return `
      <tr>
        <td class="${statusClass}">${status}</td>
        <td>${name}</td>
        <td class="num">${entry.rowCount}</td>
        <td>${dateStr} ${timeStr}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th></th>
            <th>Type</th>
            <th class="num">Rows</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function refreshActivityLog(container) {
  const section = container.querySelector('#activity-log-section');
  if (!section) {
    return;
  }

  const heading = '<h3 class="finance-controls__subheading">Activity Log</h3>';
  section.innerHTML = heading + renderActivityLog();
}

// ── FX Rates & Client Defaults ───────────────────────────────────────────────

const FX_CURRENCIES = [
  { code: 'eur', label: 'EUR' },
  { code: 'usd', label: 'USD' },
  { code: 'gbp', label: 'GBP' },
  { code: 'sgd', label: 'SGD' }
];

function renderFxRates() {
  const rates = get('fxRates') || { aud: 1, eur: 1.61, usd: 1.5, gbp: 2, sgd: 1 };

  const rows = FX_CURRENCIES.map(cur => `
    <tr>
      <td>${cur.label}</td>
      <td class="data-table__cell--editable">
        <input class="form-input" type="number" step="0.0001" min="0"
               data-fx-code="${cur.code}"
               value="${rates[cur.code] || 0}">
      </td>
    </tr>
  `).join('');

  return `
    <h4 class="finance-controls__label">Exchange Rates (to AUD)</h4>
    <p class="finance-controls__description">AUD is always 1.00. Rates are multipliers: amount × rate = AUD value.</p>
    <div class="data-table-wrap">
      <table class="data-table">
        <thead><tr><th>Currency</th><th class="num">Rate</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderClientDefaults() {
  const data = get('clientDefaults') || { defaults: { iePct: 0.70, refPct: 0, avgPay: 30 }, clients: [] };
  const clients = data.clients || [];

  if (clients.length === 0) {
    return `
      <h4 class="finance-controls__label">Client Reference Data</h4>
      <p class="finance-controls__placeholder">No client data loaded. Import data or check seed files.</p>
    `;
  }

  const rows = clients.map((client, idx) => `
    <tr>
      <td>${client.name}</td>
      <td class="data-table__cell--editable num">
        <input class="form-input" type="number" step="0.01" min="0" max="1"
               data-client-idx="${idx}" data-client-field="iePct"
               value="${client.iePct}">
      </td>
      <td class="data-table__cell--editable num">
        <input class="form-input" type="number" step="0.01" min="0" max="1"
               data-client-idx="${idx}" data-client-field="refPct"
               value="${client.refPct}">
      </td>
      <td class="data-table__cell--editable num">
        <input class="form-input" type="number" step="1" min="0"
               data-client-idx="${idx}" data-client-field="avgPay"
               value="${client.avgPay}">
      </td>
    </tr>
  `).join('');

  return `
    <h4 class="finance-controls__label">Client Reference Data</h4>
    <p class="finance-controls__description">
      Default IE fee: ${Math.round(data.defaults.iePct * 100)}% · Default referral: ${Math.round(data.defaults.refPct * 100)}% · Default payment: ${data.defaults.avgPay} days
    </p>
    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Client</th>
            <th class="num">IE Fee %</th>
            <th class="num">Referral %</th>
            <th class="num">Avg Pay (days)</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function bindReferenceData(container) {
  // FX rate inputs
  container.querySelectorAll('[data-fx-code]').forEach(input => {
    input.addEventListener('blur', () => {
      const code = input.dataset.fxCode;
      const value = parseFloat(input.value) || 0;
      const rates = get('fxRates') || {};
      rates[code] = value;
      set('fxRates', rates);
    });
  });

  // Client default inputs
  container.querySelectorAll('[data-client-idx]').forEach(input => {
    input.addEventListener('blur', () => {
      const idx = parseInt(input.dataset.clientIdx, 10);
      const field = input.dataset.clientField;
      const value = parseFloat(input.value) || 0;
      const data = get('clientDefaults') || {};
      if (data.clients && data.clients[idx]) {
        data.clients[idx][field] = value;
        set('clientDefaults', data);
      }
    });
  });
}

// ── Backup & Restore ─────────────────────────────────────────────────────────

function bindBackupRestore(container) {
  const exportBtn = container.querySelector('#btn-export-backup');
  const restoreBtn = container.querySelector('#btn-restore-backup');
  const confirmBtn = container.querySelector('#btn-restore-confirm');
  const cancelBtn = container.querySelector('#btn-restore-cancel');
  const confirmRow = container.querySelector('#restore-confirm');

  let confirmTimeout = null;

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = getAll();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const date = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wwri-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (restoreBtn && confirmRow) {
    restoreBtn.addEventListener('click', () => {
      const fileInput = container.querySelector('#restore-file');
      if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        return;
      }

      // Show inline confirmation
      restoreBtn.hidden = true;
      confirmRow.hidden = false;

      // Auto-cancel after 5 seconds
      confirmTimeout = setTimeout(() => {
        cancelRestore();
      }, 5000);
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      clearTimeout(confirmTimeout);
      const fileInput = container.querySelector('#restore-file');
      if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        cancelRestore();
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          for (const [key, value] of Object.entries(data)) {
            if (value !== null) {
              set(key, value);
            }
          }
          addFeedbackBanner(container, true, 'Backup Restore', 'All data restored successfully');
          logImport('restore', true, Object.keys(data).length);
          refreshActivityLog(container);
        } catch {
          addFeedbackBanner(container, false, 'Backup Restore', 'Invalid JSON file — could not parse backup');
        }
        cancelRestore();
      };
      reader.readAsText(fileInput.files[0]);
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      clearTimeout(confirmTimeout);
      cancelRestore();
    });
  }

  function cancelRestore() {
    const restoreBtnEl = container.querySelector('#btn-restore-backup');
    const confirmRowEl = container.querySelector('#restore-confirm');
    if (restoreBtnEl) {
      restoreBtnEl.hidden = false;
    }
    if (confirmRowEl) {
      confirmRowEl.hidden = true;
    }
  }
}

export { render };
