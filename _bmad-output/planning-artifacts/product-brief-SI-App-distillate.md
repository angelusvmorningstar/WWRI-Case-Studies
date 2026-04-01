---
title: "Product Brief Distillate: Structured Interview App"
type: llm-distillate
source: "product-brief-SI-App.md"
created: "2026-04-01"
purpose: "Token-efficient context for downstream PRD creation"
---

# Product Brief Distillate: Structured Interview App

## Core Product

- Internal tool for WWRI Independent Experts (IEs) — not client-facing
- Structured leadership interview tool used in Stage 2 of the WW Strategic Journey ("Review As-is & Individual Visions/Roadblocks")
- 60–90 min 1:1 interviews with client ELT/stakeholders, scored against proprietary framework
- Clients see the report output (heatmaps, radar charts, benchmarks), never the tool itself
- Report quality directly influences Phase 2 engagement upsell — revenue-linked

## Existing Proof-of-Concept (reference/structured-interview.html)

- 1,108-line single HTML file, React 18.2 via CDN, no build step
- All state in React useState hooks at App level, prop-drilled down
- Inline styles (no CSS files), centralised colour object `C`
- Custom SVG visualisations (no charting library) — radar, heatmap, bar chart
- 4 tabs: Setup, Interview, Results, Report
- **No persistence** — all data lost on browser close
- **No auth** — anyone with URL sees everything
- **No engagement management** — single hardcoded engagement
- Source at `D:\WWRI Development\reference\structured-interview.html`
- Live at: https://wwri-structured-interview.netlify.app/

## Data Model (from prototype state)

- **Engagement**: name (string) — currently single hardcoded "Meridian Foods Group"
- **Person (Interviewee)**: id, name, title, category (Executive|Senior Management|Middle Management), assigned interviewers[], status (pending|in_progress|complete)
- **Interviewer**: id, name
- **Interviewer Adjustment**: per-interviewer calibration score (-100 to +100), averaged across assigned interviewers per person, clamped to [0,100]
- **Topic Config**: per topic — enabled (bool), selected subtopics (max 3), custom questions per subtopic, time allocation per subtopic
- **Session (per person)**: status, background data, notes per question, scores per criterion (0-100), startedAt timestamp
- **Question (derived)**: flattened from topic > subtopic > criteria hierarchy via buildQuestions()
- **Criteria**: id, name, high descriptor, low descriptor — the actual scoring dimension

## Topic Libraries (6 topics, 42 subtopics, 74 criteria)

- **T1: Leadership & Strategic Direction** — 7 subtopics (~13 criteria): personal vision, org vision, accountability, functional vision, coalition breadth, decisive/empowering balance, adaptive challenge diagnosis
- **T2: Competitive Landscape & Customer Focus** — 5 subtopics (~13 criteria): competitive landscape, customer understanding, market trends, commercial strategy, external orientation
- **T3: Performance Culture** — 6 subtopics (~13 criteria): HO efficiency, front-line performance, cross-functional collaboration, performance measurement, accountability/consequence, innovation/learning
- **T4: Change Readiness & Transformation** — 8 subtopics (~15 criteria): leading change, org readiness, tech/data readiness, cultural barriers, ADKAR, psychological transition, psychological safety, short-term wins
- **T5: Concerns & Fears** — 4 subtopics (~8 criteria): open concerns/hopes, org risks, loss/identity disruption, derailment/fatigue
- **T6: Collaboration & Stakeholder Engagement** — 6 subtopics (~12 criteria): cross-functional, external stakeholders, cultural ambassadorship, franchisee/front-line, informal influence, emotional intelligence

## Topic Framework Behaviour

- Topics are NOT rigid — they provide structure with suggested questions
- IEs tailor actual interview questions per engagement via the question builder
- Subtopics are selectable (max 3 per topic) — not all are used every time
- Time allocation is configurable per subtopic
- Custom topic/subtopic creation is OUT OF SCOPE — the library itself is fixed, the questions are flexible

## Scoring & Visualisation

- Scores captured at **criteria level** (0-100 slider per criterion)
- Topic score = average of criteria scores within topic
- Overall score = average of all criteria scores
- Colour coding: green ≥70%, orange 40-69%, red <40%, grey = not assessed
- Interviewer calibration: per-interviewer adjustment applied at person level, averaged when multiple interviewers
- Benchmarks by category (editable): Executive (40/85), Senior Mgmt (20/60), Middle Mgmt (10/40) — adequate/best thresholds
- **Radar chart**: individual topic scores vs benchmark rings
- **Heatmap**: people × topics matrix, colour-coded, with tooltips, grouped by category
- **Bar chart**: individual overall scores grouped by category with benchmark lines
- **Report tab**: printable/PDF-ready executive summary with per-person radar + score breakdown

## Seed Data (from prototype — for testing reference)

- 6 seed interviewees: Claire Beaumont (COO, Exec), David Okafor (CFO, Senior), Sandra Veltman (CMO, Exec), James Hartley (Head of Strategy, Senior), Priya Menon (Head of People, Senior), Tom Reinders (Regional Ops Mgr, Middle)
- 3 seed interviewers: Adam, Luis, Tom
- Default engagement: "Meridian Foods Group"
- 3 pre-populated sessions (2 complete, 1 in-progress) with sample scores

## Technical Decisions

- **Stack**: Next.js 16 + Prisma 7 + Neon PostgreSQL + Netlify (mirrors M Suite exactly)
- **Design system**: Shared with M Suite — Tailwind v4, WWRI colour tokens, shared UI components (Button, Card, Input, Select, Badge, NavBar)
- **Auth (Phase 1)**: Engagement-level access links (unique hard-to-guess URLs per engagement). No SSO. No public access.
- **Auth (Phase 2)**: Azure SSO via Auth.js when embedding into P Suite
- **Connectivity**: Most interviews conducted via Teams. App must handle connectivity drops gracefully — local state preserved, synced on reconnection. Full offline PWA is out of scope.
- **Database backup**: Automated daily via Neon built-in capabilities
- **Deployment**: Netlify free tier + Neon free tier ($0/mo). Sufficient for ~20 IEs.

## Scope Signals

**In (Phase 1):**
- Architecture rebuild from monolith to Next.js components
- Database persistence with auto-save and failure handling
- Engagement management (create, list, switch, archive — minimal friction)
- All existing features preserved including question builder customisation
- Basic access control (engagement-level access links)
- WWRI design system alignment
- Netlify deployment
- Feature parity checklist verified before shipping
- Database backup strategy

**Out (Phase 1):**
- P Suite integration (Phase 2)
- Full SSO / multi-user auth
- SharePoint integration
- AI-assisted analysis
- New topic/subtopic creation (question tailoring is in, library editing is out)
- Full offline PWA
- Cross-engagement analytics/benchmarking (future — as dataset grows)
- Deep Dives, Merlin exercise tooling

## Rollout Requirements

- Named pilot IE and engagement identified before launch
- Prototype remains accessible as fallback during first engagement cycle
- 30-min live demo for all IEs + recorded walkthrough + one-page quick-start guide
- Feedback channel (Teams) actively monitored for 60 days
- First engagement runs in parallel (new tool + old method as backup)

## Rejected Ideas (with rationale)

- **Full CRM/pipeline features** — SI is a workspace tool, not a tracker. HubSpot is the pipeline SoR.
- **Client-facing login** — clients see reports, not the tool. No need for client auth.
- **Full offline PWA** — too much complexity for Phase 1. Graceful degradation on connectivity loss is sufficient.
- **Custom topic library editing** — the framework is the IP. Questions are flexible, structure is fixed.
- **Real-time multi-user collaboration** — IEs don't co-interview simultaneously. Handoff via persistence is sufficient.

## Open Questions

- How many interviews have actually been conducted with the prototype? (Validates UX assumptions)
- Is there a specific upcoming engagement to target as the pilot?
- Do any IEs work on tablets during interviews, or is laptop the standard?
- What data retention policy applies to client leadership assessment data?

## Product Positioning

- First module of **P Suite** (delivery platform), counterpart to M Suite (BD platform)
- Falls under Niel's approved category: "Productisation of existing tools"
- Each engagement builds WWRI's proprietary dataset — future cross-engagement benchmarking and competitive IP
- Tool embeds methodology into the platform — accelerates new IE onboarding
- Report quality directly linked to Phase 2 upsell — revenue protection
