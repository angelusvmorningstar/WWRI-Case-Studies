# Test Automation Summary — SI Migration + App Scoring

_Quinn (QA) · plain `node` + `assert` (matches the project's existing pattern; no new test-runner deps)_

## Generated Tests

### API / unit tests — data layer & migration pipeline (Scope A)
- [x] `structured-interview/api/_shared/validate.test.js` — schema + cross-ref validator (**existing**, 21 checks, still green)
- [x] `.claude/skills/si-migrate/extract-workbook.test.mjs` — **new**, 19 checks. Mapper unit tests:
  - `toScore` (ratio→0-100, blanks/dashes omitted, clamping)
  - `excelDateToISO` (1900-system serial → ISO; null on garbage)
  - `findIdCol` (locates the Topic/Subtopic id column)
  - `mapFramework` (positional Topics layout, weights, reserved-slot skip, duplicate-id re-slug, subByLabel/topicConfig)
  - `mapScores` (label-join ×100, blank omission, `meta.joinCol` workstream join)
  - `mapIdentity` (identity fields, Excel-date conversion, interviewers, Attendees+joinCol)
  - `mapBenchmarks` (per-category thresholds ×100, category order)
- [x] `.claude/skills/si-migrate/backfill-questions.test.mjs` — **new**, 5 checks. `applyMap`:
  - sets subtopic `purpose` + `topicConfig.questions`; blank question not written
  - **never mutates scores**; reports unknown map keys + uncovered subtopics; creates `questions` if missing

### Unit tests — SI app scoring (Scope B)
- [x] `structured-interview/app/scoring.test.mjs` — **new**, 11 checks. Weighted-scoring helpers extracted **directly from the shipped `index.html`** (tests the real code, no browser needed):
  - `weightedMean` — the worked example (3/1/3, 60/80/70 → **67, not 70**), plain-mean parity at weight 1, null on nothing-scored (no divide-by-zero), unscored-criteria ignored, missing-weight default, weight-0 exclusion
  - `buildWeightMap` — effective weight = subtopic × criterion, defaults to 1
  - `orderedCats` — order follows `categoryOrder`, falls back to benchmark keys, ignores unknown entries

### Real browser E2E — SI app (Scope B, Playwright + Chromium)
- [x] `structured-interview/e2e/tests/si-app.spec.js` — **new**, 5 tests, real headless Chromium against the live preview server:
  - picker lists all migrated engagements
  - **BWI Setup renders migrated data without crashing** (the two crashes we fixed) + shows the backfilled question (asserts the exact value `"Tell me about the competition…"`; verified with a negative control — fails without backfill)
  - topic-reassignment "Move to topic…" dropdown present on a migrated engagement
  - **BWI Results renders weighted scoring** (radar SVG + benchmark categories) without crashing
  - SMEC (workstream-based) opens and lists workstream sessions
  - Requires: preview server running at `:8099` + migrated `engagements/` present.

## Results

| Suite | Checks | Status |
|---|---|---|
| validate.test.js (validator) | 21 | ✅ |
| extract-workbook.test.mjs (mappers) | 19 | ✅ |
| backfill-questions.test.mjs (applyMap) | 5 | ✅ |
| scoring.test.mjs (app weighting) | 11 | ✅ |
| si-app.spec.js (browser E2E) | 5 | ✅ |
| **Total** | **61** | **✅ all pass** |

## How to run

```bash
# validator
cd structured-interview/api && node _shared/validate.test.js
# migration mappers + backfill
node ".claude/skills/si-migrate/extract-workbook.test.mjs"
node ".claude/skills/si-migrate/backfill-questions.test.mjs"
# app scoring helpers
cd structured-interview/app && node scoring.test.mjs
# real browser E2E (needs the preview server running on :8099)
cd structured-interview/e2e && npx playwright test
```

## Notes / enablers
- Added `export { … }` + an `isMain` CLI guard to `extract-workbook.mjs` and `backfill-questions.mjs` so the pure mappers/`applyMap` are unit-testable without running the CLI or hitting SharePoint. Both CLIs verified still working.
- Fixtures mirror Graph `usedRange(valuesOnly)` shape (leading empty columns trimmed → category/id in column 0). Verified against the live SODIAAL Tables sheet before asserting.
- App helpers are extracted from `index.html` by brace-matching at test time, so the tests track the shipped source automatically.

## Next steps (not done)
- Wire the five commands into a CI step / a root `test` script, and stand the preview server up in CI (or point E2E at the deployed app once live).
- Broaden E2E: full Interview→score→Results flow, actually performing a topic reassignment + asserting scores survive, Report/print view.
- SharePoint-touching paths (`extract`/`backfill` end-to-end, `sp.mjs`) are integration-tested manually via the migration runs; not unit-covered (would need Graph mocking).
