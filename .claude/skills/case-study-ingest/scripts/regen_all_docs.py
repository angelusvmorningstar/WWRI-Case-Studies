#!/usr/bin/env python
"""
Regenerate every case-study Word doc (Output 1) from the JSON backbone.

Run after a generator change or a bulk JSON edit. Clears assets/cs-word/ (keeping
the template + source reference docs), rebuilds one .docx per entry, and applies
the reviewer-suffix naming lifecycle:

  - signed off (date_reviewed set)         → no suffix
  - at the gate, ww_contact known          → " (to review by <ww_contact>)"
  - at the gate, ww_contact unset/[TO ...] → " (to review — WW contact TBC)"

Filenames are derived deterministically from the generator's own naming logic
(display_name falls back to public_client_name when client_name is a placeholder),
so no per-entry hardcoding is needed.

Usage:
    python .claude/skills/case-study-ingest/scripts/regen_all_docs.py
"""
import json
import os

from build_word_doc import build, display_name, safe_name, reinvention_label

WORD_DIR = 'assets/cs-word'
JSON_PATH = 'apps/resources/r1-case-studies/case-studies.json'

SKIP_FILES = {
    'Case Study Template.docx',
    "Nicolette's Case Studies (source).docx",
    'Whitewater Case Study Template 2026.docx',
}


def auto_base(entry):
    return f"Case Study {safe_name(display_name(entry))} – {reinvention_label(entry)}"


def reviewer_suffix(entry):
    if (entry.get('date_reviewed') or '').strip():
        return ''  # signed off — drop the suffix
    contact = (entry.get('ww_contact') or '').strip()
    if contact and not contact.startswith('[TO COMPLETE]'):
        return f' (to review by {contact})'
    return ' (to review — WW contact TBC)'


def main():
    # ── Clear existing case-study docs ────────────────────────────────────────
    print("Clearing existing docs...")
    for fname in os.listdir(WORD_DIR):
        if fname.endswith('.docx') and fname not in SKIP_FILES:
            os.remove(os.path.join(WORD_DIR, fname))

    with open(JSON_PATH, encoding='utf-8') as f:
        data = json.load(f)

    print(f"Generating {len(data)} docs...")
    seen = {}
    errors = []
    for idx, entry in enumerate(data):
        try:
            base = auto_base(entry) + reviewer_suffix(entry)
            fname = base + '.docx'
            if fname in seen:
                # Collision: disambiguate with the entry index so nothing is lost
                fname = f"{base} ({idx}).docx"
                print(f"  WARN [{idx}] filename collision, wrote {fname!r}")
            seen[fname] = idx
            build(entry, os.path.join(WORD_DIR, fname))
            print(f"  [{idx}] {fname}")
        except Exception as exc:
            print(f"  ERROR [{idx}] {entry.get('id','?')[:40]}: {exc}")
            errors.append(entry.get('id', f'entry-{idx}'))

    print(f"\nDone. {len(data) - len(errors)} generated, {len(errors)} error(s).")
    for e in errors:
        print(f"  {e}")


if __name__ == '__main__':
    main()
