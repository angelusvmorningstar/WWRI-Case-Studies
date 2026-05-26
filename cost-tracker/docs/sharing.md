# Sharing the Cost Tracker

The Cost Tracker can be distributed as a single self-contained HTML file that
opens directly in any modern browser — no server, no install, no internet
required at runtime.

## Build

```
cd cost-tracker
npm install         # one-time
npm run vendor      # one-time (downloads React/ReactDOM/htm UMD into vendor/)
npm run build       # produces dist/cost-tracker.html
```

Output: `dist/cost-tracker.html`, ~460 KB.

## Distribute

Place `dist/cost-tracker.html` anywhere — SharePoint, OneDrive, USB, email
attachment — and the recipient double-clicks it. The file opens in their
default browser (Edge / Chrome / Firefox) and works fully offline.

The seed workbook is embedded; first-time users see populated state without
needing to load a JSON file.

## What's inlined

- React 18 + ReactDOM (production, minified, from `vendor/`)
- htm UMD (from `vendor/`)
- All app modules (bundled via esbuild)
- All CSS (`theme.css`, `app.css`, `print-board.css`)
- Whitewater logo (as `data:image/svg+xml;base64,...`)
- Seed workbook JSON (`window.__WWCT_SEED__`)

## State persistence for end users

- localStorage keeps in-progress edits across browser sessions
- Save downloads a JSON file
- Load opens a file picker

If the recipient wants to reset to the embedded seed, clear browser localStorage
for the file's origin (`file://`).
