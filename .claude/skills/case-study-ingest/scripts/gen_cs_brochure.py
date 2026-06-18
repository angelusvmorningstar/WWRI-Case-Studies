"""
gen_cs_brochure.py — Render a branded multi-page case-study PDF (Output 3).

Reads one record from case-studies.json by --id, fills the branded brochure
HTML template, and prints it to PDF via headless Chrome. This is the website
"Download the case study" artifact: a flowing, paginated document (dark cover →
two-column body with green section headings → dark closing page), NOT a slide.

Why HTML -> PDF: the download reflows across pages with a two-column body and
styled callouts. CSS paged media handles that; PowerPoint does not.

Usage:
    python gen_cs_brochure.py --id "<entry id>" [--json PATH] [--out DIR] [--html-only]

Anonymisation: uses public_client_name; suppresses real names. Mirrors the
Output 2/3 rules in apps/resources/r1-case-studies/CASE-STUDIES.md.
"""

import argparse
import html
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]  # .claude/skills/case-study-ingest/scripts/ -> repo root
DEFAULT_JSON = ROOT / "apps/resources/r1-case-studies/case-studies.json"
LOGO = ROOT / "assets/WWRI logo white on transparent.png"
HERO_DIR = ROOT / "assets/cs-heroes"
GRADIENT = "background-image:linear-gradient(135deg,#2b3946,#10161c);"

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def find_chrome():
    for p in [
        CHROME,
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        shutil.which("chrome"),
        shutil.which("google-chrome"),
    ]:
        if p and Path(p).exists():
            return p
    sys.exit("Chrome not found — install Chrome or set CHROME path.")


def esc(s):
    return html.escape(s or "")


def paras(text):
    """Split a narrative field on blank lines into <p> blocks; strip [DRAFT]/markers."""
    text = (text or "").strip()
    # drop a leading provenance marker if present
    for marker in ("[DRAFT — for review]", "[DRAFT - for review]"):
        if text.startswith(marker):
            text = text[len(marker):].strip()
    blocks = [b.strip() for b in text.split("\n\n") if b.strip()]
    return "\n".join(f"<p>{esc(b)}</p>" for b in blocks)


def bullets(items):
    return "\n".join(f"<li>{esc(b)}</li>" for b in (items or []) if b and b.strip())


def fast_facts(rec):
    """Build the white fast-facts panel rows from the record (anonymised)."""
    rows = [
        ("Company size", rec.get("revenue")),
        ("Industry", rec.get("industry")),
        ("Geography", rec.get("geography")),
        ("Reinvention type", rec.get("type_of_reinvention")),
        ("Duration", rec.get("duration")),
    ]
    out = []
    for k, v in rows:
        v = (v or "").strip()
        if not v or v.startswith("[TO COMPLETE]") or v.startswith("[AI"):
            continue
        out.append(
            f'<div class="ff-row"><div class="ff-key">{esc(k)}</div>'
            f'<div class="ff-val">{esc(v)}</div></div>'
        )
    return "\n".join(out)


def hero_style(rec):
    """CSS for the hero band: the study's image if set + found, else a gradient.

    `hero_image` may be a bare filename (resolved under assets/cs-heroes/ then
    assets/) or an absolute path.
    """
    name = (rec.get("hero_image") or "").strip()
    if name:
        for cand in (Path(name), HERO_DIR / name, ROOT / "assets" / name):
            if cand.is_file():
                return f"background-image:url('{cand.resolve().as_uri()}');"
        print(f"  ! hero_image {name!r} not found — using gradient", file=sys.stderr)
    return GRADIENT


def build_html(rec):
    title = rec.get("title") or rec.get("public_client_name") or "Case Study"
    logo_uri = LOGO.resolve().as_uri()
    return TEMPLATE.format(
        title=esc(title),
        logo=logo_uri,
        hero_style=hero_style(rec),
        ambition=paras(rec.get("ambition")),
        challenge=paras(rec.get("challenge")),
        solutions=paras(rec.get("solutions")),
        results=bullets(rec.get("benefits")),
        fast_facts=fast_facts(rec),
    )


def to_pdf(chrome, html_path, pdf_path):
    with tempfile.TemporaryDirectory() as profile:
        cmd = [
            chrome,
            "--headless=new",
            "--disable-gpu",
            f"--user-data-dir={profile}",
            "--no-pdf-header-footer",
            "--print-to-pdf-no-header",
            f"--print-to-pdf={pdf_path}",
            "--no-margins",
            Path(html_path).resolve().as_uri(),
        ]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if not Path(pdf_path).exists():
            sys.exit(f"PDF not produced.\nSTDOUT:{r.stdout}\nSTDERR:{r.stderr}")


def main():
    ap = argparse.ArgumentParser(description="Render a branded case-study PDF.")
    ap.add_argument("--id", required=True)
    ap.add_argument("--json", default=str(DEFAULT_JSON))
    ap.add_argument("--out", default=str(ROOT / "assets/cs-one-pagers"))
    ap.add_argument("--html-only", action="store_true")
    args = ap.parse_args()

    data = json.loads(Path(args.json).read_text(encoding="utf-8"))
    rec = next((e for e in data if e.get("id") == args.id), None)
    if rec is None:
        sys.exit(f"No entry with id {args.id!r}")

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = (rec.get("public_client_name") or "case-study").replace("/", "-")
    html_path = out_dir / f"{stem} — brochure.html"
    pdf_path = out_dir / f"{stem} — brochure.pdf"

    html_path.write_text(build_html(rec), encoding="utf-8")
    print(f"Wrote {html_path}")
    if args.html_only:
        return
    to_pdf(find_chrome(), str(html_path), str(pdf_path))
    print(f"Wrote {pdf_path}")


# ───────────────────────── brochure template ─────────────────────────
TEMPLATE = r"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<style>
  :root {{
    --dark:#1E2228; --green:#1E8C4A; --green-bright:#39D98A;
    --amber:#C07A00; --txt:#23272E; --mut:#6B7178; --line:#E2E0DB;
    --font:'Segoe UI','Calibri',system-ui,sans-serif;
  }}
  * {{ box-sizing:border-box; margin:0; padding:0; }}
  @page {{ size:A4 portrait; margin:0; }}
  html,body {{ font-family:var(--font); color:var(--txt); -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
  body {{ background:#fff; }}
  .pg {{ padding:0 16mm; }}

  /* ── Cover header ── */
  .cover {{
    background:var(--dark);
    background-image:repeating-linear-gradient(115deg, rgba(255,255,255,.05) 0 1px, transparent 1px 16px);
    color:#fff; padding:18mm 16mm 14mm;
  }}
  .cover .eyebrow {{ font-size:11px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:var(--green-bright); margin-bottom:10px; }}
  .cover h1 {{ font-size:30px; line-height:1.18; font-weight:700; max-width:90%; }}

  /* ── Hero + fast facts (white card overlaps the hero image) ── */
  .band {{ position:relative; background:var(--dark); min-height:84mm; }}
  .hero {{ position:absolute; inset:0; {hero_style} background-size:cover; background-position:center; }}
  .ff {{ position:absolute; top:11mm; right:16mm; width:78mm; background:#fff; box-shadow:0 12px 34px rgba(0,0,0,.30); padding:8mm 8mm 6mm; }}
  .ff h2 {{ font-size:12px; font-weight:600; color:var(--mut); letter-spacing:.01em; border-bottom:1px solid var(--line); padding-bottom:8px; margin-bottom:10px; }}
  .ff-row {{ display:grid; grid-template-columns:30mm 1fr; gap:8px; padding:6px 0; border-bottom:1px solid #F1F0EC; }}
  .ff-row:last-child {{ border-bottom:none; }}
  .ff-key {{ font-size:10.5px; font-weight:700; color:var(--txt); }}
  .ff-val {{ font-size:10.5px; line-height:1.4; color:#44484E; }}

  /* ── Body ── */
  .body {{ padding:11mm 16mm 8mm; column-count:2; column-gap:9mm; }}
  .sec {{ break-inside:avoid-column; margin-bottom:7mm; }}
  .sec h3 {{ font-size:15px; color:var(--green); font-weight:700; margin-bottom:5px; }}
  .sec p {{ font-size:10.5px; line-height:1.55; margin-bottom:7px; }}
  .sec ul {{ list-style:none; }}
  .sec li {{ font-size:10.5px; line-height:1.5; padding-left:14px; position:relative; margin-bottom:6px; break-inside:avoid; }}
  .sec li::before {{ content:""; position:absolute; left:0; top:.5em; width:6px; height:6px; border-radius:50%; background:var(--amber); }}

  /* ── Closing page ── */
  .closing {{ break-before:page; background:var(--dark); color:#fff; min-height:297mm; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:40mm 24mm; }}
  .closing .tag1 {{ font-size:28px; font-weight:700; }}
  .closing .tag2 {{ font-size:28px; font-weight:700; color:var(--green-bright); margin-bottom:14mm; }}
  .closing p {{ font-size:12px; line-height:1.7; max-width:120mm; color:rgba(255,255,255,.85); margin-bottom:8mm; }}
  .btn {{ display:inline-block; border:2px solid var(--amber); color:var(--amber); font-weight:700; padding:10px 26px; border-radius:8px; font-size:13px; margin-bottom:24mm; }}
  .closing img {{ width:54mm; opacity:.95; }}
</style></head>
<body>
  <header class="cover">
    <div class="eyebrow">Case study</div>
    <h1>{title}</h1>
  </header>

  <div class="band">
    <div class="hero"></div>
    <aside class="ff">
      <h2>The client fast facts</h2>
      {fast_facts}
    </aside>
  </div>

  <section class="body">
    <div class="sec"><h3>The Ambition</h3>{ambition}</div>
    <div class="sec"><h3>The Challenge</h3>{challenge}</div>
    <div class="sec"><h3>Solutions Applied</h3>{solutions}</div>
    <div class="sec"><h3>Results</h3><ul>{results}</ul></div>
  </section>

  <section class="closing">
    <div class="tag1">We don&rsquo;t transform.</div>
    <div class="tag2">We reinvent.</div>
    <p>At Whitewater Reinventions, we specialise in helping organisations navigate complex processes. Our expert teams provide the insights, strategies and support every business needs to go further than a transformation &mdash; to reinvent their organisation for good.</p>
    <div class="btn">Talk to Whitewater</div>
    <img src="{logo}" alt="Whitewater Reinventions">
  </section>
</body></html>
"""


if __name__ == "__main__":
    main()
