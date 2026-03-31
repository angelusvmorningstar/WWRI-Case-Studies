---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: 'complete'
completedAt: '2026-03-31'
inputDocuments:
  - prd-m-suite.md
  - architecture-m-suite.md
  - ux-design-specification-m-suite.md
---

# M Suite - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for M Suite, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: IE can log in using their existing Microsoft 365 credentials (SSO)
- FR2: System assigns role-based access: IE, Reviewer, or Admin
- FR3: IE can only view and edit their own opportunities
- FR4: Reviewer can view opportunities assigned to them for review
- FR5: Admin can view all opportunities across the network
- FR6: Admin can assign roles to users
- FR7: IE can create a new opportunity with basic details (client name, prospect contact, description)
- FR8: IE can view a list of all their opportunities with current M stage
- FR9: IE can progress an opportunity from one M stage to the next
- FR10: IE can mark an opportunity as "do not pursue" at any decision gate
- FR11: System records the stage, decision, and timestamp for every opportunity state change
- FR12: Admin can view all active opportunities across the network with current stage and assigned IE
- FR13: Each M stage page (M0, M1, M2, M3, M4/M5) displays the SOP guidance content for that stage, combining both internal (.5) and external (.0) sub-stages
- FR14: System surfaces advisory self-check decision points at M0, M1, and M2 with guidance on what to assess
- FR15: IE can record their self-check decision (pursue or stop) with optional notes
- FR16: Stages without dedicated tooling display process guidance, checklists, and expected outputs
- FR17: Admin can update SOP guidance content for any stage
- FR18: IE can create a new costing sheet linked to an opportunity
- FR19: IE can enter project metadata (client name, legal entity, project title, short name)
- FR20: IE can assign people to a costing (project lead, project partner, reviewer, referral partner)
- FR21: IE can configure financial parameters (currency, government impost type, WWRI %, referral %)
- FR22: IE can define up to 4 project phases with name, active toggle, start date, and duration in weeks
- FR23: IE can add, remove, and edit experts (name, role, daily fee) with a minimum of 1
- FR24: IE can add, remove, and edit services (name, weekly fee) with a minimum of 1
- FR25: IE can allocate expert days per week per phase, with default and per-week override capability
- FR26: IE can allocate service weeks per phase (active/inactive per week)
- FR27: System calculates WWRI contribution as a markup: fee / (1 - wwriPct) * wwriPct
- FR28: System calculates referral fees based on active/inactive involvement (10% / 5%) applied to project subtotal
- FR29: System calculates phase totals (professional fees, service fees, WWRI amount, referral fee, client charge) in real-time as inputs change
- FR30: System calculates project totals across all active phases in real-time
- FR31: IE can view a summary of charges by phase, days by expert, income by expert, and WWRI share
- FR32: IE can override an expert's daily fee on a per-phase basis
- FR33: System auto-saves every field change without explicit save action
- FR34: IE can export a costing sheet to JSON for backup
- FR35: IE can import a costing sheet from JSON
- FR36: IE can add timeline milestones and activity spans to each phase
- FR37: IE can submit a completed costing sheet for review by selecting an assigned reviewer
- FR38: System sends a Microsoft Teams notification to the assigned reviewer upon submission
- FR39: Reviewer can view the full costing sheet with all calculations
- FR40: Reviewer can approve a costing sheet
- FR41: Reviewer can request changes to a costing sheet with comments
- FR42: IE is notified via Teams when a reviewer requests changes or approves
- FR43: System tracks review status (draft, submitted, in review, changes requested, approved)
- FR44: System flags costings where WWRI % or referral % deviate from defaults as requiring Board approval
- FR45: Reviewer can view all items pending their review in a single view
- FR46: System automatically files costing sheet documents to the correct SharePoint location when saved
- FR47: System organises SharePoint folders by opportunity/client
- FR48: IE can access their opportunity documents through the app without navigating SharePoint directly
- FR49: Admin can configure the SharePoint site and folder schema
- FR50: Admin can manage the reviewer list (add, remove reviewers)
- FR51: Admin can set system-wide default values (WWRI %, referral rates, Board-approval thresholds)
- FR52: Admin can configure which WWRI % and referral % values require Board approval
- FR53: System enforces that Board-approval-triggering fields are flagged and cannot be finalised without reviewer acknowledgement
- FR54: System architecture supports adding new stage-specific modules without restructuring the application
- FR55: System architecture supports adding new data fields and content to any M stage without restructuring the application
- FR56: System supports future integration points (HubSpot API, additional notification channels) through a defined integration layer

### Non-Functional Requirements

- NFR1: Page load time under 2 seconds on standard broadband
- NFR2: Costing sheet calculations update instantaneously on every field change (client-side engine, no server round-trip)
- NFR3: Auto-save persists field changes to backend within 1 second asynchronously
- NFR4: Real-time state propagation (review status, submission notifications) within 3 seconds
- NFR5: System supports 20 concurrent users with no degradation (design for 50+ headroom)
- NFR6: All data encrypted in transit (HTTPS/TLS) and at rest
- NFR7: Authentication exclusively via Microsoft 365 SSO — no local passwords
- NFR8: Role-based access control enforced at the API level, not just the UI
- NFR9: Costing sheets contain commercially sensitive data — access restricted to assigned IE, assigned reviewer, and admin
- NFR10: Session management via M365 tokens with appropriate expiry and refresh
- NFR11: Audit trail: all review actions logged with user, timestamp, and action
- NFR12: "Could Marc use it?" standard — every interaction usable by digitally non-literate 50-60+ executive without training
- NFR13: No feature requires more than 3 clicks/taps to reach from the home page
- NFR14: All form inputs use auto-save — no explicit save buttons
- NFR15: Error messages in plain language
- NFR16: Consistent navigation: always clear which M stage the user is in
- NFR17: Undo capability for destructive actions
- NFR18: Target 99.5% uptime during business hours (AEST/AEDT and CET)
- NFR19: Graceful handling of SharePoint or Teams API outages — costing sheet remains functional
- NFR20: No data loss on browser close, crash, or network interruption
- NFR21: Microsoft Graph API: SSO authentication, Teams notifications, SharePoint document CRUD
- NFR22: SharePoint: automatic document filing with configurable folder schema
- NFR23: All integrations must fail gracefully — retry silently
- NFR24: Integration layer must be abstracted to support future HubSpot API addition

### Additional Requirements

- Starter template: Next.js 16 App Router with TypeScript, Tailwind CSS, ESLint, Turbopack
- Database: PostgreSQL on Azure with Prisma ORM — 11 core models (User, Opportunity, StageHistory, CostingSheet, Phase, Expert, Service, PhaseExpert, PhaseService, Review, AuditLog)
- Auth: Auth.js v5 with Microsoft Entra ID provider (tenant-restricted)
- Real-time: Server-Sent Events via Route Handler (/api/events)
- SharePoint integration: Graph API service layer with retry queue (IntegrationQueue table)
- Teams notifications: Graph API chat messages with retry queue
- Deployment: Azure Container Apps with standalone output + Azure PostgreSQL Flexible Server
- CI/CD: GitHub Actions with Docker multi-stage build
- Costing calculation engine: pure TypeScript functions (calcPhase, calcTotals) shared between client and server
- SOP content: Markdown files in content/ directory, rendered by stage pages
- Auto-save: 300ms debounce, Server Actions for persistence

### UX Design Requirements

- UX-DR1: WWRI design token system in Tailwind config (colours, typography, spacing from existing prototypes)
- UX-DR2: M-Stage Progress Bar component (horizontal, clickable, colour-coded completed/current/future)
- UX-DR3: Opportunity Card component (client name, stage, last activity, review status)
- UX-DR4: Review Status Badge component (5 states with semantic colours)
- UX-DR5: Self-Check Decision Panel component (guidance text + pursue/stop buttons + notes)
- UX-DR6: Costing Summary Panel component (sticky/collapsible running totals)
- UX-DR7: SOP Guidance Block component (collapsible card with guidance, checklists, outputs)
- UX-DR8: Auto-Save Indicator component (subtle "saved" near nav bar)
- UX-DR9: Persistent top nav with logo, M-Stage Progress Bar, opportunity context, user name
- UX-DR10: Breadcrumb navigation (Home > Client > Stage)
- UX-DR11: No hamburger menus — all primary navigation visible
- UX-DR12: Desktop-first responsive design with tablet breakpoint (768px)
- UX-DR13: WCAG 2.1 AA compliance (44px targets, 4.5:1 contrast, keyboard nav, focus indicators)

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1-FR6 | Epic 1 | Auth & access control |
| FR7-FR12 | Epic 2 | Opportunity management |
| FR13-FR17 | Epic 2 | M+ process guidance |
| FR18-FR36 | Epic 3 | Costing sheet module |
| FR37-FR45 | Epic 4 | Review workflow |
| FR46-FR49 | Epic 5 | SharePoint integration |
| FR50-FR53 | Epic 6 | Administration |
| FR54-FR56 | Epic 7 | Extensibility |

## Epic List

### Epic 1: Project Foundation & Authentication
Users can access the M Suite via their Microsoft 365 account and see a personalised home page. Admin can assign roles.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6
**UX-DRs covered:** UX-DR1, UX-DR9, UX-DR11, UX-DR12, UX-DR13

### Epic 2: Opportunity Management & M+ Process
IEs can create opportunities, view their opportunity list, progress through M stages with SOP guidance, and record self-check decisions. Admin can see all opportunities.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17
**UX-DRs covered:** UX-DR2, UX-DR3, UX-DR5, UX-DR7, UX-DR8, UX-DR10

### Epic 3: Costing Sheet Module
IEs can create, configure, and calibrate costing sheets with real-time calculations, auto-save, and full project/phase/expert/service management. Includes the calculation engine, summary views, and JSON export/import.
**FRs covered:** FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36
**UX-DRs covered:** UX-DR6

### Epic 4: Review Workflow & Notifications
IEs can submit costings for review. Reviewers receive Teams notifications, can view costings, approve or request changes. Board-approval thresholds are enforced. Full audit trail.
**FRs covered:** FR37, FR38, FR39, FR40, FR41, FR42, FR43, FR44, FR45
**UX-DRs covered:** UX-DR4

### Epic 5: SharePoint Document Management
The app automatically files costing documents to SharePoint, organises folders by client/opportunity, and IEs can access documents through the app. Admin can configure the SharePoint schema.
**FRs covered:** FR46, FR47, FR48, FR49

### Epic 6: Administration & System Configuration
Admin can manage the reviewer list, set system-wide defaults (WWRI %, referral rates), configure Board-approval thresholds, and enforce governance rules.
**FRs covered:** FR50, FR51, FR52, FR53

### Epic 7: Extensibility & Integration Foundation
Architecture supports adding new stage modules, new data fields, and future integrations (HubSpot) without restructuring. SSE real-time endpoint, integration abstraction layer, retry queue.
**FRs covered:** FR54, FR55, FR56

## Epic 1: Project Foundation & Authentication

Users can access the M Suite via their Microsoft 365 account and see a personalised home page. Admin can assign roles.

### Story 1.1: Project Initialisation & Design System

As a developer,
I want the project scaffolded with Next.js, Prisma, and the WWRI design token system,
So that all subsequent development has a consistent foundation.

**Acceptance Criteria:**

**Given** a fresh development environment
**When** the project is initialised
**Then** Next.js 16 App Router is configured with TypeScript, Tailwind CSS, ESLint, and Turbopack
**And** Tailwind config includes WWRI design tokens (teal #009898, off-white #F5F4F0, full colour system, typography scale, spacing scale)
**And** Prisma is configured with PostgreSQL connection
**And** All 11 data models are defined in schema.prisma (User, Opportunity, StageHistory, CostingSheet, Phase, Expert, Service, PhaseExpert, PhaseService, Review, AuditLog)
**And** Docker and docker-compose files are configured for local development
**And** GitHub Actions CI/CD pipeline builds and tests

### Story 1.2: Microsoft 365 SSO Authentication

As an IE,
I want to access the M Suite using my existing Microsoft 365 account without a separate login,
So that I can start using the app immediately.

**Acceptance Criteria:**

**Given** an IE with a WWRI Microsoft 365 account navigates to the M Suite
**When** the page loads
**Then** Auth.js authenticates via Microsoft Entra ID transparently (no login screen)
**And** only WWRI tenant accounts are accepted
**And** the user's name and email are displayed in the nav bar
**And** a User record is created in the database if it doesn't exist (first-time auto-provisioning)
**And** unauthenticated users are redirected to Microsoft login

### Story 1.3: Role-Based Access Control

As an admin,
I want to assign roles (IE, Reviewer, Admin) to users,
So that each user sees only what they're authorised to see.

**Acceptance Criteria:**

**Given** an authenticated user with the Admin role
**When** they navigate to the admin user management page
**Then** they can view all users and their current roles
**And** they can change a user's role to IE, Reviewer, or Admin
**And** role changes take effect on the user's next page load
**And** API-level middleware enforces role checks on all Server Actions and Route Handlers
**And** an IE cannot access admin or reviewer-only routes via URL manipulation

### Story 1.4: Persistent Navigation & Layout

As an IE,
I want a clear, consistent navigation bar on every page,
So that I always know where I am and can navigate easily.

**Acceptance Criteria:**

**Given** an authenticated user on any page
**When** the page renders
**Then** a sticky 56px nav bar displays the WWRI logo, the user's name, and a link to the home page
**And** no hamburger menus are used — all primary navigation is visible
**And** the layout is desktop-first (1280px+) and functional on tablet (768px+)
**And** all interactive elements have minimum 44x44px tap targets
**And** colour contrast meets WCAG 2.1 AA (4.5:1 ratio)
**And** all elements are keyboard-navigable with visible teal focus indicators

## Epic 2: Opportunity Management & M+ Process

IEs can create opportunities, view their opportunity list, progress through M stages with SOP guidance, and record self-check decisions. Admin can see all opportunities.

### Story 2.1: Create New Opportunity

As an IE,
I want to create a new opportunity with basic client details,
So that I can begin tracking a BD pursuit through the M+ Process.

**Acceptance Criteria:**

**Given** an authenticated IE on the home page
**When** they click "New Opportunity"
**Then** a form displays fields for client name, prospect contact, and description
**And** submitting creates an Opportunity record at stage M0 with the IE as owner
**And** a StageHistory record is created with the initial stage and timestamp
**And** the IE is redirected to the M0 stage page for the new opportunity
**And** the opportunity appears in the IE's opportunity list

### Story 2.2: Opportunity List & Home Page

As an IE,
I want to see all my opportunities with their current M stage,
So that I know where each pursuit stands at a glance.

**Acceptance Criteria:**

**Given** an authenticated IE on the home page
**When** the page loads
**Then** a personalised greeting is displayed ("Welcome, Priya")
**And** all of the IE's opportunities are listed as Opportunity Cards showing client name, current M stage, last activity date, and review status (if applicable)
**And** opportunities are sorted by last activity (most recent first)
**And** active and stopped opportunities are visually distinct
**And** the "New Opportunity" button is prominently visible
**And** an admin sees all opportunities across the network with the assigned IE name

### Story 2.3: M Stage Pages with SOP Guidance

As an IE,
I want to see the M+ Process guidance for each stage of my opportunity,
So that I know exactly what to do and what the expected outputs are.

**Acceptance Criteria:**

**Given** an IE viewing an opportunity
**When** they navigate to a stage page (M0, M1, M2, M3, or M4/M5)
**Then** the M-Stage Progress Bar is visible showing all stages with completed (green), current (teal), and future (muted) states
**And** the progress bar is clickable — IE can navigate to any stage
**And** breadcrumb navigation shows "Home > [Client Name] > [Stage]"
**And** the SOP Guidance Block displays the guidance content for that stage, combining internal (.5) and external (.0) sub-stages
**And** the guidance block is collapsible
**And** stages without dedicated tooling show process guidance, checklists, and expected outputs
**And** SOP content is loaded from Markdown files in the content/ directory

### Story 2.4: Self-Check Decision Gates

As an IE,
I want to be prompted to assess whether an opportunity is worth pursuing at key stages,
So that I don't waste time on opportunities that aren't a good fit.

**Acceptance Criteria:**

**Given** an IE on a stage page at M0, M1, or M2
**When** they reach the decision point
**Then** a Self-Check Decision Panel displays guidance on what to assess (e.g., "Is this person transformational and interested?")
**And** the IE can select "Pursue" or "Do not pursue"
**And** the IE can add optional notes explaining their decision
**And** selecting "Pursue" progresses the opportunity to the next stage
**And** selecting "Do not pursue" marks the opportunity as stopped with the decision recorded in StageHistory
**And** all decisions are recorded with timestamp and user

### Story 2.5: Stage Progression

As an IE,
I want to progress my opportunity from one M stage to the next,
So that the app tracks where I am in the BD process.

**Acceptance Criteria:**

**Given** an IE on any stage page for an active opportunity
**When** they complete the stage activities and click to progress
**Then** the opportunity's currentStage updates to the next stage
**And** a StageHistory record is created with fromStage, toStage, timestamp, and userId
**And** the M-Stage Progress Bar updates to show the new current stage
**And** the IE is navigated to the next stage page
**And** the Auto-Save Indicator briefly shows "Saved"

### Story 2.6: Admin SOP Content Management

As an admin,
I want to update the SOP guidance content for any stage,
So that the M+ Process guidance stays current as the methodology evolves.

**Acceptance Criteria:**

**Given** an authenticated admin
**When** they navigate to admin content management
**Then** they can view and edit the Markdown content for each M stage (M0-M4)
**And** changes are saved and immediately reflected on the stage pages
**And** non-admin users cannot access the content editor

## Epic 3: Costing Sheet Module

IEs can create, configure, and calibrate costing sheets with real-time calculations, auto-save, and full project/phase/expert/service management.

### Story 3.1: Create Costing Sheet & Project Setup

As an IE,
I want to create a costing sheet for my opportunity and enter the project details,
So that I can begin building a cost estimate for the engagement.

**Acceptance Criteria:**

**Given** an IE on the M2 stage page for an opportunity
**When** they click "Create Costing"
**Then** a new CostingSheet record is created linked to the opportunity
**And** the Project Setup view displays editable fields for: client name, legal entity, project title, short name
**And** the IE can assign people: project lead, project partner, reviewer (from approved list), referral partner
**And** the IE can configure: currency (AUD/USD/EUR/GBP/JPY/CAD/CNH/NZD/SGD), government impost (GST/VAT/None), WWRI % (default 30%, flagged if changed), referral % (5% inactive / 10% active, flagged if changed)
**And** all fields auto-save on change (300ms debounce)
**And** the Auto-Save Indicator shows "Saved" after each persist

### Story 3.2: Phase Management

As an IE,
I want to define up to 4 project phases with dates and durations,
So that I can structure the engagement timeline.

**Acceptance Criteria:**

**Given** an IE on the costing sheet
**When** they navigate to phase configuration
**Then** they can define up to 4 phases, each with: name, active toggle, start date, duration in weeks
**And** end date auto-calculates from start date + weeks
**And** only active phases contribute to project totals
**And** phase changes auto-save and calculations update instantly
**And** flexible date input supports ISO, DD/MM/YYYY, and natural formats (matching prototype behaviour)

### Story 3.3: Expert Management & Allocation

As an IE,
I want to add experts and allocate their days per phase,
So that I can cost the professional fees for the engagement.

**Acceptance Criteria:**

**Given** an IE on the costing sheet
**When** they manage experts
**Then** they can add, remove, and edit experts (name, role, daily fee) with minimum 1 expert required
**And** for each active phase, they can set a default days-per-week and override individual weeks
**And** per-phase fee overrides are supported (actualFee overrides global dailyFee)
**And** changes auto-save and phase/project totals recalculate instantly
**And** the expert allocation grid preserves scroll position during re-renders (matching prototype UX)

### Story 3.4: Service Management & Allocation

As an IE,
I want to add services and allocate them per phase,
So that I can include service costs in the engagement estimate.

**Acceptance Criteria:**

**Given** an IE on the costing sheet
**When** they manage services
**Then** they can add, remove, and edit services (name, weekly fee) with minimum 1 service required
**And** for each active phase, they can toggle services active/inactive per week
**And** changes auto-save and totals recalculate instantly

### Story 3.5: Calculation Engine & Real-Time Totals

As an IE,
I want to see all financial calculations update instantly as I change inputs,
So that I can calibrate the costing through iterative micro-adjustments.

**Acceptance Criteria:**

**Given** an IE editing any field in the costing sheet
**When** a value changes
**Then** the client-side calculation engine recalculates all derived values with zero perceptible delay
**And** WWRI contribution calculates as markup: `fee / (1 - wwriPct) * wwriPct`
**And** referral fee calculates as: projectSubtotal * referralPct (0 if no referral partner)
**And** phase totals show: professional fees, service fees, WWRI amount, referral fee, client charge
**And** project totals aggregate across all active phases
**And** the Costing Summary Panel shows running totals (sticky or collapsible)
**And** calculations match the prototype engine output exactly

### Story 3.6: Summary Views

As an IE,
I want to see a clear summary of the costing across all dimensions,
So that I can verify the engagement cost structure before submitting for review.

**Acceptance Criteria:**

**Given** a costing sheet with phases, experts, and services configured
**When** the IE views the summary
**Then** they see: charges by phase, days by expert, income by expert, and WWRI share by phase
**And** all monetary values display in monospace font with currency symbol
**And** the summary updates in real-time as costing inputs change

### Story 3.7: Timeline, Export & Import

As an IE,
I want to add timeline milestones, and export/import costings as JSON,
So that I can visualise the project timeline and back up my work.

**Acceptance Criteria:**

**Given** an IE on the costing sheet
**When** they use timeline features
**Then** they can add milestone markers and activity spans to each phase
**And** they can export the complete costing sheet to a JSON file
**And** they can import a costing sheet from a JSON file
**And** imported data validates and loads correctly

## Epic 4: Review Workflow & Notifications

IEs can submit costings for review. Reviewers receive Teams notifications, can view costings, approve or request changes. Board-approval thresholds are enforced. Full audit trail.

### Story 4.1: Submit Costing for Review

As an IE,
I want to submit my costing sheet for review,
So that a senior reviewer can validate and approve it.

**Acceptance Criteria:**

**Given** an IE with a completed costing sheet
**When** they click "Send for Review" and select a reviewer from the approved list
**Then** the costing's review status changes to "Submitted"
**And** a Review record is created with the assigned reviewer
**And** non-standard WWRI % or referral % values are flagged as requiring Board approval
**And** the IE sees inline confirmation: "[Reviewer name] has been notified"
**And** the costing becomes read-only for the IE while in review

### Story 4.2: Teams Notification for Reviewers

As a reviewer,
I want to receive a Teams notification when a costing is submitted for my review,
So that I know immediately when action is needed.

**Acceptance Criteria:**

**Given** a costing has been submitted for review
**When** the submission is processed
**Then** a Teams chat message is sent to the assigned reviewer via Graph API
**And** the message includes: IE name, client name, opportunity reference, and a deep link to the review page
**And** if Teams notification fails, the submission still succeeds and the notification is queued for retry
**And** the retry queue processes failed notifications every 60 seconds, max 5 attempts

### Story 4.3: Reviewer Costing View & Decision

As a reviewer,
I want to view a submitted costing and approve or request changes,
So that I can validate the engagement cost structure.

**Acceptance Criteria:**

**Given** a reviewer clicks the deep link from Teams (or navigates to their review dashboard)
**When** the review page loads
**Then** the full costing sheet is displayed in read-only mode with all calculations visible
**And** non-standard values (WWRI %, referral %) are highlighted with Board-approval flag
**And** the reviewer can click "Approve" or "Request Changes"
**And** "Request Changes" requires a comment explaining what needs to change
**And** the decision is recorded in the Review table with reviewer, status, comments, and timestamp
**And** an AuditLog entry is created for the review action

### Story 4.4: Review Status Tracking & IE Notification

As an IE,
I want to be notified when my costing is approved or has changes requested,
So that I can proceed or make corrections.

**Acceptance Criteria:**

**Given** a reviewer has made a decision on a costing
**When** the decision is recorded
**Then** the IE receives a Teams notification with the decision and reviewer comments (if any)
**And** the costing's review status updates to "Approved" or "Changes Requested"
**And** if "Changes Requested", the costing becomes editable again for the IE
**And** the Review Status Badge on the Opportunity Card updates to reflect the current state
**And** real-time SSE pushes the status update to the IE's browser if they're online

### Story 4.5: Reviewer Dashboard

As a reviewer,
I want to see all costings pending my review in one place,
So that I don't miss any review requests.

**Acceptance Criteria:**

**Given** an authenticated reviewer
**When** they navigate to the reviews page
**Then** all costings assigned to them are listed with: client name, IE name, submission date, review status
**And** items are sorted by submission date (oldest first)
**And** new submissions appear in real-time via SSE without page refresh
**And** the count of pending items is visible in the nav bar

## Epic 5: SharePoint Document Management

The app automatically files costing documents to SharePoint, organises folders by client/opportunity, and IEs can access documents through the app. Admin can configure the SharePoint schema.

### Story 5.1: SharePoint Service & Folder Structure

As a system,
I want to automatically create and manage SharePoint folders for each opportunity,
So that BD documents are organised consistently without IE effort.

**Acceptance Criteria:**

**Given** a new opportunity is created
**When** the opportunity record is saved
**Then** a SharePoint folder is created at `/M Suite/{ClientName}/{OpportunityName}/Costings/`
**And** the SharePointService uses Graph API with delegated permissions (on-behalf-of flow)
**And** if SharePoint is unavailable, the folder creation is queued for retry
**And** the integration queue retries every 60 seconds, max 5 attempts

### Story 5.2: Automatic Document Filing

As an IE,
I want my costing documents to file automatically to SharePoint,
So that I never have to manually manage BD document folders.

**Acceptance Criteria:**

**Given** an IE saves or submits a costing sheet
**When** the save is persisted
**Then** the costing document is filed to the correct SharePoint location (`/M Suite/{Client}/{Opportunity}/Costings/`)
**And** the filing happens asynchronously — the IE is never blocked waiting for SharePoint
**And** if filing fails, it is queued for retry without user notification
**And** the IE can access filed documents through the app via a "Documents" link on the opportunity page

### Story 5.3: SharePoint Configuration

As an admin,
I want to configure the SharePoint site and folder schema,
So that I can control where documents are stored.

**Acceptance Criteria:**

**Given** an authenticated admin on the settings page
**When** they configure SharePoint settings
**Then** they can set the root SharePoint site URL
**And** the folder schema is applied to all new opportunities
**And** existing opportunity folders are not affected by schema changes

## Epic 6: Administration & System Configuration

Admin can manage the reviewer list, set system-wide defaults (WWRI %, referral rates), configure Board-approval thresholds, and enforce governance rules.

### Story 6.1: Reviewer Management

As an admin,
I want to manage the list of approved reviewers,
So that IEs can only select from authorised reviewers when submitting costings.

**Acceptance Criteria:**

**Given** an authenticated admin on the reviewer management page
**When** they manage reviewers
**Then** they can add new reviewers (selecting from existing users with Reviewer role)
**And** they can remove reviewers from the approved list
**And** the reviewer dropdown in the costing sheet reflects the current approved list
**And** removing a reviewer does not affect existing review assignments

### Story 6.2: System Defaults & Board-Approval Thresholds

As an admin,
I want to set system-wide default values and Board-approval thresholds,
So that costings use consistent parameters and governance rules are enforced.

**Acceptance Criteria:**

**Given** an authenticated admin on the settings page
**When** they configure system defaults
**Then** they can set: default WWRI % (currently 30%), default referral rates (5% inactive, 10% active)
**And** they can configure which WWRI % and referral % values trigger Board-approval flagging
**And** these defaults apply to all new costings
**And** costings with values outside the approved range are flagged with an amber Board-approval indicator
**And** flagged costings cannot be finalised without reviewer acknowledgement of the non-standard values

## Epic 7: Extensibility & Integration Foundation

Architecture supports adding new stage modules, new data fields, and future integrations (HubSpot) without restructuring. SSE real-time endpoint, integration abstraction layer, retry queue.

### Story 7.1: SSE Real-Time Endpoint & Integration Layer

As a developer,
I want a real-time event endpoint and an abstracted integration layer,
So that future modules and integrations can be added without restructuring.

**Acceptance Criteria:**

**Given** the application architecture
**When** a new module or integration is needed
**Then** the `/api/events` SSE Route Handler broadcasts events (review status changes, submissions, stage progressions) to connected clients
**And** the integration service layer (`services/`) provides a consistent pattern for external API calls with retry queue
**And** adding a new integration (e.g., HubSpot) requires only a new service file, not changes to existing code
**And** adding a new M-stage module requires only a new route folder under `app/opportunity/[id]/`, not changes to the app structure
**And** the IntegrationQueue table supports any integration type via an `integrationType` field
