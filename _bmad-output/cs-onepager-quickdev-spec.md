# Quick-Dev Spec — Case Study One-Pager PDF Generator (Output 3)

**Status:** draft for approval · **Author:** Angelus (via Claude) · **Date:** 2026-06-18
**BMad path:** quick-dev (single tool, direct in-repo precedent — no PRD/architecture cycle)

## 1. Purpose

Produce **Output 3** of the case-study pipeline: a one-page, branded PDF that matches
the existing *Whitewater Reinventions* case-study one-pagers (the dark slide layout —
title bar, green section headings, hero image, right-hand fast-facts, logo). Driven
from a single `case-studies.json` record so it stays consistent with Outputs 1 & 2.

## 2. Approach (decided)

**PPTX-stamp → PDF**, mirroring `scripts/slides/gen_rp_slide.py`. The brand design
lives in the `.pptx` template; the script stamps text into a copy and exports to PDF.
No visual rebuild, pixel-faithful, reuses the proven RP-slide pattern.

- Render engine: `python-pptx` 1.0.2 (installed)
- PDF export: PowerPoint COM (confirmed available on this machine)

## 3. Template (the simpler "air-cargo" layout)

Target layout = the air-cargo one-pager screenshot, **not** the FMCG deck (which has
an extra center infographic column). Single slide, 13.33 × 7.5 in (16:9).

**Region map (left text column / right rail):**

| Region | Source JSON field | Notes |
|--------|-------------------|-------|
| Title bar | `title` | one line |
| "Context" body | `ambition` | narrative |
| "Root Issues & Opportunities" body | `challenge` | narrative |
| "What We Did" body | `solutions` | narrative |
| "Results and Impact" | `benefits[]` | bullets |
| Hero image | **`hero_image`** (NEW field) | per-study image; falls back to a default sector image |
| Fast fact — Company size | `revenue` | |
| Fast fact — Industry | `industry` | |
| Fast fact — Geography | `geography` | |
| Fast fact — Type of Reinvention | `type_of_reinvention` | |
| Logo + diagonal hatch | (master) | left untouched |

Section **headings are fixed** in the template (green); the script only replaces body
text and fast-facts, identified by shape name (same technique as gen_rp_slide.py:
named shapes / placeholders, stripped and re-stamped).

## 4. Text-fit strategy (the main risk)

One-pagers use fixed text boxes; prose length varies. Plan:
1. Set body boxes to `word_wrap = True` + `MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE` (shrink-to-fit).
2. Add a `validate_entries.py`-style length advisory (warn if a field exceeds the
   comfortable character budget for its box) so authors keep prose within range.
3. Bullets: cap at the template's row budget; warn on overflow rather than silently clip.

## 5. CLI

```
python scripts/slides/gen_cs_onepager.py \
    --json apps/resources/r1-case-studies/case-studies.json \
    --id "<entry id>" \
    [--template scripts/slides/templates/cs-onepager-template.pptx] \
    --out "assets/cs-one-pagers/" \
    [--pdf]          # also export PDF via PowerPoint COM
```

Anonymisation: uses `public_client_name`, suppresses any field per the Output 2/3 rules
in `CASE-STUDIES.md` §5–6. Gated on sign-off (`date_reviewed` set) like Output 2.

## 6. File map

| Thing | Path |
|-------|------|
| Generator | `scripts/slides/gen_cs_onepager.py` (new) |
| Master template | `scripts/slides/templates/cs-onepager-template.pptx` (new — see §8) |
| PDF-export helper | `scripts/slides/pptx_to_pdf.py` (new, PowerPoint COM) |
| Output PDFs | `assets/cs-one-pagers/` (existing) |
| Pipeline hook | `case-study-ingest` Stage D (Output 3) |

## 7. Pipeline integration

Becomes the real implementation of Stage D in the `case-study-ingest` skill: after
sign-off, generate the one-pager PDF from the signed-off record. Update
`CASE-STUDIES.md` §6 from "template not finalised (stub)" to point at this generator.

## 8. Open dependency (need from Angelus)

**The clean master `.pptx` for the air-cargo (simpler) layout.** It's not in
`assets/cs-templates/` (the collections deck is only 3 slides; the FMCG deck is the
richer infographic variant). Options, best first:
- **(a)** You provide the `.pptx` the air-cargo screenshot was exported from → use it as the master.
- **(b)** I derive a clean master by stripping the infographic column out of the FMCG deck slide.
- **(c)** Build the master slide from scratch in python-pptx (most work, least faithful).

## 9. Effort

~Half a day once the master template (§8) is in hand: stamping script + COM PDF export +
length advisory + pipeline wiring + Cathay PDF as the first output.

## 10. New JSON field

Add `hero_image` (string path/filename) to the schema so each one-pager gets its own
image; document it in `CASE-STUDIES.md` field reference. Default per category if unset.
