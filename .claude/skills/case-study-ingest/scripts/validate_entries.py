#!/usr/bin/env python
"""
Validate case-study entries against the style standard (CASE-STUDIES.md §7).
Read-only; never writes. Run before generation to catch drift.

Reports two tiers:
  ERROR   — a style violation that must be fixed (British spelling, body em-dash,
            bare ie/eg, missing required field). Exits 1 if any are present.
  PENDING — a field still holding a [TO COMPLETE] / [AI — verify] / [DRAFT] marker.
            Expected at the sign-off gate; informational, never fails the run.

Usage:
    python .claude/skills/case-study-ingest/scripts/validate_entries.py
    python .claude/skills/case-study-ingest/scripts/validate_entries.py --id "<entry id>"
    python .claude/skills/case-study-ingest/scripts/validate_entries.py --strict   # PENDING also fails
"""
import argparse
import json
import re
import sys

from _prose_rules import (
    SCALAR_NARRATIVE, ARRAY_NARRATIVE, BODY_PARAGRAPH_FIELDS, REQUIRED_FIELDS,
    find_british_spellings, find_body_emdashes, find_bare_latin_abbr, is_placeholder,
)

JSON_PATH = 'apps/resources/r1-case-studies/case-studies.json'
_MARKER_RE = re.compile(r'\[(DRAFT|AI|TO COMPLETE)[^\]]*\]')


def _texts(entry, field):
    """Yield all string values for a field (scalar or array)."""
    v = entry.get(field)
    if isinstance(v, str):
        yield v
    elif isinstance(v, list):
        for item in v:
            if isinstance(item, str):
                yield item


def validate_entry(entry):
    errors, pending = [], []
    eid = entry.get('id', '?')

    # Required fields present and non-empty
    for field in REQUIRED_FIELDS:
        v = entry.get(field)
        if v is None or (isinstance(v, str) and not v.strip()) or (isinstance(v, list) and not v):
            errors.append(f"missing required field: {field}")

    # Spelling + Latin abbreviations across narrative fields
    for field in SCALAR_NARRATIVE + ARRAY_NARRATIVE:
        for text in _texts(entry, field):
            for brit in find_british_spellings(text):
                errors.append(f"British spelling in {field}: {brit!r}")
            for abbr in find_bare_latin_abbr(text):
                errors.append(f"bare Latin abbreviation in {field}: {abbr!r}")

    # Em-dashes only in body paragraph fields
    for field in BODY_PARAGRAPH_FIELDS:
        for text in _texts(entry, field):
            if find_body_emdashes(text):
                errors.append(f"em-dash in body paragraph field: {field}")

    # Pending markers (informational)
    for field in REQUIRED_FIELDS + ['revenue', 'headcount', 'duration',
                                    'client_lead', 'ww_contact']:
        for text in _texts(entry, field):
            if _MARKER_RE.search(text):
                marker = _MARKER_RE.search(text).group(0)
                pending.append(f"{field}: {marker}")

    return eid, errors, pending


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--json', default=JSON_PATH)
    ap.add_argument('--id', help='Validate a single entry by id')
    ap.add_argument('--strict', action='store_true',
                    help='Treat PENDING markers as failures too')
    args = ap.parse_args()

    with open(args.json, encoding='utf-8') as f:
        data = json.load(f)
    if args.id:
        data = [e for e in data if e.get('id') == args.id]
        if not data:
            sys.exit(f"No entry with id={args.id!r}")

    total_errors = 0
    total_pending = 0
    for entry in data:
        eid, errors, pending = validate_entry(entry)
        total_errors += len(errors)
        total_pending += len(pending)
        if errors or pending:
            print(f"\n[{eid}]")
            for e in errors:
                print(f"  ERROR   {e}")
            for p in pending:
                print(f"  pending {p}")

    print(f"\n{'='*60}")
    print(f"{len(data)} entr{'y' if len(data)==1 else 'ies'} checked: "
          f"{total_errors} error(s), {total_pending} pending marker(s).")

    if total_errors or (args.strict and total_pending):
        sys.exit(1)


if __name__ == '__main__':
    main()
