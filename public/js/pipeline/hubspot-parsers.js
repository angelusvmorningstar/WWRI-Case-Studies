/**
 * hubspot-parsers.js — HubSpot and Xero CSV parsing for pipeline data
 */

import { parseCSV } from '../shared/csv-parser.js';

const STAGE_KEYS = ['M4', 'M3', 'M2.5', 'M2', 'M1.5', 'M1'];

/**
 * Map a deal stage string to a stage key (M1–M4) or null.
 */
function toStageKey(stage) {
  if (!stage) return null;
  for (const sk of STAGE_KEYS) {
    if (stage.includes(sk)) return sk;
  }
  return null;
}

/**
 * Find a column value by substring pattern — handles embedded-quote column names
 * like 'Date entered "M1 - Exploratory Meeting ..."'.
 */
function findCol(r, pattern) {
  const key = Object.keys(r).find(k => k.includes(pattern));
  return key ? (r[key] || '').trim() : '';
}

/**
 * Parse date fields — extract YYYY-MM-DD portion only.
 */
function parseDateField(val) {
  if (!val) return '';
  const match = val.trim().match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) return match[0];
  // Handle D/M/YYYY or DD/MM/YYYY (Xero format, single- or double-digit day/month)
  const dmy = val.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  return val.trim().slice(0, 10);
}

/**
 * Compute integer days between two YYYY-MM-DD date strings.
 * Returns null if fromDate is blank.
 */
function stageDays(fromDate, toDate) {
  if (!fromDate) return null;
  const from = new Date(fromDate);
  const to   = toDate ? new Date(toDate) : new Date();
  if (isNaN(from) || isNaN(to)) return null;
  return Math.max(0, Math.round((to - from) / 86400000));
}

/**
 * Convert a CSV row to a deal object.
 * Uses fuzzy column matching for "Date entered" stage columns.
 */
function toDeal(r) {
  const d1  = parseDateField(findCol(r, 'M1 - Exploratory'));
  const d15 = parseDateField(findCol(r, 'M1.5'));
  const d2  = parseDateField(findCol(r, 'M2 - Client'));
  const d25 = parseDateField(findCol(r, 'M2.5'));
  const d3  = parseDateField(findCol(r, 'M3 - SOW'));
  const d4  = parseDateField(findCol(r, 'M4 - Contract'));

  const stage = (r['Deal Stage'] || '').trim();

  return {
    id:      r['Record ID'] || `r${Math.random().toString(36).slice(2, 8)}`,
    name:    (r['Deal Name'] || '').trim().replace(/[–—]/g, '-').replace(/\s*\([^)]*\)\s*$/, '').trim(),
    company: (r['Associated Company'] || '').trim(),
    stage,
    sk:      toStageKey(stage),
    lead:    (r['IE Lead'] || '').trim(),
    amt:     parseFloat(r['Amount']) || 0,
    close:   parseDateField(r['Close Date']),
    act:     parseDateField(r['Last Activity Date']),
    ref:     '',
    isWon:   (r['Is Closed Won'] || '').trim().toLowerCase() === 'true',
    dm1:     stageDays(d1,  d15),
    dm15:    stageDays(d15, d2),
    dm2:     stageDays(d2,  d25),
    dm25:    stageDays(d25, d3),
    dm3:     stageDays(d3,  d4),
    dm4:     stageDays(d4,  null),
  };
}

// ── Full Pipeline Import ─────────────────────────────────────────────────────

/**
 * Parse a full HubSpot pipeline export — replaces the deal database.
 * @param {string} text - Raw CSV text
 * @returns {{ ok: true, data: Object, count: number } | { ok: false, error: string }}
 */
function parseFullPipeline(text) {
  const result = parseCSV(text);
  if (!result.ok) return { ok: false, error: `Pipeline import: ${result.error}` };

  if (!result.columns.includes('Deal Name')) {
    return { ok: false, error: 'Pipeline import: Expected column "Deal Name" not found' };
  }

  const db = {};
  for (const row of result.data) {
    if (!row['Deal Name']) continue;
    const deal = toDeal(row);
    db[deal.id] = deal;
  }

  const count = Object.keys(db).length;
  if (count === 0) return { ok: false, error: 'Pipeline import: No deals found in data' };

  return { ok: true, data: db, count };
}

// ── Leads Import ─────────────────────────────────────────────────────────────

/**
 * Parse HubSpot leads/contacts CSV — keeps only contacts with Lead Stage 0.x.
 * @param {string} text - Raw CSV text
 * @returns {{ ok: true, data: Object[], count: number } | { ok: false, error: string }}
 */
function parseLeads(text) {
  const result = parseCSV(text);
  if (!result.ok) return { ok: false, error: `Leads import: ${result.error}` };

  const now   = Date.now();
  const leads = [];

  for (const row of result.data) {
    const stage = (row['Lead Stage'] || '').trim();
    const owner = (row['Contact owner'] || '').trim();
    if (!stage.startsWith('0.') || !owner) continue;

    const stageDate = parseDateField(row['Date entered current stage']);
    let days = null;
    if (stageDate) {
      const d = new Date(stageDate);
      if (!isNaN(d.getTime())) {
        days = Math.floor((now - d.getTime()) / 86400000);
      }
    }

    leads.push({
      id:      row['Record ID'] || '',
      first:   (row['First Name'] || '').trim(),
      last:    (row['Last Name'] || '').trim(),
      co:      (row['Associated Company (Primary)'] || '').trim(),
      owner,
      stage:   stage.slice(0, 3),
      cat:     (row['Category'] || 'Uncategorised').trim(),
      pri:     (row['Prioritisation'] || '').trim(),
      days,
      lastAct: parseDateField(row['Last Activity Date']),
      linkedin:(row['Linkedin account'] || '').trim(),
    });
  }

  if (leads.length === 0) {
    return { ok: false, error: 'Leads import: No valid leads found (require Lead Stage 0.x and Contact owner)' };
  }

  return { ok: true, data: leads, count: leads.length };
}

// ── Xero Contracted Invoices ─────────────────────────────────────────────────

/**
 * Parse a Xero Sales Invoices CSV export.
 * Keeps one record per unique InvoiceNumber where Status is Authorised,
 * Awaiting Payment, or Draft (all represent contracted/active revenue).
 * @param {string} text - Raw CSV text
 * @returns {{ ok: true, data: Object[], count: number } | { ok: false, error: string }}
 */
function parseXeroInvoices(text) {
  const result = parseCSV(text);
  if (!result.ok) return { ok: false, error: `Xero import: ${result.error}` };

  if (!result.columns.includes('InvoiceNumber')) {
    return { ok: false, error: 'Xero import: Expected column "InvoiceNumber" not found' };
  }

  const seen     = {};
  const invoices = [];

  for (const row of result.data) {
    const num    = (row['InvoiceNumber'] || '').trim();
    const status = (row['Status'] || '').trim().toLowerCase();
    if (!num || seen[num]) continue;
    if (status !== 'authorised' && status !== 'awaiting payment' && status !== 'draft') continue;
    const acctCode = (row['AccountCode'] || '').trim();
    if (acctCode && acctCode !== '210' && acctCode !== '220') continue; // revenue invoices only (210, 220); excludes expenses pass-through (230), tax (820), etc.
    seen[num] = true;

    invoices.push({
      num,
      client:   (row['ContactName'] || '').trim(),
      due:      parseDateField(row['DueDate']),
      amt:      parseFloat(row['InvoiceAmountDue']) || 0,
      total:    parseFloat(row['Total']) || 0,
      amtPaid:  parseFloat(row['InvoiceAmountPaid']) || 0,
      currency: (row['Currency'] || 'AUD').trim(),
    });
  }

  return { ok: true, data: invoices, count: invoices.length };
}

export { parseFullPipeline, parseLeads, parseXeroInvoices };
