#!/usr/bin/env node
/**
 * backfill-questions.mjs — populate a migrated engagement's interview QUESTIONS
 * and subtopic PURPOSE from a curated question map sourced from the companion
 * questionnaire .docx (the legacy analytics workbooks store no question text).
 *
 *   map  = question-maps/<key>.json  { map: { <subId>: { question, purpose } } }
 *   target = the migrated engagement in engagements/ whose name matches the map.
 *
 * For each subId: sets framework subtopic.purpose, and (when question non-blank)
 * topicConfig[topicId].questions[subId]. Scores/structure untouched. Validates
 * via the real validateEngagement() before writing — never writes if invalid.
 *
 * Usage:
 *   node backfill-questions.mjs <key>            # propose: apply in-memory, validate, report coverage
 *   node backfill-questions.mjs <key> --write    # write the backfilled engagement in place
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = 'D:/WWRI Work';
const SKILL = `${ROOT}/.claude/skills/si-migrate`;
const ENGAGEMENTS = `${ROOT}/structured-interview/engagements`;
const SCRATCH = join(tmpdir(), 'si-migrate');
const require = createRequire(import.meta.url);
const { validateEngagement } = require(`${ROOT}/structured-interview/api/_shared/validate.js`);

function loadMap(key) {
  const p = `${SKILL}/question-maps/${key}.json`;
  if (!existsSync(p)) throw new Error(`no question map at ${p}`);
  return JSON.parse(readFileSync(p, 'utf8'));
}
// Find the migrated engagement file whose name matches the map's prefix.
function findEngagement(spec) {
  const pre = spec.engagementNameStartsWith || spec.workbook;
  for (const f of readdirSync(ENGAGEMENTS)) {
    if (!f.endsWith('.json')) continue;
    const doc = JSON.parse(readFileSync(join(ENGAGEMENTS, f), 'utf8'));
    if ((doc.name || '').toLowerCase().startsWith(String(pre).toLowerCase())) return { path: join(ENGAGEMENTS, f), doc };
  }
  throw new Error(`no engagement in ${ENGAGEMENTS} whose name starts with "${pre}" — run extract-workbook.mjs ${spec.workbook} --write first`);
}

function applyMap(doc, map) {
  const subToTopic = {};               // subId -> topicId
  const subById = {};                  // subId -> subtopic object
  for (const t of doc.framework.topics) for (const st of t.subtopics) { subToTopic[st.id] = t.id; subById[st.id] = st; }

  const stats = { setPurpose: 0, setQuestion: 0, matched: 0 };
  const unknownKeys = [];               // map keys not in framework
  for (const [subId, entry] of Object.entries(map)) {
    const st = subById[subId];
    if (!st) { unknownKeys.push(subId); continue; }
    stats.matched++;
    if (entry.purpose) { st.purpose = entry.purpose; stats.setPurpose++; }
    if (entry.question && entry.question.trim()) {
      const tid = subToTopic[subId];
      const tc = doc.topicConfig[tid] || (doc.topicConfig[tid] = { enabled: true, selected: [], questions: {}, mins: {} });
      if (!tc.questions) tc.questions = {};
      tc.questions[subId] = entry.question.trim();
      stats.setQuestion++;
    }
  }
  const uncovered = Object.keys(subById).filter(id => !(id in map)); // framework subtopics with no map entry
  doc.updatedAt = new Date().toISOString();
  return { stats, unknownKeys, uncovered };
}

function report(spec, doc, res, valid, previewPath) {
  const L = console.log;
  L(`\n=== Backfill questions: ${doc.name} ===`);
  L(`source doc: ${spec.source}`);
  const total = doc.framework.topics.reduce((a, t) => a + t.subtopics.length, 0);
  L(`subtopics: ${total} | mapped: ${res.stats.matched} | purpose set: ${res.stats.setPurpose} | questions set: ${res.stats.setQuestion}`);
  if (res.uncovered.length) L(`\nSubtopics with NO map entry (${res.uncovered.length}): ${res.uncovered.join(', ')}`);
  if (res.unknownKeys.length) L(`\nMap keys NOT in framework (${res.unknownKeys.length}): ${res.unknownKeys.join(', ')}`);
  L(`\nvalid=${valid}`);
  if (previewPath) L(`Preview: ${previewPath}`);
}

export { applyMap, loadMap, findEngagement };

const isMain = /backfill-questions\.mjs$/.test(process.argv[1] || '');
const [key, ...flags] = process.argv.slice(2);
if (isMain && !key) { console.error('Usage: node backfill-questions.mjs <key> [--write]'); process.exit(2); }

if (isMain) try {
  const spec = loadMap(key);
  const { path, doc } = findEngagement(spec);
  const res = applyMap(doc, spec.map);
  const { valid, errors } = validateEngagement(doc);
  if (!valid) console.error('INVALID:\n' + errors.map(e => '  - ' + e).join('\n'));

  if (flags.includes('--write')) {
    if (!valid) { console.error('Refusing to write: engagement is invalid.'); process.exit(1); }
    copyFileSync(path, path + '.bak');                       // safety backup
    writeFileSync(path, JSON.stringify(doc, null, 2));
    report(spec, doc, res, valid, null);
    console.log(`\nWROTE ${path}  (backup: ${path}.bak)`);
  } else {
    if (!existsSync(SCRATCH)) mkdirSync(SCRATCH, { recursive: true });
    const pv = join(SCRATCH, `backfill.${key}.preview.json`);
    writeFileSync(pv, JSON.stringify(doc, null, 2));
    report(spec, doc, res, valid, pv);
    console.log(valid ? '\nEyeball it, then re-run with --write to apply in place.' : '\nFix the map/engagement before writing.');
  }
} catch (e) { console.error('ERROR:', e.message); process.exit(1); }
