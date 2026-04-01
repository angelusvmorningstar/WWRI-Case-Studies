---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
status: complete
completedAt: '2026-04-01'
classification:
  projectType: web_app
  domain: professional_services
  complexity: low-medium
  projectContext: brownfield
inputDocuments:
  - product-brief-SI-App.md
  - product-brief-SI-App-distillate.md
  - product-brief-M-Suite.md
documentCounts:
  briefs: 2
  distillates: 1
  research: 0
  projectDocs: 0
workflowType: 'prd'
---

# Product Requirements Document — Structured Interview App

**Author:** Angelus Morningstar
**Date:** 2026-04-01
**Status:** Complete

## Executive Summary

The Structured Interview App is an internal production tool for WWRI's Independent Experts (IEs) to conduct, score, and analyse structured leadership interviews during Phase 1 client engagements. It replaces an existing browser-based proof-of-concept that demonstrates the full workflow but cannot persist data, manage multiple engagements, or be reliably used in the field.

Every Phase 1 engagement requires structured interviews across 6–15 client leaders, scored against a proprietary 42-subtopic, 74-criteria framework. The prototype validates this workflow but loses all data when the browser closes. IEs either avoid the tool or duplicate work manually — degrading the quality of cohort reports that directly influence Phase 2 upsell.

The solution is a production rebuild: proper Next.js architecture, Prisma/Neon PostgreSQL persistence, engagement management, WWRI design system alignment, and Netlify deployment. The interview workflow, scoring engine, topic libraries, interviewer calibration mechanism, and all four visualisation types (radar, heatmap, bar chart, report) are preserved from the validated prototype.

Target: deployed and used on a real client engagement within 2 weeks of sign-off.

### What Makes This Special

This is not a generic survey or assessment tool. It encodes WWRI's proprietary transformation readiness framework — 6 domains, 42 subtopics, 74 scoring criteria with high/low descriptors — as an interactive interview workflow. The interviewer calibration mechanism (per-interviewer severity adjustment, averaged across multi-interviewer assignments, applied at the person level) ensures scoring consistency across a distributed consultant network. No off-the-shelf tool provides this.

The topic libraries provide structure with suggested questions, but IEs tailor actual questions per interview via the built-in question builder. The framework guides without constraining.

Each engagement conducted builds WWRI's proprietary dataset — future cross-engagement benchmarking and competitive IP that strengthens market positioning.

## Project Classification

- **Type:** Full-stack web application (Next.js 16, Prisma 7, Neon PostgreSQL, Netlify)
- **Domain:** Professional services / consulting tooling
- **Complexity:** Low-medium — domain model well-understood, architecture proven via M Suite, topic libraries defined
- **Context:** Brownfield — rebuilding existing prototype with proper architecture. Mirrors M Suite stack and patterns.

## Success Criteria

### User Success

- IEs create an engagement, configure topics, conduct interviews across multiple sessions, and generate a cohort report — without losing data at any point
- An IE can pause an interview mid-session, close the browser, reopen it days later, and resume exactly where they left off
- An IE can hand off an engagement to a colleague by sharing the access link
- The scoring and calibration workflow feels as responsive as the prototype — no perceptible lag during live interviews
- The "aha" moment: an IE finishes their first real engagement and the cohort heatmap and radar charts generate automatically from persisted data

### Business Success

- At least one real client engagement conducted using the production app within 30 days of launch
- All active IEs (~20) have access and have been shown the tool within 2 weeks of launch
- Report quality from the tool matches or exceeds what's produced manually — validated by Niel or Nicolette on the pilot engagement
- Zero data loss incidents during the first 3 engagements

### Technical Success

- Build passes, deploys to Netlify, connects to Neon PostgreSQL without manual intervention
- Auto-save handles connectivity drops gracefully — local state preserved, synced on reconnection
- Cold start latency under 3 seconds (Neon serverless wake-up)
- Feature parity with prototype verified against a checklist before launch

### Measurable Outcomes

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Pilot engagement completed | 1 | 30 days post-launch |
| IEs with access | 20 | 14 days post-launch |
| Data loss incidents | 0 | First 90 days |
| Interview sessions persisted | 100% | Ongoing |

## Product Scope

### MVP — Phase 1 (Production-Ready SI App)

- Architecture rebuild from monolith to Next.js with component decomposition
- Database persistence (Prisma + Neon) with auto-save and failure handling
- Engagement management: create, list, switch, archive (minimal friction — client name and go)
- All prototype features preserved: 6 topic libraries, 42 subtopics, question builder, scoring, calibration, heatmap, radar, bar chart, report
- Engagement-level access links (unique URLs per engagement)
- WWRI design system (shared with M Suite)
- Netlify deployment
- Automated daily database backups (Neon built-in)
- Graceful connectivity degradation (local state queue, sync on reconnect)

### Growth Features (Post-MVP)

- P Suite integration (shared navigation, platform framing)
- Azure SSO via Auth.js (proper consultant login)
- SharePoint intranet embed
- Data export (CSV/Excel of raw scores for offline analysis)
- Engagement templates (pre-configured topic selections for common engagement types)
- Usage analytics (engagement created, interviews started/completed)

### Vision (Future)

- Cross-engagement benchmarking ("your client scored below median on Change Readiness vs. 12 prior engagements")
- AI-assisted insight generation from interview notes
- MasterPlan builder (Stage 4 tool) alongside SI in P Suite
- Trend analysis across the WWRI dataset as competitive IP

## User Journeys

### Journey 1: Priya conducts a full engagement (IE — Happy Path)

Priya is an IE with 5 years at WWRI. She's been assigned a new Phase 1 engagement with a mid-size manufacturer. She opens the SI app, creates a new engagement ("Apex Manufacturing"), and selects 4 of the 6 topic libraries — she skips Concerns & Fears for this particular client where trust is still being built. She tailors three questions in the Leadership topic to focus on the CEO's recently announced transformation programme.

Over the next three weeks, Priya interviews 8 leaders. Some are in-person at the client's offices, most are via Teams. She conducts 2-3 interviews per day on busy weeks. Between each, she opens the engagement, selects the next interviewee, and starts scoring. Mid-interview with the CFO, her Teams connection drops for 30 seconds — when it reconnects, her scores are still there. She finishes scoring, adds notes, and marks the session complete.

After the final interview, Priya opens the Results tab. The heatmap lights up — she can immediately see that the leadership team scores well on Strategic Direction but poorly on Change Readiness. The radar chart for each leader tells a clear story. She generates the report and sends the PDF to the engagement lead for review.

**Capabilities revealed:** Engagement creation, topic selection/customisation, question tailoring, multi-session persistence, auto-save with connectivity recovery, interviewee management, scoring workflow, results generation, report export.

### Journey 2: Priya's laptop dies mid-interview (IE — Edge Case)

Priya is halfway through scoring an interview with the Head of Operations when her laptop battery dies. She plugs in, reboots, opens the browser, navigates to the engagement. The interview session is there — her last 4 scored criteria and notes are preserved from the auto-save 30 seconds before the crash. She picks up where she left off.

Later, she realises she scored one criterion incorrectly for a completed interview from yesterday. She opens that person's session, adjusts the score, and saves. The heatmap updates.

**Capabilities revealed:** Auto-save resilience, session recovery, ability to edit completed sessions, real-time recalculation of results.

### Journey 3: Luis takes over Priya's engagement (IE — Handoff)

Priya is pulled onto an urgent engagement. She shares the engagement access link with Luis, a colleague. Luis opens it, sees 5 of 8 interviews completed, reviews Priya's calibration settings and topic configuration, and conducts the remaining 3 interviews. He adds himself as a second interviewer with his own calibration adjustment. The results automatically factor in both interviewers' calibration profiles.

**Capabilities revealed:** Engagement-level access links, multi-interviewer support, per-interviewer calibration, engagement status visibility.

### Journey 4: Niel reviews engagement quality (Reviewer)

Niel wants to check the quality of a completed engagement before the report goes to the client. He opens the engagement link, goes straight to Results. He reviews the heatmap for obvious anomalies — one interviewer's scores are consistently 15 points higher than the other's. He checks the calibration settings and sees the adjustment hasn't been applied. He flags this to the IE.

He also scans the radar charts for each leader, cross-referencing against the notes to ensure scores are justified. Satisfied, he approves the engagement for client delivery.

**Capabilities revealed:** Read-only review access, results visualisation, calibration visibility, notes review, engagement approval workflow (future — manual for now).

### Journey Requirements Summary

| Capability Area | Journeys | Priority |
|----------------|----------|----------|
| Engagement CRUD (create, list, switch, archive) | 1, 3 | MVP |
| Topic selection & question customisation | 1 | MVP |
| Interviewee management | 1 | MVP |
| Interview scoring workflow with timer | 1, 2 | MVP |
| Auto-save with connectivity resilience | 1, 2 | MVP |
| Session recovery after crash/close | 2 | MVP |
| Edit completed sessions | 2 | MVP |
| Multi-interviewer calibration | 3 | MVP |
| Engagement-level access links | 3, 4 | MVP |
| Results: heatmap, radar, bar chart | 1, 4 | MVP |
| Report generation (PDF-ready) | 1 | MVP |
| Engagement status visibility | 3, 4 | MVP |
| Notes review for quality checking | 4 | MVP |

## Web Application Requirements

### Technical Architecture

- **Rendering:** Server components for page shells, data loading, and static content. Client components (`"use client"`) for the interview scoring workflow, timer, visualisations (radar, heatmap, bar chart), and all interactive forms.
- **Routing:** Next.js App Router. Key routes: `/` (engagement list), `/engagement/[id]` (dashboard), `/engagement/[id]/setup` (config), `/engagement/[id]/interview/[personId]` (live interview), `/engagement/[id]/results` (analytics), `/engagement/[id]/report` (printable).
- **Data layer:** Prisma 7 with `@prisma/adapter-neon` (serverless). Server actions for mutations. Server components for reads.
- **State management:** React useState/useReducer at component level for interview state. Server-side for persisted state. No global state library needed.
- **Auto-save:** Client-side debounced save (every 10-30 seconds during active scoring) via server action. Local state preserved in memory if save fails, retried on reconnection.

### Browser & Device Support

- **Target:** Modern evergreen browsers (Chrome, Edge, Firefox, Safari — latest 2 versions)
- **Primary device:** Laptop (IEs conducting interviews via Teams or in-person)
- **Responsive:** Functional on tablet, optimised for desktop. Not targeting mobile phones.
- **SEO:** Not needed — internal tool, not indexed

## Project Scoping & Phased Development

### MVP Strategy

**Approach:** Problem-solving MVP — the minimum set of capabilities that lets IEs use the tool on a real engagement without falling back to spreadsheets. The prototype validates the UX; the MVP validates the production infrastructure.

**Resource Requirements:** Single developer (Angelus) with AI-assisted development (Claude Code).

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data loss during live interview | Auto-save every 10-30s, local state queue on connectivity loss, sync on reconnect |
| Prototype-to-production feature gap | Feature parity checklist verified before launch |
| IE adoption resistance | Pilot engagement with named IE, prototype as fallback, 30-min demo |
| Neon cold start latency | Test and document; warm-up strategy if >3s |
| Single developer bus factor | Document runbooks for deployment, database access, incident response |

## Functional Requirements

### Engagement Management

- FR1: IE can create a new engagement with a client name
- FR2: IE can view a list of their engagements with status indicators
- FR3: IE can switch between engagements
- FR4: IE can archive a completed engagement
- FR5: IE can generate a unique access link for an engagement
- FR6: Anyone with an engagement access link can view that engagement's data

### Topic & Question Configuration

- FR7: IE can enable or disable each of the 6 topic libraries per engagement
- FR8: IE can select up to 3 subtopics per enabled topic
- FR9: IE can customise the interview question for each selected subtopic
- FR10: IE can set time allocation (minutes) per subtopic
- FR11: System preserves all 42 subtopics with their default suggested questions, criteria, and high/low descriptors

### Interviewee Management

- FR12: IE can add interviewees with name, title, and category (Executive, Senior Management, Middle Management)
- FR13: IE can edit interviewee details
- FR14: IE can delete an interviewee
- FR15: IE can assign one or more interviewers to each interviewee
- FR16: IE can view interviewee status (pending, in-progress, complete)

### Interviewer Management & Calibration

- FR17: IE can add interviewers to the engagement
- FR18: IE can set a calibration adjustment per interviewer (-100 to +100)
- FR19: System applies interviewer calibration adjustments to scores (averaged across assigned interviewers per person, clamped to 0-100)

### Interview Workflow

- FR20: IE can select an interviewee and begin an interview session
- FR21: System displays editable interviewer guidance before questions begin (engagement-level template with per-interview customisation — includes boilerplate sections and a bespoke section for engagement-specific goals and context)
- FR22: IE can edit interviewer guidance text per engagement (find/replace for client name and goals, plus free-text bespoke section)
- FR23: System collects background information per interviewee
- FR24: System presents questions sequentially with purpose statement and time allocation
- FR25: IE can score each criterion on a 0-100 scale via slider
- FR26: IE can enter free-text notes per question
- FR27: System displays a running timer with pause/resume capability
- FR28: IE can navigate forward and backward between questions
- FR29: IE can mark an interview session as complete
- FR30: IE can reopen and edit a completed session
- FR31: System auto-saves interview state (scores, notes, progress) at regular intervals — IE does not need to manually save to avoid data loss
- FR32: System preserves local state if auto-save fails and retries on reconnection
- FR33: System displays a sidebar showing all interviews in the engagement (pending, in-progress, complete) with click-to-navigate between them

### Results & Visualisation

- FR34: System calculates topic-level scores as the average of criteria scores within each topic
- FR35: System calculates overall scores as the average of all criteria scores
- FR36: System applies colour coding to scores (green ≥70%, orange 40-69%, red <40%)
- FR37: System displays a heatmap of all interviewees × topics with colour-coded scores, grouped by category
- FR38: System displays a radar chart per interviewee showing topic scores against benchmark rings
- FR39: System displays a bar chart of individual overall scores grouped by category with benchmark reference lines
- FR40: IE can view and edit benchmark thresholds (adequate/best) per category
- FR41: Heatmap displays interactive tooltips on hover

### Report Generation

- FR42: System generates a printable/PDF-ready executive report
- FR43: Report includes per-person sections with radar chart and score breakdown
- FR44: Report includes engagement context (client name, date)

### Data Persistence

- FR45: All engagement data persists across browser sessions — engagements can be stored and retrieved across weeks
- FR46: System supports concurrent access to the same engagement by multiple users (last-write-wins for MVP)
- FR47: System performs automated daily database backups

## Non-Functional Requirements

### Performance

- Page load (including Neon cold start): under 3 seconds
- Scoring slider interaction: under 100ms (client-side, no server round-trip)
- Auto-save server action: under 2 seconds
- Visualisation render (heatmap/radar/bar with up to 15 interviewees): under 500ms
- Auto-save frequency: every 10-30 seconds during active scoring

### Security & Data Protection

- Engagements are not publicly discoverable — access requires a unique engagement link
- Database connection uses SSL (Neon enforces sslmode=require)
- No client leadership assessment data is exposed without the engagement-specific URL
- Database credentials stored as environment variables, never in source code

### Reliability

- Auto-save handles intermittent connectivity — local state queue with retry on reconnection
- No data loss on browser crash, laptop restart, or network dropout (within auto-save interval)
- Neon automated daily backups for disaster recovery

### Scalability

- Supports ~20 concurrent IEs (current network size)
- Neon free tier sufficient for initial usage (0.5 GB, ~50+ engagements)
- Netlify free tier sufficient for traffic volume (125k serverless function invocations/month)
- Architecture supports migration to paid tiers if usage grows
