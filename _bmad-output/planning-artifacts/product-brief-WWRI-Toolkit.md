---
title: "Product Brief: WWRI Toolkit"
status: "complete"
created: "2026-03-29"
updated: "2026-03-29"
inputs:
  - WWRI-toolkit.html (pipeline report, 508KB)
  - WWRI-finance.html (finance report, 191KB)
  - WWRI-costing.html (project costing sheet, 77KB)
  - index.html (structured interview tool, 239KB)
  - WWRI_Finance_Report_Spec_v0.1.md (finance module specification)
  - ww-app-style.skill (design system reference)
  - WWT-Logo.jpg (company logo)
---

# Product Brief: WWRI Toolkit

## Executive Summary

Whitewater Reinventions is a consulting firm operating across Australia, Europe, and the US. The firm's admin and finance manager currently runs critical business operations — pipeline reporting, financial forecasting, project costing, and client assessments — using a set of browser-based tools vibecoded as monolithic single-HTML files. These tools work, but they are fragile, difficult to maintain, and increasingly expensive to extend.

The **WWRI Toolkit** is a refactor of these tools into a properly structured, modular web application following established architectural standards. The core app is a **unified executive reporting tool** with two modes — Pipeline Report and Finance Report — sharing a common data layer (HubSpot deals, Xero invoices) via a top-level mode switcher. Alongside this, two consultant-facing tools (project costing and structured interviews) share the same design system and architectural patterns but deploy independently. The immediate priority is the Finance Report mode, which must be production-ready within two days to meet board reporting deadlines.

This is not a new product — it is a disciplined refactor of proven tools that already deliver real value. The goal is to make them maintainable, extensible, and robust enough to trust with board-level reporting.

## The Problem

Every month, Angelus generates executive reports for the Whitewater board. This involves importing data from HubSpot (deal pipeline) and Xero (invoices, P&L, balance sheets), running calculations, and producing printable PDF reports. Today this is done through single HTML files that contain everything — data, logic, styles, and embedded business data — in files exceeding 500KB.

The pain is threefold:

1. **Maintenance is fragile.** A single file with 3,000+ lines of string-concatenated HTML, inline styles, and hardcoded business data is difficult to change safely. Editing one section risks breaking another. AI-assisted development chews through context trying to work with these monoliths.

2. **Data is tangled with logic.** Exchange rates, client details, stage definitions, seed snapshots, and benchmark data are all hardcoded into the JavaScript. Updating a quarterly FX rate means editing application code.

3. **No structure means no growth.** Adding features — like merging pipeline and finance into a unified dashboard, or making consultant tools work on tablets — requires rewriting, not extending.

The current approach works, but it does not scale with the ambition of the person building it.

## The Solution

Refactor the toolkit into a modular, no-build-step web application using vanilla HTML, CSS, and ES modules. The architecture follows standards established by Peter on the sister project Terra Mortis: separated concerns, CSS custom properties for theming, semantic HTML, and a clean file structure.

**WWRI Toolkit** (unified executive app):
- **Pipeline Report mode** — Deal funnel, analytics, forecasting, leads tracking, printable board reports. Data from HubSpot CSV imports.
- **Finance Report mode** — Cash-basis P&L, balance sheet, 9-month cash forecast, revenue pipeline with weighted projections. Data from Xero CSV imports.
- Both modes share a **common data layer** — HubSpot deals and Xero invoices are imported once via a shared Controls interface and persisted in localStorage. A top-level mode switcher in the app header toggles between views.

**WWRI Consult** (consultant-facing, separate apps):
- **Project Costing Sheet** — Per-project fee calculations, expert allocation across phases, WWRI margin, referral fees, timeline visualisation, printable proposals.
- **Structured Interview Tool** — Change-readiness assessments with configurable topic libraries, real-time scoring, cohort analytics, and PDF report generation.

All apps share a common design system (colours, typography, components) and architectural patterns. The core toolkit is one app; the consultant tools deploy independently.

## What Makes This Different

This is an internal tool rebuild, not a market product. The differentiator is not competitive — it is operational:

- **No build step.** Edit a file, refresh the browser. No webpack, no npm, no TypeScript. This keeps the development loop accessible to a first-time developer learning architecture.
- **Modular by design.** No single file exceeds 500 lines. Data lives in JSON files, not in application code. Styles use CSS custom properties from a single theme file.
- **AI-friendly structure.** Small, focused modules are far cheaper to work with in AI-assisted development than monolithic files. This directly reduces the cost and risk of every future change.
- **Tablet-ready.** Consultant tools need to work on iPads in client meetings. The rebuild targets responsive layouts from the start.

## Who This Serves

**Primary: Angelus (Admin & Finance Manager)**
Generates monthly board reports, manages the sales pipeline, tracks cash flow forecasts, and oversees project costing. Needs tools that are reliable, fast to update, and produce professional output. Success: monthly reporting takes less time and produces fewer errors.

**Secondary: Whitewater consultants**
Use the costing sheet to build project proposals and the interview tool to run structured assessments on-site with clients. Need tools that work on tablets, offline-capable, and produce client-ready PDF output. Success: consultants can run a full assessment without needing Angelus to set things up.

## Success Criteria

- Finance Report produces the same board-ready output as the current vibecoded version, with data separated from logic
- Monthly report generation time is reduced (fewer manual steps, fewer errors)
- Any single module can be edited without risk of breaking unrelated functionality
- No JavaScript or CSS file exceeds 500 lines
- Consultant tools render correctly on iPad Safari
- All colour values defined in one theme file; no hardcoded hex values in component CSS

## Scope

**In scope (first release — Finance Report, 2-day deadline):**
- Refactor `WWRI-toolkit.html` into proper file structure (public/, data/)
- Extract the Finance Report mode into modular ES modules and CSS files
- Shared data layer (localStorage) serving both Pipeline and Finance modes
- Finance tabs: Dashboard, Cash Forecast, Revenue Pipeline, Controls, Print/Export
- Shared theme.css with CSS custom properties
- Mode switcher in app header (Pipeline Report / Finance Report)
- Pipeline Report carries over functionally during refactor (not rewritten, but extracted into modules)

**In scope (subsequent releases):**
- Pipeline Report modules cleaned up and improved
- Project Costing Sheet refactor (WWRI Consult)
- Structured Interview Tool refactor (WWRI Consult)
- Responsive/tablet layouts for consultant tools

**Out of scope:**
- Backend or server-side components
- User authentication
- Real-time collaboration
- npm packages or build tooling
- GitHub Pages deployment (stays local for now)

## Vision

If this succeeds, Whitewater has a professional-grade internal toolkit that Angelus can maintain and extend with confidence — and that consultants can use independently in the field. The architectural patterns learned here transfer directly to future projects and to the sister project Terra Mortis. The immediate win is operational: faster, more reliable board reporting. The longer-term win is capability: a first-time developer who understands *why* code is structured the way it is, not just *what* it does.
