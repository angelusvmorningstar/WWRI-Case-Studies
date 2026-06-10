/**
 * revenue-pipeline.js — Revenue Pipeline tab
 *
 * Projects are the top-level entity. Each project has one or more phases.
 * Invoice installments (Start / Middle / End) are derived from phase parameters
 * and never stored separately.
 *
 * Store key: ww_projects
 * Schema: [{
 *   id, client, entity,
 *   iePct,       // decimal — 0.70 = 70%
 *   refPct,      // decimal — 0.10 = 10%
 *   phases: [{
 *     id, name, status, currency,
 *     split,       // 'single' | '5050' | '303040' | '252550' | 'custom'
 *     customSplit, // [number, number, number] — pcts summing to 100, only when split==='custom'
 *     total,       // number (in phase currency)
 *     startDate,   // 'YYYY-MM-DD'
 *     weeks,       // number
 *     avgPay,      // days
 *     paid,        // boolean[] — one per installment; true = payment received
 *   }]
 * }]
 */

import { get, set } from '../shared/store.js';
import { formatCurrency, formatMonthYear } from '../shared/format.js';
import { convertToAUD } from '../shared/fx.js';

const STATUS_LABELS  = { 1: 'Contracted', 2: 'Certain', 3: 'Uncertain' };
const STATUS_CLASSES = { 1: 'contracted', 2: 'certain', 3: 'uncertain' };
const CURRENCIES     = ['AUD', 'EUR', 'USD', 'GBP', 'SGD'];

// ── Store helpers ─────────────────────────────────────────────────────────────

function getProjects()          { return get('projects') || []; }
function saveProjects(projects) { set('projects', projects); }
function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

// ── Installment derivation ────────────────────────────────────────────────────

function deriveInstallments(phase) {
  const { split, total, startDate, weeks, avgPay, customSplit } = phase;
  const DAY_MS  = 24 * 60 * 60 * 1000;
  const startMs = new Date(startDate).getTime();
  const endMs   = startMs + (weeks || 0) * 7 * DAY_MS;
  const midMs   = Math.round((startMs + endMs) / 2);
  const payMs   = (avgPay || 30) * DAY_MS;
  const due     = ms => new Date(ms + payMs).toISOString().slice(0, 10);

  if (split === '5050') {
    const a = Math.round(total / 2);
    return [
      { label: 'Start', amount: a,         due: due(startMs) },
      { label: 'End',   amount: total - a, due: due(endMs)   },
    ];
  }
  if (split === 'single') {
    return [{ label: '', amount: total, due: due(startMs) }];
  }
  if (split === '252550') {
    const a = Math.round(total * 0.25);
    const b = Math.round(total * 0.25);
    return [
      { label: 'Start',  amount: a,             due: due(startMs) },
      { label: 'Middle', amount: b,             due: due(midMs)   },
      { label: 'End',    amount: total - a - b, due: due(endMs)   },
    ];
  }
  if (split === 'custom') {
    const [pA = 33, pB = 33] = customSplit || [];
    const a = Math.round(total * pA / 100);
    const b = Math.round(total * pB / 100);
    return [
      { label: 'Start',  amount: a,             due: due(startMs) },
      { label: 'Middle', amount: b,             due: due(midMs)   },
      { label: 'End',    amount: total - a - b, due: due(endMs)   },
    ];
  }
  // 30 / 30 / 40 (default)
  const a = Math.round(total * 0.30);
  const b = Math.round(total * 0.30);
  return [
    { label: 'Start',  amount: a,             due: due(startMs) },
    { label: 'Middle', amount: b,             due: due(midMs)   },
    { label: 'End',    amount: total - a - b, due: due(endMs)   },
  ];
}

// Unpaid overdue installments roll forward to today + 7 days.
// Returns { date: 'YYYY-MM-DD', overdue: boolean }
function effectiveDue(dueStr, paid) {
  if (paid || !dueStr) return { date: dueStr, overdue: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueStr);
  if (!isNaN(due) && due < today) {
    const rolled = new Date(today);
    rolled.setDate(rolled.getDate() + 7);
    return { date: rolled.toISOString().slice(0, 10), overdue: true };
  }
  return { date: dueStr, overdue: false };
}

// ── Render ────────────────────────────────────────────────────────────────────

function render(container) {
  const projects = getProjects();

  container.innerHTML = `
    <div class="revenue-pipeline">
      <div class="revenue-pipeline__topbar">
        <h2 class="revenue-pipeline__heading">Revenue Pipeline</h2>
        <button class="btn btn--primary" type="button" id="btn-add-project">+ Add Project</button>
      </div>

      <div class="project-panel" id="project-panel" hidden></div>

      ${projects.length === 0 ? `
        <p class="revenue-pipeline__empty">No projects yet. Click "+ Add Project" to get started.</p>
      ` : `
        <div class="data-table-wrap">
          <table class="data-table" id="revenue-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Phase</th>
                <th>Status</th>
                <th>Entity</th>
                <th class="num">Amount</th>
                <th>Currency</th>
                <th class="num">AUD Value</th>
                <th class="num">IE Fee</th>
                <th class="num">Ref Fee</th>
                <th class="num">WWRI Margin</th>
                <th>Due</th>
                <th class="rev-paid-cell">Paid</th>
                <th class="rev-action-cell"></th>
              </tr>
            </thead>
            <tbody>
              ${projects.map(p => renderProjectRows(p)).join('')}
            </tbody>
            <tfoot class="data-table__footer">
              ${renderTotals(projects)}
            </tfoot>
          </table>
        </div>
        <div class="revenue-pipeline__section">
          <h3 class="revenue-pipeline__subheading">Monthly Revenue Projections</h3>
          ${renderProjectionTable(projects)}
        </div>
      `}
    </div>
  `;

  bind(container);
}

// ── Table rendering ───────────────────────────────────────────────────────────

function renderProjectRows(project) {
  const { id, client, entity, iePct, refPct, phases } = project;
  const iePctDisp  = Math.round((iePct  || 0) * 100);
  const refPctDisp = Math.round((refPct || 0) * 100);
  const refStr     = refPctDisp > 0 ? ` · Ref ${refPctDisp}%` : '';

  let html = `
    <tr class="rev-project-row">
      <td class="rev-project-cell" colspan="12">
        <span class="rev-project-name">${escHtml(client || '(no client)')}</span>
        <span class="rev-project-meta">${escHtml(entity || '')} · IE ${iePctDisp}%${refStr}</span>
      </td>
      <td class="rev-action-cell rev-project-actions">
        <button class="btn btn--ghost btn--sm btn-edit-project" type="button"
                data-project-id="${id}">Edit</button>
        <button class="btn-delete-project" type="button"
                data-project-id="${id}" title="Delete project">✕</button>
      </td>
    </tr>
  `;

  for (const phase of (phases || [])) {
    const installments = deriveInstallments(phase);
    for (let i = 0; i < installments.length; i++) {
      const paid = (phase.paid || [])[i] === true;
      html += renderInstallmentRow(project, phase, installments[i], i, paid);
    }
  }

  return html;
}

function renderInstallmentRow(project, phase, inst, instIdx, paid) {
  const { id: projectId, entity, iePct = 0, refPct = 0 } = project;
  const { id: phaseId, currency = 'AUD', status, name } = phase;
  const { label, amount } = inst;

  const { date: dueDate, overdue } = effectiveDue(inst.due, paid);

  const audValue   = convertToAUD(amount || 0, currency);
  const ieFee      = audValue * iePct;
  const refFee     = audValue * refPct;
  const margin     = audValue - ieFee - refFee;
  const statusCls  = STATUS_CLASSES[status] || '';
  const phaseLabel = label ? `${escHtml(name)} – ${label}` : escHtml(name);
  const rowCls     = paid ? 'rev-phase-row rev-phase-row--paid' : 'rev-phase-row';

  return `
    <tr class="${rowCls}">
      <td class="rev-phase-indent"></td>
      <td>${phaseLabel}</td>
      <td><span class="status-badge status-badge--${statusCls}">${STATUS_LABELS[status] || '—'}</span></td>
      <td>${escHtml(entity || '')}</td>
      <td class="num">${formatCurrency(amount)}</td>
      <td>${currency}</td>
      <td class="num">${formatCurrency(audValue)}</td>
      <td class="num">${formatCurrency(ieFee)}</td>
      <td class="num">${formatCurrency(refFee)}</td>
      <td class="num ${margin < 0 ? 'num--negative' : ''}">${formatCurrency(margin)}</td>
      <td class="${overdue ? 'rev-due--overdue' : ''}">${dueDate || ''}</td>
      <td class="rev-paid-cell">
        <input type="checkbox" class="paid-checkbox"
               data-project-id="${escHtml(projectId)}"
               data-phase-id="${escHtml(phaseId)}"
               data-inst-idx="${instIdx}"
               ${paid ? 'checked' : ''}>
      </td>
      <td></td>
    </tr>
  `;
}

function renderTotals(projects) {
  let totalAUD = 0, totalIE = 0, totalRef = 0, totalMargin = 0;

  for (const project of projects) {
    const iePct  = project.iePct  || 0;
    const refPct = project.refPct || 0;
    for (const phase of (project.phases || [])) {
      for (const inst of deriveInstallments(phase)) {
        const aud = convertToAUD(inst.amount || 0, phase.currency || 'AUD');
        const ie  = aud * iePct;
        const ref = aud * refPct;
        totalAUD    += aud;
        totalIE     += ie;
        totalRef    += ref;
        totalMargin += aud - ie - ref;
      }
    }
  }

  return `
    <tr>
      <td colspan="6">Total</td>
      <td class="num">${formatCurrency(totalAUD)}</td>
      <td class="num">${formatCurrency(totalIE)}</td>
      <td class="num">${formatCurrency(totalRef)}</td>
      <td class="num ${totalMargin < 0 ? 'num--negative' : ''}">${formatCurrency(totalMargin)}</td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  `;
}

// ── Project panel ─────────────────────────────────────────────────────────────

function renderProjectPanel(project) {
  const p      = project || { client: '', entity: 'AU', iePct: 0.70, refPct: 0, phases: [] };
  const isEdit = !!project;
  const iePctDisp  = Math.round((p.iePct  || 0) * 100);
  const refPctDisp = Math.round((p.refPct || 0) * 100);
  const clients    = getKnownClients();
  const initPhases = p.phases.length > 0 ? p.phases : [defaultPhase()];

  return `
    <div class="project-panel__inner">
      <h3 class="project-panel__heading">${isEdit ? 'Edit Project' : 'New Project'}</h3>

      <div class="project-form">
        <div class="project-form__row">
          <div class="project-form__field project-form__field--lg">
            <label class="form-label" for="proj-client">Client</label>
            <input class="form-input" type="text" id="proj-client"
                   list="proj-client-list" autocomplete="off"
                   value="${escHtml(p.client || '')}">
            <datalist id="proj-client-list">
              ${clients.map(c => `<option value="${escHtml(c)}">`).join('')}
            </datalist>
          </div>
          <div class="project-form__field">
            <label class="form-label" for="proj-entity">Entity</label>
            <select class="form-input" id="proj-entity">
              <option value="AU" ${p.entity === 'AU' ? 'selected' : ''}>AU</option>
              <option value="EU" ${p.entity === 'EU' ? 'selected' : ''}>EU</option>
              <option value="US" ${p.entity === 'US' ? 'selected' : ''}>US</option>
            </select>
          </div>
          <div class="project-form__field">
            <label class="form-label" for="proj-iepct">IE fee %</label>
            <input class="form-input" type="number" id="proj-iepct"
                   min="0" max="100" step="1" value="${iePctDisp}">
          </div>
          <div class="project-form__field">
            <label class="form-label" for="proj-refpct">Referral %</label>
            <input class="form-input" type="number" id="proj-refpct"
                   min="0" max="100" step="1" value="${refPctDisp}">
          </div>
        </div>

        <div class="project-form__phases-label">Phases</div>
        <div class="project-form__phases" id="phases-list">
          ${initPhases.map((ph, i) => renderPhaseEntry(ph, i)).join('')}
        </div>

        <button class="btn btn--ghost btn--sm" type="button" id="btn-add-phase-entry">+ Add Phase</button>
      </div>

      <div class="project-panel__actions">
        <button class="btn btn--primary" type="button" id="btn-save-project">
          ${isEdit ? 'Save Changes' : 'Add to Pipeline'}
        </button>
        <button class="btn btn--ghost" type="button" id="btn-cancel-project">Cancel</button>
        <span class="project-panel__error" id="project-error"></span>
      </div>
    </div>
  `;
}

function defaultPhase() {
  return {
    id: uid(), name: 'Phase 1', status: 2, currency: 'AUD',
    split: '303040', total: '', startDate: '', weeks: '', avgPay: 30,
    paid: [],
  };
}

function renderPhaseEntry(phase, idx) {
  const splits = [
    { value: 'single',  label: 'Single invoice' },
    { value: '5050',    label: '50 / 50'         },
    { value: '303040',  label: '30 / 30 / 40'    },
    { value: '252550',  label: '25 / 25 / 50'    },
    { value: 'custom',  label: 'Custom'           },
  ];
  const cs = phase.customSplit || [33, 33, 34];

  return `
    <div class="phase-entry" data-phase-idx="${idx}" data-phase-id="${phase.id || ''}">
      <div class="phase-entry__header">
        <span class="phase-entry__number">Phase ${idx + 1}</span>
        <button class="btn-remove-phase" type="button" title="Remove phase">✕</button>
      </div>
      <div class="project-form__row">
        <div class="project-form__field project-form__field--lg">
          <label class="form-label">Name</label>
          <input class="form-input phase-name" type="text"
                 value="${escHtml(phase.name || `Phase ${idx + 1}`)}" placeholder="Phase name">
        </div>
        <div class="project-form__field">
          <label class="form-label">Status</label>
          <select class="form-input phase-status">
            <option value="1" ${phase.status === 1 ? 'selected' : ''}>Contracted</option>
            <option value="2" ${phase.status === 2 ? 'selected' : ''}>Certain</option>
            <option value="3" ${phase.status === 3 ? 'selected' : ''}>Uncertain</option>
          </select>
        </div>
        <div class="project-form__field">
          <label class="form-label">Currency</label>
          <select class="form-input phase-currency">
            ${CURRENCIES.map(c => `<option value="${c}" ${(phase.currency || 'AUD') === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="project-form__field project-form__field--lg">
          <label class="form-label">Total value</label>
          <input class="form-input phase-total" type="number" min="0" step="0.01"
                 value="${phase.total || ''}" placeholder="0.00">
        </div>
        <div class="project-form__field">
          <label class="form-label">Split</label>
          <select class="form-input phase-split">
            ${splits.map(o => `<option value="${o.value}" ${(phase.split || '303040') === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        </div>
        <div class="project-form__field">
          <label class="form-label">Start date</label>
          <input class="form-input phase-start" type="date" value="${phase.startDate || ''}">
        </div>
        <div class="project-form__field">
          <label class="form-label">Duration (wks)</label>
          <input class="form-input phase-weeks" type="number" min="1" step="1"
                 value="${phase.weeks || ''}" placeholder="e.g. 20">
        </div>
        <div class="project-form__field">
          <label class="form-label">Avg pay (days)</label>
          <input class="form-input phase-avgpay" type="number" min="0" step="1"
                 value="${phase.avgPay != null ? phase.avgPay : 30}">
        </div>
      </div>
      <div class="phase-custom-split" ${phase.split !== 'custom' ? 'hidden' : ''}>
        <div class="project-form__row">
          <div class="project-form__field">
            <label class="form-label">Start %</label>
            <input class="form-input phase-custom-a" type="number" min="0" max="100" step="1" value="${cs[0]}">
          </div>
          <div class="project-form__field">
            <label class="form-label">Mid %</label>
            <input class="form-input phase-custom-b" type="number" min="0" max="100" step="1" value="${cs[1]}">
          </div>
          <div class="project-form__field">
            <label class="form-label">End %</label>
            <input class="form-input phase-custom-c" type="number" min="0" max="100" step="1" value="${cs[2]}">
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Binding ───────────────────────────────────────────────────────────────────

function bind(container) {
  container.querySelector('#btn-add-project')?.addEventListener('click', () => {
    openPanel(container, null);
  });

  container.querySelectorAll('.btn-edit-project').forEach(btn => {
    btn.addEventListener('click', () => {
      const project = getProjects().find(p => p.id === btn.dataset.projectId);
      if (project) openPanel(container, project);
    });
  });

  container.querySelectorAll('.btn-delete-project').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = btn.dataset.projectId;
      if (!confirm('Delete this project and all its phases?')) return;
      saveProjects(getProjects().filter(p => p.id !== pid));
      render(container);
    });
  });

  container.querySelectorAll('.paid-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const { projectId, phaseId, instIdx } = cb.dataset;
      const projects = getProjects();
      const project  = projects.find(p => p.id === projectId);
      if (!project) return;
      const phase = (project.phases || []).find(ph => ph.id === phaseId);
      if (!phase) return;
      if (!phase.paid) phase.paid = [];
      phase.paid[parseInt(instIdx, 10)] = cb.checked;
      saveProjects(projects);
      render(container);
    });
  });
}

function openPanel(container, project) {
  const panel = container.querySelector('#project-panel');
  panel.innerHTML = renderProjectPanel(project);
  panel.dataset.editId = project ? project.id : '';
  panel.hidden = false;
  bindPanel(container, panel);
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function bindPanel(container, panel) {
  const errorEl = panel.querySelector('#project-error');

  panel.querySelector('#btn-cancel-project').addEventListener('click', () => {
    panel.hidden = true;
    panel.innerHTML = '';
  });

  panel.querySelector('#btn-add-phase-entry').addEventListener('click', () => {
    const list = panel.querySelector('#phases-list');
    const idx  = list.querySelectorAll('.phase-entry').length;
    const ph   = { ...defaultPhase(), name: `Phase ${idx + 1}` };
    const el   = document.createElement('div');
    el.innerHTML = renderPhaseEntry(ph, idx);
    list.appendChild(el.firstElementChild);
    bindRemovePhaseButtons(panel);
  });

  bindRemovePhaseButtons(panel);

  // Custom split toggle — event delegation covers current and future phase entries
  panel.addEventListener('change', e => {
    if (e.target.classList.contains('phase-split')) {
      const phaseEntry = e.target.closest('.phase-entry');
      const customDiv  = phaseEntry?.querySelector('.phase-custom-split');
      if (customDiv) customDiv.hidden = e.target.value !== 'custom';
    }
  });

  panel.querySelector('#proj-client')?.addEventListener('change', e => {
    const avgPay = getClientAvgPay(e.target.value);
    panel.querySelectorAll('.phase-avgpay').forEach(inp => {
      if (!inp.value || inp.value === '30') inp.value = avgPay;
    });
  });

  panel.querySelector('#btn-save-project').addEventListener('click', () => {
    saveProject(container, panel, errorEl);
  });
}

function bindRemovePhaseButtons(panel) {
  panel.querySelectorAll('.btn-remove-phase').forEach(btn => {
    btn.onclick = () => {
      const list = btn.closest('#phases-list');
      btn.closest('.phase-entry').remove();
      renumberPhases(list);
    };
  });
}

function renumberPhases(list) {
  list.querySelectorAll('.phase-entry').forEach((entry, i) => {
    entry.dataset.phaseIdx = i;
    const num = entry.querySelector('.phase-entry__number');
    if (num) num.textContent = `Phase ${i + 1}`;
  });
}

function saveProject(container, panel, errorEl) {
  const client = panel.querySelector('#proj-client').value.trim();
  const entity = panel.querySelector('#proj-entity').value;
  const iePct  = (parseFloat(panel.querySelector('#proj-iepct').value) || 0) / 100;
  const refPct = (parseFloat(panel.querySelector('#proj-refpct').value) || 0) / 100;

  if (!client) { showError(errorEl, 'Client is required'); return; }

  const phaseEntries = panel.querySelectorAll('.phase-entry');
  if (phaseEntries.length === 0) { showError(errorEl, 'At least one phase is required'); return; }

  // Build a flat lookup of existing phases to preserve paid state across edits
  const existingPhases = getProjects().flatMap(p => p.phases || []);

  const phases = [];
  for (const entry of phaseEntries) {
    const name      = entry.querySelector('.phase-name').value.trim();
    const status    = parseInt(entry.querySelector('.phase-status').value);
    const currency  = entry.querySelector('.phase-currency').value;
    const total     = parseFloat(entry.querySelector('.phase-total').value) || 0;
    const split     = entry.querySelector('.phase-split').value;
    const startDate = entry.querySelector('.phase-start').value;
    const weeks     = parseFloat(entry.querySelector('.phase-weeks').value) || 0;
    const avgPay    = parseInt(entry.querySelector('.phase-avgpay').value) || 30;
    const label     = name || `Phase ${phases.length + 1}`;

    let customSplit = null;
    if (split === 'custom') {
      const a = parseInt(entry.querySelector('.phase-custom-a')?.value) || 0;
      const b = parseInt(entry.querySelector('.phase-custom-b')?.value) || 0;
      const c = parseInt(entry.querySelector('.phase-custom-c')?.value) || 0;
      if (a + b + c !== 100) {
        showError(errorEl, `"${label}": custom split must sum to 100% (got ${a + b + c}%)`);
        return;
      }
      customSplit = [a, b, c];
    }

    if (!total)                             { showError(errorEl, `"${label}": total value required`);  return; }
    if (!startDate)                         { showError(errorEl, `"${label}": start date required`);   return; }
    if (!weeks && split !== 'single')       { showError(errorEl, `"${label}": duration required`);     return; }

    const existing = existingPhases.find(ph => ph.id === entry.dataset.phaseId);

    phases.push({
      id:          entry.dataset.phaseId || uid(),
      name:        label,
      status, currency, split, customSplit, total, startDate, weeks, avgPay,
      paid:        existing?.paid || [],
    });
  }

  const projects = getProjects();
  const editId   = panel.dataset.editId;

  if (editId) {
    const idx = projects.findIndex(p => p.id === editId);
    if (idx >= 0) projects[idx] = { ...projects[idx], client, entity, iePct, refPct, phases };
  } else {
    projects.push({ id: uid(), client, entity, iePct, refPct, phases });
  }

  saveProjects(projects);
  panel.hidden = true;
  panel.innerHTML = '';
  render(container);
}

function showError(el, msg) {
  if (el) el.textContent = msg;
}

// ── Client helpers ────────────────────────────────────────────────────────────

function getKnownClients() {
  const projects = getProjects();
  const defaults = get('clientDefaults') || { clients: [] };
  const fromProj = projects.map(p => p.client).filter(Boolean);
  const fromDef  = (defaults.clients || []).map(c => c.name).filter(Boolean);
  return [...new Set([...fromProj, ...fromDef])].sort();
}

function getClientAvgPay(clientName) {
  const defaults = get('clientDefaults') || { defaults: { avgPay: 30 }, clients: [] };
  const name     = (clientName || '').toLowerCase();
  const match    = (defaults.clients || []).find(c =>
    c.name && name.includes(c.name.toLowerCase().slice(0, 8))
  );
  return (match || defaults.defaults || {}).avgPay || 30;
}

// ── Monthly projections ───────────────────────────────────────────────────────

function generateMonthColumns() {
  const now  = new Date();
  const cols = [];
  for (let i = 0; i < 9; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    cols.push({ label: formatMonthYear(d.toISOString().slice(0, 10)), year: d.getFullYear(), month: d.getMonth() });
  }
  return cols;
}

function renderProjectionTable(projects) {
  const months   = generateMonthColumns();
  const allLines = [];

  for (const project of projects) {
    const iePct  = project.iePct  || 0;
    const refPct = project.refPct || 0;
    for (const phase of (project.phases || [])) {
      const installments = deriveInstallments(phase);
      for (let i = 0; i < installments.length; i++) {
        const paid = (phase.paid || [])[i] === true;
        if (paid) continue; // already received — exclude from forward projections
        const { date: due } = effectiveDue(installments[i].due, false);
        allLines.push({
          client:   project.client,
          status:   phase.status,
          currency: phase.currency || 'AUD',
          amount:   installments[i].amount,
          due,
          iePct, refPct,
        });
      }
    }
  }

  if (allLines.length === 0) return '';

  const rows = allLines.map(line => {
    const aud      = convertToAUD(line.amount || 0, line.currency);
    const margin   = aud - aud * line.iePct - aud * line.refPct;
    const dueDate  = line.due ? new Date(line.due) : null;
    const cells    = months.map(m =>
      dueDate && dueDate.getFullYear() === m.year && dueDate.getMonth() === m.month ? margin : 0
    );
    return { client: line.client || '', status: STATUS_LABELS[line.status] || '', cells };
  });

  const totals      = months.map((_, i) => rows.reduce((s, r) => s + r.cells[i], 0));
  const headerCells = months.map(m => `<th class="num">${m.label}</th>`).join('');
  const bodyRows    = rows.map(row => {
    const cells = row.cells.map(v =>
      v === 0 ? '<td class="num">—</td>' : `<td class="num">${formatCurrency(v)}</td>`
    ).join('');
    return `<tr><td>${escHtml(row.client)}</td><td>${row.status}</td>${cells}</tr>`;
  }).join('');
  const totalCells  = totals.map(v =>
    `<td class="${v < 0 ? 'num num--negative' : 'num'}">${v === 0 ? '—' : formatCurrency(v)}</td>`
  ).join('');

  return `
    <div class="data-table-wrap">
      <table class="data-table">
        <thead><tr><th>Client</th><th>Status</th>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
        <tfoot class="data-table__footer">
          <tr><td colspan="2">WWRI Margin</td>${totalCells}</tr>
        </tfoot>
      </table>
    </div>
  `;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export { render };
