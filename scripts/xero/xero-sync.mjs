/**
 * xero-sync.mjs — Pull Balance Sheet, P&L, and outstanding Invoices from Xero.
 *
 * Usage: node scripts/xero/xero-sync.mjs
 *
 * Requires: xero.config.json + .xero-tokens.json (created by xero-auth.mjs)
 *
 * Outputs JSON files to toolkit/data/live/:
 *   bs-{entity}.json        Balance Sheet
 *   pl-{entity}-mo.json     P&L current month
 *   pl-{entity}-ytd.json    P&L financial year to date (AU FY = Jul–Jun)
 *   invoices-{entity}.json  Outstanding invoices (AUTHORISED status)
 *
 * Load these files in the Finance Toolkit via Controls → Xero API Sync.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dir, 'xero.config.json');
const TOKENS_FILE = path.join(__dir, '.xero-tokens.json');
// Resolve relative to this script: scripts/xero/ → ../../toolkit/data/live
const OUT_DIR = path.resolve(__dir, '../../toolkit/data/live');

const API_BASE = 'https://api.xero.com/api.xro/2.0';
const TOKEN_URL = 'https://identity.xero.com/connect/token';

// ── Token management ──────────────────────────────────────────────────────────

function loadState() {
  if (!existsSync(TOKENS_FILE)) {
    throw new Error('No tokens found. Run: node scripts/xero/xero-auth.mjs first.');
  }
  return {
    tokens: JSON.parse(readFileSync(TOKENS_FILE, 'utf8')),
    config: JSON.parse(readFileSync(CONFIG_FILE, 'utf8')),
  };
}

async function refreshIfNeeded(tokens, config) {
  if (Date.now() < tokens.expires_at) return tokens;

  console.log('  Refreshing access token...');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} — ${await res.text()}`);

  const fresh = await res.json();
  fresh.expires_at = Date.now() + (fresh.expires_in - 60) * 1000;
  writeFileSync(TOKENS_FILE, JSON.stringify(fresh, null, 2));
  return fresh;
}

// ── Xero API ──────────────────────────────────────────────────────────────────

async function xeroGet(endpoint, accessToken, tenantId, params = {}) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Xero-tenant-id': tenantId,
      Accept: 'application/json',
    },
  });

  if (!res.ok) throw new Error(`GET ${endpoint}: ${res.status} — ${await res.text()}`);
  return res.json();
}

// ── Row traversal helpers ─────────────────────────────────────────────────────

function pv(v) {
  if (v === undefined || v === null || v === '') return 0;
  const s = v.toString().trim();
  const neg = s.startsWith('(') && s.endsWith(')');
  const n = parseFloat(s.replace(/[(),\s$€£]/g, '').replace(/,/g, ''));
  return isNaN(n) ? 0 : (neg ? -n : n);
}

function cellVal(row, colIndex = 1) {
  return pv(row?.Cells?.[colIndex]?.Value);
}

function cellLabel(row) {
  return (row?.Cells?.[0]?.Value || '').trim();
}

/** Find a Section by title keyword; search is case-insensitive across all rows. */
function findSection(rows, keyword) {
  const kw = keyword.toLowerCase();
  for (const row of rows) {
    if (row.RowType === 'Section') {
      if ((row.Title || '').toLowerCase().includes(kw)) return row;
      const found = findSection(row.Rows || [], keyword);
      if (found) return found;
    }
  }
  return null;
}

/** Get the SummaryRow value from a Section's direct children. */
function sectionTotal(section) {
  if (!section) return 0;
  const summary = (section.Rows || []).find(r => r.RowType === 'SummaryRow');
  return summary ? cellVal(summary) : 0;
}

/** Get all direct Row entries (not SummaryRow or sub-sections) from a Section. */
function sectionLineItems(section) {
  if (!section) return [];
  return (section.Rows || []).filter(r => r.RowType === 'Row');
}

/** Walk all rows recursively; return value of first row whose label matches keyword. */
function findLineItem(rows, keyword) {
  const kw = keyword.toLowerCase();
  for (const row of rows) {
    if (row.RowType === 'Row' && cellLabel(row).toLowerCase().includes(kw)) {
      return cellVal(row);
    }
    if (row.Rows) {
      const v = findLineItem(row.Rows, keyword);
      if (v !== 0) return v;
    }
  }
  return 0;
}

// ── Balance Sheet transform ───────────────────────────────────────────────────

function transformBalanceSheet(report, entity) {
  const rows = report.Rows || [];
  const period = `As at ${report.ReportDate || ''}`;

  const bankSection    = findSection(rows, 'bank');
  const curAssetSec    = findSection(rows, 'current assets');
  const fixedAssetSec  = findSection(rows, 'fixed assets');
  const nonCurAssetSec = findSection(rows, 'non-current assets');
  const curLiabSec     = findSection(rows, 'current liabilities');
  const nonCurLiabSec  = findSection(rows, 'non-current liabilities');
  const equitySection  = findSection(rows, 'equity');

  const bank             = sectionTotal(bankSection);
  const currentAssets    = sectionTotal(curAssetSec);
  const fixedAssets      = sectionTotal(fixedAssetSec);
  const nonCurrentAssets = sectionTotal(nonCurAssetSec);
  const currentLiabilities    = sectionTotal(curLiabSec);
  const nonCurrentLiabilities = sectionTotal(nonCurLiabSec);

  const bankDetail = sectionLineItems(bankSection).map(r => ({
    name: cellLabel(r),
    val:  cellVal(r),
  })).filter(r => r.name && r.val !== 0);

  const equityRows = equitySection ? equitySection.Rows || [] : rows;
  const retainedEarnings    = findLineItem(equityRows, 'retained earnings');
  const currentYearEarnings = findLineItem(equityRows, 'current year earnings');
  const shareCapital        = findLineItem(equityRows, 'share capital')
                           || findLineItem(equityRows, 'ordinary shares');
  const unearnedIncome      = findLineItem(rows, 'unearned income');

  const assets     = bank + currentAssets + fixedAssets + nonCurrentAssets;
  const liabilities = currentLiabilities + nonCurrentLiabilities;
  const netAssets  = assets - liabilities;

  const data = {
    period, bank, bankDetail,
    currentAssets, fixedAssets, nonCurrentAssets, assets,
    currentLiabilities, nonCurrentLiabilities, liabilities,
    unearnedIncome, netAssets,
    retainedEarnings, shareCapital, currentYearEarnings,
  };

  // AU: extract embedded FX balances from bank account names (e.g. "12,799.86 EUR")
  if (entity === 'au') {
    for (const item of bankDetail) {
      const eurMatch = item.name.match(/([\d,.]+)\s*EUR/i);
      const usdMatch = item.name.match(/([\d,.]+)\s*USD/i);
      if (eurMatch) data.fxEur = pv(eurMatch[1]);
      if (usdMatch) data.fxUsd = pv(usdMatch[1]);
    }
  }

  return { ok: true, data };
}

// ── P&L transform ─────────────────────────────────────────────────────────────

function transformProfitLoss(report, entity, type) {
  const rows = report.Rows || [];
  const period = report.ReportDate || '';

  const incomeSec = findSection(rows, 'trading income') || findSection(rows, 'income');
  const cosSec    = findSection(rows, 'cost of sales');
  const opexSec   = findSection(rows, 'operating expenses') || findSection(rows, 'expenses');

  const revenue = sectionTotal(incomeSec);
  const cos     = sectionTotal(cosSec);
  const opex    = sectionTotal(opexSec);
  const gp      = revenue - cos;
  const net     = gp - opex;

  const data = {
    period, revenue, cos, gp, opex, net,
    p1: { label: '', revenue: 0, cos: 0, gp: 0, opex: 0, net: 0 },
    p2: { label: '', revenue: 0, cos: 0, gp: 0, opex: 0, net: 0 },
  };

  if (type === 'mo') {
    data.intlSales = findLineItem(rows, 'international sales');
    data.reimb     = findLineItem(rows, 'reimbursement');
    data.ieFees    = findLineItem(rows, 'international experts');
    data.refFees   = findLineItem(rows, 'referral partner') || findLineItem(rows, 'referral');
    data.clientExp = findLineItem(rows, 'client-charged') || findLineItem(rows, 'client exp');
  }

  return { ok: true, data };
}

// ── Invoice transform ─────────────────────────────────────────────────────────

function xeroDateToISO(s) {
  if (!s) return '';
  const msMatch = s.match(/\/Date\((\d+)/);
  if (msMatch) return new Date(parseInt(msMatch[1])).toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}

function transformInvoices(raw, entity) {
  const SKIP = new Set(['PAID', 'VOIDED', 'DRAFT', 'DELETED']);
  const data = (raw.Invoices || [])
    .filter(inv => !SKIP.has(inv.Status) && inv.AmountDue > 0)
    .map(inv => ({
      invoiceId: inv.InvoiceNumber,
      client:    inv.Contact?.Name || '',
      project:   inv.Reference || inv.InvoiceNumber,
      due:       xeroDateToISO(inv.DueDate),
      rev:       inv.AmountDue,
      cur:       inv.CurrencyCode || (entity === 'au' ? 'AUD' : entity === 'us' ? 'USD' : 'EUR'),
      entity:    entity.toUpperCase(),
      status:    inv.Status === 'AUTHORISED' ? 1 : 2,
    }));

  return { ok: true, data, rowCount: data.length };
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function toISO(d) { return d.toISOString().slice(0, 10); }

function fyStart(d) {
  // AU/EU financial year starts 1 July
  return d.getMonth() >= 6
    ? `${d.getFullYear()}-07-01`
    : `${d.getFullYear() - 1}-07-01`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('── Xero Sync ─────────────────────────────────────────────────────');

  let { tokens, config } = loadState();
  tokens = await refreshIfNeeded(tokens, config);

  const connectRes = await fetch('https://api.xero.com/connections', {
    headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: 'application/json' },
  });
  if (!connectRes.ok) throw new Error(`Connections call failed: ${connectRes.status}`);
  const connections = await connectRes.json();

  if (connections.length === 0) {
    throw new Error('No connected orgs. Re-run xero-auth.mjs to re-authorise.');
  }

  console.log(`\nConnected: ${connections.map(c => c.tenantName).join(', ')}`);

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const syncedAt = new Date().toISOString();
  const today = new Date();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const todayISO = toISO(today);

  const written = [];

  for (const conn of connections) {
    const { tenantId, tenantName } = conn;
    const entity = tenantName.toLowerCase().includes(' us') ? 'us'
                 : tenantName.toLowerCase().includes('europe') ? 'eu'
                 : 'au';

    console.log(`\n${tenantName} (${entity.toUpperCase()})`);

    // Balance Sheet
    try {
      const raw = await xeroGet('Reports/BalanceSheet', tokens.access_token, tenantId);
      const result = transformBalanceSheet(raw.Reports?.[0] || {}, entity);
      result.syncedAt = syncedAt;
      result.orgName = tenantName;
      const file = path.join(OUT_DIR, `bs-${entity}.json`);
      writeFileSync(file, JSON.stringify(result, null, 2));
      written.push(`bs-${entity}.json`);
      console.log(`  ✓ Balance Sheet — bank: ${result.data.bank.toFixed(2)} | assets: ${result.data.assets.toFixed(2)}`);
    } catch (e) { console.warn(`  ✗ Balance Sheet: ${e.message}`); }

    // P&L month-to-date
    try {
      const raw = await xeroGet('Reports/ProfitAndLoss', tokens.access_token, tenantId, {
        fromDate: monthStart,
        toDate: todayISO,
      });
      const result = transformProfitLoss(raw.Reports?.[0] || {}, entity, 'mo');
      result.syncedAt = syncedAt;
      const file = path.join(OUT_DIR, `pl-${entity}-mo.json`);
      writeFileSync(file, JSON.stringify(result, null, 2));
      written.push(`pl-${entity}-mo.json`);
      console.log(`  ✓ P&L (month)  — revenue: ${result.data.revenue.toFixed(2)}`);
    } catch (e) { console.warn(`  ✗ P&L monthly: ${e.message}`); }

    // P&L YTD (AU financial year Jul–Jun)
    try {
      const raw = await xeroGet('Reports/ProfitAndLoss', tokens.access_token, tenantId, {
        fromDate: fyStart(today),
        toDate: todayISO,
      });
      const result = transformProfitLoss(raw.Reports?.[0] || {}, entity, 'ytd');
      result.syncedAt = syncedAt;
      const file = path.join(OUT_DIR, `pl-${entity}-ytd.json`);
      writeFileSync(file, JSON.stringify(result, null, 2));
      written.push(`pl-${entity}-ytd.json`);
      console.log(`  ✓ P&L (YTD)    — revenue: ${result.data.revenue.toFixed(2)}`);
    } catch (e) { console.warn(`  ✗ P&L YTD: ${e.message}`); }

    // Outstanding invoices
    try {
      const raw = await xeroGet('Invoices', tokens.access_token, tenantId, {
        Statuses: 'AUTHORISED,SUBMITTED',
      });
      const result = transformInvoices(raw, entity);
      result.syncedAt = syncedAt;
      const file = path.join(OUT_DIR, `invoices-${entity}.json`);
      writeFileSync(file, JSON.stringify(result, null, 2));
      written.push(`invoices-${entity}.json`);
      console.log(`  ✓ Invoices     — ${result.rowCount} outstanding`);
    } catch (e) { console.warn(`  ✗ Invoices: ${e.message}`); }
  }

  console.log(`\n✓ Done — ${written.length} file(s) written to toolkit/data/live/`);
  console.log('  Load them in Finance Toolkit → Controls → Xero API Sync\n');
}

main().catch(err => { console.error('\n✗', err.message); process.exit(1); });
