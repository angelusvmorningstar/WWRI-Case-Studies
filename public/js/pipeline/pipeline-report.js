/**
 * pipeline-report.js — Pipeline Print tab
 * Print layout matching the WWRI pipeline report reference style.
 */

import { get } from '../shared/store.js';
import { triggerPrint } from '../shared/print.js';

// ── Colour palette (mirrors reference monolith) ───────────────────────────────
const TEL  = '#009898';
const TXT  = '#1A1A1A';
const MUT  = '#777773';
const SUB  = '#888884';
const BRD  = '#DDDBD6';
const BG   = '#F5F4F0';

const STAGE_ORDER  = ['M4', 'M3', 'M2.5', 'M2', 'M1.5', 'M1'];
const STAGE_COLORS = {
  M1: '#C0DD97', 'M1.5': '#97C459', M2: '#639922',
  'M2.5': '#3B6D11', M3: '#EF9F27', M4: '#D85A30'
};

let printMode = 'basic';

// ── Render ────────────────────────────────────────────────────────────────────

function render(container) {
  const deals  = Object.values(get('deals') || {});
  const active = deals.filter(d => d.sk);
  const won    = deals.filter(d => d.isWon);
  const snaps  = (get('snapshots') || []).slice(-12);

  const sum    = buildStageSummary(active);
  const tot    = active.reduce((s, d) => s + d.amt, 0);
  const mat    = active.filter(d => d.sk === 'M3' || d.sk === 'M4').reduce((s, d) => s + d.amt, 0);
  const wonTot = won.reduce((s, d) => s + d.amt, 0);

  const advanced    = printMode === 'advanced';
  const reportLabel = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

  container.innerHTML = `
    <div class="pipeline-print-tab">
      <div class="pipeline-print-tab__actions">
        <h2 class="pipeline-print-tab__heading">Pipeline Report — Print Preview</h2>
        <div class="print-mode-toggle" role="group" aria-label="Report mode">
          <button class="print-mode-toggle__btn${printMode === 'basic' ? ' print-mode-toggle__btn--active' : ''}"
                  type="button" data-print-mode="basic">Basic</button>
          <button class="print-mode-toggle__btn${printMode === 'advanced' ? ' print-mode-toggle__btn--active' : ''}"
                  type="button" data-print-mode="advanced">Advanced</button>
        </div>
        <button class="btn btn--primary" type="button" id="btn-print-pipeline">Print Report</button>
      </div>

      <div class="print-page">
        ${renderPage1(active, sum, tot, mat, wonTot, deals, snaps, reportLabel)}
        ${renderPage2(active, tot, reportLabel)}
      </div>

      ${advanced ? renderAdvancedPages(active, deals, sum, tot, snaps, reportLabel) : ''}
    </div>
  `;

  container.querySelector('#btn-print-pipeline').addEventListener('click', () => triggerPrint(`Pipeline Report — ${reportLabel}`));
  container.querySelectorAll('[data-print-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const newMode = btn.dataset.printMode;
      printMode = newMode;
      try {
        render(container);
      } catch (err) {
        console.error('[pipeline-report] render failed:', err);
        return;
      }
      if (newMode === 'advanced') {
        const pages = container.querySelectorAll('.print-page');
        if (pages.length > 1) {
          pages[pages.length - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ── Page 1 ────────────────────────────────────────────────────────────────────

function renderPage1(active, sum, tot, mat, wonTot, deals, snaps, reportLabel) {
  const contracts  = get('contracts') || [];
  const fxRates    = get('fxRates') || { aud: 1, usd: 1.5, eur: 1.61 };
  const usdBase    = fxRates.usd || 1.5;
  function toUSD(amt, ccy) {
    const r = fxRates[(ccy || 'AUD').toLowerCase()];
    return r ? amt * r / usdBase : amt;
  }
  const xeroTotal  = contracts.reduce((s, inv) => s + toUSD(inv.amt, inv.currency), 0);
  const xeroProjects = new Set(contracts.map(inv => inv.client || '(unknown)')).size;
  const WEIGHTS    = { M4: 0.80, M3: 0.60, 'M2.5': 0.45, M2: 0.30, 'M1.5': 0.20, M1: 0.10 };
  const weighted   = active.reduce((s, d) => s + d.amt * (WEIGHTS[d.sk] || 0), 0);
  const fyStart    = new Date('2025-07-01');
  const fyEnd      = new Date('2026-06-30T23:59:59');
  const wonFY      = deals.filter(d => d.isWon && d.close && new Date(d.close) >= fyStart && new Date(d.close) <= fyEnd);
  const wonFYTot   = wonFY.reduce((s, d) => s + d.amt, 0);
  const overdue    = active.filter(d => d.close && new Date(d.close) < new Date());
  const overdueTot = overdue.reduce((s, d) => s + d.amt, 0);
  const kpiCards = [
    { label: 'Active pipeline',  value: fUSD(tot, true),        sub: `${active.length} deals`,           acc: TEL       },
    { label: 'M3–M4 mature',     value: fUSD(mat, true),        sub: `${(sum.M3?.count||0) + (sum.M4?.count||0)} deals`, acc: TEL },
    { label: 'Won — FY25/26',    value: fUSD(wonFYTot, true),   sub: `${wonFY.length} closed deals`,     acc: '#1E8C4A' },
    { label: 'Outstanding (Xero)', value: xeroTotal > 0 ? fUSD(xeroTotal, true) : '—', sub: contracts.length > 0 ? `${xeroProjects} active project${xeroProjects !== 1 ? 's' : ''}` : 'no data imported', acc: SUB }
  ];

  const cardsHtml = kpiCards.map(c => `
    <div style="border-left:3px solid ${c.acc};padding:10px 12px;background:${BG};border-radius:0 4px 4px 0">
      <div style="font-size:9px;color:${MUT};text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">${c.label}</div>
      <div style="font-size:17px;font-weight:700;color:${TXT};margin-bottom:2px">${c.value}</div>
      <div style="font-size:10px;color:${MUT}">${c.sub}</div>
    </div>
  `).join('');

  const hasSnaps = snaps.length >= 2;

  return `
    <!-- Page 1 header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:2px solid ${TEL};margin-bottom:20px">
      <div>
        <div style="font-size:18px;font-weight:700;color:${TXT}">Pipeline Report</div>
        <div style="font-size:11px;color:${MUT};margin-top:3px">Whitewater Reinventions · ${reportLabel}</div>
      </div>
      <div style="text-align:right;font-size:10px;color:${MUT};line-height:1.8">
        Confidential<br>Generated ${reportLabel}
      </div>
    </div>

    <!-- KPI cards -->
    <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:8px">
      ${cardsHtml}
    </div>
    <div style="text-align:right;font-size:8.5px;color:${MUT};margin-bottom:14px">
      Probability-weighted forecast: <strong style="color:${TXT}">${fUSD(weighted, true)}</strong>
      <span style="margin-left:6px;color:${SUB}">(M4=80% · M3=60% · M2.5=45% · M2=30% · M1.5=20% · M1=10%)</span>
    </div>

    <!-- Overdue callout -->
    ${overdue.length > 0 ? `
      <div style="background:#FFF5F5;border-left:3px solid #B83232;padding:8px 12px;margin-bottom:14px;border-radius:0 4px 4px 0;display:flex;justify-content:space-between;align-items:center">
        <div>
          <span style="font-size:9px;font-weight:700;color:#B83232;text-transform:uppercase;letter-spacing:.06em">Attention required</span>
          <span style="font-size:9px;color:#B83232;margin-left:8px">${overdue.length} deal${overdue.length !== 1 ? 's' : ''} past close date — ${fUSD(overdueTot, true)} at risk</span>
        </div>
        <span style="font-size:8px;color:#B83232">${overdue.map(d => esc(d.name)).join(' · ')}</span>
      </div>
    ` : ''}

    <!-- Funnel + Stage table -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
      <div>
        <div style="font-size:11px;font-weight:700;color:${TXT};margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">Current pipeline (USD)</div>
        ${tot > 0 ? svgFunnel(sum, tot) : `<div style="padding:40px;text-align:center;color:${MUT};font-size:13px">No pipeline data.</div>`}
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;color:${TXT};margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">Active projects — outstanding</div>
        ${renderXeroTable(contracts, fxRates, toUSD)}
      </div>
    </div>

    <!-- Rolling chart -->
    ${hasSnaps ? `
      <div style="margin-bottom:20px">
        <div style="font-size:11px;font-weight:700;color:${TXT};margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">12-month rolling pipeline (USD)</div>
        ${svgStackedArea(snaps)}
      </div>
    ` : ''}

    <!-- Page 1 footer -->
    <div style="border-top:0.5px solid ${BRD};padding-top:8px;display:flex;justify-content:space-between;font-size:9px;color:${MUT}">
      <span>Whitewater Reinventions · Pipeline Report · Confidential</span><span>Page 1</span>
    </div>
  `;
}

function renderStageTable(sum, tot) {
  const rows = STAGE_ORDER.map(sk => {
    const s = sum[sk] || { count: 0, total: 0 };
    if (s.count === 0) return '';
    const pct = tot > 0 ? Math.round(s.total / tot * 100) : 0;
    const clr = STAGE_COLORS[sk] || TEL;
    return `
      <tr style="border-bottom:0.5px solid ${BRD}">
        <td style="padding:5px 6px"><span style="color:${clr};font-weight:700;font-size:10px">${sk}</span></td>
        <td style="padding:5px 6px;text-align:right;color:${TXT}">${s.count}</td>
        <td style="padding:5px 6px;text-align:right;font-weight:600">${fUSD(s.total, true)}</td>
        <td style="padding:5px 6px;text-align:right;color:${MUT}">${pct}%</td>
      </tr>
    `;
  }).join('');

  return `
    <table style="width:100%;border-collapse:collapse;font-size:10px">
      <thead>
        <tr style="border-bottom:1px solid ${BRD}">
          <th style="padding:4px 6px;text-align:left;color:${MUT};font-weight:600;font-size:9px;text-transform:uppercase;letter-spacing:.05em">Stage</th>
          <th style="padding:4px 6px;text-align:right;color:${MUT};font-weight:600;font-size:9px;text-transform:uppercase;letter-spacing:.05em">Deals</th>
          <th style="padding:4px 6px;text-align:right;color:${MUT};font-weight:600;font-size:9px;text-transform:uppercase;letter-spacing:.05em">Value (USD)</th>
          <th style="padding:4px 6px;text-align:right;color:${MUT};font-weight:600;font-size:9px;text-transform:uppercase;letter-spacing:.05em">Share</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="border-top:1.5px solid ${BRD}">
          <td colspan="2" style="padding:5px 6px;font-weight:700;font-size:10px">Total active</td>
          <td style="padding:5px 6px;text-align:right;font-weight:700;color:${TEL}">${fUSD(tot, true)}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  `;
}

function renderXeroTable(contracts, fxRates, toUSD) {
  const usdBase = fxRates.usd || 1.5;
  const audUsd  = (1 / usdBase).toFixed(4);
  const eurUsd  = ((fxRates.eur || 1.61) / usdBase).toFixed(4);
  const fxLine  = `<div style="font-size:7.5px;color:${MUT};margin-bottom:8px">Xero · AUD/USD ${audUsd} · EUR/USD ${eurUsd}</div>`;

  if (contracts.length === 0) {
    return `${fxLine}<div style="font-size:9px;color:${MUT};padding:12px 0">No Xero data imported.</div>`;
  }

  const totalUSD = contracts.reduce((s, inv) => s + toUSD(inv.amt, inv.currency), 0);

  // Group invoices by client (project) — a contract may be split across several
  // invoices (draft + awaiting payment); we sum them into one outstanding line.
  const groups = {};
  for (const inv of contracts) {
    const key = inv.client || '(unknown)';
    if (!groups[key]) {
      groups[key] = { client: key, amt: 0, total: 0, amtPaid: 0, usd: 0, currency: (inv.currency || 'AUD').toUpperCase(), mixedCcy: false, due: '' };
    }
    const g = groups[key];
    const ccy = (inv.currency || 'AUD').toUpperCase();
    if (ccy !== g.currency) g.mixedCcy = true;
    g.amt     += inv.amt;
    g.total   += inv.total || 0;
    g.amtPaid += inv.amtPaid || 0;
    g.usd     += toUSD(inv.amt, ccy);
    if (inv.due && (!g.due || inv.due < g.due)) g.due = inv.due; // earliest due date
  }
  const groupList = Object.values(groups);
  const showRecvd = groupList.some(g => g.total > 0);

  const rows = groupList.map((g, idx) => {
    const native = g.mixedCcy ? 'Mixed' : `${g.currency} ${g.amt.toLocaleString('en-AU', { maximumFractionDigits: 0 })}`;
    const usd    = fUSD(g.usd, true);
    const recvd  = g.total > 0 ? `${Math.round((g.amtPaid || 0) / g.total * 100)}%` : '—';
    const overdueStyle = g.due && new Date(g.due) < new Date() ? `color:#B83232;font-weight:700` : `color:${TXT}`;
    return `
      <tr style="border-bottom:0.5px solid ${BRD};background:${idx % 2 ? BG : '#fff'}">
        <td style="padding:4px 6px;${overdueStyle};max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(g.client)}</td>
        <td style="padding:4px 6px;text-align:right;font-size:8px">${native}</td>
        <td style="padding:4px 6px;text-align:right;font-weight:600;color:${TEL}">${usd}</td>
        ${showRecvd ? `<td style="padding:4px 6px;text-align:right;color:${MUT}">${recvd}</td>` : ''}
      </tr>
    `;
  }).join('');

  return `
    ${fxLine}
    <table style="width:100%;border-collapse:collapse;font-size:9px">
      <thead>
        <tr style="background:${BG};border-bottom:1px solid ${BRD}">
          <th style="padding:4px 6px;text-align:left;font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${MUT}">Project</th>
          <th style="padding:4px 6px;text-align:right;font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${MUT}">Native</th>
          <th style="padding:4px 6px;text-align:right;font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${MUT}">≈ USD</th>
          ${showRecvd ? `<th style="padding:4px 6px;text-align:right;font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${MUT}">Recv'd</th>` : ''}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="border-top:1.5px solid ${BRD}">
          <td colspan="2" style="padding:5px 6px;font-weight:700;font-size:9px">Total outstanding</td>
          <td style="padding:5px 6px;text-align:right;font-weight:700;color:${TEL}">${fUSD(totalUSD, true)}</td>
          ${showRecvd ? `<td></td>` : ''}
        </tr>
      </tfoot>
    </table>
  `;
}

// ── Page 2: Deals table ───────────────────────────────────────────────────────

function renderPage2(active, tot, reportLabel) {
  const sorted = [...active].sort((a, b) => {
    const ia = STAGE_ORDER.indexOf(a.sk);
    const ib = STAGE_ORDER.indexOf(b.sk);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const rows = sorted.map(d => {
    const stageClr = STAGE_COLORS[d.sk] || SUB;
    const isOd = isOverdue(d.close);
    return `
      <tr style="border-bottom:0.5px solid ${BRD}">
        <td style="padding:5px 8px;color:${TXT};max-width:160px">${esc(d.name)}</td>
        <td style="padding:5px 8px;color:${MUT}">${esc(d.company || '–')}</td>
        <td style="padding:5px 8px"><span style="color:${stageClr};font-weight:700;font-size:10px">${d.sk || '–'}</span></td>
        <td style="padding:5px 8px;color:${MUT}">${esc(d.lead || '–')}</td>
        <td style="padding:5px 8px;text-align:right;font-weight:600">${fUSD(d.amt)}</td>
        <td style="padding:5px 8px;text-align:right;color:${isOd ? '#C0392B' : MUT};font-weight:${isOd ? 700 : 400}">${fDate(d.close)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!-- Page 2: Deals pipeline -->
    <div style="margin-top:32px;padding-top:20px;border-top:2px solid ${TEL};page-break-before:always">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px">
        <div style="font-size:13px;font-weight:700;color:${TXT}">Deals pipeline — ${reportLabel} (USD)</div>
        <div style="font-size:10px;color:${MUT}">${active.length} active deals</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:10px">
        <thead>
          <tr style="background:${BG};border-bottom:1px solid ${BRD}">
            ${['Deal name','Company','Stage','IE Lead','Amount (USD)','Close date'].map((h, i) =>
              `<th style="padding:6px 8px;text-align:${i >= 4 ? 'right' : 'left'};font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${MUT}">${h}</th>`
            ).join('')}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr style="border-top:1.5px solid ${BRD};background:${BG}">
            <td colspan="4" style="padding:6px 8px;font-weight:700;font-size:10px">Total</td>
            <td style="padding:6px 8px;text-align:right;font-weight:700;color:${TEL}">${fUSD(tot)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      <div style="margin-top:16px;border-top:0.5px solid ${BRD};padding-top:8px;display:flex;justify-content:space-between;font-size:9px;color:${MUT}">
        <span>Whitewater Reinventions · Pipeline Report · Confidential</span><span>Page 2</span>
      </div>
    </div>
  `;
}

// ── Advanced analytics pages ──────────────────────────────────────────────────

function renderAdvancedPages(active, deals, sum, tot, snaps, reportLabel) {
  // ── Variables also needed by summary block ──
  const overdue    = active.filter(d => d.close && new Date(d.close) < new Date());
  const overdueTot = overdue.reduce((s, d) => s + d.amt, 0);

  // ── Shared helpers ──
  function bar(val, maxVal, clr) {
    const w = maxVal > 0 ? Math.min(val / maxVal * 100, 100) : 0;
    return `<div style="background:${BG};border-radius:2px;height:14px;overflow:hidden"><div style="width:${w.toFixed(1)}%;height:100%;background:${clr};border-radius:2px;opacity:0.85"></div></div>`;
  }
  function sec(t) {
    return `<div style="font-size:8px;font-weight:700;color:${MUT};text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">${t}</div>`;
  }
  function rule() {
    return `<div style="border-top:0.5px solid ${BRD};margin:12px 0"></div>`;
  }
  function pageHdr(n) {
    return `
      <div style="display:flex;justify-content:space-between;align-items:baseline;padding-bottom:10px;border-bottom:3px solid ${TEL};margin-bottom:16px">
        <div style="font-size:14px;font-weight:700">Analytics Report — ${reportLabel}</div>
        <div style="font-size:9px;color:${MUT}">Whitewater Reinventions · Confidential · Page ${n}</div>
      </div>`;
  }
  function pageFtr(n) {
    return `
      <div style="margin-top:16px;border-top:0.5px solid ${BRD};padding-top:8px;display:flex;justify-content:space-between;font-size:9px;color:${MUT}">
        <span>Whitewater Reinventions · Analytics Report · Confidential</span><span>Page ${n}</span>
      </div>`;
  }

  // ── Compute data ──
  const cutoff12 = new Date();
  cutoff12.setFullYear(cutoff12.getFullYear() - 1);

  // IE mature (M3/M4) and developing (M1–M2.5) pipeline by lead
  const ieMatMap = {}, ieDevMap = {};
  for (const d of active) {
    const l = d.lead || 'Unassigned';
    if (d.sk === 'M3' || d.sk === 'M4') ieMatMap[l] = (ieMatMap[l] || 0) + d.amt;
    else                                 ieDevMap[l] = (ieDevMap[l] || 0) + d.amt;
  }
  const ieMatArr = Object.entries(ieMatMap).map(([lead, total]) => ({ lead, total })).sort((a, b) => b.total - a.total);
  const ieDevArr = Object.entries(ieDevMap).map(([lead, total]) => ({ lead, total })).sort((a, b) => b.total - a.total);
  const matTot   = ieMatArr.reduce((s, ie) => s + ie.total, 0);
  const devTot   = ieDevArr.reduce((s, ie) => s + ie.total, 0);

  // Referrer effectiveness (active + won in last 12m)
  const refMap = {};
  for (const d of active) {
    if (!d.ref) continue;
    if (!refMap[d.ref]) refMap[d.ref] = { ac: 0, av: 0, wc: 0, wv: 0 };
    refMap[d.ref].ac++;
    refMap[d.ref].av += d.amt;
  }
  for (const d of deals) {
    if (!d.isWon || !d.ref || !d.amt || !d.close) continue;
    if (new Date(d.close) < cutoff12) continue;
    if (!refMap[d.ref]) refMap[d.ref] = { ac: 0, av: 0, wc: 0, wv: 0 };
    refMap[d.ref].wc++;
    refMap[d.ref].wv += d.amt;
  }
  const refArr = Object.entries(refMap)
    .map(([ref, v]) => ({ ref, ...v }))
    .sort((a, b) => (b.av + b.wv) - (a.av + a.wv));

  // Client concentration (active pipeline)
  const coMap = {};
  for (const d of active) {
    const co = d.company || 'Unknown';
    coMap[co] = (coMap[co] || 0) + d.amt;
  }
  const coArr = Object.entries(coMap)
    .map(([company, total]) => ({ company, total }))
    .sort((a, b) => b.total - a.total);

  // Won by IE — last 12 months
  const ieWon12Map = {};
  for (const d of deals) {
    if (!d.isWon || !d.amt || !d.close) continue;
    if (new Date(d.close) < cutoff12) continue;
    const lead = d.lead || 'Unassigned';
    if (!ieWon12Map[lead]) ieWon12Map[lead] = { total: 0, deals: [] };
    ieWon12Map[lead].total += d.amt;
    ieWon12Map[lead].deals.push(d);
  }
  const ieWon12Arr = Object.entries(ieWon12Map)
    .map(([lead, v]) => ({ lead, ...v }))
    .sort((a, b) => b.total - a.total);

  // Leads pipeline
  const leads     = get('leads') || [];
  const leads01   = leads.filter(l => l.stage === '0.1');
  const leads02   = leads.filter(l => l.stage === '0.2');
  const leads03   = leads.filter(l => l.stage === '0.3');
  const staleDate  = new Date(Date.now() - 90 * 86400000);
  const isStale    = l => !l.lastAct || new Date(l.lastAct) < staleDate;
  const noActLeads = leads.filter(isStale);
  const STGCLR    = { '0.1': '#C07A00', '0.2': '#1E7A5A', '0.3': TEL };

  // ── IE Origination — current financial year (Jul 2025–Jun 2026) ──
  const fyStart  = new Date('2025-07-01');
  const fyEnd    = new Date('2026-06-30T23:59:59');
  const wonDeals = deals.filter(d => d.isWon);
  const origMap  = {};
  for (const d of wonDeals) {
    if (!d.close) continue;
    const closeDate = new Date(d.close);
    if (closeDate < fyStart || closeDate > fyEnd) continue;
    const lead = d.lead || 'Unassigned';
    if (!origMap[lead]) origMap[lead] = { clients: new Set(), total: 0 };
    if (d.company) origMap[lead].clients.add(d.company);
    origMap[lead].total += d.amt;
  }
  const origArr = Object.entries(origMap)
    .map(([lead, v]) => ({ lead, clients: v.clients.size, total: v.total }))
    .sort((a, b) => b.total - a.total);

  // ── PAGE 3: IE Origination + pipeline breakdown + referrer effectiveness ──
  const maxMat = ieMatArr[0]?.total || 1;
  const maxDev = ieDevArr[0]?.total || 1;

  const ieOrigRows = origArr.length
    ? `<table style="width:100%;border-collapse:collapse;font-size:8px">
        <thead>
          <tr style="background:${BG};border-bottom:1px solid ${BRD}">
            <th style="padding:4px 6px;text-align:left;font-size:7px;font-weight:700;text-transform:uppercase;color:${MUT}">IE Lead</th>
            <th style="padding:4px 6px;text-align:right;font-size:7px;font-weight:700;text-transform:uppercase;color:${MUT}">Clients</th>
            <th style="padding:4px 6px;text-align:right;font-size:7px;font-weight:700;text-transform:uppercase;color:${MUT}">Won</th>
          </tr>
        </thead>
        <tbody>
          ${origArr.map((ie, idx) => `
            <tr style="border-bottom:0.5px solid ${BRD};background:${idx % 2 ? BG : '#fff'}">
              <td style="padding:4px 6px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:90px">${esc(ie.lead)}</td>
              <td style="padding:4px 6px;text-align:right;color:${MUT}">${ie.clients}</td>
              <td style="padding:4px 6px;text-align:right;font-weight:600;color:#1E8C4A">${fUSD(ie.total, true)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`
    : `<div style="font-size:9px;color:${MUT}">No closed deals recorded.</div>`;

  const ieMatRows = ieMatArr.length
    ? ieMatArr.map(ie => `
        <div style="display:grid;grid-template-columns:80px 1fr 48px;align-items:center;gap:5px;margin-bottom:6px">
          <span style="font-size:8px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(ie.lead)}</span>
          ${bar(ie.total, maxMat, '#D85A30')}
          <span style="font-size:8px;font-weight:600;color:#D85A30;text-align:right">${fUSD(ie.total, true)}</span>
        </div>
      `).join('') + `<div style="font-size:8px;color:${MUT};font-weight:600;margin-top:4px">Total: ${fUSD(matTot, true)}</div>`
    : `<div style="font-size:9px;color:${MUT}">No mature deals</div>`;

  const ieDevRows = ieDevArr.length
    ? ieDevArr.map(ie => `
        <div style="display:grid;grid-template-columns:80px 1fr 48px;align-items:center;gap:5px;margin-bottom:6px">
          <span style="font-size:8px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(ie.lead)}</span>
          ${bar(ie.total, maxDev, '#3B6D11')}
          <span style="font-size:8px;font-weight:600;color:#3B6D11;text-align:right">${fUSD(ie.total, true)}</span>
        </div>
      `).join('') + `<div style="font-size:8px;color:${MUT};font-weight:600;margin-top:4px">Total: ${fUSD(devTot, true)}</div>`
    : `<div style="font-size:9px;color:${MUT}">No developing deals</div>`;

  // ── IE conversion rates (replaces referrer effectiveness) ──
  const ieConvMap = {};
  for (const d of active) {
    const l = d.lead || 'Unassigned';
    if (!ieConvMap[l]) ieConvMap[l] = { active: 0, activeVal: 0, won: 0, wonVal: 0 };
    ieConvMap[l].active++;
    ieConvMap[l].activeVal += d.amt;
  }
  for (const d of wonDeals) {
    if (!d.close) continue;
    const closeDate = new Date(d.close);
    if (closeDate < fyStart || closeDate > fyEnd) continue;
    const l = d.lead || 'Unassigned';
    if (!ieConvMap[l]) ieConvMap[l] = { active: 0, activeVal: 0, won: 0, wonVal: 0 };
    ieConvMap[l].won++;
    ieConvMap[l].wonVal += d.amt;
  }
  const ieConvArr = Object.entries(ieConvMap)
    .map(([lead, v]) => ({ lead, ...v }))
    .sort((a, b) => b.wonVal - a.wonVal);

  const ieConvSection = ieConvArr.length ? `
    ${rule()}
    ${sec('IE conversion — FY25/26 won vs active pipeline')}
    <table style="width:100%;border-collapse:collapse;font-size:8px">
      <thead>
        <tr style="background:${BG};border-bottom:1px solid ${BRD}">
          ${['IE Lead', 'Active deals', 'Active value', 'Won FY25/26', 'Won value', 'Win rate'].map((h, i) =>
            `<th style="padding:4px 6px;text-align:${i === 0 ? 'left' : 'right'};font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${MUT}">${h}</th>`
          ).join('')}
        </tr>
      </thead>
      <tbody>
        ${ieConvArr.map((ie, idx) => {
          const total = ie.active + ie.won;
          const rate  = total > 0 ? Math.round(ie.won / total * 100) : 0;
          const rateClr = rate >= 40 ? '#1E8C4A' : rate >= 20 ? '#B05628' : MUT;
          return `
            <tr style="border-bottom:0.5px solid ${BRD};background:${idx % 2 ? BG : '#fff'}">
              <td style="padding:4px 6px;font-weight:500">${esc(ie.lead)}</td>
              <td style="padding:4px 6px;text-align:right;color:${MUT}">${ie.active}</td>
              <td style="padding:4px 6px;text-align:right">${fUSD(ie.activeVal, true)}</td>
              <td style="padding:4px 6px;text-align:right;color:${MUT}">${ie.won}</td>
              <td style="padding:4px 6px;text-align:right;font-weight:600;color:#1E8C4A">${fUSD(ie.wonVal, true)}</td>
              <td style="padding:4px 6px;text-align:right;font-weight:700;color:${rateClr}">${rate}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  ` : '';

  // ── Summary callouts ──
  const bullets = [];
  // Pipeline vs last snapshot
  if (snaps.length >= 2) {
    const prev = snaps[snaps.length - 2];
    const prevTot = (prev.m34 || 0) + (prev.m12 || 0);
    const currTot = (ieMatArr.reduce((s,ie) => s + ie.total, 0)) + (ieDevArr.reduce((s,ie) => s + ie.total, 0));
    const delta = currTot - prevTot;
    const pct = prevTot > 0 ? Math.round(Math.abs(delta) / prevTot * 100) : 0;
    if (Math.abs(pct) >= 5) bullets.push(`Pipeline is <strong>${delta >= 0 ? 'up' : 'down'} ${pct}%</strong> vs prior snapshot (${prev.label}) — ${fUSD(Math.abs(delta), true)} ${delta >= 0 ? 'added' : 'removed'}.`);
  }
  // Concentration
  if (coArr.length > 0) {
    const top = coArr[0];
    const topPct = tot > 0 ? Math.round(top.total / tot * 100) : 0;
    if (topPct >= 25) bullets.push(`<strong>${esc(top.company)}</strong> represents <strong style="color:${topPct >= 40 ? '#B83232' : '#B05628'}">${topPct}%</strong> of active pipeline — ${topPct >= 40 ? 'high' : 'elevated'} concentration risk.`);
  }
  // Overdue
  if (overdue.length > 0) bullets.push(`<strong>${overdue.length} deal${overdue.length !== 1 ? 's' : ''}</strong> past close date totalling <strong style="color:#B83232">${fUSD(overdueTot, true)}</strong> — require immediate review.`);
  // Top IE by FY won
  if (ieConvArr.length > 0) {
    const top = ieConvArr[0];
    if (top.wonVal > 0) bullets.push(`<strong>${esc(top.lead)}</strong> leads FY25/26 origination at <strong style="color:#1E8C4A">${fUSD(top.wonVal, true)}</strong> won across ${top.won} deal${top.won !== 1 ? 's' : ''}.`);
  }
  // Leads funnel shape
  if (leads.length > 0) {
    const ratio = leads01.length > 0 ? Math.round(leads03.length / leads01.length * 100) : 0;
    if (ratio < 15) bullets.push(`Leads funnel is <strong>top-heavy</strong> — ${leads01.length} at shortlist (0.1) vs only ${leads03.length} at make-meeting (0.3). Conversion to meeting is ${ratio}%.`);
  }

  const summaryBlock = bullets.length ? `
    <div style="background:${BG};border-left:3px solid ${TEL};padding:10px 14px;margin-bottom:16px;border-radius:0 4px 4px 0">
      <div style="font-size:8px;font-weight:700;color:${TEL};text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">Key signals</div>
      ${bullets.map(b => `<div style="font-size:8.5px;color:${TXT};margin-bottom:4px;padding-left:10px;position:relative"><span style="position:absolute;left:0;color:${TEL}">›</span>${b}</div>`).join('')}
    </div>
  ` : '';

  const page3 = `
    <div class="print-page" style="margin-top:20px">
      ${pageHdr(3)}
      ${summaryBlock}
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
        <div>
          ${sec('IE origination — FY25/26')}
          ${ieOrigRows}
        </div>
        <div>
          ${sec('Mature pipeline — M3/M4')}
          ${ieMatRows}
        </div>
        <div>
          ${sec('Developing pipeline — M1–M2.5')}
          ${ieDevRows}
        </div>
      </div>
      ${ieConvSection}
      ${pageFtr(3)}
    </div>
  `;

  // ── PAGE 4: Client concentration + won by IE + leads ──
  const coClrs   = ['#1E3D6E', '#3B6D11', '#B05628', TEL, '#639922', '#EF9F27', '#97C459', SUB];
  const top2Pct  = coArr.slice(0, 2).reduce((s, c) => s + (tot > 0 ? c.total / tot * 100 : 0), 0);
  const coTop    = coArr.slice(0, 8);

  function svgPie(slices, total) {
    const CX = 70, CY = 70, R = 60, IR = 28;
    let svg = `<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">`;
    let startAngle = -Math.PI / 2;
    for (let i = 0; i < slices.length; i++) {
      const pct = slices[i].total / total;
      const angle = pct * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const x1 = CX + R * Math.cos(startAngle), y1 = CY + R * Math.sin(startAngle);
      const x2 = CX + R * Math.cos(endAngle),   y2 = CY + R * Math.sin(endAngle);
      const ix1 = CX + IR * Math.cos(startAngle), iy1 = CY + IR * Math.sin(startAngle);
      const ix2 = CX + IR * Math.cos(endAngle),   iy2 = CY + IR * Math.sin(endAngle);
      const lg = angle > Math.PI ? 1 : 0;
      svg += `<path d="M${ix1.toFixed(1)},${iy1.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${lg},1 ${x2.toFixed(1)},${y2.toFixed(1)} L${ix2.toFixed(1)},${iy2.toFixed(1)} A${IR},${IR} 0 ${lg},0 ${ix1.toFixed(1)},${iy1.toFixed(1)} Z" fill="${coClrs[i] || SUB}" stroke="#fff" stroke-width="1.5"/>`;
      startAngle = endAngle;
    }
    svg += `</svg>`;
    return svg;
  }

  const coLegend = coTop.map((c, i) => {
    const pct     = tot > 0 ? c.total / tot * 100 : 0;
    const riskClr = pct >= 40 ? '#B83232' : pct >= 25 ? '#B05628' : TXT;
    return `
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px">
        <div style="width:8px;height:8px;border-radius:2px;background:${coClrs[i] || SUB};flex-shrink:0"></div>
        <span style="font-size:8px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:${pct >= 25 ? 700 : 400};color:${riskClr}">${esc(c.company)}</span>
        <span style="font-size:8px;font-weight:600;color:${TEL};white-space:nowrap">${fUSD(c.total, true)}</span>
        <span style="font-size:8px;color:${riskClr};font-weight:${pct >= 25 ? 700 : 400};white-space:nowrap;min-width:26px;text-align:right">${Math.round(pct)}%</span>
      </div>
    `;
  }).join('');

  const wonIeRows = ieWon12Arr.length
    ? ieWon12Arr.map(ie => `
        <div style="margin-bottom:8px">
          <div style="font-size:9px;font-weight:700;margin-bottom:2px">${esc(ie.lead)} — ${fUSD(ie.total, true)}</div>
          ${[...ie.deals].sort((a, b) => b.amt - a.amt).map(d => `
            <div style="display:flex;justify-content:space-between;font-size:8px;color:${MUT};padding-left:10px">
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px">${esc(d.name)}</span>
              <span>${fUSD(d.amt, true)}</span>
            </div>
          `).join('')}
        </div>
      `).join('')
    : `<div style="font-size:9px;color:${MUT}">No closed deals in last 12 months</div>`;

  // Leads IE matrix
  const owners = [...new Set(leads.map(l => l.owner))].sort((a, b) =>
    leads.filter(l => l.owner === b).length - leads.filter(l => l.owner === a).length
  );
  const leadsKpi = [
    { label: 'Total active leads', v: leads.length,   acc: TEL       },
    { label: '0.1 Shortlist',      v: leads01.length, acc: '#C07A00' },
    { label: '0.2 Engaged',        v: leads02.length, acc: '#1E7A5A' },
    { label: '0.3 Make meeting',   v: leads03.length, acc: TEL       },
  ].map(c => `
    <div style="border:0.5px solid ${BRD};border-left:3px solid ${c.acc};padding:6px 8px;border-radius:0 4px 4px 0">
      <div style="font-size:7px;color:${MUT};text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">${c.label}</div>
      <div style="font-size:14px;font-weight:700">${c.v}</div>
    </div>
  `).join('');

  const leadsMatrixRows = owners.map((owner, idx) => {
    const ol = leads.filter(l => l.owner === owner);
    const noA = ol.filter(isStale).length;
    return `
      <tr style="border-bottom:0.5px solid ${BRD};background:${idx % 2 ? BG : '#fff'}">
        <td style="padding:4px 6px;font-weight:500">${esc(owner)}</td>
        ${['0.1', '0.2', '0.3'].map(s => {
          const cnt = ol.filter(l => l.stage === s).length;
          return `<td style="padding:4px 6px;text-align:right;color:${cnt > 0 ? STGCLR[s] : MUT};font-weight:${cnt > 0 ? 600 : 400}">${cnt || '–'}</td>`;
        }).join('')}
        <td style="padding:4px 6px;text-align:right;font-weight:700">${ol.length}</td>
        <td style="padding:4px 6px;text-align:right;color:${noA > 0 ? '#B83232' : MUT};font-weight:${noA > 0 ? 700 : 400}">${noA || '–'}</td>
      </tr>
    `;
  }).join('');

  // ── Deal cycle time by stage ──
  const CYCLE_STAGES = [
    { field: 'dm1',  label: 'M1 → M1.5' },
    { field: 'dm15', label: 'M1.5 → M2' },
    { field: 'dm2',  label: 'M2 → M2.5' },
    { field: 'dm25', label: 'M2.5 → M3' },
    { field: 'dm3',  label: 'M3 → M4'   },
    { field: 'dm4',  label: 'M4 → close' },
  ];
  const cycleRows = CYCLE_STAGES.map(({ field, label }) => {
    const vals = active.filter(d => d[field] != null).map(d => d[field]);
    if (vals.length === 0) return null;
    const avg = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
    const max = Math.max(...vals);
    const barW = Math.min(avg / 90 * 100, 100);
    const clr  = avg > 60 ? '#B83232' : avg > 30 ? '#B05628' : '#1E8C4A';
    return { label, avg, max, barW, clr, n: vals.length };
  }).filter(Boolean);

  const cycleSection = cycleRows.length ? `
    ${rule()}
    ${sec('Average deal cycle time — active pipeline')}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      ${cycleRows.map(r => `
        <div style="display:grid;grid-template-columns:76px 1fr 36px 36px;align-items:center;gap:6px;margin-bottom:5px">
          <span style="font-size:8px;color:${MUT}">${r.label}</span>
          <div style="background:${BG};border-radius:2px;height:10px;overflow:hidden">
            <div style="width:${r.barW.toFixed(1)}%;height:100%;background:${r.clr};opacity:0.8;border-radius:2px"></div>
          </div>
          <span style="font-size:8px;font-weight:700;color:${r.clr};text-align:right">${r.avg}d</span>
          <span style="font-size:7px;color:${SUB};text-align:right">${r.n} deals</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const page4 = `
    <div class="print-page" style="margin-top:20px">
      ${pageHdr(4)}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:4px">
        <div>
          ${sec('Client concentration — active pipeline')}
          ${coTop.length ? `
            <div style="display:flex;gap:12px;align-items:flex-start">
              ${svgPie(coTop, tot)}
              <div style="flex:1;padding-top:4px">${coLegend}</div>
            </div>
            ${top2Pct >= 60 ? `<div style="font-size:8px;color:#B83232;margin-top:4px">Top 2 clients = ${Math.round(top2Pct)}% — concentration risk</div>` : ''}
          ` : `<div style="font-size:9px;color:${MUT}">No active deals</div>`}
        </div>
        <div>
          ${sec('Won by IE lead — last 12 months')}
          ${wonIeRows}
        </div>
      </div>
      ${cycleSection}
      ${rule()}
      ${sec('Leads pipeline')}
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
        ${leadsKpi}
      </div>
      ${leads.length ? `
        <table style="width:100%;border-collapse:collapse;font-size:8px;margin-bottom:10px">
          <thead>
            <tr style="background:${BG};border-top:1px solid ${BRD};border-bottom:1px solid ${BRD}">
              ${['IE Lead', '0.1', '0.2', '0.3', 'Total', 'No activity'].map((h, i) =>
                `<th style="padding:4px 6px;text-align:${i > 0 ? 'right' : 'left'};font-size:7px;font-weight:700;text-transform:uppercase;color:${MUT}">${h}</th>`
              ).join('')}
            </tr>
          </thead>
          <tbody>${leadsMatrixRows}</tbody>
          <tfoot>
            <tr style="border-top:1.5px solid ${BRD};background:${BG}">
              <td style="padding:4px 6px;font-weight:700">Total</td>
              ${['0.1', '0.2', '0.3'].map(s =>
                `<td style="padding:4px 6px;text-align:right;font-weight:700;color:${STGCLR[s]}">${leads.filter(l => l.stage === s).length}</td>`
              ).join('')}
              <td style="padding:4px 6px;text-align:right;font-weight:700;color:${TEL}">${leads.length}</td>
              <td style="padding:4px 6px;text-align:right;font-weight:700;color:#B83232">${noActLeads.length || '–'}</td>
            </tr>
          </tfoot>
        </table>
        <div style="font-size:7.5px;color:#B83232;padding:5px 8px;background:rgba(192,57,43,.05);border-radius:3px">"No activity" = last HubSpot activity &gt;90 days ago or date blank.</div>
      ` : `<div style="font-size:9px;color:${MUT}">No leads data.</div>`}
      ${pageFtr(4)}
    </div>
  `;

  return page3 + page4;
}

// ── SVG: Funnel (ported from reference) ──────────────────────────────────────

function svgFunnel(sum, tot) {
  if (tot <= 0) return `<div style="padding:40px;text-align:center;color:${MUT};font-size:13px">No pipeline data.</div>`;

  const TY = 40, BY = 420, CX = 260, TLX = 60, TRX = 460, H = 380, HALF = 200;
  const LX = 475, MIN_GAP = 26;
  const VW = 680, VH = 460;
  const FONT = `font-family="Calibri,'Segoe UI',sans-serif"`;

  function rX(y) { return CX + (BY - y) / H * HALF; }

  let svg = `<svg width="100%" viewBox="0 0 ${VW} ${VH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<defs><clipPath id="fc"><polygon points="${CX},${BY} ${TLX},${TY} ${TRX},${TY}"/></clipPath></defs>`;

  let y = TY;
  const bands = [];
  for (const k of [...STAGE_ORDER].reverse()) {
    const val = sum[k] ? sum[k].total : 0;
    const bh = val / tot * H;
    bands.push({ key: k, val, y, h: bh, clr: STAGE_COLORS[k] || '#ccc' });
    y += bh;
  }

  svg += `<g clip-path="url(#fc)">`;
  for (const b of bands) {
    if (b.h > 0) svg += `<rect x="${TLX}" y="${b.y.toFixed(1)}" width="${TRX - TLX}" height="${Math.ceil(b.h + 1)}" fill="${b.clr}"/>`;
  }
  svg += `</g>`;

  for (let i = 1; i < bands.length; i++) {
    const b = bands[i];
    const lx = CX - (BY - b.y) / H * HALF + 2;
    const rx = CX + (BY - b.y) / H * HALF - 2;
    if (rx > lx) svg += `<line x1="${lx.toFixed(1)}" y1="${b.y.toFixed(1)}" x2="${rx.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="white" stroke-width="1" opacity="0.5"/>`;
  }
  svg += `<polygon points="${CX},${BY} ${TLX},${TY} ${TRX},${TY}" fill="none" stroke="${BRD}" stroke-width="1.2"/>`;

  const visible = bands.filter(b => b.h >= 1);
  let labelY = visible.map(b => b.y + b.h / 2);

  for (let pass = 0; pass < 10; pass++) {
    for (let i = labelY.length - 2; i >= 0; i--) { if (labelY[i + 1] - labelY[i] < MIN_GAP) labelY[i] = labelY[i + 1] - MIN_GAP; }
    for (let j = 1; j < labelY.length; j++) { if (labelY[j] - labelY[j - 1] < MIN_GAP) labelY[j] = labelY[j - 1] + MIN_GAP; }
  }
  labelY = labelY.map(ly => Math.max(TY + 8, Math.min(BY - 8, ly)));

  visible.forEach((b, idx) => {
    const midY = b.y + b.h / 2;
    const ly = labelY[idx];
    const pct = Math.round(b.val / tot * 100);
    const rx = rX(midY);
    svg += `<line x1="${rx.toFixed(1)}" y1="${midY.toFixed(1)}" x2="${(LX - 4).toFixed(1)}" y2="${ly.toFixed(1)}" stroke="${MUT}" stroke-width="0.8" stroke-dasharray="3 2"/>`;
    svg += `<text font-size="11" font-weight="700" ${FONT} x="${LX}" y="${(ly + 2).toFixed(1)}" fill="${TXT}">${b.key}</text>`;
    svg += `<text font-size="10" ${FONT} x="${LX}" y="${(ly + 14).toFixed(1)}" fill="${SUB}">${fUSD(b.val, true)}  ${pct}%</text>`;
  });

  svg += `<text font-size="10" ${FONT} x="${CX}" y="${VH - 8}" text-anchor="middle" fill="${MUT}">Total: ${fUSD(tot)}</text>`;
  svg += `</svg>`;
  return svg;
}

// ── SVG: Stacked area chart (ported from reference) ───────────────────────────

function svgStackedArea(data) {
  if (!data || data.length < 2) return '';

  const W = 860, PB = 72, PT = 44, PL = 66, PR = 24;
  const H = PT + 260 + PB;
  const cW = W - PL - PR, cH = 260;
  const n = data.length;
  const niceMax = 3000000;
  const CA = '#1E3D6E', CM = '#B05628', CL = '#F0D5BE';
  const FONT = `font-family="Calibri,'Segoe UI',system-ui,sans-serif"`;

  function xp(i) { return PL + i / (n - 1) * cW; }
  function yp(v) { return PT + cH * (1 - v / niceMax); }

  let svg = `<svg width="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;

  const ticks = [0, 500000, 1000000, 1500000, 2000000, 2500000, 3000000];
  for (const tv of ticks) {
    const ty = yp(tv);
    svg += `<line x1="${PL}" y1="${ty.toFixed(1)}" x2="${W - PR}" y2="${ty.toFixed(1)}" stroke="${BRD}" stroke-width="1"/>`;
    svg += `<text x="${PL - 5}" y="${(ty + 4).toFixed(1)}" text-anchor="end" fill="${MUT}" font-size="10" ${FONT}>${fUSD(tv, true)}</text>`;
  }

  let fwd3 = '', fwd2 = '', fwd1 = '';
  for (let i = 0; i < n; i++) {
    const px = xp(i).toFixed(1);
    fwd3 += `${px},${yp(data[i].active + (data[i].m34 || 0) + (data[i].m12 || 0)).toFixed(1)} `;
    fwd2 += `${px},${yp(data[i].active + (data[i].m34 || 0)).toFixed(1)} `;
    fwd1 += `${px},${yp(data[i].active).toFixed(1)} `;
  }
  const br = `${(PL + cW).toFixed(1)},${yp(0).toFixed(1)}`;
  const bl = `${PL.toFixed(1)},${yp(0).toFixed(1)}`;

  svg += `<polygon points="${fwd3}${br} ${bl}" fill="${CL}"/>`;
  svg += `<polygon points="${fwd2}${br} ${bl}" fill="${CM}"/>`;
  svg += `<polygon points="${fwd1}${br} ${bl}" fill="${CA}"/>`;

  let p3 = '', p2 = '', p1 = '';
  for (let i = 0; i < n; i++) {
    const pp = (i === 0 ? 'M' : 'L') + xp(i).toFixed(1) + ',';
    p3 += pp + yp(data[i].active + (data[i].m34 || 0) + (data[i].m12 || 0)).toFixed(1);
    p2 += pp + yp(data[i].active + (data[i].m34 || 0)).toFixed(1);
    p1 += pp + yp(data[i].active).toFixed(1);
  }
  svg += `<path d="${p3}" fill="none" stroke="${CL}" stroke-width="1.2" opacity="0.6"/>`;
  svg += `<path d="${p2}" fill="none" stroke="#7A3D1C" stroke-width="1" opacity="0.5"/>`;
  svg += `<path d="${p1}" fill="none" stroke="#122A4E" stroke-width="1" opacity="0.5"/>`;

  const axisY = PT + cH + 16;
  for (let i = 0; i < n; i++) {
    const lx = xp(i).toFixed(1);
    svg += `<text x="${lx}" y="${axisY}" text-anchor="end" transform="rotate(-45,${lx},${axisY})" fill="${MUT}" font-size="10" ${FONT}>${data[i].label}</text>`;
  }

  // Legend
  let ly = 14, lxL = W - PR;
  lxL -= 52;
  svg += `<rect x="${lxL}" y="${ly}" width="10" height="10" fill="${CL}" stroke="${BRD}" stroke-width="0.5"/>`;
  svg += `<text x="${lxL + 14}" y="${ly + 9}" fill="${MUT}" font-size="10" ${FONT}>M1 – M2</text>`;
  lxL -= 82;
  svg += `<rect x="${lxL}" y="${ly}" width="10" height="10" fill="${CM}"/>`;
  svg += `<text x="${lxL + 14}" y="${ly + 9}" fill="${MUT}" font-size="10" ${FONT}>M3 – M4</text>`;
  lxL -= 116;
  svg += `<rect x="${lxL}" y="${ly}" width="10" height="10" fill="${CA}"/>`;
  svg += `<text x="${lxL + 14}" y="${ly + 9}" fill="${MUT}" font-size="10" ${FONT}>Active deals</text>`;

  svg += `</svg>`;
  return svg;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildStageSummary(active) {
  const sum = {};
  for (const sk of STAGE_ORDER) {
    const stageDeals = active.filter(d => d.sk === sk);
    sum[sk] = { count: stageDeals.length, total: stageDeals.reduce((s, d) => s + d.amt, 0) };
  }
  return sum;
}

function fUSD(v, compact = false) {
  if (compact) {
    const abs = Math.abs(v);
    if (abs >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M';
    if (abs >= 1000)    return '$' + Math.round(v / 1000) + 'K';
  }
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function fDate(str) {
  if (!str) return '–';
  try {
    return new Date(str).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return str;
  }
}

function isOverdue(close) {
  if (!close) return false;
  return new Date(close) < new Date();
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export { render };
