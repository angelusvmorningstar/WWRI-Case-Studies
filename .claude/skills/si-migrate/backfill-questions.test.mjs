/* Tests for si-migrate backfill-questions.mjs applyMap().
 * Verifies question/purpose backfill writes to the right places and leaves
 * scores untouched.  Run: node backfill-questions.test.mjs
 */
import assert from 'node:assert';
import { applyMap } from './backfill-questions.mjs';

let pass = 0, fail = 0;
function check(label, fn) {
  try { fn(); pass++; console.log('  OK  ' + label); }
  catch (e) { fail++; console.log('  XX  ' + label + '  -> ' + e.message); }
}

function freshDoc() {
  return {
    framework: { version: 't', topics: [
      { id: 'T1', name: 'A', subtopics: [
        { id: 's1', name: 'S1', weight: 1, crit: [{ id: 'c1', name: 'S1', weight: 1 }] },
        { id: 's2', name: 'S2', weight: 1, crit: [{ id: 'c2', name: 'S2', weight: 1 }] },
      ] },
    ] },
    topicConfig: { T1: { enabled: true, selected: ['s1', 's2'], questions: {}, mins: {} } },
    sessions: { p1: { status: 'complete', scores: { c1: 50, c2: 80 } } },
    updatedAt: '2020-01-01T00:00:00Z',
  };
}

check('applyMap sets purpose on subtopics and question in topicConfig', () => {
  const doc = freshDoc();
  const res = applyMap(doc, { s1: { question: 'What is your vision?', purpose: 'P1' }, s2: { question: '', purpose: 'P2' } });
  assert.strictEqual(doc.framework.topics[0].subtopics[0].purpose, 'P1');
  assert.strictEqual(doc.framework.topics[0].subtopics[1].purpose, 'P2');
  assert.strictEqual(doc.topicConfig.T1.questions.s1, 'What is your vision?');
  assert.strictEqual(doc.topicConfig.T1.questions.s2, undefined);   // blank question not written
  assert.strictEqual(res.stats.setPurpose, 2);
  assert.strictEqual(res.stats.setQuestion, 1);
  assert.strictEqual(res.stats.matched, 2);
});

check('applyMap never touches scores', () => {
  const doc = freshDoc();
  applyMap(doc, { s1: { question: 'Q', purpose: 'P' } });
  assert.deepStrictEqual(doc.sessions.p1.scores, { c1: 50, c2: 80 });
});

check('applyMap reports map keys not in the framework', () => {
  const doc = freshDoc();
  const res = applyMap(doc, { s1: { purpose: 'P' }, s9: { purpose: 'ghost' } });
  assert.deepStrictEqual(res.unknownKeys, ['s9']);
});

check('applyMap reports framework subtopics with no map entry', () => {
  const doc = freshDoc();
  const res = applyMap(doc, { s1: { question: 'Q', purpose: 'P' } });   // s2 uncovered
  assert.deepStrictEqual(res.uncovered, ['s2']);
});

check('applyMap creates topicConfig.questions if missing', () => {
  const doc = freshDoc();
  delete doc.topicConfig.T1.questions;                                  // migrated docs may lack it
  applyMap(doc, { s1: { question: 'Q', purpose: 'P' } });
  assert.strictEqual(doc.topicConfig.T1.questions.s1, 'Q');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
