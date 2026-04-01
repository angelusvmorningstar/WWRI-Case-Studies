---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: complete
completedAt: '2026-04-01'
inputDocuments:
  - prd-si-app.md
  - architecture-si-app.md
---

# Structured Interview App - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Structured Interview App, decomposing the 47 functional requirements from the PRD and Architecture into 18 implementable stories across 6 epics.

## Requirements Inventory

### Functional Requirements

- FR1: IE can create a new engagement with a client name
- FR2: IE can view a list of their engagements with status indicators
- FR3: IE can switch between engagements
- FR4: IE can archive a completed engagement
- FR5: IE can generate a unique access link for an engagement
- FR6: Anyone with an engagement access link can view that engagement's data
- FR7: IE can enable or disable each of the 6 topic libraries per engagement
- FR8: IE can select up to 3 subtopics per enabled topic
- FR9: IE can customise the interview question for each selected subtopic
- FR10: IE can set time allocation (minutes) per subtopic
- FR11: System preserves all 42 subtopics with their default suggested questions, criteria, and high/low descriptors
- FR12: IE can add interviewees with name, title, and category
- FR13: IE can edit interviewee details
- FR14: IE can delete an interviewee
- FR15: IE can assign one or more interviewers to each interviewee
- FR16: IE can view interviewee status (pending, in-progress, complete)
- FR17: IE can add interviewers to the engagement
- FR18: IE can set a calibration adjustment per interviewer (-100 to +100)
- FR19: System applies interviewer calibration adjustments to scores
- FR20: IE can select an interviewee and begin an interview session
- FR21: System displays editable interviewer guidance before questions begin
- FR22: IE can edit interviewer guidance text per engagement
- FR23: System collects background information per interviewee
- FR24: System presents questions sequentially with purpose statement and time allocation
- FR25: IE can score each criterion on a 0-100 scale via slider
- FR26: IE can enter free-text notes per question
- FR27: System displays a running timer with pause/resume capability
- FR28: IE can navigate forward and backward between questions
- FR29: IE can mark an interview session as complete
- FR30: IE can reopen and edit a completed session
- FR31: System auto-saves interview state at regular intervals
- FR32: System preserves local state if auto-save fails and retries on reconnection
- FR33: System displays a sidebar showing all interviews in the engagement with click-to-navigate
- FR34: System calculates topic-level scores as the average of criteria scores within each topic
- FR35: System calculates overall scores as the average of all criteria scores
- FR36: System applies colour coding to scores (green ≥70%, orange 40-69%, red <40%)
- FR37: System displays a heatmap of all interviewees × topics with colour-coded scores
- FR38: System displays a radar chart per interviewee showing topic scores against benchmark rings
- FR39: System displays a bar chart of individual overall scores grouped by category
- FR40: IE can view and edit benchmark thresholds (adequate/best) per category
- FR41: Heatmap displays interactive tooltips on hover
- FR42: System generates a printable/PDF-ready executive report
- FR43: Report includes per-person sections with radar chart and score breakdown
- FR44: Report includes engagement context (client name, date)
- FR45: All engagement data persists across browser sessions
- FR46: System supports concurrent access to the same engagement by multiple users
- FR47: System performs automated daily database backups

### Non-Functional Requirements

- NFR1: Page load under 3 seconds (including Neon cold start)
- NFR2: Scoring slider interaction under 100ms (client-side)
- NFR3: Auto-save server action under 2 seconds
- NFR4: Visualisation render under 500ms for up to 15 interviewees
- NFR5: Auto-save frequency every 10-30 seconds during active scoring
- NFR6: Engagements not publicly discoverable — access requires unique link
- NFR7: Database connection uses SSL
- NFR8: No client data exposed without engagement-specific URL
- NFR9: Database credentials in environment variables, never in source
- NFR10: Auto-save handles intermittent connectivity — local state queue with retry
- NFR11: No data loss on browser crash within auto-save interval
- NFR12: Neon automated daily backups
- NFR13: Supports ~20 concurrent IEs
- NFR14: Neon free tier sufficient (0.5 GB)
- NFR15: Netlify free tier sufficient (125k invocations/month)
- NFR16: Architecture supports migration to paid tiers

### Additional Requirements (Architecture)

- Scaffold from M Suite: Next.js 16, Prisma 7, @prisma/adapter-neon, Tailwind CSS v4
- Topic library as static TypeScript constants in lib/topic-library.ts
- 12 Prisma models: Engagement, TopicConfig, QuestionOverride, GuidanceOverride, Interviewee, Interviewer, InterviewerAssignment, Session, Background, Score, Note, Benchmark
- Access via unique accessKey in URL (cuid/nanoid)
- SVG visualisations ported from prototype (SvgRadar, SvgHeatmap, SvgBar)
- WWRI design system shared with M Suite
- Netlify deployment with @netlify/plugin-nextjs
- No auth for Phase 1 — engagement-level access links only

### FR Coverage Map

| FR | Story | Description |
|----|-------|-------------|
| FR1-FR3 | 1.2 | Create, list, switch engagements |
| FR4-FR6 | 1.3 | Archive, access links |
| FR7-FR11 | 2.1 | Topic selection, question customisation |
| FR12-FR14, FR16 | 2.2 | Interviewee CRUD, status |
| FR15, FR17-FR19 | 2.3 | Interviewer management, calibration, assignment |
| FR21-FR22 | 2.4 | Interviewer guidance editor |
| FR20, FR23 | 3.1 | Start interview, intro, background |
| FR24-FR26 | 3.2 | Scoring sliders, notes |
| FR27-FR29 | 3.3 | Timer, navigation, complete session |
| FR30, FR33 | 3.4 | Sidebar, reopen sessions |
| FR31-FR32 | 3.5 | Auto-save, connectivity resilience |
| FR34-FR36 | 4.1 | Score calculations, colour coding |
| FR37, FR41 | 4.2 | Heatmap with tooltips |
| FR38-FR39 | 4.3 | Radar and bar charts |
| FR40 | 4.4 | Benchmark editor |
| FR42-FR44 | 5.1 | Executive report |
| FR45-FR46 | 6.1 | Cross-session persistence, concurrent access |
| FR47 | 6.2 | Automated backups |

## Epic List

### Epic 1: Project Setup & Engagement Management
An IE can create, list, switch between, and archive interview engagements — the foundation for all other work.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6

### Epic 2: Interview Configuration
An IE can configure an engagement for interviews — select topics, customise questions, manage interviewees and interviewers, edit guidance, and set calibration.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR21, FR22

### Epic 3: Live Interview Workflow
An IE can conduct a live interview — score criteria, take notes, use the timer, navigate questions, and auto-save throughout. Sidebar shows all interviews with status.
**FRs covered:** FR20, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33

### Epic 4: Results & Visualisation
An IE or reviewer can view cohort analytics — heatmap, radar charts, bar chart, benchmarks — with scores calculated and colour-coded automatically.
**FRs covered:** FR34, FR35, FR36, FR37, FR38, FR39, FR40, FR41

### Epic 5: Report Generation
An IE can generate a printable executive report with per-person radar charts, score breakdowns, and engagement context.
**FRs covered:** FR42, FR43, FR44

### Epic 6: Data Persistence & Reliability
Interview data persists reliably — engagements survive across weeks, concurrent access works, backups are automated, and connectivity drops don't lose data.
**FRs covered:** FR45, FR46, FR47

---

## Epic 1: Project Setup & Engagement Management

An IE can create, list, switch between, and archive interview engagements.

### Story 1.1: Scaffold SI App from M Suite

As a developer,
I want to initialise the SI App project from the M Suite scaffold,
So that we have a working Next.js app with design system, Prisma, Neon, and Netlify config ready.

**Acceptance Criteria:**

**Given** the M Suite codebase exists
**When** I scaffold the SI App
**Then** a new `si-app/` directory exists with Next.js 16, Tailwind v4, Prisma 7 with @prisma/adapter-neon
**And** the WWRI design system (UI components, tokens) is included
**And** `netlify.toml` is configured
**And** Prisma schema contains all 12 SI App models (Engagement, TopicConfig, QuestionOverride, GuidanceOverride, Interviewee, Interviewer, InterviewerAssignment, Session, Background, Score, Note, Benchmark)
**And** `npm run dev` starts successfully
**And** `npm run build` passes

### Story 1.2: Create and List Engagements

As an IE,
I want to create a new engagement and see my list of engagements,
So that I can manage multiple client interviews.

**Acceptance Criteria:**

**Given** I am on the home page
**When** I click "New Engagement" and enter a client name
**Then** a new engagement is created with a unique accessKey
**And** I am redirected to the engagement dashboard
**And** the engagement appears in my engagement list with status indicator

**Given** I have multiple engagements
**When** I view the home page
**Then** I see all engagements with client name, status, and creation date
**And** I can click any engagement to navigate to it

### Story 1.3: Engagement Access Links & Archive

As an IE,
I want to share an engagement via a unique link and archive completed engagements,
So that colleagues can access my engagement and old engagements don't clutter the list.

**Acceptance Criteria:**

**Given** I am on an engagement dashboard
**When** I copy the access link
**Then** the URL contains the engagement's unique accessKey
**And** anyone with that URL can view and edit the engagement

**Given** I have a completed engagement
**When** I archive it
**Then** it no longer appears in the active engagement list
**And** it is still accessible via its access link

---

## Epic 2: Interview Configuration

An IE can configure an engagement for interviews — select topics, customise questions, manage interviewees and interviewers, edit guidance, and set calibration.

### Story 2.1: Topic Selection & Question Customisation

As an IE,
I want to select which topics and subtopics to use and customise the questions,
So that I can tailor the interview to each client engagement.

**Acceptance Criteria:**

**Given** I am on the setup page for an engagement
**When** I view the topic configuration
**Then** I see all 6 topics with their subtopics
**And** I can enable/disable each topic
**And** I can select up to 3 subtopics per enabled topic
**And** each subtopic shows a default suggested question

**Given** I select a subtopic
**When** I edit the question text
**Then** the custom question is saved for this engagement
**And** the default question is still available as reference

**Given** I select a subtopic
**When** I change the time allocation
**Then** the custom time (in minutes) is saved for this engagement

### Story 2.2: Interviewee Management

As an IE,
I want to add, edit, and remove interviewees for an engagement,
So that I can set up the people I need to interview.

**Acceptance Criteria:**

**Given** I am on the setup page
**When** I add an interviewee with name, title, and category (Executive/Senior Management/Middle Management)
**Then** the interviewee appears in the engagement's interviewee list with "pending" status

**Given** an interviewee exists
**When** I edit their details
**Then** the changes are saved

**Given** an interviewee with no interview data
**When** I delete them
**Then** they are removed from the engagement

### Story 2.3: Interviewer Management & Calibration

As an IE,
I want to add interviewers and set calibration adjustments,
So that scoring consistency is maintained across the consultant team.

**Acceptance Criteria:**

**Given** I am on the setup page
**When** I add an interviewer with a name
**Then** they appear in the interviewer list with a default adjustment of 0

**Given** an interviewer exists
**When** I set their calibration adjustment (slider from -100 to +100)
**Then** the adjustment is saved

**Given** an interviewee exists
**When** I assign one or more interviewers to them
**Then** the assignments are saved
**And** the interviewee shows their assigned interviewers

### Story 2.4: Interviewer Guidance Editor

As an IE,
I want to customise the interviewer guidance text per engagement,
So that the introductory guidance reflects the specific goals and context of this engagement.

**Acceptance Criteria:**

**Given** I am on the setup page
**When** I view the guidance editor
**Then** I see the boilerplate guidance sections with find/replace fields (client name, engagement goals)
**And** I see a bespoke free-text section for engagement-specific context

**Given** I edit the boilerplate fields or bespoke section
**When** I leave the editor
**Then** the changes are saved for this engagement

---

## Epic 3: Live Interview Workflow

An IE can conduct a live interview — score criteria, take notes, use the timer, navigate questions, and auto-save throughout. Sidebar shows all interviews with status.

### Story 3.1: Start Interview & Introduction

As an IE,
I want to select an interviewee and see the interviewer guidance before starting questions,
So that I'm prepared for the interview.

**Acceptance Criteria:**

**Given** I am on the engagement dashboard
**When** I select an interviewee to interview
**Then** I see the interviewer guidance sections (boilerplate + bespoke)
**And** the session status changes to "in-progress"
**And** a session record is created with startedAt timestamp

**Given** the guidance is displayed
**When** I click "Begin Questions"
**Then** I proceed to the background collection step
**And** then to the first question

### Story 3.2: Scoring & Notes

As an IE,
I want to score each criterion and take notes during the interview,
So that I capture structured assessment data in real time.

**Acceptance Criteria:**

**Given** I am on a question during an interview
**When** I view the question
**Then** I see the question text, purpose statement, and time allocation
**And** I see a 0-100 slider for each criterion with high/low descriptors

**Given** I move a criterion slider
**When** I set a score
**Then** the score is stored locally and auto-saved to the database within 10-30 seconds

**Given** I am on a question
**When** I type in the notes field
**Then** the notes are stored locally and auto-saved to the database

### Story 3.3: Timer & Navigation

As an IE,
I want a running timer and the ability to navigate between questions,
So that I can manage interview pacing and review previous answers.

**Acceptance Criteria:**

**Given** I am in an active interview
**When** I view the timer
**Then** I see elapsed time in minutes:seconds
**And** I can pause and resume the timer

**Given** I am on a question
**When** I click Next or Previous
**Then** I navigate to the adjacent question
**And** my current scores and notes are preserved

**Given** I am on the last question
**When** I complete scoring
**Then** I can mark the session as complete

### Story 3.4: Interview Sidebar & Session Management

As an IE,
I want a sidebar showing all interviews in the engagement with their status,
So that I can navigate between interviews and track progress.

**Acceptance Criteria:**

**Given** I am in an engagement
**When** I view the sidebar
**Then** I see all interviewees listed with status (pending, in-progress, complete)
**And** I can click any interviewee to navigate to their interview

**Given** I have a completed interview
**When** I click on it in the sidebar
**Then** I can reopen and edit scores and notes

### Story 3.5: Auto-Save & Connectivity Resilience

As an IE,
I want my interview data to save automatically and survive connectivity drops,
So that I never lose work during a live interview.

**Acceptance Criteria:**

**Given** I am actively scoring an interview
**When** 10-30 seconds of inactivity pass after a change
**Then** all unsaved scores and notes are sent to the server via server action

**Given** the network connection drops during auto-save
**When** the save fails
**Then** local state is preserved in memory
**And** a save failure indicator is shown
**And** the save is retried when connectivity returns

**Given** my browser crashes or laptop restarts
**When** I reopen the engagement
**Then** all data saved by the last successful auto-save is present

---

## Epic 4: Results & Visualisation

An IE or reviewer can view cohort analytics — heatmap, radar charts, bar chart, benchmarks — with scores calculated and colour-coded automatically.

### Story 4.1: Scoring Calculations & Colour Coding

As an IE,
I want scores calculated automatically with colour coding,
So that I can see performance at a glance.

**Acceptance Criteria:**

**Given** interviews have been scored
**When** I view results
**Then** topic-level scores are calculated as the average of criteria scores within each topic
**And** overall scores are calculated as the average of all criteria scores
**And** interviewer calibration adjustments are applied (averaged across assigned interviewers, clamped to 0-100)
**And** scores are colour-coded: green ≥70%, orange 40-69%, red <40%

### Story 4.2: Heatmap Visualisation

As an IE or reviewer,
I want a heatmap showing all interviewees × topics,
So that I can see cohort-level patterns at a glance.

**Acceptance Criteria:**

**Given** I am on the results page
**When** I view the heatmap
**Then** I see a matrix with interviewees as rows and topics as columns
**And** rows are grouped by category (Executive, Senior Management, Middle Management)
**And** each cell is colour-coded by score
**And** hovering over a cell shows a tooltip with the exact score

### Story 4.3: Radar & Bar Chart Visualisation

As an IE or reviewer,
I want radar charts per interviewee and a bar chart comparing all interviewees,
So that I can assess individual profiles and compare across the cohort.

**Acceptance Criteria:**

**Given** I am on the results page
**When** I view an individual's radar chart
**Then** I see topic scores plotted on a polar chart with benchmark rings (adequate/best)

**Given** I am on the results page
**When** I view the bar chart
**Then** I see individual overall scores as horizontal bars, grouped by category
**And** benchmark reference lines are overlaid per category

### Story 4.4: Benchmark Editor

As an IE,
I want to view and edit benchmark thresholds per category,
So that I can calibrate what "adequate" and "best" mean for different seniority levels.

**Acceptance Criteria:**

**Given** I am on the results page
**When** I open the benchmark editor
**Then** I see adequate and best thresholds for each category (Executive, Senior Management, Middle Management)
**And** I can edit any threshold value
**And** changes are saved and immediately reflected in all visualisations

---

## Epic 5: Report Generation

An IE can generate a printable executive report with per-person radar charts, score breakdowns, and engagement context.

### Story 5.1: Executive Report

As an IE,
I want to generate a printable executive report,
So that I can deliver a polished assessment to the client engagement lead.

**Acceptance Criteria:**

**Given** I am on the report page
**When** the page loads
**Then** I see a print-optimised layout with engagement context (client name, date)
**And** each interviewee has a section with their radar chart and score breakdown by topic
**And** scores are colour-coded consistently with the results page

**Given** I am viewing the report
**When** I print or save as PDF
**Then** the layout renders correctly for A4 paper
**And** charts and formatting are preserved

---

## Epic 6: Data Persistence & Reliability

Interview data persists reliably — engagements survive across weeks, concurrent access works, backups are automated, and connectivity drops don't lose data.

### Story 6.1: Cross-Session Persistence & Concurrent Access

As an IE,
I want engagement data to persist across weeks and be accessible by multiple consultants,
So that long-running engagements and handoffs work reliably.

**Acceptance Criteria:**

**Given** I create an engagement and add data
**When** I close the browser and reopen the engagement days later
**Then** all data (config, interviewees, interviews, scores, notes) is present

**Given** two IEs have the same engagement open
**When** both make changes
**Then** the last save wins (last-write-wins)
**And** no errors or data corruption occurs

### Story 6.2: Backup & Recovery

As a system administrator,
I want automated daily database backups,
So that data can be recovered in case of disaster.

**Acceptance Criteria:**

**Given** the Neon database is active
**When** each day passes
**Then** Neon performs an automated backup
**And** backups are retained per Neon's free tier policy
