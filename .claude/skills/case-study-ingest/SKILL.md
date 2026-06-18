---
name: case-study-ingest
description: Ingest a WWRI engagement into the standard case-study pipeline — produce the Word source-of-truth doc (Output 1), then the anonymised web summary (Output 2) and PPT-style PDF content (Output 3) after sign-off. Use when the user wants to convert, ingest, or add a case study, turn an engagement/PPTX/notes into a case study, or produce the case-study Word doc.
argument-hint: "[source path: .pptx / notes / transcript / existing json id]  [--word-only]  [--post-signoff <id>]"
---

# Case Study Ingestion

Turns a raw WWRI engagement source into the three standard outputs. The full
domain standard lives in **`apps/resources/r1-case-studies/CASE-STUDIES.md`** —
read it first; this skill is the procedure that executes it.

## Core rules (do not violate)

1. **`case-studies.json` is the backbone.** Author the complete entry there
   first; all three outputs render from it. Never author a Word doc independently
   of the JSON.
2. **Sign-off gate.** Output 1 (Word) → SharePoint review/sign-off → *only then*
   Outputs 2 & 3. A normal run stops at Output 1.
3. **Provenance markers are mandatory** (`feedback_cs_draft_provenance`):
   `[DRAFT — for review]` on AI-authored narrative; `[AI — verify]` + basis on
   sourced metadata; `[TO COMPLETE]` for owner-only fields; never fabricate
   real names/headcounts/dates; `date_reviewed` always left blank (RP sets it).
4. **The Word template is locked** — generate by cloning it, never rebuild it.
5. **Body text is deidentified.** Narrative fields (`hook`, `ambition`,
   `challenge`, `solutions`, `client_insight`, `benefits[]`) must not name the
   client company or any individual. Use **"The Client"** for the company and
   "The Client's CEO / CFO / etc." for named individuals. Real names belong
   only in `client_name`, `client_lead`, and the document title.
6. **Formal corporate prose.** No colloquialisms in body paragraphs. No
   em-dashes in the narrative body paragraphs (`ambition`, `challenge`,
   `solutions`, `client_insight`) — replace with a colon, semicolon, comma, or
   restructured sentence. Em-dashes *are* acceptable in the `hook` and
   `benefits[]` bullets. Exception: provenance markers retain their em-dashes.
   **Solutions use third person:** "Whitewater analyzed…", not "We analyzed…".
   **Numerals not spelled-out words** in hooks and bullets: "9x", "7", "102".
   **Punctuate Latin abbreviations:** "ie" → "i.e.", "eg" → "e.g.".
7. **American English spelling** throughout: organization, behavior, labor,
   program, center, color, analyze, localize, stabilize, etc.
8. **Multi-paragraph fields:** `challenge`, `solutions`, `client_insight` may
   use `\n\n` in the JSON value to produce multiple paragraphs in the Word doc.

## On activation

1. Read `apps/resources/r1-case-studies/CASE-STUDIES.md` (the standard).
2. Identify the source: a `.pptx`, notes/transcript, or an existing JSON `id`
   needing completion/regeneration. If unclear, ask which engagement.
3. Determine the stage:
   - **Default / `--word-only`** → run Stage A + B (author JSON, build Word doc),
     then stop at the sign-off gate.
   - **`--post-signoff <id>`** → the Word doc is signed off (`date_reviewed` set);
     run Stage C + D (web summary + PDF content).

## Stage A — Author the JSON entry

Extract from the source and populate the full entry (see field reference in the
standard). Author the narrative fields:

- `hook` — one line, 10–15 words, outcome-oriented.
- `ambition`, `challenge` — narrative paragraphs.
- `solutions` — **narrative paragraph, not bullets.** Prefix `[DRAFT — for review]`.
- `benefits[]` — results as bullets (kept as bullets).
- `client_insight` — the surprising "aha". Prefix `[DRAFT — for review]`.
- Metadata: `client_name`, `public_client_name`, `industry`, `geography`,
  `revenue`, `headcount`, `type_of_reinvention`, `duration`, `client_lead`,
  `ww_contact` (RP Lead), `website_approved` (default `false`).
- Sourced gap-fills → `[AI — verify] <value> — <basis>`. Unknown owner fields →
  `[TO COMPLETE]`. Leave `date_reviewed` empty.

Add or update the entry in `apps/resources/r1-case-studies/case-studies.json`
(validate JSON parses).

Then run the conformance tools (both live in this skill's `scripts/`):

```
python .claude/skills/case-study-ingest/scripts/normalize_prose.py        # auto-fix spelling + i.e./e.g.
python .claude/skills/case-study-ingest/scripts/validate_entries.py --id "<entry id>"
```

`normalize_prose.py` applies American spelling and Latin-abbreviation punctuation
across narrative fields (idempotent — safe to run any time). `validate_entries.py`
flags style violations it cannot auto-fix: **em-dashes in body paragraphs**
(`ambition`/`challenge`/`solutions`/`client_insight`), missing required fields,
and any remaining drift. Fix every ERROR before generating; PENDING markers
(`[DRAFT]`/`[TO COMPLETE]`/`[AI — verify]`) are expected at the gate.

## Stage B — Generate Output 1 (Word .docx)

```
python .claude/skills/case-study-ingest/scripts/build_word_doc.py \
    --json apps/resources/r1-case-studies/case-studies.json \
    --id "<entry id>" \
    --out "assets/cs-word/"
```

The filename is derived automatically (`display_name` falls back to
`public_client_name` when `client_name` is a `[TO COMPLETE]` placeholder; the
reviewer suffix follows the lifecycle in Notes). To rebuild **all** docs after a
generator or bulk-JSON change, use `regen_all_docs.py` instead.

Verify the output against the standard (correct section order, narrative
Solutions, bullet Results, canonical Client Details order, markers present,
`date_reviewed` blank). **Stop here** and tell the user the doc is ready for
SharePoint review/sign-off. Do not proceed to Outputs 2/3.

## Stage C — Output 2 (web summary) — only after sign-off

Confirm `date_reviewed` is populated (sign-off done). Produce the **anonymised**
public summary from the signed-off record:
- Use `public_client_name` (never `client_name`) unless `website_approved: true`.
- Suppress `revenue`/`headcount`; no individual names.
- Mark the artifact **provisional — web format TBC**.

## Stage D — Output 3 (branded PDF brochure) — only after sign-off

Generate the branded, multi-page PDF brochure (the website "Download the case
study" asset) from the signed-off record via headless Chrome:

```
python .claude/skills/case-study-ingest/scripts/gen_cs_brochure.py --id "<entry id>"
```

Output: `assets/cs-one-pagers/<public_client_name> — brochure.pdf` (+ the rendered
`.html`). Anonymisation rules of CASE-STUDIES.md §5 apply. Set `hero_image` on the
record and drop the asset in `assets/cs-heroes/` for the cover photo (falls back
to a gradient if unset). See CASE-STUDIES.md §6 for the full spec.

## Notes

- All Output 1 docs live in `assets/cs-word/`. The locked template is
  `assets/cs-word/Case Study Template.docx`.
- `build_word_doc.py` is deterministic and renders exactly what is in the JSON —
  if a marker is missing from the doc, fix the JSON, not the doc. Bullet spacing
  (6 pt, Results + Client Details) is applied automatically by the generator.
- **Batch regeneration:** after a generator change or a bulk JSON edit, regenerate
  every doc with `python .claude/skills/case-study-ingest/scripts/regen_all_docs.py`.
  It clears `assets/cs-word/` (keeping template + source files), rebuilds all
  entries, and applies the reviewer-suffix naming.
- **Reviewer suffix:** filenames carry `(to review by <ww_contact>)` while at the
  sign-off gate, or `(to review — WW contact TBC)` if `ww_contact` is unset. Once
  an entry is signed off (`date_reviewed` populated), the suffix is dropped.
