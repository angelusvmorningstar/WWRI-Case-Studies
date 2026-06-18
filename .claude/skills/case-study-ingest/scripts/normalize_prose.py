#!/usr/bin/env python
"""
Normalize prose across all case-study entries (idempotent auto-fix):
  - British → American spelling
  - Bare Latin abbreviations → punctuated (ie → i.e., eg → e.g.)

Applies to narrative fields only (never client_name / public_client_name, which
may legitimately hold proper nouns or [TO COMPLETE] placeholders). Does NOT touch
em-dashes — those need a human's choice of replacement punctuation and are
flagged by validate_entries.py instead.

Usage:
    python .claude/skills/case-study-ingest/scripts/normalize_prose.py            # write
    python .claude/skills/case-study-ingest/scripts/normalize_prose.py --check    # report only, exit 1 if changes needed
"""
import argparse
import json
import sys

from _prose_rules import SCALAR_NARRATIVE, ARRAY_NARRATIVE, normalize_text

JSON_PATH = 'apps/resources/r1-case-studies/case-studies.json'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true',
                    help='Report what would change without writing; exit 1 if any.')
    ap.add_argument('--json', default=JSON_PATH)
    args = ap.parse_args()

    with open(args.json, encoding='utf-8') as f:
        data = json.load(f)

    changes = []
    for entry in data:
        eid = entry.get('id', '?')
        for field in SCALAR_NARRATIVE:
            orig = entry.get(field)
            if not isinstance(orig, str):
                continue
            fixed = normalize_text(orig)
            if fixed != orig:
                changes.append((eid, field))
                entry[field] = fixed
        for field in ARRAY_NARRATIVE:
            arr = entry.get(field)
            if not isinstance(arr, list):
                continue
            new_arr = []
            changed = False
            for item in arr:
                if isinstance(item, str):
                    fixed = normalize_text(item)
                    new_arr.append(fixed)
                    changed = changed or fixed != item
                else:
                    new_arr.append(item)
            if changed:
                changes.append((eid, field))
                entry[field] = new_arr

    if args.check:
        if changes:
            print(f"{len(changes)} field(s) need normalization:")
            for eid, field in changes:
                print(f"  [{eid[:45]}] {field}")
            sys.exit(1)
        print("All entries already normalized.")
        return

    if changes:
        with open(args.json, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write('\n')
        print(f"Normalized {len(changes)} field(s) across the backbone.")
    else:
        print("No changes needed; all entries already normalized.")


if __name__ == '__main__':
    main()
