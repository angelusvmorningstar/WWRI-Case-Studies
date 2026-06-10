/**
 * test-epic6.mjs — Quinn's Epic 6 test suite
 *
 * Covers the pure-function and data-structure tests:
 *   T1. GST BAS window miss (Oct-Dec revenue, Jan outside horizon)
 *   T2. GST BAS window hit (Jan inside horizon)
 *   T3. GST year boundary (Oct → Jan next year, not current year)
 *   T4. GST override takes precedence over computed value
 *   T5. Status filter — only Status 1 & 2 accrue GST; 3/4 are excluded
 *   T6. Expense seed — all 25 lines have exactly 10 elements
 *   T7. calcFees — IE fee is on net-of-referral revenue, not gross
 *   T8. calcFees — zero iePct and refPct return full margin
 *
 * Run: node test-epic6.mjs
 */

import { readFileSync } from 'fs';
import assert from 'assert/strict';

// ── Colour helpers ────────────────────────────────────────────────────────────
const GREEN  = s => `\x1b[32m${s}\x1b[0m`;
const RED    = s => `\x1b[31m${s}\x1b[0m`;
const BOLD   = s => `\x1b[1m${s}\x1b[0m`;
const DIM    = s => `\x1b[2m${s}\x1b[0m`;

let passed = 0, failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ${GREEN('✓')} ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ${RED('✗')} ${name}`);
    console.log(`    ${RED(e.message)}`);
    failed++;
  }
}

// ── Inline dependencies (no store/DOM) ───────────────────────────────────────

// Stripped-down generateMonthColumns — no formatMonthYear needed for tests
function makeMonths(count, fromYear, fromMonth) {
  const cols = [];
  for (let i = 0; i < count; i++) {
    const totalMonths = fromMonth + i;
    const year  = fromYear + Math.floor(totalMonths / 12);
    const month = totalMonths % 12;
    cols.push({ index: i, year, month, label: `${year}-${String(month + 1).padStart(2, '0')}` });
  }
  return cols;
}

// Inlined from gst.js (logic under test)
function basPaymentMonth(revMonth) {
  if (revMonth <= 2) return 3;
  if (revMonth <= 5) return 6;
  if (revMonth <= 8) return 9;
  return 0;
}

function calculateGSTRemittance(revenueLines, months, gstCfg) {
  const computed = new Array(months.length).fill(0);
  for (const line of revenueLines) {
    if (!line.gstApplicable) continue;
    if (line.status !== 1 && line.status !== 2) continue;
    if (!line.due) continue;

    const d      = new Date(line.due);
    const revIdx = months.findIndex(m => m.year === d.getFullYear() && m.month === d.getMonth());
    if (revIdx === -1) continue;

    const revMonth = months[revIdx].month;
    const revYear  = months[revIdx].year;
    const bm       = basPaymentMonth(revMonth);
    const by       = revMonth >= 9 ? revYear + 1 : revYear;
    const basIdx   = months.findIndex(m => m.month === bm && m.year === by);
    if (basIdx === -1) continue;

    // AUD-only for tests (convertToAUD = identity)
    computed[basIdx] += (line.rev || 0) * 0.10;
  }

  const overrides = (gstCfg && gstCfg.overrides) || {};
  return months.map((m, i) => {
    const key = `${m.year}-${String(m.month + 1).padStart(2, '0')}`;
    return key in overrides ? overrides[key] : computed[i];
  });
}

// Inlined from calc.js
function calcFees(audValue, iePct, refPct) {
  const refFee = audValue * (refPct || 0);
  const ieFee  = (audValue - refFee) * (iePct || 0);
  const margin = audValue - refFee - ieFee;
  return { refFee, ieFee, margin };
}

// ── T1–T5: GST / BAS ─────────────────────────────────────────────────────────

console.log(BOLD('\nT1–T5  GST / BAS remittance'));

test('T1  Oct-Dec revenue: BAS silently dropped when Jan is outside horizon', () => {
  // Horizon: Jun 2026 – Mar 2027 (10 months, month indices 5–2)
  // Dec 2026 revenue should pay BAS in Jan 2027 — but Jan 2027 is NOT in this window
  // Horizon ends at Mar 2027 (month=2 of 2027, index=9) — wait, let's make it end in Dec 2026
  // Horizon: Jun 2026 – Mar 2027 actually DOES include Jan 2027...
  // Let's use: Jul 2026 – Apr 2027 (month 6 of 2026)... Jan 2027 is col 6 (in window)
  // To get window miss: need Dec to be the last column. Use Oct 2026 – Jul 2027.
  // Actually: to miss Jan 2027, horizon must end BEFORE Jan 2027.
  // Window: Apr 2026 – Jan 2027 (month 3, 10 cols = Apr–Jan, last col = Jan 2027 = in window)
  // Simpler: make window end in Dec 2026 by using Mar 2026 – Dec 2026
  //   → Dec 2026 revenue → Jan 2027 BAS → Jan 2027 NOT in window → silent drop
  const months = makeMonths(10, 2026, 2); // Mar 2026 – Dec 2026

  const lines = [{ rev: 10000, cur: 'AUD', due: '2026-12-01', status: 1, gstApplicable: true }];
  const result = calculateGSTRemittance(lines, months, {});

  // Jan 2027 is outside this horizon → GST should be 0 everywhere
  assert.deepEqual(result, new Array(10).fill(0),
    `Expected all zeros but got: ${JSON.stringify(result)}`);
});

test('T2  Oct-Dec revenue: BAS accumulates when Jan IS inside horizon', () => {
  // Window: Apr 2026 – Jan 2027 (month 3 of 2026, 10 cols → last col = Jan 2027)
  const months = makeMonths(10, 2026, 3); // Apr 2026 – Jan 2027

  const lines = [{ rev: 10000, cur: 'AUD', due: '2026-12-01', status: 1, gstApplicable: true }];
  const result = calculateGSTRemittance(lines, months, {});

  // Dec 2026 is col 8 (Apr=0, May=1, Jun=2, Jul=3, Aug=4, Sep=5, Oct=6, Nov=7, Dec=8)
  // Jan 2027 is col 9
  const janIdx = months.findIndex(m => m.year === 2027 && m.month === 0);
  assert.equal(janIdx, 9, `Expected Jan 2027 at index 9, got ${janIdx}`);
  assert.equal(result[9], 1000, `Expected $1000 GST at col 9, got ${result[9]}`);

  // All other cols should be 0
  const others = result.filter((v, i) => i !== 9);
  assert.deepEqual(others, new Array(9).fill(0));
});

test('T3  Year boundary: Oct revenue → Jan of NEXT year (not current)', () => {
  // Window covers Jan 2026 and Jan 2027
  const months = makeMonths(14, 2026, 0); // Jan 2026 – Feb 2027

  const lines = [{ rev: 5000, cur: 'AUD', due: '2026-10-15', status: 2, gstApplicable: true }];
  const result = calculateGSTRemittance(lines, months, {});

  const jan2026Idx = months.findIndex(m => m.year === 2026 && m.month === 0);
  const jan2027Idx = months.findIndex(m => m.year === 2027 && m.month === 0);

  assert.equal(result[jan2026Idx], 0, 'Jan 2026 should have no GST (Oct revenue → Jan 2027)');
  assert.equal(result[jan2027Idx], 500, `Expected $500 at Jan 2027, got ${result[jan2027Idx]}`);
});

test('T4  User override replaces computed GST for that month', () => {
  // Jan 2026 – Oct 2026 (10 cols)
  const months = makeMonths(10, 2026, 0);

  // Apr revenue → Jul BAS, computed = $1000
  const lines = [{ rev: 10000, cur: 'AUD', due: '2026-04-01', status: 1, gstApplicable: true }];
  const gstCfg = { overrides: { '2026-07': 9999 } }; // manual override for Jul 2026

  const result = calculateGSTRemittance(lines, months, gstCfg);

  const julIdx = months.findIndex(m => m.year === 2026 && m.month === 6);
  assert.equal(result[julIdx], 9999, `Override should win; expected 9999 got ${result[julIdx]}`);
});

test('T5  Status filter: only Status 1 & 2 accrue GST; Status 3 and 4 excluded', () => {
  const months = makeMonths(10, 2026, 0); // Jan–Oct 2026

  const lines = [
    { rev: 10000, cur: 'AUD', due: '2026-01-15', status: 1, gstApplicable: true }, // → Apr BAS
    { rev: 10000, cur: 'AUD', due: '2026-01-15', status: 2, gstApplicable: true }, // → Apr BAS
    { rev: 10000, cur: 'AUD', due: '2026-01-15', status: 3, gstApplicable: true }, // excluded
    { rev: 10000, cur: 'AUD', due: '2026-01-15', status: 4, gstApplicable: true }, // excluded
    { rev: 10000, cur: 'AUD', due: '2026-01-15', status: 1, gstApplicable: false }, // not GST-applicable
  ];

  const result = calculateGSTRemittance(lines, months, {});
  const aprIdx = months.findIndex(m => m.year === 2026 && m.month === 3);

  // Status 1 + 2 = 2 × $1000 = $2000
  assert.equal(result[aprIdx], 2000, `Expected $2000 (S1+S2 only), got ${result[aprIdx]}`);
});

// ── T6: Expense seed ──────────────────────────────────────────────────────────

console.log(BOLD('\nT6     Expense seed integrity'));

test('T6  All 25 expense lines have exactly 10 elements', () => {
  const raw = readFileSync('D:\\WWRI Development\\_archive\\public-v1\\data\\expense-categories.json', 'utf8');
  const data = JSON.parse(raw);

  const lines = data.categories.flatMap(cat => cat.lines);
  assert.equal(lines.length, 25, `Expected 25 lines, got ${lines.length}`);

  for (const line of lines) {
    assert.equal(
      line.defaults.length, 10,
      `Line "${line.id}" has ${line.defaults.length} elements (expected 10)`
    );
  }
});

test('T6b Updated values match May 2026 actuals', () => {
  const raw = readFileSync('D:\\WWRI Development\\_archive\\public-v1\\data\\expense-categories.json', 'utf8');
  const data = JSON.parse(raw);
  const find = id => data.categories.flatMap(c => c.lines).find(l => l.id === id);

  const checks = [
    { id: 'contractors', expected: 5000, label: 'contractors[1]', idx: 1 },
    { id: 'bookkeeping', expected: 800,  label: 'bookkeeping[1]', idx: 1 },
    { id: 'hubspot',     expected: 970,  label: 'hubspot[1]',     idx: 1 },
    { id: 'subs-au',     expected: 840,  label: 'subs-au[1]',     idx: 1 },
    { id: 'marcomms',    expected: 4000, label: 'marcomms[0]',    idx: 0 },
  ];

  for (const { id, expected, label, idx } of checks) {
    const line = find(id);
    assert.ok(line, `Line "${id}" not found`);
    assert.equal(line.defaults[idx], expected,
      `${label}: expected ${expected}, got ${line.defaults[idx]}`);
  }

  // Marcomms must be in Discretionary
  const disc = data.categories.find(c => c.name === 'Discretionary');
  assert.ok(disc.lines.find(l => l.id === 'marcomms'), 'marcomms not in Discretionary category');
});

// ── T9: GST override stability across horizon shift ──────────────────────────

console.log(BOLD('\nT9     GST override stability (Story 6.5)'));

test('T9  Override keyed by YYYY-MM lands in the correct column after horizon shift', () => {
  // Override for October 2026 should survive a horizon shift.
  // Window A: Jul 2026 – Apr 2027 (10 cols) — Oct 2026 is col 3
  // Window B: Sep 2026 – Jun 2027 (10 cols) — Oct 2026 is col 1
  const gstCfg = { overrides: { '2026-10': 7777 } };

  const windowA = makeMonths(10, 2026, 6); // Jul 2026 start
  const windowB = makeMonths(10, 2026, 8); // Sep 2026 start

  const resA = calculateGSTRemittance([], windowA, gstCfg);
  const resB = calculateGSTRemittance([], windowB, gstCfg);

  const octA = windowA.findIndex(m => m.year === 2026 && m.month === 9);
  const octB = windowB.findIndex(m => m.year === 2026 && m.month === 9);

  assert.equal(resA[octA], 7777, `Window A: expected 7777 at col ${octA}, got ${resA[octA]}`);
  assert.equal(resB[octB], 7777, `Window B: expected 7777 at col ${octB}, got ${resB[octB]}`);

  // Non-override cols must be zero (no revenue lines passed)
  assert.equal(resA.filter((v, i) => i !== octA && v !== 0).length, 0, 'Window A: unexpected non-zero col');
  assert.equal(resB.filter((v, i) => i !== octB && v !== 0).length, 0, 'Window B: unexpected non-zero col');
});

// ── T10: Paid installment exclusion ──────────────────────────────────────────

console.log(BOLD('\nT10–T11 Paid installment exclusion (Story 6.3)'));

// Inline deriveInstallments (calc.js — no format.js dependency for this function)
function deriveInstallments(phase) {
  const { split, total, startDate, weeks, avgPay } = phase;
  if (!startDate) return [];
  const DAY_MS  = 24 * 60 * 60 * 1000;
  const startMs = new Date(startDate).getTime();
  if (isNaN(startMs)) return [];
  const endMs = startMs + (weeks || 0) * 7 * DAY_MS;
  const midMs = Math.round((startMs + endMs) / 2);
  const payMs = (avgPay || 30) * DAY_MS;
  const due   = ms => new Date(ms + payMs).toISOString().slice(0, 10);

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
  const a = Math.round(total * 0.30);
  const b = Math.round(total * 0.30);
  return [
    { label: 'Start',  amount: a,             due: due(startMs) },
    { label: 'Middle', amount: b,             due: due(midMs)   },
    { label: 'End',    amount: total - a - b, due: due(endMs)   },
  ];
}

// Inline flattenProjectsToLines (cash-forecast.js interactive version)
function flattenProjectsToLines(projects) {
  const lines = [];
  for (const project of projects) {
    const iePct  = project.iePct  || 0;
    const refPct = project.refPct || 0;
    for (const phase of (project.phases || [])) {
      const installments = deriveInstallments(phase);
      for (let i = 0; i < installments.length; i++) {
        const paid = (phase.paid || [])[i] === true;
        if (paid) continue;
        lines.push({
          rev:           installments[i].amount,
          cur:           phase.currency || 'AUD',
          due:           installments[i].due,
          iePct, refPct,
          status:        phase.status,
          gstApplicable: phase.gstApplicable || false,
        });
      }
    }
  }
  return lines;
}

test('T10  Single paid installment is excluded entirely', () => {
  const projects = [{
    iePct: 0, refPct: 0,
    phases: [{
      split: 'single', total: 10000, startDate: '2026-04-01', avgPay: 0,
      status: 1, gstApplicable: true,
      paid: [true],
    }],
  }];

  const lines = flattenProjectsToLines(projects);
  assert.equal(lines.length, 0, `Expected 0 lines (all paid), got ${lines.length}`);
});

test('T11  5050 split: first paid, second unpaid — only second appears', () => {
  const projects = [{
    iePct: 0, refPct: 0,
    phases: [{
      split: '5050', total: 10000, startDate: '2026-04-01', weeks: 8, avgPay: 0,
      status: 1, gstApplicable: true,
      paid: [true, false],
    }],
  }];

  const lines = flattenProjectsToLines(projects);
  assert.equal(lines.length, 1, `Expected 1 line (second installment only), got ${lines.length}`);
  assert.equal(lines[0].rev, 5000, `Expected $5000 (second half), got ${lines[0].rev}`);
});

// ── T12: IE payable paid-flag exclusion ───────────────────────────────────────

console.log(BOLD('\nT12–T13 IE payable exclusion (Story 6.3)'));

// Inline the iePayables accumulation loop
function accumulateIEPayables(iePayables, months) {
  const cosByMonth = new Array(months.length).fill(0);
  for (const p of (iePayables || [])) {
    if (p.paid || !p.expectedPayMonth) continue;
    const [year, mon] = p.expectedPayMonth.split('-').map(Number);
    const idx = months.findIndex(m => m.year === year && m.month === mon - 1);
    if (idx !== -1) cosByMonth[idx] += p.ieFee || 0;
  }
  return cosByMonth;
}

test('T12  Unpaid IE payable accumulates into cosByMonth', () => {
  const months = makeMonths(10, 2026, 0); // Jan–Oct 2026
  const payables = [{ paid: false, expectedPayMonth: '2026-04', ieFee: 3500 }];
  const cos = accumulateIEPayables(payables, months);

  const aprIdx = months.findIndex(m => m.year === 2026 && m.month === 3);
  assert.equal(cos[aprIdx], 3500, `Expected $3500 at Apr 2026, got ${cos[aprIdx]}`);
});

test('T13  Paid IE payable is excluded from cosByMonth', () => {
  const months = makeMonths(10, 2026, 0);
  const payables = [{ paid: true, expectedPayMonth: '2026-04', ieFee: 3500 }];
  const cos = accumulateIEPayables(payables, months);

  assert.deepEqual(cos, new Array(10).fill(0), 'Expected all zeros; paid payable should be excluded');
});

// ── T14: Americas opening balance ─────────────────────────────────────────────

console.log(BOLD('\nT14–T15 Americas entity opening balance (Story 6.4)'));

// Inline opening balance calculation from calculateCashFlow
function openingBalance(bs, fxRates) {
  const convertToAUD = (amount, cur) => {
    if (!cur || cur.toLowerCase() === 'aud') return amount || 0;
    const rate = fxRates[cur.toLowerCase()];
    return rate ? (amount || 0) * rate : (amount || 0);
  };
  const auBank = (bs.au && bs.au.bank) || 0;
  const euBank = convertToAUD((bs.eu && bs.eu.bank) || 0, 'EUR');
  const usBank = convertToAUD((bs.us && bs.us.bank) || 0, 'USD');
  return auBank + euBank + usBank;
}

test('T14  USD balance is converted and included in opening cash', () => {
  const bs = { au: { bank: 50000 }, eu: { bank: 0 }, us: { bank: 10000 } };
  const fxRates = { usd: 1.55, eur: 1.65 };

  const result = openingBalance(bs, fxRates);
  const expected = 50000 + 0 + (10000 * 1.55); // 50000 + 15500 = 65500
  assert.equal(result, expected, `Expected ${expected}, got ${result}`);
});

test('T15  FX rate change updates opening balance proportionally', () => {
  const bs = { au: { bank: 0 }, us: { bank: 10000 } };

  const low  = openingBalance(bs, { usd: 1.40 }); // 14000
  const high = openingBalance(bs, { usd: 1.65 }); // 16500

  assert.equal(low,  14000, `Rate 1.40: expected 14000, got ${low}`);
  assert.equal(high, 16500, `Rate 1.65: expected 16500, got ${high}`);
  assert.ok(high > low, 'Higher FX rate should produce higher AUD opening balance');
});

// ── T7–T8: calcFees ───────────────────────────────────────────────────────────

console.log(BOLD('\nT7–T8  Fee calculation (Story 6.1)'));

test('T7  IE fee is on net-of-referral revenue, not gross', () => {
  // $10,000 revenue, 10% referral, 70% IE
  // refFee = 10000 × 0.10 = 1000
  // ieFee  = (10000 − 1000) × 0.70 = 9000 × 0.70 = 6300
  // margin = 10000 − 1000 − 6300 = 2700
  const { refFee, ieFee, margin } = calcFees(10000, 0.70, 0.10);
  assert.equal(refFee, 1000,  `refFee: expected 1000, got ${refFee}`);
  assert.equal(ieFee,  6300,  `ieFee: expected 6300, got ${ieFee}`);
  assert.equal(margin, 2700,  `margin: expected 2700, got ${margin}`);
});

test('T8  Zero fees return full margin', () => {
  const { refFee, ieFee, margin } = calcFees(10000, 0, 0);
  assert.equal(refFee, 0,     `refFee: expected 0, got ${refFee}`);
  assert.equal(ieFee,  0,     `ieFee: expected 0, got ${ieFee}`);
  assert.equal(margin, 10000, `margin: expected 10000, got ${margin}`);
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('');
const total = passed + failed;
if (failed === 0) {
  console.log(GREEN(BOLD(`  All ${total} tests passed`)));
} else {
  console.log(RED(BOLD(`  ${failed} of ${total} tests failed`)));
}
console.log('');

if (failed > 0) process.exit(1);
