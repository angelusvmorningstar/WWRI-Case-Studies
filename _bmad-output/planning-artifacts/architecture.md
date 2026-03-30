---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-30'
inputDocuments:
  - prd.md
  - product-brief-WWRI-Toolkit-distillate.md
workflowType: 'architecture'
project_name: 'WWRI-Toolkit'
user_name: 'Angelus'
date: '2026-03-30'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
44 FRs across 8 domains. The bulk of complexity sits in two areas: (1) CSV import/parsing with 7 distinct formats using name-based column matching, and (2) financial calculations spanning multi-entity revenue projection, FX conversion, cost-of-sales derivation, and rolling cash forecasts. The remaining FRs are UI concerns — tab navigation, inline editing, chart rendering, print layouts.

**Non-Functional Requirements:**
18 NFRs, dominated by maintainability constraints (500-line file limits, BEM-lite CSS, ES modules, no build step, data/logic separation). Performance targets are modest (sub-1s tab switching, sub-3s CSV parsing) and achievable given dataset sizes (~200 deals, ~50 revenue lines). No security, auth, or compliance requirements beyond data integrity.

**Scale & Complexity:**

- Primary domain: Browser-based SPA (vanilla JS, no framework)
- Complexity level: Low-medium
- Estimated architectural components: ~25-35 JS modules, ~8-10 CSS files, ~5-8 JSON data files

### Technical Constraints & Dependencies

- No build step — browser-native ES modules, no bundler, no TypeScript
- ES modules require local dev server (Live Server) — no file:// protocol
- localStorage is the sole persistence layer (no IndexedDB, no backend)
- Print/PDF via `@media print` CSS and `window.print()` — no third-party libraries
- SVG charts via string concatenation — no D3 or charting library
- Must maintain backward compatibility with existing localStorage key structure (~12 keys)
- Terra Mortis conventions govern file structure, naming, and code style

### Cross-Cutting Concerns Identified

- **Data layer abstraction** — localStorage access must be centralised so modules read/write through a consistent interface. This also enables future migration from manual CSV import to direct API integration (HubSpot, Xero, Frankfurter FX) without rewiring consumers.
- **FX conversion** — used by revenue pipeline, cash forecast, and dashboard. Must be a shared utility, not duplicated per module.
- **Print layouts** — two distinct print modes (Finance, Pipeline) with different page structures. Print CSS needs clean separation from screen CSS.
- **Mode switching** — Pipeline and Finance modes share data but have entirely separate UI trees. The switcher must cleanly mount/unmount tab sets.
- **Theme** — all colours in `theme.css` as custom properties, consumed everywhere.
- **CSV parsing** — 7+ formats, each with its own column mapping. Parsers should be modular but share a common base (delimiter detection, quoted field handling).

## Starter Template Evaluation

### Primary Technology Domain

Browser-based SPA — vanilla JavaScript with ES modules. No framework.

### Starter Options Considered

**Not applicable.** This project's architectural constraints explicitly rule out frameworks, build tools, and starter templates:

- No webpack, Vite, npm packages, or TypeScript (Terra Mortis standards)
- No React, Vue, Svelte, or any framework
- No CLI scaffolding — the project structure is hand-built following Terra Mortis conventions
- Brownfield refactor of existing working code, not a greenfield scaffold

### Selected Approach: Manual File Structure (Terra Mortis Convention)

**Rationale:** The project is a brownfield extraction from existing monoliths. A starter template would impose structure that conflicts with the established conventions and the existing code being extracted. The file structure is defined by Terra Mortis standards and the PRD.

**Architectural Decisions (Pre-Established):**

- **Language & Runtime:** Vanilla JavaScript (ES modules), browser-native
- **Styling Solution:** CSS custom properties in `theme.css`, BEM-lite naming
- **Build Tooling:** None — edit file, refresh browser
- **Testing:** Manual browser testing (no test framework in MVP)
- **Code Organisation:** `public/` (HTML, CSS, JS), `data/` (JSON), feature-based JS module folders
- **Development Experience:** VS Code + Live Server, Git, Claude Code

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data access via storage wrapper with clean interface and key mapping
- Tab modules as self-contained render functions
- Feature-based folder structure (shared/, finance/, pipeline/)

**Important Decisions (Shape Architecture):**
- Events bound inside each tab module, not centralised
- Shared utilities for cross-cutting logic (FX, CSV parsing, formatting)
- JSON seed files for defaults, loaded on first run only

**Deferred Decisions (Post-MVP):**
- IndexedDB migration if localStorage limits become an issue
- API data sources (HubSpot, Xero, Frankfurter) replacing CSV imports
- CI/CD pipeline, automated testing

### Data Architecture

- **Live storage:** localStorage, accessed exclusively through `store.js` wrapper
- **Wrapper interface:** `store.get(key)`, `store.set(key, data)`, `store.getAll()`, `store.clear()`
- **Key mapping:** App uses clean names (`deals`, `importLog`, `snapshots`); wrapper translates to existing localStorage keys (`ww_db2`, `ww_log2`, `ww_snaps2`) for backward compatibility
- **Seed data:** JSON files in `data/` loaded at startup only when localStorage has no value for that key
- **Backup/restore:** Operates through the wrapper — export via `store.getAll()`, import via `store.set()` per key
- **Future path:** Wrapper internals can swap to IndexedDB or API fetch without changing any consuming module

### Authentication & Security

Not applicable. Single-user, local-only application. No auth, no server, no API keys in MVP.

### API & Communication Patterns

Not applicable for MVP. Future phases will add `fetch()` calls to Frankfurter (FX rates) and potentially HubSpot/Xero APIs. The storage wrapper's interface is designed so these data sources slot in without rewiring consumers.

### Frontend Architecture

- **Tab rendering:** Each tab is a JS module exporting a `render(container)` function. The module owns its HTML (template literals), event binding, and data reads. No shared DOM between tabs.
- **Mode switching:** `app.js` manages the mode switcher. Switching modes clears the content area and calls the appropriate tab's `render()`.
- **Tab navigation:** `app.js` manages tab bar state. Clicking a tab calls that module's `render()` into the content area.
- **Event handling:** Each tab binds its own event listeners during `render()`. No centralised event delegation.
- **Shared utilities:** Cross-cutting logic in `public/js/shared/` — store, FX conversion, CSV parsing, formatting, chart rendering, print setup.

### Infrastructure & Deployment

- **Development:** VS Code + Live Server (ES modules require a local server)
- **Version control:** Git with feature branches, PR to merge to main
- **Deployment:** GitHub Pages via Actions deploying `public/` — Phase 3
- **Testing:** Manual browser testing for MVP. No automated test framework.
- **Monitoring:** None. Single-user local app.

### Decision Impact Analysis

**Implementation Sequence:**
1. Create file structure and `store.js` wrapper first — everything depends on it
2. Extract shared utilities (FX, CSV parser, formatting)
3. Extract tab modules one at a time, starting with Finance (deadline-driven)
4. Wire up `app.js` mode switcher and tab routing
5. Extract and test print layouts last

**Cross-Component Dependencies:**
- All tab modules depend on `store.js` and `format.js`
- Finance tabs depend on `fx.js` for currency conversion
- Both modes share `csv-parser.js` for imports
- Print modules depend on `charts.js` for SVG rendering

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 12 areas where AI agents could make different choices, grouped into 5 categories below.

### Naming Patterns

**File Naming:**
- JS/CSS files: `kebab-case` (e.g., `cash-forecast.js`, not `cashForecast.js`)
- JSON data files: `kebab-case.json` (e.g., `fx-rates.json`, `stage-definitions.json`)

**Code Naming:**
- Functions/variables: `camelCase` (e.g., `calculateNetCash`, `dealCount`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_FX_RATES`, `STORAGE_KEYS`)
- JSON field names: `camelCase` (e.g., `{ dealName: "...", closeDate: "..." }`)

**CSS Naming:**
- BEM-lite: `block__element--modifier` (e.g., `forecast__row--editable`, `kpi-card__value`)
- All colours as custom properties in `theme.css` — no hardcoded hex values elsewhere

**Storage Naming:**
- Internal clean names: `camelCase` (e.g., `deals`, `importLog`)
- Actual localStorage keys preserved as-is (`ww_db2`, `ww_log2`) — mapped through `store.js`

### Structure Patterns

- **Feature folders:** `public/js/shared/`, `public/js/finance/`, `public/js/pipeline/`
- **CSS mirrors JS:** `public/css/shared/`, `public/css/finance/`, `public/css/pipeline/`, plus `theme.css` at the CSS root
- **One module = one concern.** A file called `cash-forecast.js` handles the Cash Forecast tab and nothing else
- **No barrel files** — import directly from the source module, never from an `index.js` that re-exports
- **Import paths** must include `.js` extension (e.g., `import { get } from '../shared/store.js'`)

### Format Patterns

- **Dates in data:** ISO strings (`"2026-03-30"`) — no timestamps, no locale-dependent formats
- **Currency values:** Numbers (not strings). Formatting at render time via `format.js`, never stored pre-formatted
- **Booleans:** `true`/`false` (not `1`/`0`, not `"yes"/"no"`)
- **Null handling:** `null` for absent values, never `undefined` in stored data. Check with `=== null`

### Communication Patterns

No event bus or pub/sub. Modules do not communicate with each other — they read/write through `store.js`. If the Cash Forecast tab needs deal data, it calls `store.get('deals')`.

**The one exception:** `app.js` orchestrates mode and tab switching. Tab modules expose `render(container)` and that is their entire public interface.

### Process Patterns

**Error Handling:**
- CSV parse errors: show user-visible message in Controls tab (e.g., "Could not parse Balance Sheet AU — expected column 'Account' not found"). Don't throw, don't silently fail
- Storage errors: wrap in try/catch at the `store.js` level. If localStorage is full, surface a clear message
- Render errors: each tab's `render()` catches its own errors and shows a fallback message in the container, not crash the whole app

**Loading States:**
- Not needed for MVP — all data is local, reads are synchronous or near-instant
- When API fetching is added in Phase 2, loading states will be revisited

**Number Formatting:**
- All currency display through `format.js` — e.g., `formatCurrency(amount, currency)` returns `"$1,234.56"`
- Percentages: `formatPercent(0.15)` returns `"15%"`
- No inline `toFixed()` or `toLocaleString()` scattered across modules

### Enforcement Guidelines

**All AI Agents MUST:**
1. Check `store.js` for the key mapping before adding new localStorage keys
2. Never hardcode colour values — always reference `theme.css` custom properties
3. Never exceed 500 lines per file — split into sub-modules if approaching the limit
4. Use `format.js` for all user-facing number/currency/date display
5. Import with `.js` extension in all import paths

**Anti-Patterns (never do these):**
- `document.getElementById()` to reach into another tab's DOM
- `localStorage.getItem()` directly — always go through `store.js`
- Inline styles in JS template literals — use CSS classes
- `var` anywhere, or `let` when `const` would do
- `!important` in CSS

## Project Structure & Boundaries

### Complete Project Directory Structure

```
WWRI-Toolkit/
├── .gitignore
├── _bmad/                          # BMAD method (installed)
├── _bmad-output/
│   ├── planning-artifacts/         # PRD, architecture, briefs
│   └── implementation-artifacts/   # Epics, stories, sprint plan
├── docs/                           # Project documentation
├── reference/                      # Source monoliths and specs (not deployed)
│   ├── WWRI-toolkit.html           # Primary extraction source (508KB)
│   ├── WWRI-finance.html           # Superseded — reference only
│   ├── WWRI-costing.html           # Phase 2 consultant tool
│   ├── structured-interview.html   # Phase 2/3 consultant tool
│   ├── WWRI_Finance_Report_Spec_v0.1.md
│   ├── ww-app-style.skill          # Style guide reference
│   └── WWT-Logo.jpg                # Logo (also copied to public/assets/)
├── public/
│   ├── index.html                  # App shell — mode switcher, tab bar, content area
│   ├── data/
│   │   ├── fx-rates.json           # Default exchange rates
│   │   ├── stage-definitions.json  # Deal pipeline stages
│   │   ├── expense-categories.json # Operating expense line items
│   │   └── client-defaults.json    # Client reference data
│   ├── css/
│   │   ├── theme.css               # All colour custom properties
│   │   ├── layout.css              # App shell, mode switcher, tab bar
│   │   ├── print-finance.css       # @media print for finance report
│   │   ├── print-pipeline.css      # @media print for pipeline report
│   │   ├── shared/
│   │   │   ├── tables.css
│   │   │   ├── forms.css
│   │   │   ├── cards.css
│   │   │   └── charts.css
│   │   ├── finance/
│   │   │   ├── dashboard.css
│   │   │   ├── cash-forecast.css
│   │   │   ├── revenue-pipeline.css
│   │   │   └── finance-controls.css
│   │   └── pipeline/
│   │       ├── pipeline.css
│   │       ├── performance.css
│   │       ├── forecasting.css
│   │       ├── leads.css
│   │       ├── history.css
│   │       └── pipeline-controls.css
│   ├── js/
│   │   ├── app.js                  # Entry point — mode switcher, tab router
│   │   ├── shared/
│   │   │   ├── store.js            # Data access wrapper
│   │   │   ├── csv-parser.js       # Base CSV/TSV parsing
│   │   │   ├── fx.js               # Currency conversion
│   │   │   ├── format.js           # Number/currency/date formatting
│   │   │   ├── charts.js           # SVG chart rendering
│   │   │   └── print.js            # Print mode setup/teardown
│   │   ├── finance/
│   │   │   ├── dashboard.js
│   │   │   ├── cash-forecast.js
│   │   │   ├── revenue-pipeline.js
│   │   │   ├── finance-controls.js
│   │   │   └── finance-print.js
│   │   └── pipeline/
│   │       ├── pipeline.js
│   │       ├── performance.js
│   │       ├── forecasting.js
│   │       ├── leads.js
│   │       ├── history.js
│   │       ├── pipeline-report.js
│   │       └── pipeline-controls.js
│   └── assets/
│       └── WWT-Logo.jpg
└── private/                        # Local sensitive files (gitignored)
```

### Architectural Boundaries

**Component Boundaries:**
- Tab modules are fully self-contained — they render into a provided container and bind their own events
- Tab modules never import from other tab modules (no `finance/dashboard.js` importing from `pipeline/performance.js`)
- All cross-tab data sharing goes through `store.js`
- Only `app.js` knows which tabs exist and how to route between them

**Data Boundaries:**
- `store.js` is the sole gateway to localStorage — no other module touches `localStorage` directly
- JSON data files in `data/` are read-only defaults — loaded once at startup, then localStorage takes over
- CSV parsers produce plain objects that get passed to `store.set()` — parsers never write to storage directly

### Requirements to Structure Mapping

**FR Category: Data Import & Parsing (FR1–FR8)**
→ `public/js/shared/csv-parser.js` (base parsing)
→ `public/js/finance/finance-controls.js` (Xero CSV import UI)
→ `public/js/pipeline/pipeline-controls.js` (HubSpot CSV import UI)

**FR Category: Data Persistence & Recovery (FR9–FR13)**
→ `public/js/shared/store.js` (all persistence logic)
→ Controls tabs for backup/restore UI

**FR Category: Mode Switching & Navigation (FR14–FR16)**
→ `public/js/app.js` (mode switcher + tab router)
→ `public/css/layout.css` (mode/tab bar styling)

**FR Category: Pipeline Report (FR17–FR24)**
→ `public/js/pipeline/*.js` (one file per tab)
→ `public/css/pipeline/*.css` (matching styles)

**FR Category: Finance Dashboard (FR25–FR26)**
→ `public/js/finance/dashboard.js`

**FR Category: Cash Forecast (FR27–FR32)**
→ `public/js/finance/cash-forecast.js`
→ `public/js/shared/charts.js` (SVG dual-line chart)

**FR Category: Revenue Pipeline (FR33–FR36)**
→ `public/js/finance/revenue-pipeline.js`
→ `public/js/shared/fx.js` (FX conversion)

**FR Category: FX & Reference Data (FR37–FR39)**
→ `public/js/finance/finance-controls.js` (editor UI)
→ `public/js/shared/fx.js` (conversion logic)
→ `public/data/fx-rates.json` (defaults)

**FR Category: Print & Export (FR40–FR42)**
→ `public/js/finance/finance-print.js`
→ `public/js/pipeline/pipeline-report.js`
→ `public/js/shared/print.js` (shared setup/teardown)
→ `public/css/print-finance.css`, `print-pipeline.css`

**FR Category: Activity Logging (FR43–FR44)**
→ `public/js/shared/store.js` (log storage)
→ Controls tabs (log display UI)

### Cross-Cutting Concerns Mapping

| Concern | Location |
|---------|----------|
| Data access | `shared/store.js` |
| FX conversion | `shared/fx.js` |
| CSV parsing | `shared/csv-parser.js` |
| Number/date formatting | `shared/format.js` |
| SVG charts | `shared/charts.js` |
| Print mode | `shared/print.js` + `print-*.css` |
| Theming | `css/theme.css` |
| App shell/routing | `app.js` + `css/layout.css` |

### Data Flow

```
CSV file (user paste) → csv-parser.js → store.set() → localStorage
                                                          ↓
JSON defaults (data/) → store.js (first-run only) ───→ localStorage
                                                          ↓
Tab module render() ← store.get() ←─────────────── localStorage
         ↓
    DOM (template literals → container.innerHTML)
         ↓
    User edits → event handler → store.set() → localStorage
```

### Development Workflow

- **Dev server:** VS Code Live Server serving `public/` directory
- **Edit cycle:** Change file → save → refresh browser (or Live Server auto-refreshes)
- **GitHub Pages (Phase 3):** Actions workflow deploys `public/` directory on push to `main`
- `data/` lives inside `public/` — no special deployment handling needed

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All decisions are internally consistent. Vanilla JS + ES modules + no build step + localStorage + CSS custom properties — no conflicts. Storage wrapper pattern works cleanly with tab-module render pattern.

**Pattern Consistency:** Naming conventions unified across all sections — `kebab-case` files, `camelCase` code, `UPPER_SNAKE_CASE` constants, BEM-lite CSS. No contradictions.

**Structure Alignment:** Directory tree directly supports feature-folder pattern. Every FR has a mapped location. Component boundaries are clear and enforceable.

### Requirements Coverage Validation

**Functional Requirements:** All 44 FRs (FR1–FR44) mapped to specific modules. No gaps.

**Non-Functional Requirements:** All 18 NFRs addressed — maintainability via file structure and patterns, performance inherently met by dataset size, data integrity via store wrapper.

### Implementation Readiness Validation

**Decision Completeness:** All critical decisions documented. No external dependencies requiring version pinning.

**Structure Completeness:** Full directory tree defined with every file mapped to specific FRs.

**Pattern Completeness:** Naming, structure, format, communication, and process patterns all specified with concrete examples and anti-patterns.

### Issues Found & Resolved

1. **`data/` directory location** — Originally outside `public/`, causing fetch path and deployment issues. **Resolved:** Moved to `public/data/`.
2. **`index.html` name collision** — Root `index.html` was the Structured Interview Tool. **Resolved:** Renamed to `structured-interview.html` and moved to `reference/`.
3. **`WWRI-finance.html` redundancy** — Superseded by finance features in `WWRI-toolkit.html`. **Resolved:** Moved to `reference/`, noted as not an extraction source.
4. **Root directory clutter** — Monolith files, zips, and specs cluttering the project root. **Resolved:** Reference files moved to `reference/`, zip files deleted.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analysed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented
- [x] Technology stack fully specified
- [x] Data architecture defined with future migration path
- [x] Frontend architecture (tab modules, mode switching) defined

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified (store-mediated, no cross-tab imports)
- [x] Process patterns documented (error handling, formatting)

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] All FRs mapped to specific files
- [x] Cross-cutting concerns mapped to shared modules

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Clean separation of concerns — every module has one job
- Storage wrapper future-proofs for API integration without touching consumers
- Feature-folder organisation makes each tab independently editable
- Patterns are specific enough to prevent AI agent inconsistency

**Areas for Future Enhancement:**
- IndexedDB migration if localStorage limits are reached
- API data sources (Frankfurter, HubSpot, Xero) replacing CSV imports
- Automated testing framework
- GitHub Pages deployment workflow

**First Implementation Priority:**
Create `public/` file structure, `store.js` wrapper, and `app.js` shell — everything else builds on these.
