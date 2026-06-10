/**
 * leads.js — Leads Pipeline tab
 * Activity status, IE matrix, category breakdown.
 */

import { get } from '../shared/store.js';

const STAGE_LABELS = { '0.1': '0.1 Shortlist', '0.2': '0.2 Soft Engagement', '0.3': '0.3 Engaged' };
const STAGE_CLASSES = { '0.1': 'shortlist', '0.2': 'soft', '0.3': 'engaged' };

function render(container) {
  const leads = get('leads') || [];

  if (leads.length === 0) {
    container.innerHTML = '<div><h2>Leads Pipeline</h2><p style="color:var(--color-text-muted);font-style:italic">No leads data imported. Go to Controls to import HubSpot leads.</p></div>';
    return;
  }

  container.innerHTML = `
    <div>
      <h2 style="font-size:var(--font-size-xl);font-weight:var(--font-weight-semibold);margin-bottom:var(--space-6)">Leads Pipeline (${leads.length})</h2>
      ${renderStageSummary(leads)}
      ${renderIEMatrix(leads)}
      ${renderCategoryBreakdown(leads)}
      ${renderLeadsTable(leads)}
    </div>
  `;
}

function renderStageSummary(leads) {
  const stages = ['0.1', '0.2', '0.3'];
  const rows = stages.map(s => {
    const inStage = leads.filter(l => l.stage === s);
    const active = inStage.filter(l => l.lastAct);
    const avgDays = inStage.length > 0 ? Math.round(inStage.reduce((sum, l) => sum + (l.days || 0), 0) / inStage.length) : 0;
    return `<tr><td><span class="status-badge status-badge--${STAGE_CLASSES[s]}">${STAGE_LABELS[s]}</span></td><td class="num">${inStage.length}</td><td class="num">${active.length}</td><td class="num">${avgDays} days</td></tr>`;
  }).join('');
  return `<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin-bottom:var(--space-4)">Stage Summary</h3>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Stage</th><th class="num">Count</th><th class="num">Active</th><th class="num">Avg Days</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderIEMatrix(leads) {
  const owners = {};
  for (const l of leads) {
    const owner = l.owner || 'Unassigned';
    if (!owners[owner]) { owners[owner] = { '0.1': 0, '0.2': 0, '0.3': 0, total: 0 }; }
    owners[owner][l.stage] = (owners[owner][l.stage] || 0) + 1;
    owners[owner].total++;
  }
  const rows = Object.entries(owners).sort((a, b) => b[1].total - a[1].total)
    .map(([owner, counts]) => `<tr><td>${owner}</td><td class="num">${counts['0.1']}</td><td class="num">${counts['0.2']}</td><td class="num">${counts['0.3']}</td><td class="num">${counts.total}</td></tr>`).join('');
  return `<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:var(--space-6) 0 var(--space-4)">IE Lead Matrix</h3>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>IE Lead</th><th class="num">0.1</th><th class="num">0.2</th><th class="num">0.3</th><th class="num">Total</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderCategoryBreakdown(leads) {
  const cats = {};
  for (const l of leads) {
    const cat = l.cat || 'Uncategorised';
    cats[cat] = (cats[cat] || 0) + 1;
  }
  const rows = Object.entries(cats).sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => `<tr><td>${cat}</td><td class="num">${count}</td></tr>`).join('');
  return `<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:var(--space-6) 0 var(--space-4)">Category Breakdown</h3>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Category</th><th class="num">Count</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderLeadsTable(leads) {
  const rows = leads.map(l => {
    const cls = STAGE_CLASSES[l.stage] || '';
    const active = l.lastAct ? '✓' : '';
    return `<tr><td>${l.first} ${l.last}</td><td>${l.co}</td><td><span class="status-badge status-badge--${cls}">${l.stage}</span></td><td>${l.owner}</td><td>${l.cat}</td><td class="num">${l.days !== null ? l.days : '—'}</td><td>${active}</td></tr>`;
  }).join('');
  return `<h3 style="font-size:var(--font-size-lg);font-weight:var(--font-weight-semibold);margin:var(--space-6) 0 var(--space-4)">All Leads</h3>
    <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Company</th><th>Stage</th><th>Owner</th><th>Category</th><th class="num">Days</th><th>Active</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export { render };
