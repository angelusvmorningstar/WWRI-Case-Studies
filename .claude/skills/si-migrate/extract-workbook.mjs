#!/usr/bin/env node
/**
 * extract-workbook.mjs — SI legacy-workbook → engagement.schema.json v1.1.
 *
 * One workbook → one engagement. Propose (dry-run, default) → eyeball → --write.
 * Reads workbooks through sp.mjs `sheets` + `range` (Graph workbook
 * usedRange valuesOnly) — NOT `read` (an .xlsx streams binary OOXML).
 *
 * Usage:
 *   node extract-workbook.mjs <key>                 # propose: build + validate + preview
 *   node extract-workbook.mjs <key> --write         # write the (frozen/edited) preview
 *   node extract-workbook.mjs <key> --validate <p>  # re-validate a (hand-edited) preview file
 *
 * Hard rule: an invalid engagement is NEVER written. validateEngagement() is the gate.
 *
 * Env: MSGRAPH_TENANT_ID, MSGRAPH_CLIENT_ID (same token cache as the mail tooling).
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = 'D:/WWRI Work';
const SP = `${ROOT}/scripts/sharepoint/sp.mjs`;
const ENGAGEMENTS = `${ROOT}/structured-interview/engagements`;
const SCRATCH = join(tmpdir(), 'si-migrate');

const require = createRequire(import.meta.url);
// CJS validator: JSON-Schema (ajv) + cross-reference integrity. The write gate.
const { validateEngagement } =
  require(`${ROOT}/structured-interview/api/_shared/validate.js`);

// ---------------------------------------------------------------------------
// Workbook registry (inline; mirrors workbooks.json convention). All six are
// the .xlsx analytics/questionnaire workbooks on the WhitewaterUsers drive.
// Confirm each itemId with `sp.mjs get <driveId> <itemId>` at propose time.
// ---------------------------------------------------------------------------
const DRIVE = 'b!CCEjTdT2X0KMrToSz5_XWoJ1HfsyBaNCrRFklVXTpQQcg0jSuDr0QYAyUnVzHCN-';
const WORKBOOKS = {
  sodiaal: {
    label: 'SODIAAL', file: 'SODIAAL Interview Analytics.xlsx',
    driveId: DRIVE, itemId: '01X4DFEWWALM26NQXHVFBZH4YZBG6ZZT4D',
    path: 'WhitewaterUsers/SODIAAL Interview Analytics.xlsx',
    frameworkVersion: 'sodiaal-legacy',
    notes: 'Summary sheet is "Interview Summary"; 2 tiers (Senior Executive, Manager); '
         + 'dup subtopic id 05.3 re-slugged on import; Supervisors set is a separate workbook.',
  },
  'sodiaal-supervisors': {
    label: 'SODIAAL Supervisors', file: 'SODIAAL Interview Analytics - Supervisors.xlsx',
    driveId: DRIVE, itemId: '01X4DFEWWQMIILRW5HG5GKV7YDGGDLBDBS',
    path: '9. Angelus Morningstar & CER/Structured Interview Library Questions/Other/SODIAAL Interview Analytics - Supervisors.xlsx',
    frameworkVersion: 'sodiaal-supervisors-legacy',
    notes: 'SODIAAL supervisor cohort — separate workbook from the senior analytics one. '
         + 'Companion doc: "Questionnaire - Supervisors & Specialists (30 mins).doc".',
  },
  bwi: {
    label: 'BWI', file: 'BWI Assessment Questionnaire.xlsx',
    driveId: DRIVE, itemId: '01X4DFEWXMUOYELWNFM5E3QKAYDAOFA77Y',
    path: 'WhitewaterUsers/BWI Assessment Questionnaire.xlsx',
    frameworkVersion: 'bwi-legacy',
    notes: 'Three .xlsx hits exist (also itemId 01X4DFEWSDZY3O55HGGBG367QAVGFM5C6L on this drive, '
         + 'and one on drive b!VEuZ7...). Confirm canonical itemId with sp.mjs get before trusting. '
         + '4 tiers + weights + Commentary sheet → background/notes. Reviewer weights ignored unless applied.',
  },
  djp: {
    label: 'DJP', file: 'DJP - Assessment Questionnaire.xlsx',
    driveId: DRIVE, itemId: '01X4DFEWU765KKBNLSXZAYI2TRXJNHF72A',
    path: 'WhitewaterUsers/DJP - Assessment Questionnaire.xlsx',
    frameworkVersion: 'djp-legacy',
    notes: 'Straightforward; categories Executive / Senior Management / Middle Management.',
  },
  hart: {
    label: 'Hart Agency', file: 'Hart Agency - Assessment Questionnaire.xlsx',
    driveId: DRIVE, itemId: '01X4DFEWTREUPGBMBUHBG3KE7566D5AWWK',
    path: 'WhitewaterUsers/Hart Agency - Assessment Questionnaire.xlsx',
    frameworkVersion: 'hart-legacy',
    notes: 'Straightforward; Hart uses variable weights.',
  },
  skycity: {
    label: 'SkyCity', file: 'SkyCity Assessment Questionnaire.xlsx',
    driveId: DRIVE, itemId: '01X4DFEWRLXNSIKNLDUJHZWIR574ZGBWFI',
    path: 'WhitewaterUsers/SkyCity Assessment Questionnaire.xlsx',
    frameworkVersion: 'skycity-legacy',
    notes: 'Single "All" benchmark tier; uniform weights.',
  },
  smec: {
    label: 'SMEC (P4 Check-In)', file: 'SMEC Assessment Questionnaire.xlsx',
    driveId: DRIVE, itemId: '01X4DFEWQT7BKJIKE5XVAIC42BBJ66P67O',
    joinCol: 'workstream',   // SMEC assessed WORKSTREAMS (group sessions), not individuals — join Summary+Eval on the Workstream column
    path: 'z Archive/1. Friska Wirya Clients/1. SMEC/5. Phase 4 - Check-In of Masterplan Implementation Progress/SMEC Assessment Questionnaire.xlsx',
    frameworkVersion: 'smec-legacy',
    notes: 'Use the Phase-4 "SMEC Assessment Questionnaire.xlsx" (standard Summary/Evaluation Data/'
         + 'Topics/Tables structure). The sibling "...Analysis.xlsx" (itemId 01X4DFEWUBXVLYN6IQJZDYJRKEVTK3NLXA) '
         + 'is a topic-level radar SUMMARY only (no subtopics) — do NOT use it.',
  },
};

// ---------------------------------------------------------------------------
// sp.mjs invocation — the correct .xlsx path is `sheets` + `range`.
// ---------------------------------------------------------------------------
function sp(args) {
  const r = spawnSync('node', [SP, ...args], { encoding: 'utf8', maxBuffer: 64e6 });
  if (r.status !== 0) throw new Error(`sp.mjs ${args[0]} failed: ${(r.stderr || '').trim()}`);
  return JSON.parse(r.stdout);
}
const listSheets = (d, i) => sp(['sheets', d, i]);                 // [{name,id,position,...}]
const readRange  = (d, i, name) => sp(['range', d, i, name]).values || []; // 2D array of values

// Tolerant sheet match: "Summary" matches "Interview Summary".
function findSheet(sheets, ...aliases) {
  const n = s => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  const hit = (sheets || []).find(s => aliases.some(a => n(s.name).includes(n(a))));
  return hit?.name;
}

// ---------------------------------------------------------------------------
// Small helpers: slug / dedupe / score conversion / cell utilities.
// ---------------------------------------------------------------------------
const norm = s => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const slug = s => (String(s ?? '').trim().replace(/[^A-Za-z0-9_.-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64) || 'x');
const dedupe = (id, seen) => { let k = id, n = 2; while (seen.has(k)) k = `${id}-${n++}`; seen.add(k); return k; };
const isBlank = v => v === '' || v == null || (typeof v === 'string' && v.trim() === '');
// Legacy scores are ratios 0.0–1.0 → integer 0–100. Blanks omitted (missing ≠ 0).
const toScore = v => {
  if (isBlank(v) || String(v).trim() === '-') return undefined;
  const n = Number(v); if (Number.isNaN(n)) return undefined;
  return Math.max(0, Math.min(100, Math.round(n * 100)));
};
const nowISO = () => new Date().toISOString(); // satisfies the timestamp regex (seconds + Z)
// Excel (1900-system) serial date → 'YYYY-MM-DD'. 25569 = days from 1899-12-30 to 1970-01-01.
const excelDateToISO = serial => {
  const d = new Date(Math.round((Number(serial) - 25569) * 86400000));
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

// Find the first row index whose normalised cells satisfy `pred(cells)`.
function headerRow(rows, pred, fallback = 0) {
  const idx = rows.findIndex(r => pred((r || []).map(norm)));
  return idx >= 0 ? idx : fallback;
}
// Column index whose header includes any `inc` token but no `exc` token.
function col(header, inc, exc = []) {
  const cells = header.map(norm);
  return cells.findIndex(c => c && inc.some(a => c.includes(norm(a))) && !exc.some(b => c.includes(norm(b))));
}

// ---------------------------------------------------------------------------
// SHEET → SCHEMA MAPPERS
// Each returns { ..., warnings:[] }. Layouts vary across workbooks, so the
// mappers detect columns by fuzzy header match rather than fixed positions.
// ---------------------------------------------------------------------------

// Find the column holding Topic/Subtopic ids (cells prefixed "Topic"/"Subtopic" + a number).
function findIdCol(rows) {
  const maxC = Math.max(0, ...rows.map(r => (r || []).length));
  let bestCol = 0, bestN = -1;
  for (let c = 0; c < maxC; c++) {
    let n = 0;
    for (const r of rows) {
      const v = (r || [])[c];
      if (typeof v === 'string' && /^\s*sub[\s-]*topic|^\s*topic\s*\d/i.test(v)) n++;
    }
    if (n > bestN) { bestN = n; bestCol = c; }
  }
  return bestCol;
}

// Topics → framework.topics[] (subtopic → exactly ONE criterion; weights carried).
// Legacy WWRI layout is POSITIONAL, not header-labelled:
//   [idCol] = "Topic##" / "Subtopic##.#"   [idCol+1] = label   [idCol+2] = weight
// Topic rows open a group; Subtopic rows add a scorable criterion to the current group.
// A Subtopic row with a blank label is a reserved/empty slot → skipped (missing ≠ scoreless crit).
function mapFramework(rows, meta) {
  const warnings = [];
  const idCol = findIdCol(rows);
  const labCol = idCol + 1, wCol = idCol + 2;

  const topics = [];
  const subByLabel = new Map(); // norm(label) AND norm(id) → critId  (join key for Evaluation Data)
  const topicConfig = {};
  const seenTopicId = new Set(), seenSubId = new Set(), seenCritId = new Set();
  let curTopic = null;

  for (const row of rows) {
    const idv = row && row[idCol];
    if (isBlank(idv) || typeof idv !== 'string') continue;   // separator / 'Total Evaluation' header / noise
    const idStr = idv.trim();
    const label = !isBlank(row[labCol]) ? String(row[labCol]).trim() : '';

    if (/^sub[\s-]*topic/i.test(idStr)) {
      if (!curTopic) {
        curTopic = { id: dedupe('topic', seenTopicId), name: 'Topic', subtopics: [] };
        topics.push(curTopic);
        topicConfig[curTopic.id] = { enabled: true, selected: [], questions: {}, mins: {} };
        warnings.push('Topics: subtopic encountered before any topic header — bucketed under a synthetic topic.');
      }
      if (!label) { warnings.push(`Topics: "${idStr}" has no label — skipped (reserved slot).`); continue; }

      const baseSubId = slug(idStr);
      const subId = dedupe(baseSubId, seenSubId);
      if (subId !== baseSubId) warnings.push(`Topics: duplicate subtopic id "${baseSubId}" re-slugged to "${subId}".`);

      let weight = 1;
      if (!isBlank(row[wCol])) {
        const w = Number(row[wCol]);
        if (!Number.isNaN(w) && w >= 0 && w <= 100) weight = w;
        else warnings.push(`Topics: "${label}" weight "${row[wCol]}" out of range — defaulted to 1.`);
      }

      const critId = dedupe(slug(`c_${subId}`), seenCritId);
      curTopic.subtopics.push({ id: subId, name: label, weight, crit: [{ id: critId, name: label, weight: 1 }] });
      topicConfig[curTopic.id].selected.push(subId);
      subByLabel.set(norm(label), critId);
      subByLabel.set(norm(idStr), critId);
    } else if (/^topic/i.test(idStr)) {
      const name = label || idStr;
      const id = dedupe(slug(idStr), seenTopicId);
      curTopic = { id, name, subtopics: [] };
      topics.push(curTopic);
      topicConfig[id] = { enabled: true, selected: [], questions: {}, mins: {} };
    }
  }

  // Drop topics that ended with no scorable subtopics (e.g. a header whose slots were all reserved).
  const kept = topics.filter(t => t.subtopics.length);
  for (const t of topics) if (!t.subtopics.length) delete topicConfig[t.id];
  if (kept.length !== topics.length) warnings.push(`Topics: ${topics.length - kept.length} empty topic(s) dropped.`);
  if (!kept.length) warnings.push('Topics: no topics parsed — check the sheet name/layout.');

  return {
    framework: { version: meta.frameworkVersion || 'legacy', topics: kept },
    subByLabel, topicConfig, warnings,
  };
}

// Evaluation Data → scores per interviewee, joined to criteria by subtopic label.
// meta.joinCol (optional) names the identity column (e.g. SMEC joins on "Workstream",
// not a person name) — used as the join key in both this sheet and Summary.
function mapScores(rows, subByLabel, meta = {}) {
  const warnings = [];
  // Header row = the row with the most cells matching known subtopic labels.
  let hIdx = 0, best = -1;
  for (let r = 0; r < rows.length; r++) {
    const matches = (rows[r] || []).reduce((a, c) => a + (subByLabel.has(norm(c)) ? 1 : 0), 0);
    if (matches > best) { best = matches; hIdx = r; }
  }
  const header = (rows[hIdx] || []).map(x => (x == null ? '' : String(x)));
  const cJoin = meta.joinCol ? col(header, [meta.joinCol]) : -1;
  const cName = cJoin >= 0 ? cJoin : col(header, ['name', 'interviewee', 'participant', 'respondent'], ['company']);
  const nameCol = cName >= 0 ? cName : 0;

  // Map each column to a criterion id (topic-average / pillar columns won't match → skipped).
  const colToCrit = {};
  header.forEach((h, i) => { const c = subByLabel.get(norm(h)); if (c) colToCrit[i] = c; });
  if (!Object.keys(colToCrit).length) warnings.push('Evaluation Data: no columns matched subtopic labels — check header alignment.');

  const scoresByKey = new Map();
  let cells = 0, filled = 0;
  for (let r = hIdx + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    if (isBlank(row[nameCol])) continue;
    const key = norm(row[nameCol]);
    const scores = {};
    for (const [ci, crit] of Object.entries(colToCrit)) {
      cells++;
      const s = toScore(row[ci]);
      if (s !== undefined) { scores[crit] = s; filled++; }
    }
    scoresByKey.set(key, { scores });
  }
  const fillRate = cells ? Math.round((filled / cells) * 100) : 0;
  return { scoresByKey, warnings, fillRate, scoredColumns: Object.keys(colToCrit).length };
}

// Summary / "Interview Summary" → interviewees[] + interviewers[].
function mapIdentity(rows, meta = {}) {
  const warnings = [];
  // Header row carries a person/identity column. Most workbooks use "Name"; SMEC's
  // group/workstream sessions use "Attendees". Fall back to a company+category row.
  const hIdx = headerRow(rows, c => c.some(x => x.includes('name') || x.includes('attendee') || (meta.joinCol && x.includes(norm(meta.joinCol))))
    || (c.some(x => x.includes('company')) && c.some(x => x.includes('category'))));
  const header = (rows[hIdx] || []).map(x => (x == null ? '' : String(x)));

  // meta.joinCol forces the identity column (so Summary + Evaluation Data join on the same key).
  const cJoin = meta.joinCol ? col(header, [meta.joinCol]) : -1;
  const cName = cJoin >= 0 ? cJoin : col(header, ['name', 'interviewee', 'participant', 'attendee'], ['company', 'interviewer']);
  const cTitle = col(header, ['jobtitle', 'title', 'role', 'position']);
  const cCompany = col(header, ['company', 'organisation', 'organization', 'business', 'unit']);
  const cRegion = col(header, ['region', 'geography', 'country', 'location']);
  const cFunction = col(header, ['function', 'department', 'discipline']);
  const cDate = col(header, ['date', 'interviewed']);
  const cCategory = col(header, ['category', 'tier', 'seniority', 'level', 'band']);
  const cReviewer = col(header, ['interviewer', 'reviewer', 'assessor']);
  const nameCol = cName >= 0 ? cName : 0;

  const splitCodes = v => String(v).split(/[\/,&;+]| and /i).map(s => s.trim()).filter(Boolean);

  const interviewers = [];
  const interviewerById = new Map();
  const interviewees = [];
  const joinKeyById = new Map();
  const seenP = new Set();

  for (let r = hIdx + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    if (isBlank(row[nameCol])) continue;
    const name = String(row[nameCol]).trim();

    // interviewer codes → interviewers[] (dedup by code)
    const interviewerIds = [];
    if (cReviewer >= 0 && !isBlank(row[cReviewer])) {
      for (const code of splitCodes(row[cReviewer])) {
        const id = slug(code);
        if (!interviewerById.has(id)) {
          const rec = { id, name: code, code, scoreAdjustment: 0 };
          interviewerById.set(id, rec);
          interviewers.push(rec);
        }
        if (interviewerIds.length < 3 && !interviewerIds.includes(id)) interviewerIds.push(id);
      }
      if (splitCodes(row[cReviewer]).length > 3) warnings.push(`Summary: "${name}" lists >3 interviewers — truncated to 3.`);
    }

    const id = dedupe(slug(name), seenP);
    const person = { id, name, category: '', status: 'complete' };
    if (cTitle >= 0 && !isBlank(row[cTitle])) person.title = String(row[cTitle]).trim();
    if (cCompany >= 0 && !isBlank(row[cCompany])) person.company = String(row[cCompany]).trim();
    if (cRegion >= 0 && !isBlank(row[cRegion])) person.region = String(row[cRegion]).trim();
    if (cFunction >= 0 && !isBlank(row[cFunction])) person.function = String(row[cFunction]).trim();
    if (cDate >= 0 && !isBlank(row[cDate])) {
      const dv = row[cDate];
      const isSerial = typeof dv === 'number' || /^\d{4,6}(\.\d+)?$/.test(String(dv).trim());
      person.interviewDate = isSerial ? (excelDateToISO(dv) || String(dv).trim()) : String(dv).trim();
    }
    if (interviewerIds.length) person.interviewerIds = interviewerIds;

    if (cCategory >= 0 && !isBlank(row[cCategory])) person.category = String(row[cCategory]).trim();
    else warnings.push(`Summary: "${name}" has no category — left blank (validator will flag; do not guess).`);

    interviewees.push(person);
    joinKeyById.set(id, norm(name));
  }

  if (cCategory < 0) warnings.push('Summary: no category column detected — every interviewee category is blank.');
  return { interviewees, interviewers, joinKeyById, warnings };
}

// Tables → benchmarks{} + categoryOrder[] (most-senior-first as listed).
function mapBenchmarks(rows) {
  const warnings = [];
  const hIdx = headerRow(rows, c => c.some(x => x.includes('category') || x.includes('tier'))
    || (c.some(x => x.includes('adequate')) && c.some(x => x.includes('best'))));
  const header = (rows[hIdx] || []).map(x => (x == null ? '' : String(x)));

  const cCat = col(header, ['category', 'tier', 'seniority', 'level', 'band']);
  const cAdq = col(header, ['adequate', 'industryadequate', 'minimum', 'acceptable']);
  const cBest = col(header, ['best', 'bestinclass', 'bestpractice', 'target', 'excellent']);
  const catCol = cCat >= 0 ? cCat : 0;

  const benchmarks = {};
  const categoryOrder = [];
  for (let r = hIdx + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    if (isBlank(row[catCol])) continue;
    const cat = String(row[catCol]).trim();
    const adequate = cAdq >= 0 ? toScore(row[cAdq]) : undefined;
    const best = cBest >= 0 ? toScore(row[cBest]) : undefined;
    if (adequate === undefined || best === undefined) {
      warnings.push(`Tables: category "${cat}" missing adequate/best threshold — omitted.`);
      continue;
    }
    if (!benchmarks[cat]) { benchmarks[cat] = { adequate, best }; categoryOrder.push(cat); }
  }
  if (!categoryOrder.length) warnings.push('Tables: no benchmark categories parsed — check the sheet name/layout.');
  return { benchmarks, categoryOrder, warnings };
}

// ---------------------------------------------------------------------------
// ASSEMBLY
// ---------------------------------------------------------------------------
function buildEngagement(meta) {
  const sheets = listSheets(meta.driveId, meta.itemId);
  const get = (...al) => {
    const name = findSheet(sheets, ...al);
    if (!name) throw new Error(`sheet not found (aliases: ${al.join(', ')}); have: ${(sheets || []).map(s => s.name).join(', ')}`);
    return readRange(meta.driveId, meta.itemId, name);
  };

  const fw    = mapFramework(get('Topics'), meta);
  const ident = mapIdentity(get('Summary', 'Interview Summary'), meta);
  const bench = mapBenchmarks(get('Tables'));
  const sess  = mapScores(get('Evaluation Data', 'Evaluation', 'Scores'), fw.subByLabel, meta);

  const ts = nowISO();
  const doc = {
    schemaVersion: '1.1',
    id: randomUUID(),
    name: `${meta.label} (migrated)`,
    status: 'archived',
    createdAt: ts,
    updatedAt: ts,
    provenance: {
      source: 'excel-migration',
      sourceFile: meta.file,
      sourcePath: meta.path,
      driveId: meta.driveId,
      itemId: meta.itemId,
      importedAt: ts,
      importedBy: 'si-migrate',
      scoreScale: 'ratio-0-1',
      notes: meta.notes,
    },
    framework: fw.framework,
    interviewers: ident.interviewers,
    categoryOrder: bench.categoryOrder,
    benchmarks: bench.benchmarks,
    interviewees: ident.interviewees,
    topicConfig: fw.topicConfig,
    sessions: Object.fromEntries(ident.interviewees.map(p => [
      p.id,
      { status: 'complete', startedAt: null, scores: sess.scoresByKey.get(ident.joinKeyById.get(p.id))?.scores || {} },
    ])),
  };

  const warnings = [...fw.warnings, ...ident.warnings, ...bench.warnings, ...sess.warnings];
  // Interviewees whose name didn't join to any score row.
  for (const p of doc.interviewees) {
    if (!sess.scoresByKey.has(ident.joinKeyById.get(p.id))) {
      warnings.push(`Join: interviewee "${p.name}" did not match any Evaluation Data row — empty scores.`);
    }
  }
  const meta2 = { fillRate: sess.fillRate, scoredColumns: sess.scoredColumns };
  return { doc, warnings, stats: meta2 };
}

// ---------------------------------------------------------------------------
// VALIDATION + HUMAN SUMMARY
// ---------------------------------------------------------------------------
function validateOrReport(doc) {
  const { valid, errors } = validateEngagement(doc);
  if (!valid) console.error('INVALID:\n' + errors.map(e => '  - ' + e).join('\n'));
  return valid;
}

function printHumanSummary(doc, warnings, stats) {
  const L = console.log;
  L(`\n=== ${doc.name} ===`);
  L(`uuid: ${doc.id}`);
  L(`status: ${doc.status}  scoreScale: ${doc.provenance.scoreScale}`);

  L(`\nFramework "${doc.framework.version}" — ${doc.framework.topics.length} topic(s):`);
  for (const t of doc.framework.topics) {
    L(`  • ${t.name} [${t.id}] — ${t.subtopics.length} subtopic(s)`);
    for (const st of t.subtopics) L(`      - ${st.name} [${st.id}] w=${st.weight} → crit ${st.crit[0].id}`);
  }

  L(`\nBenchmarks (categoryOrder: ${doc.categoryOrder.join(' > ') || '(none)'}):`);
  for (const [cat, b] of Object.entries(doc.benchmarks)) L(`  • ${cat}: adequate ${b.adequate}, best ${b.best}`);

  L(`\nInterviewers (${doc.interviewers.length}): ${doc.interviewers.map(i => `${i.code}`).join(', ') || '(none)'}`);

  L(`\nInterviewees (${doc.interviewees.length}):`);
  for (const p of doc.interviewees) {
    const n = Object.keys(doc.sessions[p.id]?.scores || {}).length;
    L(`  • ${p.name} | ${p.category || '(no category)'} | ${[p.company, p.region, p.function].filter(Boolean).join(' / ') || '—'}`
      + ` | ${p.interviewDate || '—'} | reviewers: ${(p.interviewerIds || []).join(',') || '—'} | ${n} score(s)`);
  }

  L(`\nScore matrix: ${stats.scoredColumns} scored column(s), fill-rate ${stats.fillRate}%.`);

  if (warnings.length) {
    L(`\nWARNINGS (${warnings.length}):`);
    for (const w of warnings) L(`  ! ${w}`);
  } else {
    L('\nWARNINGS: none.');
  }
}

// ---------------------------------------------------------------------------
// PROPOSE / WRITE GATE
// ---------------------------------------------------------------------------
const previewPath = key => join(SCRATCH, `si-migrate.${key}.preview.json`);

function propose(key) {
  const meta = WORKBOOKS[key];
  const { doc, warnings, stats } = buildEngagement(meta);
  const ok = validateOrReport(doc);
  if (!existsSync(SCRATCH)) mkdirSync(SCRATCH, { recursive: true });
  const p = previewPath(key);
  writeFileSync(p, JSON.stringify(doc, null, 2)); // freeze uuid + allow hand-edit
  printHumanSummary(doc, warnings, stats);
  console.log(`\nPreview: ${p}  valid=${ok}`);
  console.log(ok
    ? 'Eyeball it, then re-run with --write to land it in engagements/.'
    : 'Fix/clarify the workbook mapping before writing (no write will be allowed).');
}

function write(key) {
  const p = previewPath(key);
  if (!existsSync(p)) throw new Error(`No preview at ${p} — run propose (no --write) first.`);
  const doc = JSON.parse(readFileSync(p, 'utf8')); // reuse frozen uuid / hand-edits
  if (!validateOrReport(doc)) { console.error('Refusing to write: engagement is invalid.'); process.exit(1); }
  if (!existsSync(ENGAGEMENTS)) mkdirSync(ENGAGEMENTS, { recursive: true });
  const dest = `${ENGAGEMENTS}/${doc.id}.json`;
  writeFileSync(dest, JSON.stringify(doc, null, 2));
  console.log(`WROTE ${dest}`);
  console.log(`engagement: ${doc.name}  uuid: ${doc.id}  interviewees: ${doc.interviewees.length}`);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function usage() {
  console.error('Usage: node extract-workbook.mjs <key> [--write] [--validate <previewPath>]');
  console.error(`Keys: ${Object.keys(WORKBOOKS).join(', ')}`);
}

// Pure helpers + mappers exported for unit testing (no SharePoint side effects).
export { toScore, excelDateToISO, slug, dedupe, norm, findIdCol, mapFramework, mapScores, mapIdentity, mapBenchmarks };

const isMain = /extract-workbook\.mjs$/.test(process.argv[1] || '');
if (isMain) {
  const argv = process.argv.slice(2);
  const key = argv[0];
  const flags = argv.slice(1);

  try {
    if (flags.includes('--validate')) {
      const f = flags[flags.indexOf('--validate') + 1];
      if (!f) { usage(); process.exit(2); }
      process.exit(validateOrReport(JSON.parse(readFileSync(f, 'utf8'))) ? 0 : 1);
    }
    if (!key || !WORKBOOKS[key]) { usage(); process.exit(2); }
    if (flags.includes('--write')) write(key);
    else propose(key);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}
