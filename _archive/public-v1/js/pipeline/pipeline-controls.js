/**
 * pipeline-controls.js — Pipeline Report Controls tab
 *
 * HubSpot import areas for deals, leads, and rolling totals.
 * Reuses feedback banner and logging patterns from finance-controls.
 */

import { get, set, getAll } from '../shared/store.js';
import { parseFullPipeline, parseActiveUpdate, parseLeads, parseRollingTotals } from './hubspot-parsers.js';

const IMPORT_TYPES = [
  { id: 'full-pipeline',   label: 'Full Pipeline (Replace)',    placeholder: 'Paste full HubSpot pipeline TSV here' },
  { id: 'active-update',   label: 'Active Deals (Update)',      placeholder: 'Paste active deals TSV here — merges with existing' },
  { id: 'rolling-totals',  label: 'Rolling Monthly Totals',     placeholder: 'Paste rolling monthly totals CSV here' },
  { id: 'leads-contacts',  label: 'Leads / Contacts',           placeholder: 'Paste HubSpot leads CSV here' }
];

const DISPLAY_NAMES = {
  'full-pipeline': 'Full Pipeline',
  'active-update': 'Active Deals Update',
  'rolling-totals': 'Rolling Monthly Totals',
  'leads-contacts': 'Leads / Contacts'
};

function render(container) {
  container.innerHTML = `
    <div class="pipeline-controls">
      <h2 class="pipeline-controls__heading">Pipeline Controls</h2>

      <div id="pipeline-feedback-area"></div>

      <section class="pipeline-controls__section">
        <h3 class="pipeline-controls__subheading">Data Import</h3>
        <p class="pipeline-controls__description">Paste HubSpot exports below.</p>
        ${IMPORT_TYPES.map(t => `
          <div class="import-area">
            <label class="form-label" for="pipeline-import-${t.id}">${t.label}</label>
            <textarea class="form-textarea" id="pipeline-import-${t.id}" placeholder="${t.placeholder}"></textarea>
            <button class="btn btn--primary" type="button" data-pipeline-import="${t.id}">Import</button>
          </div>
        `).join('')}
      </section>

      <section class="pipeline-controls__section">
        <h3 class="pipeline-controls__subheading">Baseline</h3>
        <button class="btn btn--ghost" type="button" id="btn-save-baseline">Save Current Pipeline as Baseline</button>
      </section>

      <section class="pipeline-controls__section" id="pipeline-log-section">
        <h3 class="pipeline-controls__subheading">Activity Log</h3>
        ${renderLog()}
      </section>
    </div>
  `;

  bindImports(container);
  bindBaseline(container);
}

function bindImports(container) {
  container.querySelectorAll('[data-pipeline-import]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.pipelineImport;
      const textarea = container.querySelector(`#pipeline-import-${type}`);
      if (!textarea || !textarea.value.trim()) {
        return;
      }
      handleImport(type, textarea, container);
    });
  });
}

function handleImport(type, textarea, container) {
  const text = textarea.value;
  const displayName = DISPLAY_NAMES[type] || type;
  let result;

  if (type === 'full-pipeline') {
    result = parseFullPipeline(text);
    if (result.ok) {
      set('deals', result.data);
      // Auto-snapshot
      captureSnapshot();
      addBanner(container, true, displayName, `${result.count} deals imported`);
      logImport(type, true, result.count);
    }
  } else if (type === 'active-update') {
    const existing = get('deals') || {};
    result = parseActiveUpdate(text, existing);
    if (result.ok) {
      set('deals', result.data);
      const msg = `${result.added} added, ${result.updated} updated, ${result.stale.length} stale`;
      addBanner(container, true, displayName, msg);
      logImport(type, true, result.added + result.updated);
      if (result.stale.length > 0) {
        addBanner(container, false, 'Stale Deals', `${result.stale.length} active deals not in update — review in Pipeline tab`);
      }
    }
  } else if (type === 'rolling-totals') {
    const existing = get('snapshots') || [];
    result = parseRollingTotals(text, existing);
    if (result.ok) {
      set('snapshots', result.data);
      addBanner(container, true, displayName, `${result.count} months imported`);
      logImport(type, true, result.count);
    }
  } else if (type === 'leads-contacts') {
    result = parseLeads(text);
    if (result.ok) {
      set('leads', result.data);
      addBanner(container, true, displayName, `${result.count} leads imported`);
      logImport(type, true, result.count);
    }
  }

  if (!result) {
    return;
  }

  if (!result.ok) {
    addBanner(container, false, displayName, result.error);
    logImport(type, false, 0);
  } else {
    textarea.value = '';
  }

  refreshLog(container);
}

function captureSnapshot() {
  const deals = get('deals') || {};
  const active = Object.values(deals).filter(d => d.sk);
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const label = `${months[now.getMonth()]}-${String(now.getFullYear()).slice(-2)}`;

  const m34 = active.filter(d => d.sk === 'M3' || d.sk === 'M4').reduce((s, d) => s + d.amt, 0);
  const m12 = active.filter(d => d.sk === 'M1' || d.sk === 'M1.5' || d.sk === 'M2' || d.sk === 'M2.5').reduce((s, d) => s + d.amt, 0);
  const total = active.reduce((s, d) => s + d.amt, 0);

  const snaps = get('snapshots') || [];
  const existing = snaps.findIndex(s => s.key === key);
  const snap = { key, label, active: total, m34, m12 };

  if (existing >= 0) {
    snaps[existing] = snap;
  } else {
    snaps.push(snap);
  }

  set('snapshots', snaps.slice(-24));
}

function bindBaseline(container) {
  const btn = container.querySelector('#btn-save-baseline');
  if (btn) {
    btn.addEventListener('click', () => {
      const deals = get('deals') || {};
      set('baselines', { savedAt: new Date().toISOString(), data: deals });
      addBanner(container, true, 'Baseline', 'Current pipeline saved as baseline');
    });
  }
}

// ── Feedback & Logging ───────────────────────────────────────────────────────

function addBanner(container, success, name, message) {
  const area = container.querySelector('#pipeline-feedback-area');
  if (!area) {
    return;
  }
  const variant = success ? 'import-feedback--success' : 'import-feedback--error';
  const icon = success ? '✓' : '⚠';
  const banner = document.createElement('div');
  banner.className = `import-feedback ${variant}`;
  banner.innerHTML = `
    <span class="import-feedback__icon">${icon}</span>
    <span class="import-feedback__text">${name} — ${message}</span>
    <span class="import-feedback__meta">just now</span>
  `;
  area.insertBefore(banner, area.firstChild);
}

function logImport(type, success, count) {
  const log = get('importLog') || [];
  log.push({ type, timestamp: new Date().toISOString(), rowCount: count, success });
  set('importLog', log);
}

function renderLog() {
  const log = (get('importLog') || []).filter(e =>
    ['full-pipeline', 'active-update', 'rolling-totals', 'leads-contacts', 'seed', 'merge', 'rolling'].includes(e.type)
  );
  if (log.length === 0) {
    return '<p class="pipeline-controls__placeholder">No pipeline imports recorded yet.</p>';
  }
  const rows = [...log].reverse().map(e => {
    const name = DISPLAY_NAMES[e.type] || e.type;
    const d = new Date(e.timestamp);
    const date = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    const icon = e.success ? '✓' : '✗';
    const cls = e.success ? 'num--positive' : 'num--negative';
    return `<tr><td class="${cls}">${icon}</td><td>${name}</td><td class="num">${e.rowCount}</td><td>${date} ${time}</td></tr>`;
  }).join('');
  return `<table class="data-table"><thead><tr><th></th><th>Type</th><th class="num">Count</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function refreshLog(container) {
  const section = container.querySelector('#pipeline-log-section');
  if (section) {
    section.innerHTML = '<h3 class="pipeline-controls__subheading">Activity Log</h3>' + renderLog();
  }
}

export { render };
