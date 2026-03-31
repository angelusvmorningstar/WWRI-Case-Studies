---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
status: complete
completedAt: '2026-03-31'
classification:
  projectType: web_app
  domain: general
  complexity: medium
  projectContext: greenfield
inputDocuments:
  - product-brief-M-Suite.md
  - product-brief-M-Suite-distillate.md
documentCounts:
  briefs: 1
  distillates: 1
  research: 0
  projectDocs: 0
workflowType: 'prd'
---

# Product Requirements Document — M Suite

**Author:** Angelus
**Date:** 2026-03-31

## Executive Summary

The M Suite is a web application that encodes Whitewater Reinventions' proprietary M+ Process — a structured business development methodology spanning prospect identification (M0) through contract sign-off (M5) — as an interactive, guided workspace for the firm's network of approximately 20 Independent Experts (IEs).

Today, the M+ Process depends on a single employee (the firm's operator) to transfer knowledge, administer costing tools, route reviews, and maintain process discipline across the network. This creates a hard ceiling on growth: the network cannot scale beyond what one person can manually support. Of 20 IEs, only 2 currently use the costing sheet — the Excel-based tool is too complex for the rest, forcing the remaining 18 to either avoid costing entirely or queue behind those two people.

The M Suite removes this bottleneck by making the methodology self-service. Each M+ stage presents its SOP guidance, purpose-built tools (starting with the costing calculator at M2.5), review workflows with Teams notifications, and advisory decision gates — all within a single branded environment. IEs log in with existing Microsoft 365 credentials and documents file automatically to SharePoint. The app does not replace HubSpot as the pipeline system of record; it is the workspace where the work of business development happens. HubSpot integration is planned for Phase 2.

The MVP delivers the complete M+ Process as a guided workspace with the costing sheet as the first deep module, followed by a pitch document builder (M1.5) and proposal/SOW generator (M3.0) in subsequent phases.

## What Makes This Special

The M Suite is not a CRM, not a proposal tool, and not a project management platform. It is a consultancy's proprietary methodology made tangible as software.

The core insight: a consulting network's ability to scale is capped by its ability to transfer methodology. When that transfer depends on one person — through mentoring, Excel templates, and manual administration — growth is linear at best. The M Suite breaks that constraint by encoding institutional knowledge into the tool itself. A new IE joining the network can follow the guided workflow from day one without dedicated mentoring.

No off-the-shelf tool occupies this space. Proposal tools (PandaDoc, Proposify) generate documents but don't orchestrate process. CRMs (HubSpot, Salesforce) track deals but don't guide the work. PSA platforms (Kantata, Accelo) manage delivery but are weak on pre-sale BD. The M Suite sits alongside these tools — specifically alongside HubSpot — filling the gap between "where is this deal?" and "what should I do next to move it forward?"

## Project Classification

- **Project Type:** Web application — multi-page application (MPA) with backend services
- **Domain:** General / internal business process tooling
- **Complexity:** Medium — standard web app patterns elevated by M365/SharePoint integrations, multi-user review workflows, and the need to faithfully encode a nuanced multi-stage BD methodology
- **Project Context:** Greenfield — new product, building from scratch. A single-file HTML prototype of the costing module exists as a reference for business rules and calculation logic, but the M Suite is a new codebase.

## Success Criteria

### User Success

- IEs who have never used the costing sheet can produce a complete, accurate costing independently on their first attempt — no training session required, no assistance from colleagues.
- IEs always know what to do next in the M+ Process — the app surfaces the relevant SOP guidance, tools, and decision points for their current stage.
- Reviewers receive Teams notifications when items need their attention and can see all pending reviews in one place.

### Business Success

- At least 15 of 20 active IEs have created or progressed an opportunity in the M Suite within 90 days of launch.
- 10+ IEs producing costings independently in the first quarter (up from 2 today).
- Angelus is no longer required for any IE activity before M4 (contract drafting).

### Technical Success

- Zero manual calculation errors in costing sheets — the calculation engine enforces correctness.
- M365 SSO authentication works seamlessly for all IEs.
- Documents file to SharePoint automatically without manual intervention.
- Review turnaround tracked; target under 48 hours for standard reviews.

### Measurable Outcomes

- **90-day adoption:** 15/20 IEs active in M Suite
- **Costing independence:** 10+ IEs producing costings (from baseline of 2)
- **Review response:** median under 48 hours
- **Process coverage:** every active opportunity has a recorded stage and decision history

## User Journeys

### Journey 1: Priya — IE Pursues a New Opportunity (Success Path)

Priya is an experienced transformation consultant who joined the WWRI network 6 months ago. She's strong at client relationships but has never built a costing sheet — she's always relied on Adam to do it. She has a promising lead at a mid-sized logistics company.

**Today (without M Suite):** Priya meets the prospect, takes notes in her own format, updates HubSpot with a new deal, saves her notes somewhere in her SharePoint folder, and messages Angelus to ask "what do I do next?" When it comes time to cost the engagement, she emails Adam with a rough description and waits 3 days for him to build the Excel. She doesn't fully understand the numbers when they come back.

**With M Suite:** Priya logs in with her M365 account and creates a new opportunity. The app shows her M0 — what to research, how to prepare for the first meeting, and the self-check: "Is this prospect transformational and interested?" She progresses through M1, and the app captures the 2-3 key challenges she identified. At M2.5, she opens the costing sheet module — guided fields walk her through project setup, phase allocation, and expert assignment. The WWRI margin and referral fees calculate automatically. She assigns Bernard as reviewer and hits submit. Bernard gets a Teams notification, reviews it, and approves within a day. The costing documents file automatically to SharePoint.

**The moment it clicks:** Priya produces her first costing in 30 minutes, the numbers are correct, and she understands every line — because the tool guided her through it instead of hiding the logic in Excel formulas.

### Journey 2: Bernard — Reviewer Reviews a Costing Sheet

Bernard Leung is one of 7 senior reviewers. He currently reviews costings informally — Adam sends him an Excel via email, he eyeballs the numbers, and replies "looks good" or calls to discuss changes. He has no visibility into what's pending or what he's already reviewed.

**Today:** Bernard gets an email from Adam with an Excel attachment. He opens it, tries to verify the margins, cross-checks the expert rates from memory, and replies with approval or a few comments. He has no idea if there are other costings waiting for his review from other IEs.

**With M Suite:** Bernard receives a Teams notification: "Priya Sharma submitted a costing for review — Meridian Logistics, M2.5." He clicks through to the M Suite, sees the costing summary with all calculations visible, checks the WWRI margin and referral fee (highlighted if non-standard), and either approves or requests changes with inline comments. His dashboard shows 2 other costings pending his review. The system flags any Board-approval triggers (e.g., non-standard WWRI % or referral rate).

**The moment it clicks:** Bernard can see everything pending his review in one place, the numbers are pre-validated by the calculation engine, and his approval is recorded with a timestamp — no more "did I already review that one?"

### Journey 3: Priya — IE Hits a Decision Gate (Edge Case)

Priya has been working an opportunity through M1. She had the first formal meeting, played back the challenges, but the prospect wasn't engaged — they were polite but non-committal about a follow-up.

**With M Suite:** At the end of M1, the app surfaces the self-check: "Is this person transformational and interested?" with guidance on what to look for (accountability for transformation, genuine engagement with the challenges). Priya selects "No — do not pursue." The app records this decision with a timestamp and the opportunity is marked as closed-lost at M1.

**Without M Suite:** Priya might keep the opportunity alive out of optimism, investing another 2-3 weeks of effort before reaching the same conclusion — or worse, never formally deciding and letting it drift.

### Journey 4: Angelus — Admin Configures and Oversees

Angelus is the sole WWRI employee. He configures the M Suite, manages reviewers, sets default rates, and at M4 receives the costing sheet and M3 presentation to draft the contract. He needs oversight of all opportunities without chasing IEs for updates.

**Today:** Angelus pieces together pipeline status from HubSpot, asks IEs for updates via email/Teams, receives costings as Excel files, and manually tracks which have been reviewed and by whom. When an IE needs the M+ Process explained, Angelus walks them through it on a call.

**With M Suite:** Angelus sees all active opportunities across the network, each at a specific M stage. He configures system defaults (WWRI % at 30%, referral rates, reviewer panel) and these apply to every new costing automatically. When an opportunity reaches M4, he receives a notification with the approved costing and M3 presentation attached, ready to draft the contract. He no longer needs to explain the M+ Process — the app does it.

**The moment it clicks:** Angelus opens the admin view on a Monday morning and sees exactly where every opportunity stands — no emails, no chasing, no calls. He drafts contracts from clean, reviewed data instead of re-checking Excel formulas.

### Journey Requirements Summary

| Journey | Key Capabilities Revealed |
|---------|--------------------------|
| Priya — success path | Opportunity creation, M+ stage progression with SOP guidance, costing sheet with guided input, reviewer assignment, Teams notification, SharePoint auto-filing |
| Bernard — reviewer | Review queue/dashboard, costing summary view, approve/request changes workflow, Board-approval flagging, audit trail with timestamps |
| Priya — decision gate | Self-check prompts at M0/M1/M2, decision recording (pursue/stop), opportunity status update on close-lost |
| Angelus — admin | Network-wide opportunity overview, system defaults configuration, reviewer management, M4 handoff notification, contract drafting from reviewed data |

## Web Application Specific Requirements

### Application Architecture

- **MPA structure:** One page per M stage (M0, M1, M2, M3, M4/M5) plus costing sheet module, admin panel, reviewer dashboard, and opportunity list/home
- **Real-time:** Live updates for costing sheet calculations (client-side engine, no server round-trip for micro-adjustments), review status changes, and submission notifications. Costing is an iterative calibration tool — IEs tweak fees, adjust days, toggle phases, and must see financial impact ripple through instantly.
- **Authentication:** Microsoft 365 SSO — no separate account creation

### Browser & Device Support

- **Browsers:** Modern evergreen browsers only (Chrome, Edge, Safari, Firefox — latest 2 versions)
- **Responsive:** Desktop-first but must be functional on tablets (IEs may use iPads in client meetings)

### Accessibility & Usability

- **WCAG 2.1 AA** as baseline standard
- **Critical UX constraint: "Could Marc use it?"** — The primary users are 50-60+ year old former C-suite executives, many of whom are not digitally literate and are accustomed to delegating technology tasks to others. This is the defining design constraint for the entire application.
- **Implications:**
  - Large, clear tap/click targets
  - Minimal cognitive load per screen — one clear action at a time
  - No jargon in the UI (no "submit payload" — say "send for review")
  - Obvious navigation — always clear where you are in the M process and what to do next
  - Forgiving input — generous validation, auto-save, no lost work
  - Progressive disclosure — show what's needed now, hide complexity until relevant
  - Clear visual hierarchy — important numbers and actions stand out immediately

### Design System

- Must use the established WWRI visual language already proven in the costing prototype and structured interview tool
- Palette: teal #009898 primary, warm off-white #F5F4F0 background, system font stack
- Monospace for all currency/numeric values (Cascadia Code, Consolas)
- Component patterns: cards, data tables, teal-accented tab bar, sticky nav, badges

### Implementation Considerations

- **M365 integration:** Graph API for SSO, Teams notifications, and SharePoint document management. Requires Azure AD app registration and tenant admin consent.
- **Data persistence:** TBD in architecture — must support real-time multi-user access, role-based visibility (IE sees own opportunities, reviewer sees assigned items, admin sees all)

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP — remove the bottleneck (Angelus), make the costing sheet accessible to all IEs, and give the M+ Process a home.

**Key insight:** For this user base, "minimum viable" has a higher UX bar than typical internal tools. A rough tool will be rejected — IEs are accustomed to delegating technology they find frustrating. The MVP must feel simple and complete within its scope, even if that scope is narrow.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Priya (IE success path): create opportunity, progress through M stages, build costing, submit for review
- Bernard (reviewer): receive notification, review costing, approve/request changes
- Angelus (admin): configure system defaults, manage reviewers, see all opportunities

**Must-Have Capabilities:**

| Capability | Rationale |
|-----------|-----------|
| Microsoft 365 SSO | Non-negotiable — IEs will not create separate accounts |
| M+ Process workspace (M0-M5) | SOP guidance for all stages, advisory decision gates, opportunity tracking. Stages without dedicated tooling show process guidance only. |
| Costing sheet module (M2.5) | Full port of prototype logic — project setup, phases, expert/service grids, calculation engine, summary. Real-time client-side calculations with async backend persistence. Auto-save on every field change. |
| Review workflow | Assign reviewer, Teams notification on submission, approve/request changes, status tracking, Board-approval flagging for non-standard terms |
| SharePoint document management | App controls SharePoint filing — documents are organised automatically. IEs never manually file BD documents. |
| Admin panel | Reviewer list management, WWRI % default, referral rate defaults, Board-approval thresholds |
| Role-based access | IE sees own opportunities, reviewer sees assigned items, admin sees all |
| Opportunity list / home page | All of an IE's opportunities with current stage, or all network opportunities for admin |

**Explicitly NOT in MVP:**
- HubSpot integration (deferred — future development cycle)
- Pitch document builder (Phase 2)
- Proposal/SOW generator (Phase 3)
- Content reuse across IEs (Phase 2+)
- Quote & Invoicing completion (the costing prototype stubs this — keep it stubbed for MVP)

### Post-MVP Features

**Phase 2 (Growth):**
- Pitch document builder (M1.5): branded document generation, template library, QC review workflow
- HubSpot integration: deal stage sync, task creation, bidirectional updates
- Content reuse: start from a previous costing, share templates across IEs
- Quote & Invoicing: complete the stubbed section with invoice scheduling and split configuration

**Phase 3 (Expansion):**
- Proposal/SOW generator (M3.0): Word document generation, linked to costing data, contract-ready output
- Programme type and company revenue inputs for smarter costing estimates
- Opportunity analytics: win/loss by stage, conversion patterns, deal size analysis
- Enhanced admin dashboards for network-wide BD visibility

### Risk Mitigation Strategy

**Technical Risks:**
- *SharePoint API complexity:* Highest-risk technical component. Mitigate by defining the folder schema early and building a thin abstraction layer so filing logic can be adjusted without rewriting the app.
- *Real-time costing calculations:* The calculation engine must run client-side for instantaneous feedback on micro-adjustments, with async persistence to the backend. Any architecture requiring a server round-trip per field change will be rejected by users.
- *Data persistence architecture:* TBD. First architecture decision to resolve — impacts every other technical choice.

**Adoption Risks:**
- *"Could Marc use it?" bar:* Highest risk is building something developers find intuitive but Marc finds confusing. Mitigate with early prototype testing with 2-3 IEs (including at least one who struggles with current Excel tools).
- *Habit change:* IEs have existing workflows. Mitigate by ensuring M Suite is strictly easier, not just different — the costing sheet must be demonstrably simpler than the Excel within the first 5 minutes of use.

**Resource Risks:**
- *Single-developer dependency:* Bus factor of 1. Mitigate with clean architecture, comprehensive documentation, and standard patterns any competent developer could maintain.

## Functional Requirements

### Authentication & Access Control

- FR1: IE can log in using their existing Microsoft 365 credentials (SSO)
- FR2: System assigns role-based access: IE, Reviewer, or Admin
- FR3: IE can only view and edit their own opportunities
- FR4: Reviewer can view opportunities assigned to them for review
- FR5: Admin can view all opportunities across the network
- FR6: Admin can assign roles to users

### Opportunity Management

- FR7: IE can create a new opportunity with basic details (client name, prospect contact, description)
- FR8: IE can view a list of all their opportunities with current M stage
- FR9: IE can progress an opportunity from one M stage to the next
- FR10: IE can mark an opportunity as "do not pursue" at any decision gate
- FR11: System records the stage, decision, and timestamp for every opportunity state change
- FR12: Admin can view all active opportunities across the network with current stage and assigned IE

### M+ Process Guidance

- FR13: Each M stage page (M0, M1, M2, M3, M4/M5) displays the SOP guidance content for that stage, combining both internal (.5) and external (.0) sub-stages
- FR14: System surfaces advisory self-check decision points at M0, M1, and M2 with guidance on what to assess
- FR15: IE can record their self-check decision (pursue or stop) with optional notes
- FR16: Stages without dedicated tooling display process guidance, checklists, and expected outputs
- FR17: Admin can update SOP guidance content for any stage

### Costing Sheet Module (M2.5)

- FR18: IE can create a new costing sheet linked to an opportunity
- FR19: IE can enter project metadata (client name, legal entity, project title, short name)
- FR20: IE can assign people to a costing (project lead, project partner, reviewer, referral partner)
- FR21: IE can configure financial parameters (currency, government impost type, WWRI %, referral %)
- FR22: IE can define up to 4 project phases with name, active toggle, start date, and duration in weeks
- FR23: IE can add, remove, and edit experts (name, role, daily fee) with a minimum of 1
- FR24: IE can add, remove, and edit services (name, weekly fee) with a minimum of 1
- FR25: IE can allocate expert days per week per phase, with default and per-week override capability
- FR26: IE can allocate service weeks per phase (active/inactive per week)
- FR27: System calculates WWRI contribution as a markup: `fee / (1 - wwriPct) * wwriPct`
- FR28: System calculates referral fees based on active/inactive involvement (10% / 5%) applied to project subtotal
- FR29: System calculates phase totals (professional fees, service fees, WWRI amount, referral fee, client charge) in real-time as inputs change
- FR30: System calculates project totals across all active phases in real-time
- FR31: IE can view a summary of charges by phase, days by expert, income by expert, and WWRI share
- FR32: IE can override an expert's daily fee on a per-phase basis
- FR33: System auto-saves every field change without explicit save action
- FR34: IE can export a costing sheet to JSON for backup
- FR35: IE can import a costing sheet from JSON
- FR36: IE can add timeline milestones and activity spans to each phase

### Review Workflow

- FR37: IE can submit a completed costing sheet for review by selecting an assigned reviewer
- FR38: System sends a Microsoft Teams notification to the assigned reviewer upon submission
- FR39: Reviewer can view the full costing sheet with all calculations
- FR40: Reviewer can approve a costing sheet
- FR41: Reviewer can request changes to a costing sheet with comments
- FR42: IE is notified via Teams when a reviewer requests changes or approves
- FR43: System tracks review status (draft, submitted, in review, changes requested, approved)
- FR44: System flags costings where WWRI % or referral % deviate from defaults as requiring Board approval
- FR45: Reviewer can view all items pending their review in a single view

### SharePoint Document Management

- FR46: System automatically files costing sheet documents to the correct SharePoint location when saved
- FR47: System organises SharePoint folders by opportunity/client
- FR48: IE can access their opportunity documents through the app without navigating SharePoint directly
- FR49: Admin can configure the SharePoint site and folder schema

### Administration

- FR50: Admin can manage the reviewer list (add, remove reviewers)
- FR51: Admin can set system-wide default values (WWRI %, referral rates, Board-approval thresholds)
- FR52: Admin can configure which WWRI % and referral % values require Board approval
- FR53: System enforces that Board-approval-triggering fields are flagged and cannot be finalised without reviewer acknowledgement

### Extensibility

- FR54: System architecture supports adding new stage-specific modules (e.g., pitch document builder at M1.5, proposal generator at M3.0) without restructuring the application
- FR55: System architecture supports adding new data fields and content to any M stage without restructuring the application
- FR56: System supports future integration points (HubSpot API, additional notification channels) through a defined integration layer

## Non-Functional Requirements

### Performance

- Page load time under 2 seconds on standard broadband
- Costing sheet calculations update instantaneously on every field change (client-side engine, no server round-trip)
- Auto-save persists field changes to backend within 1 second asynchronously
- Real-time state propagation (review status, submission notifications) within 3 seconds
- System supports 20 concurrent users with no degradation (design for 50+ headroom)

### Security

- All data encrypted in transit (HTTPS/TLS) and at rest
- Authentication exclusively via Microsoft 365 SSO — no local passwords
- Role-based access control enforced at the API level, not just the UI (IE cannot access another IE's data by manipulating requests)
- Costing sheets contain commercially sensitive data (client names, fee rates, margins) — access restricted to the assigned IE, assigned reviewer, and admin
- Session management via M365 tokens with appropriate expiry and refresh
- Audit trail: all review actions (submit, approve, request changes) logged with user, timestamp, and action

### Usability

- **"Could Marc use it?" standard:** Every interaction must be usable by a digitally non-literate 50-60+ year old executive without training or documentation
- No feature requires more than 3 clicks/taps to reach from the home page
- All form inputs use auto-save — no explicit save buttons, no risk of lost work
- Error messages in plain language ("We couldn't save your changes — check your internet connection" not "HTTP 500")
- Consistent navigation: always clear which M stage the user is in and what action to take next
- Undo capability for destructive actions (e.g., removing an expert from a costing)

### Reliability

- Target 99.5% uptime during business hours (AEST/AEDT and CET, covering AU and EU IEs)
- Graceful handling of SharePoint or Teams API outages — costing sheet remains functional, document filing and notifications queue for retry
- No data loss on browser close, crash, or network interruption (auto-save ensures persistence)

### Integration

- Microsoft Graph API: SSO authentication, Teams notifications (chat or activity feed), SharePoint document CRUD
- SharePoint: automatic document filing with configurable folder schema, document retrieval within the app
- All integrations must fail gracefully — if Teams is unreachable, the review submission still succeeds and notification retries silently
- Integration layer must be abstracted to support future addition of HubSpot API without restructuring
