---
name: si-migrate
description: Convert ONE legacy WWRI Structured-Interview Excel workbook into ONE
  validated engagement.schema.json v1.1 document. Pulls sheets from SharePoint,
  maps Topics→framework / Evaluation Data→scores / Summary→identity /
  Tables→benchmarks, validates, then writes only after you eyeball it. Use when
  the user wants to migrate/import an SI assessment workbook (SODIAAL, BWI, DJP,
  Hart, SkyCity, SMEC) into the SI app dataset.
argument-hint: "[workbook key e.g. sodiaal] [--write]"
---

# SI Workbook Migration

Turns one legacy "Assessment Questionnaire / Interview Analytics" workbook into one
engagement document. The **contract is `structured-interview/schema/MIGRATION.md`** —
read it first; this file is the operating procedure. The worked reference is
`schema/migrated-example-bwi.json`. ONE workbook at a time. SODIAAL first.

The driveId/itemId registry for the six workbooks lives **inline in
`extract-workbook.mjs`** (the `WORKBOOKS` const) — resolve/confirm each at propose
time with `sp.mjs get` before trusting the itemId.

## Core rules (do not violate)
1. **Validate-before-write is hard.** Nothing lands in `engagements/` until
   `validateEngagement()` returns `valid:true` AND Angelus has eyeballed the preview.
   The script `process.exit(1)`s rather than write an invalid doc.
2. **One workbook → one engagement.** No batch runs.
3. **Never fabricate scores or identity.** Blank score cell ⇒ omit the key
   (missing ≠ 0). Unknown category/interviewer ⇒ stop and ask, don't guess.
4. **Derive, don't import:** Radar/Diagram/Readiness/Analysis sheets are charts —
   recompute rollups, never copy chart values.
5. **The uuid is minted once at propose time and frozen;** `--write` reuses the same
   preview file (so manual eyeball-edits survive).

## Procedure
### 1. Resolve workbook
Look up driveId/itemId in the `WORKBOOKS` const in `extract-workbook.mjs` (or
`sp.mjs search "<name>"`). Confirm the `.xlsx` hit, not a PDF/DOCX sibling, with
`sp.mjs get <driveId> <itemId>`.

### 2. Propose (dry-run, default)
`node extract-workbook.mjs <key>` →
  - pulls sheets via `sp.mjs` (`sheets` + `range`, **NOT `read`** — an .xlsx
    streams binary OOXML from `read`);
  - builds the v1.1 doc (mappers below);
  - runs `validateEngagement()`;
  - writes the preview to the scratchpad and prints a human summary:
    topics/subtopics + weights, interviewee roster (company/region/function/
    category/date/interviewers), benchmark table + categoryOrder, score-matrix
    fill-rate, and a WARNINGS block (blanks omitted, re-slugged dup ids,
    sheet-name variants, reviewer weights ignored).
  - If invalid: it prints the validator errors and STOPS (no write).

### 3. Eyeball
Present the summary + validator result. Wait for explicit approval. Angelus may
hand-edit the preview JSON; re-run `node extract-workbook.mjs <key> --validate <previewPath>`
to re-check.

### 4. Write (approved only)
`node extract-workbook.mjs <key> --write` → re-validates the (possibly edited)
preview and copies it to `engagements/{uuid}.json`. Echoes the path + uuid. Refuses
if invalid or if the preview is missing.

### 5. Report
One line: engagement name, uuid, path, interviewee count, any items left for
follow-up (e.g. SODIAAL Supervisors as a second engagement).

## Per-workbook quirks (carry MIGRATION.md §7)
- **SODIAAL:** summary sheet is named **"Interview Summary"**; 2 tiers (Senior
  Executive, Manager); dup subtopic id `05.3` → re-slug; separate Supervisors set
  may be a 2nd run.
- **BWI:** 4 tiers + weights + `Commentary` sheet → background/notes. Three `.xlsx`
  hits exist — confirm the canonical itemId at propose time.
- **Hart/DJP:** straightforward; Hart has variable weights.
- **SkyCity:** single "All" benchmark tier; uniform weights.
- **SMEC:** workbook is "SMEC Assessment Questionnaire Analysis.xlsx" (a `.docx`
  sibling exists); verify the sheet layout — older/divergent layouts per §7.

## Schema invariants the mappers honour
(from `engagement.schema.json` + `validate.js` cross-ref)
- `id` = real uuid (`randomUUID`); all topic/subtopic/crit/interviewer/interviewee
  ids match `^[A-Za-z0-9_.-]+$`, ≤64 chars, and are **unique** — hence `dedupe()`
  for SODIAAL's repeated `05.3`.
- `scores` keys are **criterion** ids (`c_…`), values integers 0–100; blanks omitted.
- every `interviewees[].category` is a key of `benchmarks`; every `categoryOrder`
  entry too — the validator rejects otherwise (so identity categories and Tables
  categories are reconciled, normalising whitespace/case).
- `interviewerIds` ≤3; `topicConfig` keys are framework topic ids and each
  `selected` id a subtopic of that topic.
- `sessions` keyed by interviewee id; `startedAt:null`; statuses `complete`.
- timestamps need seconds + `Z` — `new Date().toISOString()` satisfies the regex.

## Notes
- Env: `MSGRAPH_TENANT_ID`, `MSGRAPH_CLIENT_ID` (same token cache as the mail
  tooling — `~/.wwri-graph-token.json`). First run with SharePoint scopes may
  prompt a one-off device-code login.
- `validateEngagement` is CJS in `structured-interview/api/_shared/validate.js`;
  loaded via `createRequire`. It needs `ajv` + `ajv-formats` resolvable there
  (`npm i` under `structured-interview` if not).
- The weighted-rollup app change (MIGRATION.md §4) is **out of scope** for this
  skill — it only stamps weights into the data; honouring them in the live app is
  separate, Angelus-gated work.
