/**
 * xero-parsers.js — Xero CSV parsing for Balance Sheet, P&L, and Invoices
 *
 * Xero financial CSVs (BS, PL) are accounting-format, not standard header+rows.
 * Each row is an account line item; we search by account name patterns.
 * Only the Invoice export is standard CSV — parsed via csv-parser.js.
 */

import { parseCSV } from '../shared/csv-parser.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Split financial CSV text into rows of columns.
 * Xero accounting exports use a simple delimiter format.
 */
function parseFinRows(text) {
  const sep = text.includes('\t') ? '\t' : ',';
  return text.split('\n').map(line =>
    line.split(sep).map(c => c.replace(/^"|"$/g, '').trim())
  );
}

/**
 * Search rows for a pattern in columns 0+1 (concatenated).
 * Returns the matching row or null.
 */
function findRow(rows, pattern) {
  for (const row of rows) {
    const label = (row[0] || '') + (row[1] || '');
    if (label.includes(pattern)) {
      return row;
    }
  }
  return null;
}

/**
 * Parse a value string: strip commas, parse as float, default to 0.
 */
function pv(s) {
  return parseFloat((s || '0').replace(/,/g, '')) || 0;
}

/**
 * Extract the last non-empty value from a row.
 */
function lastVal(row) {
  if (!row) {
    return 0;
  }
  for (let i = row.length - 1; i >= 0; i--) {
    const v = row[i].trim();
    if (v !== '') {
      return pv(v);
    }
  }
  return 0;
}

/**
 * Find a row and extract its last non-empty value.
 */
function findVal(rows, pattern) {
  const row = findRow(rows, pattern);
  return lastVal(row);
}

// ── Balance Sheet ────────────────────────────────────────────────────────────

/**
 * Parse a Xero Balance Sheet CSV for a given entity.
 * @param {string} entity - 'au' or 'eu'
 * @param {string} text - Raw CSV text
 * @returns {{ ok: true, data: Object } | { ok: false, error: string }}
 */
function parseBalanceSheet(entity, text) {
  if (!text || !text.trim()) {
    return { ok: false, error: 'No data provided for Balance Sheet' };
  }

  const rows = parseFinRows(text);
  if (rows.length < 5) {
    return { ok: false, error: 'Balance Sheet data appears too short — expected at least 5 rows' };
  }

  // Extract period from "As at" row
  let period = '';
  for (const row of rows.slice(0, 6)) {
    const joined = row.join(' ');
    if (joined.includes('As at')) {
      period = joined.replace(/.*As at\s*/i, '').trim();
      break;
    }
  }

  // Extract bank account details (rows between "Bank" and "Total Bank")
  const bankDetail = [];
  let inBank = false;
  for (const row of rows) {
    const label = (row[0] || '') + (row[1] || '');
    if (!inBank && label.includes('Bank') && !label.includes('Total') && !label.includes('Fee') && !label.includes('Reval')) {
      inBank = true;
    }
    if (inBank && label.includes('Total Bank')) {
      inBank = false;
      continue;
    }
    if (inBank) {
      const name = (row[0] || '').trim();
      const val = lastVal(row);
      if (name) {
        bankDetail.push({ name, val });
      }
    }
  }

  const data = {
    period,
    bank: findVal(rows, 'Total Bank'),
    bankDetail,
    currentAssets: findVal(rows, 'Total Current Assets'),
    fixedAssets: findVal(rows, 'Total Fixed Assets'),
    nonCurrentAssets: findVal(rows, 'Total Non-current Assets'),
    assets: findVal(rows, 'Total Assets'),
    currentLiabilities: findVal(rows, 'Total Current Liabilities'),
    liabilities: findVal(rows, 'Total Liabilities'),
    unearnedIncome: findVal(rows, 'Unearned Income'),
    netAssets: findVal(rows, 'Net Assets'),
    retainedEarnings: findVal(rows, 'Retained Earnings'),
    shareCapital: findVal(rows, 'Ordinary shares') || findVal(rows, 'Share Capital'),
    currentYearEarnings: findVal(rows, 'Current Year Earnings')
  };

  // Extract FX rates from AU balance sheet (bank account names may contain "EUR", "USD")
  if (entity === 'au') {
    const fxData = {};
    for (const row of rows) {
      const label = (row[0] || '') + (row[1] || '');
      const eurMatch = label.match(/([\d.]+)\s*EUR/);
      const usdMatch = label.match(/([\d.]+)\s*USD/);
      if (eurMatch) {
        fxData.fxEur = parseFloat(eurMatch[1]);
      }
      if (usdMatch) {
        fxData.fxUsd = parseFloat(usdMatch[1]);
      }
    }
    Object.assign(data, fxData);
  }

  // Basic validation — we should have found at least assets
  if (data.assets === 0 && data.bank === 0 && data.netAssets === 0) {
    return { ok: false, error: `Balance Sheet ${entity.toUpperCase()}: Could not find expected account lines (Total Assets, Total Bank, Net Assets)` };
  }

  return { ok: true, data };
}

// ── Profit & Loss ────────────────────────────────────────────────────────────

/**
 * Parse a Xero Profit & Loss CSV.
 * @param {string} entity - 'au' or 'eu'
 * @param {string} type - 'mo' (month) or 'ytd' (year to date)
 * @param {string} text - Raw CSV text
 * @returns {{ ok: true, data: Object } | { ok: false, error: string }}
 */
function parseProfitLoss(entity, type, text) {
  if (!text || !text.trim()) {
    return { ok: false, error: 'No data provided for P&L' };
  }

  const rows = parseFinRows(text);
  if (rows.length < 5) {
    return { ok: false, error: 'P&L data appears too short — expected at least 5 rows' };
  }

  // Find header row containing "Account"
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if ((rows[i][0] || '').includes('Account')) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) {
    return { ok: false, error: `P&L ${entity.toUpperCase()} ${type}: Could not find header row containing "Account"` };
  }

  const headers = rows[headerIdx];

  // Extract period info
  let period = '';
  for (const row of rows.slice(0, headerIdx)) {
    const joined = row.join(' ');
    if (joined.includes('month ended') || joined.includes('period')) {
      period = joined.trim();
      break;
    }
  }

  // Helper: find pattern and extract values from columns 1, 2, 3
  function findPLVal(pattern, colIdx) {
    const row = findRow(rows, pattern);
    if (!row) {
      return 0;
    }
    return pv(row[colIdx] || '0');
  }

  const data = {
    period,
    revenue: findPLVal('Total Trading Income', 1),
    cos: findPLVal('Total Cost of Sales', 1),
    gp: findPLVal('Gross Profit', 1),
    opex: findPLVal('Total Operating Expenses', 1),
    net: findPLVal('Net Profit', 1),
    p1: {
      label: (headers[2] || '').trim(),
      revenue: findPLVal('Total Trading Income', 2),
      cos: findPLVal('Total Cost of Sales', 2),
      gp: findPLVal('Gross Profit', 2),
      opex: findPLVal('Total Operating Expenses', 2),
      net: findPLVal('Net Profit', 2)
    },
    p2: {
      label: (headers[3] || '').trim(),
      revenue: findPLVal('Total Trading Income', 3),
      cos: findPLVal('Total Cost of Sales', 3),
      gp: findPLVal('Gross Profit', 3),
      opex: findPLVal('Total Operating Expenses', 3),
      net: findPLVal('Net Profit', 3)
    }
  };

  // Month-only: extract revenue breakdown lines
  if (type === 'mo') {
    data.intlSales = findPLVal('International Sales', 1);
    data.reimb = findPLVal('Reimbursement', 1);
    data.ieFees = findPLVal('International Experts', 1);
    data.refFees = findPLVal('Referral Partner', 1);
    data.clientExp = findPLVal('Client-Charged', 1);
  }

  return { ok: true, data };
}

// ── Xero Invoices ────────────────────────────────────────────────────────────

/**
 * Parse a Xero Invoice CSV (standard header+rows format).
 * @param {string} text - Raw CSV text
 * @returns {{ ok: true, data: Object[], rowCount: number } | { ok: false, error: string }}
 */
function parseInvoices(text) {
  const result = parseCSV(text);
  if (!result.ok) {
    return { ok: false, error: `Invoice import: ${result.error}` };
  }

  return { ok: true, data: result.data, rowCount: result.rowCount };
}

export { parseBalanceSheet, parseProfitLoss, parseInvoices };
