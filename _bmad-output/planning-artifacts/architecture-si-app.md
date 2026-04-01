---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-01'
inputDocuments:
  - product-brief-SI-App.md
  - product-brief-SI-App-distillate.md
  - prd-si-app.md
  - architecture-m-suite.md
workflowType: 'architecture'
project_name: 'Structured Interview App'
user_name: 'Angelus'
date: '2026-04-01'
---

# Architecture Decision Document — Structured Interview App

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
47 FRs across 8 capability areas. The interview scoring workflow (FR20-FR33) is the most complex — real-time client-side scoring with debounced auto-save, timer, and per-criterion sliders. Results visualisation (FR34-FR41) requires three custom SVG chart types (radar, heatmap, bar chart) ported from the prototype. Engagement management (FR1-FR6) includes access link generation for sharing.

**Non-Functional Requirements:**
- Performance: <100ms scoring interaction (client-side), <3s page load (Neon cold start), <2s auto-save
- Security: Engagement-level access links (not publicly discoverable), SSL, env-based credentials
- Reliability: Auto-save with connectivity resilience, local state queue with retry, daily backups
- Scalability: ~20 concurrent IEs, Neon/Netlify free tiers sufficient

**Scale & Complexity:**
- Primary domain: Full-stack web application
- Complexity: Low-medium — domain model well-understood, architecture proven via M Suite
- Estimated architectural components: ~6 (engagement management, topic config, interview workflow, scoring/calibration, visualisation, report generation)
- Users: ~20 concurrent

### Technical Constraints & Dependencies

- Mirrors M Suite stack exactly: Next.js 16 App Router, Prisma 7, @prisma/adapter-neon, Tailwind CSS v4
- Hosting: Netlify (not Azure — lighter weight for this tool)
- Database: Neon PostgreSQL serverless (free tier)
- Existing prototype: 1,108-line HTML/React monolith with all business logic, topic libraries, and SVG visualisations
- WWRI design system: shared with M Suite (Tailwind tokens, UI components)
- No M365 integration needed for Phase 1 (no SSO, no SharePoint, no Teams)

### Cross-Cutting Concerns

- **Auto-save & persistence:** Every scoring action, note, and config change must persist. Debounced saves, local state queue on failure.
- **Engagement isolation:** Each engagement has a unique access link. Data is isolated per engagement.
- **Topic library:** 6 topics, 42 subtopics, 74 criteria — hardcoded in the app. Questions are customisable per engagement.
- **Calibration:** Per-interviewer adjustments applied at the person level, averaged across multi-interviewer assignments.

## Starter Template

### Selected Starter: Next.js 16 (App Router) — Same as M Suite

**Rationale:** Proven by M Suite build. Same stack, same patterns, same design system. No reason to evaluate alternatives.

**Initialisation:** Clone M Suite scaffold, strip M-Suite-specific pages, keep shared components and design system.

**Architectural Decisions Provided by Starter:**
- TypeScript strict mode, React 19, Tailwind CSS v4
- Prisma 7 with @prisma/adapter-neon
- Server components by default, client components where needed
- Server Actions for mutations
- Netlify deployment via @netlify/plugin-nextjs

## Core Architectural Decisions

### Data Architecture

**Database:** Neon PostgreSQL (serverless, free tier)
**ORM:** Prisma 7 with @prisma/adapter-neon

**Core Data Models:**

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| `Engagement` | A client interview engagement | id, accessKey (unique, URL-safe), clientName, status, createdAt |
| `TopicConfig` | Per-engagement topic/subtopic selection | id, engagementId, topicId, enabled, selectedSubtopics (JSON) |
| `QuestionOverride` | Per-engagement question customisation | id, engagementId, subtopicId, customQuestion, customMins |
| `GuidanceOverride` | Per-engagement interviewer guidance customisation | id, engagementId, boilerplateOverrides (JSON), bespokeSection (text) |
| `Interviewee` | Person being interviewed | id, engagementId, name, title, category, status |
| `Interviewer` | Consultant conducting interviews | id, engagementId, name, adjustment (float) |
| `InterviewerAssignment` | Which interviewers are assigned to which interviewee | id, intervieweeId, interviewerId |
| `Session` | An interview session for one interviewee | id, intervieweeId, status, startedAt, completedAt |
| `Background` | Background info collected per interviewee | id, sessionId, data (JSON) |
| `Score` | Individual criterion score | id, sessionId, criteriaId, value (float) |
| `Note` | Per-question notes | id, sessionId, questionId, text |
| `Benchmark` | Per-engagement benchmark thresholds | id, engagementId, category, adequate (float), best (float) |

**Auto-Save Strategy:**
- Client-side: 10-30 second debounce during active scoring via server action
- Local state preserved in memory if save fails, retried on reconnection
- No explicit save button needed — but one provided for user confidence

**Topic Library:**
- 6 topics, 42 subtopics, 74 criteria with high/low descriptors — stored as static TypeScript constants (not database)
- Questions customisable per engagement via `QuestionOverride`
- Interviewer guidance editable per engagement via `GuidanceOverride`

### Authentication & Security

**Phase 1:** No authentication. Engagement-level access via unique URLs.
- Each engagement gets an `accessKey` (cuid or nanoid) used in the URL: `/engagement/[accessKey]`
- Anyone with the link can view and edit — acceptable for internal tool with ~20 users
- No role-based access control needed for Phase 1

**Phase 2 (future):** Azure SSO via Auth.js when embedding into P Suite

### API & Communication Patterns

**Server Actions (mutations):**
- `createEngagement(clientName)` → create engagement + default benchmarks
- `updateTopicConfig(engagementId, topicId, config)` → save topic selection
- `saveQuestionOverride(engagementId, subtopicId, question, mins)` → custom questions
- `saveGuidance(engagementId, data)` → save interviewer guidance overrides
- `upsertInterviewee(engagementId, data)` → add/edit interviewee
- `deleteInterviewee(intervieweeId)` → remove interviewee
- `upsertInterviewer(engagementId, data)` → add/edit interviewer
- `assignInterviewers(intervieweeId, interviewerIds)` → assign interviewers
- `saveScores(sessionId, scores[])` → batch auto-save of criteria scores
- `saveNote(sessionId, questionId, text)` → save question note
- `updateSessionStatus(sessionId, status)` → mark in-progress/complete
- `saveBenchmarks(engagementId, benchmarks[])` → update benchmark thresholds
- `archiveEngagement(engagementId)` → archive

**No Route Handlers needed** — all reads via server components, all writes via server actions. No real-time features for Phase 1.

### Frontend Architecture

**Server Components (default):**
- Engagement list page: server-rendered
- Engagement dashboard: server-rendered with interview sidebar
- Results page: server-rendered (scores computed server-side)
- Report page: server-rendered, print-optimised

**Client Components (`"use client"`):**
- Interview scoring workflow: timer, sliders, notes, navigation
- Setup forms: topic selection, interviewee/interviewer management
- SVG visualisations: radar chart, heatmap, bar chart (ported from prototype)
- Auto-save hook: debounced server action calls

**Scoring Engine & Visualisations:**
- Scoring calculations: pure TypeScript functions (average by topic, overall, calibration adjustment)
- SVG charts: ported directly from prototype — SvgRadar, SvgHeatmap, SvgBar components
- Colour coding logic: green ≥70%, orange 40-69%, red <40%

### Infrastructure & Deployment

- **Hosting:** Netlify with @netlify/plugin-nextjs
- **Database:** Neon PostgreSQL (free tier, serverless)
- **CI/CD:** GitHub push → Netlify auto-build
- **Environment:** DATABASE_URL in Netlify env vars
- **Backups:** Neon automated daily backups

## Implementation Patterns & Consistency Rules

### Naming Patterns

| Element | Convention | Example |
|---------|-----------|---------|
| Files (pages) | kebab-case via Next.js routing | `app/engagement/[accessKey]/page.tsx` |
| Files (components) | PascalCase | `SvgRadar.tsx`, `ScoreSlider.tsx` |
| Files (server actions) | camelCase with suffix | `engagementActions.ts`, `scoringActions.ts` |
| Database tables | PascalCase (Prisma) | `Engagement`, `TopicConfig`, `InterviewerAssignment` |
| Database fields | camelCase | `clientName`, `accessKey`, `selectedSubtopics` |
| CSS classes | Tailwind utilities + `ww-` prefix for custom | `ww-card`, `ww-btn-primary` |
| Environment variables | UPPER_SNAKE_CASE | `DATABASE_URL` |

### Structure Patterns

**Server Actions pattern:** All mutations return `void` or redirect (matching M Suite pattern). Errors throw and are caught by Next.js error boundaries.

**Auto-save pattern:**
```
Score change → local state update → debounce timer reset → after 10-30s idle → server action saveScores() → success/failure indicator
```

**Visualisation pattern:** SVG components are pure client components that accept data props. No internal data fetching. Parent page fetches data server-side, passes as props.

### Enforcement Guidelines

- All database queries must scope to the current engagement (`where: { engagementId }`)
- All scoring calculations use the shared calculation module — never inline arithmetic
- All SVG visualisations use the WWRI colour constants — never hardcode hex
- Tailwind classes use WWRI design tokens from theme config
- Topic library data lives in `lib/topic-library.ts` as static constants — never in the database

## Project Structure & Boundaries

### Complete Project Directory Structure

```
si-app/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (NavBar)
│   ├── page.tsx                      # Home: engagement list
│   ├── engagement/
│   │   ├── new/page.tsx              # Create new engagement
│   │   └── [accessKey]/
│   │       ├── layout.tsx            # Engagement layout (sidebar with interview list)
│   │       ├── page.tsx              # Engagement dashboard
│   │       ├── setup/page.tsx        # Topic config, interviewees, interviewers, guidance
│   │       ├── interview/
│   │       │   └── [intervieweeId]/page.tsx  # Live interview (client component)
│   │       ├── results/page.tsx      # Heatmap, radar, bar chart, benchmarks
│   │       └── report/page.tsx       # Printable executive report
│   └── generated/prisma/            # Auto-generated Prisma client
├── actions/                          # Server Actions
│   ├── engagementActions.ts          # CRUD, archive, access link
│   ├── setupActions.ts               # Topic config, interviewees, interviewers, guidance
│   └── scoringActions.ts             # Scores, notes, session status, benchmarks
├── components/                       # React components
│   ├── layout/
│   │   ├── NavBar.tsx
│   │   └── InterviewSidebar.tsx      # Sidebar showing all interviews + status
│   ├── setup/
│   │   ├── TopicSelector.tsx
│   │   ├── IntervieweeManager.tsx
│   │   ├── InterviewerManager.tsx
│   │   └── GuidanceEditor.tsx
│   ├── interview/
│   │   ├── ScoreSlider.tsx
│   │   ├── InterviewTimer.tsx
│   │   ├── QuestionNavigator.tsx
│   │   ├── NotesField.tsx
│   │   └── IntroSections.tsx
│   ├── results/
│   │   ├── SvgRadar.tsx
│   │   ├── SvgHeatmap.tsx
│   │   ├── SvgBar.tsx
│   │   └── BenchmarkEditor.tsx
│   ├── report/
│   │   └── ReportLayout.tsx
│   └── ui/                           # Shared design system (from M Suite)
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Badge.tsx
│       └── StatusBadge.tsx
├── lib/                              # Shared utilities
│   ├── db.ts                         # Prisma client singleton (Neon adapter)
│   ├── topic-library.ts              # 6 topics, 42 subtopics, 74 criteria (static data)
│   ├── calculations.ts               # Scoring averages, calibration, colour coding
│   ├── types.ts                      # Shared TypeScript types
│   └── mock-auth.ts                  # Mock current user (Phase 1)
├── prisma/
│   ├── schema.prisma                 # Database schema (12 models)
│   ├── seed.ts                       # Seed data (sample engagement for demo)
│   └── migrations/
├── public/
│   └── ww-logo.jpg
├── netlify.toml
├── next.config.ts
├── package.json
├── tsconfig.json
└── .env.example
```

### Architectural Boundaries

| Boundary | Rule |
|----------|------|
| **Client ↔ Server** | Client components only call Server Actions. Never import server-only code. |
| **Server ↔ Database** | Only `lib/db.ts` exports Prisma client. All queries go through Server Actions. |
| **Topic Library** | `lib/topic-library.ts` is the single source of truth for topics, subtopics, criteria. Static data, never in database. |
| **Calculations** | `lib/calculations.ts` is pure — no imports from server, database, or React. |
| **Visualisations** | SVG components in `components/results/` are pure renderers. Data passed as props from server components. |
| **Styling** | All colours via Tailwind theme config (WWRI tokens). No hardcoded hex values. |

### Requirements to Structure Mapping

| FR Group | Primary Location | Supporting Files |
|----------|-----------------|-----------------|
| Engagement Management (FR1-6) | `app/engagement/`, `actions/engagementActions.ts` | `app/page.tsx` (list) |
| Topic & Question Config (FR7-11) | `app/engagement/[accessKey]/setup/`, `actions/setupActions.ts` | `components/setup/`, `lib/topic-library.ts` |
| Interviewee Management (FR12-16) | `actions/setupActions.ts` | `components/setup/IntervieweeManager.tsx` |
| Interviewer & Calibration (FR17-19) | `actions/setupActions.ts` | `components/setup/InterviewerManager.tsx`, `lib/calculations.ts` |
| Interview Workflow (FR20-33) | `app/engagement/[accessKey]/interview/`, `actions/scoringActions.ts` | `components/interview/`, `components/layout/InterviewSidebar.tsx` |
| Results & Visualisation (FR34-41) | `app/engagement/[accessKey]/results/` | `components/results/`, `lib/calculations.ts` |
| Report Generation (FR42-44) | `app/engagement/[accessKey]/report/` | `components/report/` |
| Data Persistence (FR45-47) | `lib/db.ts`, `prisma/schema.prisma` | Neon automated backups |

## Architecture Validation Results

### Coherence Validation

| Check | Result | Notes |
|-------|--------|-------|
| All FRs have implementation location | Pass | 47 FRs mapped to project structure |
| NFRs addressed by architecture | Pass | Performance (client-side scoring), Security (access links, SSL), Reliability (auto-save, backups) |
| No circular dependencies | Pass | Clear boundaries: client → actions → db |
| Consistent patterns across modules | Pass | All mutations via server actions, all reads via server components |
| Stack compatibility | Pass | Identical to proven M Suite stack |

### Requirements Coverage

- **47 FRs:** All mapped to specific files/directories
- **NFRs:** All addressed (performance via client-side scoring, security via access links, reliability via auto-save + Neon backups, scalability via serverless)

### Implementation Readiness

| Criterion | Status |
|-----------|--------|
| Stack selected and validated | Ready (proven by M Suite) |
| Data model defined | Ready (12 models) |
| Authentication approach confirmed | Ready (access links, no SSO) |
| API patterns established | Ready (server actions only) |
| Project structure documented | Ready |
| Deployment strategy confirmed | Ready (Netlify + Neon) |

### Architecture Readiness Assessment: READY FOR EPIC BREAKDOWN
