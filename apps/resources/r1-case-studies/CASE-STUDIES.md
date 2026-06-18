# WWRI Case Studies — Project Config & Handling Standard

**Status:** canonical. This is the single source of truth for how WWRI case
studies are structured, authored, and produced. The `case-study-ingest` skill
(`.claude/skills/case-study-ingest/`) operationalises this document. If the two
ever disagree, this document wins — update the skill to match.

WWRI holds 270+ completed engagements (consulting, executive search, org
transformation). They are the firm's strongest BD asset. The job is to turn a
raw engagement source into three standardised, audience-appropriate outputs.

---

## 1. The three outputs (per case study)

Every ingested case study produces **three** outputs from one shared data record.
They are produced **in sequence**, gated by human sign-off — see §4.

| # | Output | Format | Status | Audience | Names? | Sensitive data? |
|---|--------|--------|--------|----------|--------|-----------------|
| 1 | **Word `.docx`** — raw text, source of truth | `.docx` from locked template | ✅ **Locked** | Internal reviewers (→ SharePoint) | Real names OK | Included |
| 2 | **Web summary** — for whitewater-ri.com | TBC | ⏳ Format not finalised | **Public** | **Anonymised** | **Suppressed** |
| 3 | **Downloadable PDF** — one-pager | PPT-style template → PDF | ⏳ Template not finalised | Client-facing | Per permission | Per permission |

Output 1 is chosen as the source of truth because `.docx` is easily readable by
humans (for review/sign-off) and reasonably readable by AI. Outputs 2 and 3 are
**derived from the signed-off Output 1** — never authored independently.

The public website lives at:
<https://www.whitewater-ri.com/how-do-we-do-it/resources/case-studies>

> The **internal browse app** (`apps/resources/r1-case-studies/`, Azure Static
> Web Apps, AAD-gated) is a *separate surface* from the public website. It is the
> internal library/finder fed by `case-studies.json`. Do not confuse it with
> Output 2 (the public website summary).

---

## 2. The data backbone — `case-studies.json`

One JSON array; each entry is one case study and holds **everything** needed to
generate all three outputs. The Word doc, web summary, and PDF are all rendered
*from this record* — so the record must be complete before generation.

> **Known gap:** the existing hand-assembled entries are *leaner* than their
> hand-made Word docs (e.g. `client_insight` and `[AI — verify]` metadata markers
> live in the `.docx` but were never written back to JSON). During ingestion,
> the JSON entry is the complete authored artifact — populate every field,
> including provenance markers, so the generator produces a faithful Word doc.

### Field reference

| Field | Used by | Notes |
|-------|---------|-------|
| `id` | internal | Stable identifier, e.g. `"Consulting - GTM Transformation - Lifesciences Technology, Global"` |
| `category` | all | `Consulting` \| `Search & Recruitment` |
| `title` | web/app | Case study display title (outcome-oriented), e.g. *"Accelerated Growth Through Global Go-to-Market Transformation"* |
| `tags[]` | app filter | Service-type / theme tags |
| `client_name` | **Word title + Client Details** | Real name. Internal only. |
| `public_client_name` | **web summary** | Anonymised label, e.g. *"Global Life Sciences & Technology Company"* |
| `website_approved` | gate for Output 2/permission line | `true`/`false`. Drives the Word "client permission" line and whether the real name may appear publicly. Default `false`. |
| `hook` | **Word Headline**, web | One-line headline, 10–15 words |
| `ambition` | **Word: The Ambition** | Narrative paragraph |
| `challenge` | **Word: The Challenge** | Narrative paragraph |
| `challenges[]` | app/internal | Structured challenge bullets (internal browse aid; not the Word body) |
| `solutions` | **Word: Solutions Applied** | **Narrative paragraph, not bullets.** AI-authored → prefix `[DRAFT — for review]`. |
| `activities[]` | legacy fallback | Old bullet form. New entries leave empty and use `solutions`. |
| `benefits[]` | **Word: Results** | Bullet list. Kept as bullets. |
| `client_insight` | **Word: Client Insight** | The "aha" moment, narrative paragraph. AI-authored → prefix `[DRAFT — for review]`. |
| `revenue` | Word (internal) | Suppressed in public outputs |
| `headcount` | Word (internal) | Suppressed in public outputs |
| `industry` | Word Client Details, web | |
| `geography` | Word Client Details, web | Regions/countries where work was performed |
| `type_of_reinvention` | Word Client Details, filename | |
| `duration` | Word Client Details | |
| `client_lead` | Word Client Details | e.g. CEO/CFO/CHRO. Owner to supply. |
| `ww_contact` | Word Client Details | **The RP Lead** (Reinvention Partner). Owner to supply. |
| `date_reviewed` | Word Client Details | **Set by the reviewing RP at sign-off. Never set by AI. Always rendered blank by the generator.** |
| `source_file` | provenance | Original PPTX/source path |
| `hero_image` | Output 3 PDF | Bare filename (resolved under `assets/cs-heroes/`, then `assets/`) or an absolute path for the brochure hero image. Falls back to a dark gradient if unset/missing. |

---

## 3. Output 1 — Word document (locked)

### Template structure (`Case Study Template.docx`)

```
<Name>                          ← client_name (internal source of truth)
Headline                        → hook
The Ambition                    → ambition (narrative)
The Challenge                   → challenge (narrative)
Solutions Applied               → solutions (NARRATIVE paragraph, not bullets)
Results                         → benefits[] (bullets, one per benefit)
Client Insight                  → client_insight (narrative)
Client Details                  → metadata block (order below)
```

**Client Details — canonical order** (do not reorder):
Company name → Industry → Company size, revenue → Company size, employees →
Geography → Type of reinvention → Duration → Client lead for reinvention →
Do we have client permission to use their name → Whitewater point of contact →
Date reviewed.

Template conventions, locked:
- Placeholders are `<…>` angle brackets.
- Heading is plain **"Solutions Applied"** (no "(narrative)" suffix — the
  narrative requirement lives in guidance, not the heading).
- Whitewater point of contact = **`<RP Lead>`** (the Reinvention Partner lead).
- Permission line default is **No** (`website_approved: true` → "Yes").
- Date reviewed = **`<not done by AI, review signed off by RP>`** → left blank.

### Generation

Use the generator — it clones the locked `.docx` so branding/styling is
preserved and the output is deterministic:

```
python .claude/skills/case-study-ingest/scripts/build_word_doc.py \
    --json apps/resources/r1-case-studies/case-studies.json \
    --id "<entry id>" \
    --out "assets/cs-word/"
```

The generator is intentionally "dumb": it renders **exactly** what is in the
JSON. All provenance markers must already be in the field values.

### Provenance markers (mandatory — see `feedback_cs_draft_provenance`)

- **`[DRAFT — for review]`** → AI-*authored narrative* (`solutions`,
  `client_insight`). The prose is the AI's, written from the source — the
  reviewer is checking framing/wording, not facts.
- **`[AI — verify]`** → a *missing* field the ingestion process filled using
  **publicly available knowledge** (external to the source document). It flags
  "AI guessed this from the public record — check it against reality." Always
  add a one-line basis citing the public source/reasoning, e.g.
  `[AI — verify] ~£2,284M ≈ post-divestiture Invensys plc (late 2000s) — period employee count not publicly confirmed`.
  Do **not** use it for facts already stated in the source.
- **`[TO COMPLETE]`** → owner-only fields where no attempt was made and the
  owner/RP must supply the value (e.g. `ww_contact`/RP Lead, `client_lead`).
- **Never fabricate** real specifics (names, headcounts, dates). If a gap cannot
  be reliably filled from the public record, leave it `[TO COMPLETE]` rather
  than guessing — `[AI — verify]` means "sourced but unconfirmed," not invented.
- `date_reviewed` is always blank — the RP sets it at sign-off.

---

## 4. The pipeline & the sign-off gate

```
Source (PPTX / notes / transcript)
        │
        ▼
[A] Populate case-studies.json entry  ── author narrative + metadata,
        │                                 apply provenance markers
        ▼
[B] Generate Output 1 (Word .docx)    ── build_word_doc.py
        │
        ▼
   ┌─────────────────────────────────┐
   │  SHARePOINT REVIEW + SIGN-OFF   │  ← RP reviews, fills [TO COMPLETE],
   │  (RP sets date_reviewed)        │    verifies [AI — verify], removes [DRAFT]
   └─────────────────────────────────┘
        │  GATE: nothing downstream until signed off
        ▼
[C] Output 2 (public web summary)  +  [D] Output 3 (PPT-style PDF)
        anonymised, derived from the signed-off record
```

**Hard rule:** Outputs 2 and 3 are produced **only after** Output 1 is signed
off (`date_reviewed` populated). Until then, ingestion stops at the Word doc.

---

## 5. Output 2 — Web summary (format TBC)

Target: the **public** whitewater-ri.com case-studies page. Until the website
integration format is finalised, produce an **interim anonymised summary** and
mark it clearly as provisional.

Anonymisation rules (public):
- Use `public_client_name`, **never** `client_name` — unless `website_approved`
  is `true` and the owner has confirmed public name use.
- **Suppress** `revenue` and `headcount` entirely.
- No individual people's names.
- Summary = `title` + anonymised `hook` + a tightened version of
  ambition/challenge/solutions + selected `benefits` (de-quantified only if a
  figure is identifying).

Interim deliverable: an anonymised Markdown summary per case study (or a
`website_approved`-filtered projection of the JSON). Do not hand-author —
derive from the signed-off record.

---

## 6. Output 3 — Downloadable PDF brochure (implemented)

Target: the website's "Download the case study" asset — a **branded, flowing,
multi-page PDF** (dark cover header → two-column body with green section headings
→ dark "We don't transform. We reinvent." closing page). It is **not** a one-page
slide; it is a paginated document, typically two pages for a standard study.

Generated from the signed-off JSON record via headless Chrome:

```
python .claude/skills/case-study-ingest/scripts/gen_cs_brochure.py --id "<entry id>"
```

- Engine: an HTML/CSS brochure template printed to PDF with `chrome --headless
  --print-to-pdf` (no PowerPoint/Publisher). Anonymisation rules of §5 apply
  (uses `public_client_name`; `[TO COMPLETE]`/`[AI …]` fast-facts are skipped).
- Hero image: set `hero_image` on the record (see §2); drop the asset in
  `assets/cs-heroes/`. Falls back to a dark gradient if unset.
- Output: `assets/cs-one-pagers/<public_client_name> — brochure.pdf` (plus the
  rendered `.html` for inspection).
- Richer FMCG-style components (pull-quote callouts, infographic Results band)
  are not yet in the template; add them when a study needs them.

---

## 7. Prose and style standards

These rules apply to all narrative fields (`hook`, `ambition`, `challenge`,
`solutions`, `client_insight`, `benefits[]`). The generator renders exactly
what is in the JSON — so conformance must be in the JSON, not fixed downstream.

The canonical signed-off reference is the DPJ case study (Adam Salzer, June 2026).

### 7a. Deidentification in body text

Narrative body fields must not name the client company or any individual.
Use **"The Client"** as the standard substitution for the company name throughout
the prose. Real names belong only in the metadata fields (`client_name`,
`client_lead`) and the document title — not in the body.

- "Domino's Pizza Japan wanted…" → "The Client sought…"
- "The CEO of [Company]…" → "The Client's CEO…"
- Company abbreviations (e.g. "DPJ") → "The Client"

This means the Word doc body is already largely anonymisable at sign-off,
reducing the effort to produce Outputs 2 and 3.

### 7b. Formal corporate prose

The register is formal business/consulting writing. Specifically:

- **No colloquialisms.** Replace informal phrasing with formal equivalents:
  "find out" → "determine". Exception: the signed-off DPJ hook ("proves",
  "makes or breaks") shows that punchier idiomatic language is acceptable in
  the one-line `hook` — this field acts as a headline, not body prose.
- **No em-dashes in the narrative body paragraphs** (`ambition`, `challenge`,
  `solutions`, `client_insight`). Replace with a colon, semicolon, comma, or
  restructured sentence.
  *Em-dashes are acceptable* in the `hook` (headline register) and in
  `benefits[]` bullets where they act as connective punctuation.
  *Exception:* the provenance markers `[DRAFT — for review]` and
  `[AI — verify]` are technical notations and retain their em-dashes.
- Sentence structure should be complete and precise. Avoid sentence fragments
  and bullet-style prose in the narrative paragraph fields (the DPJ entry
  contains a fragment in the Ambition field — this was the RP's deliberate
  choice and is acceptable in signed-off content).
- **Third person in Solutions.** Use "Whitewater analyzed…" / "Whitewater was
  able to work with…", not "We analyzed…".
- **Numerals, not spelled-out numbers**, in hooks and bullets: "9x", "7", "2",
  "20x", "50%", "102" — not "nine times", "seven", "two".
- **Latin abbreviations are punctuated:** "ie" → "i.e.", "eg" → "e.g.". Never
  leave them bare.

### 7c. American English spelling

All narrative text uses **American English**:

| British | American |
|---------|----------|
| organisation | organization |
| behaviour / behavioural | behavior / behavioral |
| labour | labor |
| programme | program |
| centre | center |
| colour | color |
| recognise | recognize |
| personalised | personalized |
| centred | centered |
| analyse / analysed | analyze / analyzed |
| localise / localisation | localize / localization |
| stabilise / stabilised | stabilize / stabilized |

### 7d. Multi-paragraph narrative fields

`challenge`, `solutions`, and `client_insight` may span multiple paragraphs.
Separate paragraphs with `\n\n` in the JSON value — the generator will expand
these into individual paragraph elements in the Word doc, each inheriting the
template paragraph's formatting. A single `\n` within a paragraph value is
rendered as-is (no split).

---

## 8. File map

| Thing | Path |
|-------|------|
| **Locked Word template** | `assets/cs-word/Case Study Template.docx` |
| Finished Word docs (Output 1) | `assets/cs-word/Case Study <Client> – <Reinvention>[ (to review by <WW contact>)].docx` |
| **Data backbone** (all fields, all entries) | `apps/resources/r1-case-studies/case-studies.json` |
| Internal browse app | `apps/resources/r1-case-studies/index.html` |
| Word generator (clones template) | `.claude/skills/case-study-ingest/scripts/build_word_doc.py` |
| Batch regenerate all docs | `.claude/skills/case-study-ingest/scripts/regen_all_docs.py` |
| Prose normalizer (spelling + i.e./e.g.) | `.claude/skills/case-study-ingest/scripts/normalize_prose.py` |
| Conformance validator | `.claude/skills/case-study-ingest/scripts/validate_entries.py` |
| Shared rule tables (single source of truth) | `.claude/skills/case-study-ingest/scripts/_prose_rules.py` |
| Ingestion skill | `.claude/skills/case-study-ingest/SKILL.md` |
| **Output 3 PDF brochure generator** | `.claude/skills/case-study-ingest/scripts/gen_cs_brochure.py` |
| Brochure hero images | `assets/cs-heroes/` |
| Output 3 PDFs (+ rendered HTML) | `assets/cs-one-pagers/` |

### Filename lifecycle

The Word filename is derived deterministically by the generator:
`Case Study {company} – {reinvention}`, where `company` is `client_name`, or
`public_client_name` when `client_name` is a `[TO COMPLETE]` placeholder, and
`reinvention` is the primary `type_of_reinvention` label (before the first comma
or dash). The reviewer suffix follows sign-off state:

- **at the gate**, `ww_contact` known → ` (to review by <ww_contact>)`
- **at the gate**, `ww_contact` unset → ` (to review — WW contact TBC)`
- **signed off** (`date_reviewed` set) → no suffix

`regen_all_docs.py` applies all of this automatically; there is no manual rename.

---

## 9. Terminology

- **RP** = Reinvention Partner (WWRI's term for the IE delivering the work). The
  Word "Whitewater point of contact" = the **RP Lead**.
- **Reinvention** = the engagement/transformation type.
- Public website is **whitewater-ri.com** (not whitewatertx).
