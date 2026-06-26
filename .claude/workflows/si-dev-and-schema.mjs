export const meta = {
  name: 'si-dev-and-schema',
  description: 'Implement SI app dev changes (weighting, overall-score, topic reassignment, v1.1 consumption) + build the Excel->schema extraction skill, then verify. No git/deploy.',
  whenToUse: 'After schema v1.1 is in place, to implement the migration-driven SI app changes and build the extraction skill in one orchestrated pass. Holds git commit + deploy for sign-off.',
  phases: [
    { title: 'Design', detail: 'parallel read-only specs for each change + the extraction skill' },
    { title: 'Implement', detail: 'app edits applied sequentially (single file); skill built in parallel' },
    { title: 'Verify', detail: 'run validator tests + adversarial scoring review + regression review' },
  ],
}

const APP = 'D:/WWRI Work/structured-interview/app/index.html'
const SCHEMA = 'D:/WWRI Work/structured-interview/schema'
const API = 'D:/WWRI Work/structured-interview/api'
const SP = 'D:/WWRI Work/scripts/sharepoint/sp.mjs'
const RAILS = 'HARD RAILS: edit only the files named; DO NOT run git add/commit/push; DO NOT deploy or call any Azure CLI; do not touch any file outside the named targets.'

log('SI dev + schema workflow: designing 4 workstreams, then implementing app (sequential) + skill (parallel), then verifying.')

// ---------- Phase 1: Design (parallel, read-only) ----------
phase('Design')
const [dCats, dScore, dReassign, dSkill] = await parallel([
  () => agent(`Read ${APP} and ${SCHEMA}/engagement.schema.json (v1.1). Produce a PRECISE implementation spec (no edits) to make the app CONSUME schema v1.1 instead of its hardcoded assumptions.
Focus: CATS (~line 76), DEFAULT_BENCHMARKS (~line 77), and every use of categories/benchmarks across Setup, Results, and Report tabs, plus how an engagement is loaded/hydrated.
The app currently assumes exactly 3 fixed categories (Executive/Senior Management/Middle Management). v1.1 makes benchmarks PER-ENGAGEMENT with arbitrary category keys, adds optional categoryOrder, framework topics have canonicalTopic, subtopics/crits have weight, plus a provenance block and legacy interviewee fields (company/region/function/interviewDate).
Deliver: (a) derive the category list from the engagement's benchmarks keys ordered by categoryOrder, replacing hardcoded CATS; (b) stop assuming 3 tiers anywhere; (c) surface provenance (e.g. a "migrated from <file>" badge) and the new interviewee fields where people are displayed. List EACH hardcoded assumption with its line number and the exact replacement code. Output spec only.`, { label: 'design:v1.1-read', phase: 'Design' }),

  () => agent(`Read ${APP} and ${SCHEMA}/MIGRATION.md (section 4) and ${SCHEMA}/engagement.schema.json. Produce a PRECISE implementation spec (no edits) to make the app's score rollups WEIGHTED and to redefine the overall score.
Requirements: (1) effective criterion weight = subtopic.weight x crit.weight, BOTH defaulting to 1 when absent. topicScore = sum(critScore x effWeight) / sum(effWeight) over all scored criteria in the topic. (2) personOverall must become the MEAN OF (weighted) TOPIC SCORES - NOT the current flat average of all criteria - to match the legacy "Overall Change Readiness".
Find EVERY place these are computed: there are at least two copies - Results tab (~lines 695, 726, 727) and Report tab (~lines 933, 934, 944) - plus any benchmark gap calcs. For each, quote the exact current code and give the exact replacement. Show how to resolve a criterion's effective weight from the per-engagement framework (build a critId->weight map from framework topics/subtopics/crits). Propose a small shared helper (e.g. weightOf(critId) + weightedTopicScore(...)) and where to place it. Handle all-scores-null (avoid divide-by-zero) and keep applyAdj behaviour. Output spec only.`, { label: 'design:scoring', phase: 'Design' }),

  () => agent(`Read the SetupTab region of ${APP} (topic/subtopic selection UI ~lines 360-440 and TOPIC_LIBRARY ~lines 79-150). Produce a PRECISE spec (no edits) for an in-app affordance letting the questionnaire AUTHOR REASSIGN a subtopic (question) to a DIFFERENT topic, and set/edit its canonicalTopic tag.
Why: migrated legacy questions are grandfathered onto best-match topics; the author must be able to correct the mapping.
Constraints: the app snapshots framework PER ENGAGEMENT, so reassignment mutates that engagement's framework (move the subtopic object between framework.topics[].subtopics), updates topicConfig (move the subtopic's entry in selected/questions/mins to the destination topic), and MUST leave sessions[].scores untouched (scores key on criterion ids, which do not change).
Deliver: the UI control (e.g. a "Move to topic..." dropdown on each subtopic card), the exact state mutation function with code sketch keyed to line numbers, a canonicalTopic edit control, and edge cases (moving the last subtopic out of a topic; id collisions in the destination). Output spec only.`, { label: 'design:reassign', phase: 'Design' }),

  () => agent(`Read ${SCHEMA}/MIGRATION.md (the full contract), ${SCHEMA}/engagement.schema.json (v1.1), ${SCHEMA}/migrated-example-bwi.json, ${API}/_shared/validate.js, and ${SP} (a workbook is read via: node "${SP}" read <driveId> <itemId>; tenant search via: node "${SP}" search "<q>"). Produce a PRECISE design (no edits) for a reusable extraction SKILL that converts ONE legacy workbook into ONE validated engagement JSON.
Decide location: D:/WWRI Work/.claude/skills/si-migrate/ as SKILL.md + a node script extract-workbook.mjs (follow the existing skill conventions in D:/WWRI Work/.claude/skills/). The skill must: pull workbook sheets via sp.mjs; map Topics->framework (subtopic->SINGLE criterion, carry weights); Evaluation Data->sessions.scores (x100, round; omit blanks); Summary->interviewee identity (company/region/function/date/category/interviewer); Tables->per-engagement benchmarks + categoryOrder; set the provenance block; then VALIDATE via validateEngagement() from ${API}/_shared/validate.js BEFORE writing. Human-in-the-loop: propose -> eyeball -> write, ONE workbook at a time, SODIAAL first.
Deliver: the SKILL.md outline, the extract-workbook.mjs function structure (sp.mjs read pattern, the sheet->schema mappers, the validator invocation, the propose/confirm gate), and a table of the known workbook driveId/itemId values to migrate (SODIAAL, BWI, DJP, Hart, SkyCity, SMEC). Output design only.`, { label: 'design:skill', phase: 'Design' }),
])

// ---------- Phase 2: Implement ----------
phase('Implement')
log('Designs complete. Implementing: app edits run sequentially on one file; the extraction skill is built in parallel.')

// Skill build touches a disjoint file set -> start it concurrently with the app chain.
const skillP = agent(`Build the SI extraction skill exactly as specified below. Create the files under D:/WWRI Work/.claude/skills/si-migrate/ (SKILL.md + extract-workbook.mjs). The script must require and call validateEngagement() from ${API}/_shared/validate.js and refuse to write an invalid engagement. Do NOT actually extract any real workbook in this run - just build the skill + script so it is ready to run. ${RAILS}

=== SKILL DESIGN ===
${dSkill}`, { label: 'build:skill', phase: 'Implement' })

// App edits: SEQUENTIAL (same single file). Order: v1.1-read foundation -> scoring -> reassignment UI.
const appLog = []
appLog.push(await agent(`Apply ONLY this change to ${APP} (single file). Read the file, apply the edits, then re-read changed regions to confirm. Preserve all behaviour not mentioned. ${RAILS}
After editing, return a concise list of every edit (function/line, what changed) and anything ambiguous you had to decide.

=== CHANGE: app consumes schema v1.1 (per-engagement categories/benchmarks, provenance, new fields) ===
${dCats}`, { label: 'impl:v1.1-read', phase: 'Implement' }))

appLog.push(await agent(`Apply ONLY this change to ${APP} (single file). The file was just modified by a previous step - Read it fresh first, then apply these edits on top, preserving the prior change and all unrelated behaviour. Re-read changed regions to confirm. ${RAILS}
Return a concise list of every edit and any decisions.

=== CHANGE: weighted rollups + overall = mean of topic scores ===
${dScore}`, { label: 'impl:scoring', phase: 'Implement' }))

appLog.push(await agent(`Apply ONLY this change to ${APP} (single file). The file was modified by two previous steps - Read it fresh first, then add this on top without breaking the prior changes. Re-read changed regions to confirm. ${RAILS}
Return a concise list of every edit and any decisions.

=== CHANGE: topic reassignment UI (author correction) + canonicalTopic edit ===
${dReassign}`, { label: 'impl:reassign', phase: 'Implement' }))

const skillResult = await skillP

// ---------- Phase 3: Verify (parallel, read-only / tests only) ----------
phase('Verify')
const [vTests, vScoring, vRegress] = await parallel([
  () => agent(`Run the schema validator test suite and report results VERBATIM. Commands:
  cd "${API}" && node _shared/validate.test.js
Also confirm ${SCHEMA}/migrated-example-bwi.json and ${SCHEMA}/example-engagement.json still validate. Report pass/fail counts and any failure text exactly. Do not edit anything.`, { label: 'verify:tests', phase: 'Verify' }),

  () => agent(`Adversarially verify the weighted-rollup + overall-score math now in ${APP} (Read it). Be skeptical - default to "bug present" unless the code clearly proves otherwise.
Construct a concrete worked example: a topic with three criteria, weights 3/1/3, scores 60/80/70 -> weighted topic score must equal round(470/7)=67 (not the unweighted 70); and overall must equal the MEAN of topic scores, not a flat average of all criteria. Check the code reproduces this. Hunt specifically for: (a) any COPY of the rollup that was missed (Results vs Report tabs); (b) weight defaulting to 1 when absent; (c) divide-by-zero when all scores in a topic are null; (d) applyAdj still applied; (e) topics with no scored criteria excluded correctly. Report each concrete bug with line numbers, or state clearly that it is correct. Do not edit anything.`, { label: 'verify:scoring', phase: 'Verify' }),

  () => agent(`Review ${APP} (Read it) for REGRESSIONS introduced by today's edits. Check: (1) an engagement using the legacy hardcoded 3 categories STILL loads/renders (back-compat), AND one with custom per-engagement categories renders; (2) engagement load/hydrate and autosave still work; (3) the topic-reassignment mutation never orphans scores and keeps topicConfig consistent with framework; (4) Setup subtopic selection and the Results/Report radar still render. Report concrete issues with line numbers, or confirm clean. Do not edit anything.`, { label: 'verify:regress', phase: 'Verify' }),
])

return {
  designs: { v1_1_read: dCats, scoring: dScore, reassign: dReassign, skill: dSkill },
  implemented: { app_edits: appLog, skill: skillResult },
  verification: { tests: vTests, scoring_review: vScoring, regression_review: vRegress },
}
