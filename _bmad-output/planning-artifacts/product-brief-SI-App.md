---
title: "Product Brief: Structured Interview App"
status: "complete"
created: "2026-04-01"
updated: "2026-04-01"
inputs: ["reference/structured-interview.html", "Miro: Strategic Journey process map", "proposals/structured-interview-productisation-proposal.md"]
---

# Product Brief: Structured Interview App

## Executive Summary

Whitewater Reinventions runs a structured methodology for assessing transformation readiness in client organisations. At the heart of Stage 2 — "Review As-is & Individual Visions/Roadblocks" — sits the Structured Interview: a 60–90 minute one-on-one conversation with each member of the client's leadership team, scored against a proprietary framework of 42 subtopics and 74 criteria across six domains.

A working proof-of-concept exists. It handles the full interview lifecycle — setup, live scoring with timer, interviewer calibration, and cohort analytics (heatmaps, radar charts, benchmarks). But it's a single-file prototype with no backend. Close the browser, lose the data. Consultants either avoid using it or duplicate work. In a process where each engagement involves 6–15 interviews over 20–30 days, that's unacceptable.

The product is designed and validated. The scoring engine, topic libraries, calibration mechanism, and visualisations are proven. This is a hardening and deployment effort with known scope — not a speculative product build. The goal: make it production-ready so consultants can use it on real engagements, starting with the next one in the pipeline.

## The Problem

Today, an IE conducting structured interviews has two options:

1. **Use the prototype** — functional but fragile. Data lives only in the browser. If the session crashes, the laptop restarts, or the IE needs to pick up tomorrow, everything is gone. There's no way to share results with a co-interviewer or hand off to a colleague.

2. **Don't use it** — fall back to notes, spreadsheets, or memory. Scoring becomes inconsistent, the calibration framework isn't applied, and the cohort analytics that make the report valuable simply don't get produced.

Neither option is acceptable for a tool that sits at the centre of WWRI's delivery methodology. Every Phase 1 engagement requires structured interviews. The tool exists. It just doesn't work for real use.

**The cost of inaction:** Each engagement where an IE falls back to manual methods means hours reconstructing data, inconsistent scoring across interviewees, and degraded report quality. The structured interview report is often what sells Phase 2 of an engagement — a weaker report directly impacts revenue.

## The Solution

Rebuild the proof-of-concept as a production application with:

- **Database persistence** — interviews save automatically. Resume tomorrow, next week, or hand off to another consultant. If a save fails, the user sees a clear warning and data is preserved locally until reconnection.
- **Engagement management** — create, switch between, and archive client engagements. Each IE sees their active engagements at a glance. Engagement creation is minimal friction (client name and go).
- **Interviewer calibration as quality governance** — the calibration mechanism isn't just a feature; it's how WWRI ensures scoring consistency across its IE network. It protects the credibility of every report delivered.
- **Proper architecture** — decomposed into maintainable components with a server-side data layer. Extensible, testable, deployable.
- **Deployed and accessible** — hosted on Netlify, backed by Neon PostgreSQL. Consultants access it via a URL. Zero IT overhead, no client-side installs, works on any device with a browser.

## Who This Serves

**Primary users: Independent Experts (IEs)**
Consultants who build interview configurations per engagement, conduct 1:1 interviews with client leaders, score responses in real time, and generate cohort reports. They need the tool to be reliable, persistent, and accessible. The tool also accelerates onboarding of new IEs — the methodology is embedded in the app, not just in people's heads.

**Report audience: Client stakeholders**
They see the output — heatmaps, radar charts, benchmark comparisons — but never interact with the tool directly. Report quality directly influences whether the client proceeds to Phase 2.

**Reviewer: Engagement leads (Niel, Nicolette)**
Review interview configurations and results for quality. Need visibility into engagement status and scoring consistency.

## Success Criteria

- IEs can create an engagement, configure topics, conduct interviews across multiple sessions, and generate a cohort report — without losing data
- Interview data persists across browser sessions and device changes
- At least one real client engagement is conducted using the production app (named pilot IE and engagement identified before launch)
- Engagement leads can review results without needing to be present during interviews
- Feature parity with the prototype verified against a checklist before shipping

## Scope

**In (Phase 1 — production-ready app):**
- Architecture rebuild (Next.js, component decomposition, server-side data layer)
- Database persistence (Prisma + Neon PostgreSQL) with auto-save and failure handling
- Engagement management (create, list, switch, archive)
- All existing features preserved (6 topic libraries with 42 subtopics and suggested questions, per-interview question tailoring via the question builder, scoring, calibration, heatmap, radar, bar chart, report)
- WWRI design system (shared component library with M Suite)
- Netlify deployment
- Basic access control (engagement-level access links — not open to anyone with the URL)
- Database backup strategy (automated daily via Neon)
- Feature parity checklist verified before launch

**Out:**
- P Suite integration (Phase 2 — after the app ships)
- Full Azure SSO / multi-user auth (basic access control only for Phase 1)
- SharePoint integration
- AI-assisted analysis
- Custom topic/subtopic creation (note: the existing framework provides defined topics and subtopics with suggested questions, but IEs already tailor the actual questions per interview via the question builder. This flexibility is preserved. What's out of scope is adding entirely new topics or subtopics to the library itself.)
- Deep Dives or Merlin exercise tooling
- Full offline-first PWA (Phase 1 targets graceful degradation — local state preserved during connectivity drops, synced when reconnected. Most interviews conducted via Teams, but in-person with unreliable WiFi must not lose data.)
- Cross-engagement analytics and benchmarking (future — as the data set grows)

## Data & Confidentiality

This tool stores named individuals' leadership assessment scores — sensitive personal data. Phase 1 must address:

- **Access control** — engagements are not publicly accessible. Basic access gating at minimum.
- **Data retention** — define how long interview data is kept and who can delete it
- **Backup** — automated daily backups via Neon's built-in capabilities
- **Client trust** — IEs must be confident that interview data is not exposed. If they're not, they won't use the tool for real engagements.

## Rollout Plan

- **Pilot IE and engagement identified before launch** — the first real-world use is planned, not accidental
- **Prototype remains accessible as fallback** during the first engagement cycle
- **30-minute live demo** for all IEs at launch + recorded walkthrough + one-page quick-start guide
- **Feedback channel** — Teams channel or simple form, actively monitored for the first 60 days
- **First engagement runs in parallel** — IE uses the new tool with the old method as backup

## Vision

The Structured Interview App is the first module of P Suite — WWRI's delivery-side platform. Each engagement conducted builds a proprietary dataset of scored leadership assessments. Over time, this enables cross-engagement benchmarking ("your leadership team scored below median on Change Readiness vs. prior engagements"), trend analysis, and defensible IP that strengthens WWRI's competitive positioning.

The tool also seeds the P Suite architecture — design system, deployment pattern, database, and hosting — so that subsequent delivery modules (MasterPlan builder, engagement dashboards) build on proven foundations rather than starting from scratch.

But that's later. Right now, the job is: make it work, ship it, use it on the next engagement.
