/* Tests for si-migrate extract-workbook.mjs mappers.
 * Plain node + assert (matches structured-interview/api/_shared/validate.test.js).
 * Fixtures mirror Graph usedRange(valuesOnly) shape: leading empty columns are
 * trimmed, so the category/id lives in column 0.
 *   Run: node extract-workbook.test.mjs
 */
import assert from 'node:assert';
import {
  toScore, excelDateToISO, findIdCol,
  mapFramework, mapScores, mapIdentity, mapBenchmarks,
} from './extract-workbook.mjs';

let pass = 0, fail = 0;
function check(label, fn) {
  try { fn(); pass++; console.log('  OK  ' + label); }
  catch (e) { fail++; console.log('  XX  ' + label + '  -> ' + e.message); }
}

// ---- toScore: ratio 0-1 -> integer 0-100, blanks omitted ----
check('toScore converts ratio to 0-100', () => {
  assert.strictEqual(toScore(0.5), 50);
  assert.strictEqual(toScore(0.671), 67);     // rounds
  assert.strictEqual(toScore(1), 100);
  assert.strictEqual(toScore(0), 0);
});
check('toScore omits blanks and dashes (missing != zero)', () => {
  assert.strictEqual(toScore(''), undefined);
  assert.strictEqual(toScore(null), undefined);
  assert.strictEqual(toScore('-'), undefined);
  assert.strictEqual(toScore('abc'), undefined);
});
check('toScore clamps to 0..100', () => {
  assert.strictEqual(toScore(1.5), 100);
  assert.strictEqual(toScore(-0.2), 0);
});

// ---- excelDateToISO ----
check('excelDateToISO converts 1900-system serial', () => {
  assert.strictEqual(excelDateToISO(45238), '2023-11-08');
  assert.strictEqual(excelDateToISO('45238'), '2023-11-08');
});
check('excelDateToISO returns null on garbage', () => {
  assert.strictEqual(excelDateToISO('not-a-number'), null);
});

// ---- findIdCol: locates the Topic/Subtopic id column ----
check('findIdCol finds the prefixed id column', () => {
  assert.strictEqual(findIdCol([['', 'x', 'y'], ['Topic01', 'L', ''], ['Subtopic01.1', 'S', 1]]), 0);
  assert.strictEqual(findIdCol([['junk', 'Topic01', 'label'], ['', 'Subtopic01.1', 'lbl']]), 1);
});

// ---- mapFramework: positional Topics layout (col0=id, col1=label, col2=weight) ----
const topicsRows = [
  ['', 'Total Evaluation', 'Weight'],
  ['Topic01', 'Leadership', ''],
  ['Subtopic01.1', 'Vision', 1],
  ['Subtopic01.2', 'Ownership', 3],
  ['Subtopic01.3', '', ''],            // reserved blank slot -> skipped
  ['', '', ''],
  ['Topic02', 'Change', ''],
  ['Subtopic02.1', 'Readiness', 1],
  ['Subtopic02.1', 'Duplicate id', 1], // duplicate id -> re-slugged
];
const fw = mapFramework(topicsRows, { frameworkVersion: 'test-legacy' });
check('mapFramework parses topics + subtopics with weights', () => {
  assert.strictEqual(fw.framework.version, 'test-legacy');
  assert.strictEqual(fw.framework.topics.length, 2);
  const t1 = fw.framework.topics[0];
  assert.strictEqual(t1.name, 'Leadership');
  assert.strictEqual(t1.subtopics.length, 2);                 // 01.3 skipped
  assert.strictEqual(t1.subtopics[0].name, 'Vision');
  assert.strictEqual(t1.subtopics[1].weight, 3);              // weight carried
  assert.strictEqual(t1.subtopics[0].crit.length, 1);         // one criterion per subtopic
});
check('mapFramework skips reserved blank-label slots', () => {
  assert.ok(fw.warnings.some(w => /Subtopic01\.3.*reserved slot/.test(w)));
  assert.ok(!fw.framework.topics[0].subtopics.some(s => s.id === 'Subtopic01.3'));
});
check('mapFramework re-slugs duplicate subtopic ids', () => {
  const t2 = fw.framework.topics[1];
  const ids = t2.subtopics.map(s => s.id);
  assert.strictEqual(new Set(ids).size, ids.length);          // all unique
  assert.ok(fw.warnings.some(w => /duplicate subtopic id/.test(w)));
});
check('mapFramework builds subByLabel join keys + topicConfig', () => {
  assert.ok(fw.subByLabel.has('vision'));                     // normalised label
  assert.ok(fw.topicConfig['Topic01']);
  assert.deepStrictEqual(fw.topicConfig['Topic01'].selected.length, 2);
});

// ---- mapScores: Evaluation Data joined to criteria by subtopic label ----
const subByLabel = new Map([['vision', 'c_v'], ['ownership', 'c_o']]);
const evalRows = [
  ['', '', '', '', 1, 1],                                     // weights noise row
  ['Interviewer', 'Name', 'Category', '', 'Vision', 'Ownership'],
  ['Both', 'Alice', 'Exec', '', 0.5, 0.8],
  ['Both', 'Bob', 'Exec', '', 0.4, ''],                       // blank -> omitted
];
const sc = mapScores(evalRows, subByLabel);
check('mapScores joins scores by subtopic label (x100)', () => {
  assert.deepStrictEqual(sc.scoresByKey.get('alice').scores, { c_v: 50, c_o: 80 });
});
check('mapScores omits blank score cells', () => {
  assert.deepStrictEqual(sc.scoresByKey.get('bob').scores, { c_v: 40 });   // c_o blank -> absent
});

// ---- mapScores with joinCol (SMEC workstream sessions) ----
const evalWs = [
  ['Interviewer', 'Workstream', 'Category', '', 'Vision'],
  ['AS', '1. Employee Experience', 'Senior Executive', '', 0.7],
];
const scWs = mapScores(evalWs, new Map([['vision', 'c_v']]), { joinCol: 'workstream' });
check('mapScores honours meta.joinCol (joins on Workstream)', () => {
  assert.deepStrictEqual(scWs.scoresByKey.get('1employeeexperience').scores, { c_v: 70 });
});

// ---- mapIdentity: Summary -> interviewees + interviewers ----
const summaryRows = [
  ['', '', 'Position', '', '', '', '', ''],
  ['Interviewer', 'Name', 'Company', 'Region', 'Category', 'Job Title', 'Date of interview', ''],
  ['Both', 'Alice', 'ACME', 'EU', 'Executive', 'CEO', 45238, ''],
];
const id = mapIdentity(summaryRows);
check('mapIdentity extracts interviewee identity fields', () => {
  const p = id.interviewees[0];
  assert.strictEqual(p.name, 'Alice');
  assert.strictEqual(p.category, 'Executive');
  assert.strictEqual(p.company, 'ACME');
  assert.strictEqual(p.region, 'EU');
  assert.strictEqual(p.title, 'CEO');
  assert.strictEqual(p.status, 'complete');
});
check('mapIdentity converts Excel date serial in Summary', () => {
  assert.strictEqual(id.interviewees[0].interviewDate, '2023-11-08');
});
check('mapIdentity registers interviewers from codes', () => {
  assert.ok(id.interviewers.some(i => i.code === 'Both'));
  assert.ok(id.interviewees[0].interviewerIds.length >= 1);
});

// ---- mapIdentity with Attendees + joinCol (SMEC) ----
const summaryWs = [
  ['Interviewer', 'Attendees', 'Company', 'Region', 'Category', 'Workstream', 'Combo', 'Date'],
  ['AS', 'Nia & Betsy', 'SMEC', 'NSW', 'Senior Executive', '1. Employee Experience', 'x', ''],
];
const idWs = mapIdentity(summaryWs, { joinCol: 'workstream' });
check('mapIdentity uses joinCol as the identity (SMEC workstream)', () => {
  assert.strictEqual(idWs.interviewees[0].name, '1. Employee Experience');
  assert.strictEqual(idWs.interviewees[0].category, 'Senior Executive');
});

// ---- mapBenchmarks: Tables -> benchmarks + categoryOrder (usedRange shape) ----
const tablesRows = [
  ['Parameters', 'Industry Adequate', 'Industry Best', '', 'Reviewer', 'Weight'],
  ['Senior Executive', 0.6, 0.9, '', 'Both', 0],
  ['Manager', 0.5, 0.8, '', '', ''],
];
const bm = mapBenchmarks(tablesRows);
check('mapBenchmarks reads per-category thresholds (x100)', () => {
  assert.deepStrictEqual(bm.benchmarks['Senior Executive'], { adequate: 60, best: 90 });
  assert.deepStrictEqual(bm.benchmarks['Manager'], { adequate: 50, best: 80 });
});
check('mapBenchmarks preserves category order', () => {
  assert.deepStrictEqual(bm.categoryOrder, ['Senior Executive', 'Manager']);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
