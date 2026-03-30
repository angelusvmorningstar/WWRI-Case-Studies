/**
 * hubspot-parsers.js — HubSpot CSV/TSV parsing for deals, leads, and rolling totals
 */

import { parseCSV } from '../shared/csv-parser.js';

const STAGE_KEYS = ['M4', 'M3', 'M2.5', 'M2', 'M1.5', 'M1'];

/**
 * Map a deal stage string to a stage key (M1-M4) or null.
 */
function toStageKey(stage) {
  if (!stage) {
    return null;
  }
  for (const sk of STAGE_KEYS) {
    if (stage.includes(sk)) {
      return sk;
    }
  }
  return null;
}

/**
 * Convert a CSV row to a deal object.
 */
function toDeal(r) {
  const name = (r['Deal Name'] || '').trim().replace(/[–—]/g, '-');
  const stage = (r['Deal Stage'] || '').trim();

  return {
    id: r['Record ID'] || `r${Math.random().toString(36).slice(2, 8)}`,
    name,
    company: (r['Associated Company'] || '').trim(),
    stage,
    sk: toStageKey(stage),
    lead: (r['IE Lead'] || '').trim(),
    amt: parseFloat(r['Amount']) || 0,
    close: parseDateField(r['Close Date']),
    act: parseDateField(r['Last Activity Date']),
    ref: (r['Referee'] || '').trim(),
    dm1: parseFloat(r['Days_M1']) || null,
    dm15: parseFloat(r['Days_M1.5']) || null,
    dm2: parseFloat(r['Days_M2']) || null,
    dm25: parseFloat(r['Days_M2.5']) || null,
    dm3: parseFloat(r['Days_M3']) || null,
    dm4: parseFloat(r['Days_M4']) || null
  };
}

/**
 * Parse date fields — extract date portion only.
 */
function parseDateField(val) {
  if (!val) {
    return '';
  }
  const trimmed = val.trim();
  const match = trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return match[0];
  }
  return trimmed.slice(0, 10);
}

// ── Full Pipeline Import ─────────────────────────────────────────────────────

/**
 * Parse a full HubSpot pipeline export — replaces the deal database.
 * @param {string} text - Raw CSV/TSV text
 * @returns {{ ok: true, data: Object, count: number } | { ok: false, error: string }}
 */
function parseFullPipeline(text) {
  const result = parseCSV(text);
  if (!result.ok) {
    return { ok: false, error: `Pipeline import: ${result.error}` };
  }

  if (!result.columns.includes('Deal Name')) {
    return { ok: false, error: 'Pipeline import: Expected column "Deal Name" not found' };
  }

  const db = {};
  for (const row of result.data) {
    if (!row['Deal Name']) {
      continue;
    }
    const deal = toDeal(row);
    db[deal.id] = deal;
  }

  const count = Object.keys(db).length;
  if (count === 0) {
    return { ok: false, error: 'Pipeline import: No deals found in data' };
  }

  return { ok: true, data: db, count };
}

// ── Active Deals Update (Merge) ──────────────────────────────────────────────

/**
 * Parse an active deals update — merge with existing, detect stale deals.
 * @param {string} text - Raw CSV/TSV text
 * @param {Object} existingDb - Current deal database
 * @returns {{ ok: true, data: Object, added: number, updated: number, stale: Object[] } | { ok: false, error: string }}
 */
function parseActiveUpdate(text, existingDb) {
  const result = parseCSV(text);
  if (!result.ok) {
    return { ok: false, error: `Active update: ${result.error}` };
  }

  if (!result.columns.includes('Deal Name')) {
    return { ok: false, error: 'Active update: Expected column "Deal Name" not found' };
  }

  const db = { ...existingDb };
  const seen = {};
  let added = 0;
  let updated = 0;

  for (const row of result.data) {
    if (!row['Deal Name']) {
      continue;
    }
    const deal = toDeal(row);
    seen[deal.id] = true;

    if (db[deal.id]) {
      // Preserve company if new import missing it
      if (!deal.company && db[deal.id].company) {
        deal.company = db[deal.id].company;
      }
      updated++;
    } else {
      added++;
    }
    db[deal.id] = deal;
  }

  // Detect stale deals — active deals not in new import
  const stale = Object.values(db).filter(d => d.sk && !seen[d.id]);

  return { ok: true, data: db, added, updated, stale };
}

// ── Leads Import ─────────────────────────────────────────────────────────────

/**
 * Parse HubSpot leads/contacts CSV.
 * @param {string} text - Raw CSV/TSV text
 * @returns {{ ok: true, data: Object[], count: number } | { ok: false, error: string }}
 */
function parseLeads(text) {
  const result = parseCSV(text);
  if (!result.ok) {
    return { ok: false, error: `Leads import: ${result.error}` };
  }

  const now = Date.now();
  const leads = [];

  for (const row of result.data) {
    const stage = (row['Lead Stage'] || '').trim();
    const owner = (row['Contact owner'] || '').trim();

    if (!stage.startsWith('0.') || !owner) {
      continue;
    }

    const stageDate = parseDateField(row['Date entered current stage']);
    let days = null;
    if (stageDate) {
      const d = new Date(stageDate);
      if (!isNaN(d.getTime())) {
        days = Math.floor((now - d.getTime()) / 86400000);
      }
    }

    leads.push({
      id: row['Record ID'] || '',
      first: (row['First Name'] || '').trim(),
      last: (row['Last Name'] || '').trim(),
      co: (row['Associated Company (Primary)'] || '').trim(),
      owner,
      stage: stage.slice(0, 3),
      cat: (row['Category'] || 'Uncategorised').trim(),
      pri: (row['Prioritisation'] || '').trim(),
      days,
      lastAct: parseDateField(row['Last Activity Date']),
      linkedin: (row['Linkedin account'] || '').trim()
    });
  }

  if (leads.length === 0) {
    return { ok: false, error: 'Leads import: No valid leads found (require Lead Stage 0.x and Contact owner)' };
  }

  return { ok: true, data: leads, count: leads.length };
}

// ── Rolling Monthly Totals ───────────────────────────────────────────────────

/**
 * Parse rolling monthly pipeline totals CSV.
 * @param {string} text - Raw CSV/TSV text
 * @param {Object[]} existingSnaps - Current snapshots array
 * @returns {{ ok: true, data: Object[], count: number } | { ok: false, error: string }}
 */
function parseRollingTotals(text, existingSnaps) {
  if (!text || !text.trim()) {
    return { ok: false, error: 'Rolling totals: No data provided' };
  }

  const sep = text.includes('\t') ? '\t' : ',';
  const rows = text.trim().split('\n').map(line =>
    line.split(sep).map(c => c.replace(/^"|"$/g, '').trim())
  );

  if (rows.length < 2) {
    return { ok: false, error: 'Rolling totals: Need at least a header row and data' };
  }

  // Headers are month labels (e.g., "Jan-26", "Feb-26")
  const headers = rows[0];
  const monthCols = [];
  for (let i = 1; i < headers.length; i++) {
    const label = headers[i].trim();
    if (!label || label.toLowerCase() === 'total') {
      continue;
    }
    const key = monthLabelToKey(label);
    if (key) {
      monthCols.push({ col: i, label, key });
    }
  }

  if (monthCols.length === 0) {
    return { ok: false, error: 'Rolling totals: Could not find month columns in header' };
  }

  // Find data rows by label pattern
  const findRow = (patterns) => {
    for (const row of rows) {
      const label = (row[0] || '').trim();
      if (patterns.some(p => label.includes(p))) {
        return row;
      }
    }
    return null;
  };

  const activeRow = findRow(['Active Projects', 'Active projects']);
  const m34Row = findRow(['M3-M4', 'M3 - M4', 'M3 – M4']);
  const m12Row = findRow(['M1-M2', 'M1 - M2', 'M1 – M2']);

  const parseVal = (row, col) => {
    if (!row || !row[col]) {
      return 0;
    }
    return parseInt(row[col].replace(/[^0-9.-]/g, ''), 10) || 0;
  };

  // Build snapshots
  const newSnaps = monthCols.map(mc => ({
    key: mc.key,
    label: mc.label,
    active: parseVal(activeRow, mc.col),
    m34: parseVal(m34Row, mc.col),
    m12: parseVal(m12Row, mc.col)
  }));

  // Merge with existing — new wins on conflict, keep last 24 months
  const merged = {};
  for (const s of (existingSnaps || [])) {
    merged[s.key] = s;
  }
  for (const s of newSnaps) {
    merged[s.key] = s;
  }

  const combined = Object.values(merged)
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-24);

  return { ok: true, data: combined, count: newSnaps.length };
}

/**
 * Convert month label (e.g., "Jan-26") to YYYY-MM key.
 */
function monthLabelToKey(label) {
  const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
                   Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
  const match = label.match(/^(\w{3})-(\d{2})$/);
  if (!match) {
    return null;
  }
  const mm = months[match[1]];
  if (!mm) {
    return null;
  }
  const year = parseInt(match[2], 10) + 2000;
  return `${year}-${mm}`;
}

export { parseFullPipeline, parseActiveUpdate, parseLeads, parseRollingTotals };
