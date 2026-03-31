---
title: "Product Brief Distillate: M Suite"
type: llm-distillate
source: "product-brief-M-Suite.md"
created: "2026-03-31"
purpose: "Token-efficient context for downstream PRD creation"
---

# M Suite — Detail Pack for PRD

## Stage Numbering Convention

- **n.0** = external/client-facing stage
- **n.5** = internal stage
- This applies throughout: M0.0, M0.5, M1.0, M1.5, M2.0, M2.5, M3.0, M3.5, M4.0, M4.5, M5.0

## Complete M+ Process SOP (from Miro board, March 2026)

### M0 — Identifying Potential Leaders & Organisation Clients

**M0.1 Overview of M+ Process** (training/onboarding)
**M0.2 Getting ready to engage**
**M0.3 Client contact:**
- Two paths: known client (arrange informal chat) or unknown (find introduction)
- Work with Mentor to research client profile: industry, strategy, financials, structure, market, LinkedIn posting
- Identify the Transformational Leaders
- Ask: "Why do they want to hear from you?"
- Known contact → casual chat to understand challenges (high level)
- Unknown contact → establish casual contact via chat, LinkedIn, email
- **Self-check:** Is prospect transformational and interested? No → Stop/Do not pursue.

### M1 — 1st Formal Meeting (Exploring Dreams & Challenges)

- See the world through the leader's eyes
- Every client has problems — identify the deeper intractable challenges
- Be genuinely curious. Ask business-relevant questions. Listen. **Do NOT add solutions.**
- Share insights being inquisitive. Explore their dream and challenges.
- Determine if person is responsible and empowered to address challenges. Is this person accountable for the needed transformation? If not, ask for introduction to Tx leader.
- Play back the 2-3 challenges where Whitewater can add most value
- **Self-check:** Is this person transformational and interested? No → Stop.
- Yes → set up next meeting (10 days to 2 weeks)
- Request to think of possible solutions from within WW IEs: "I work with a group of experts (ex-CEOs) that have solved these problems, let me see if they are interested in sharing their experience... and arrange a follow-up discussion..."

### M2.1 INTERNAL — Option Development (Potential Solutions)

- **Problem statements:** What are their stated challenges? Apply the 5 Whys to identify the 1-3 fundamental challenges.
- **Develop options:** Using Whitewater P1-P4 processes, apply to the core problem area and explore options. Think through how these would solve the fundamental challenges.
- **Presentation QC:** Develop options and initial costings. Create 3-7 slide deck. Get QC on presentation.
- *Pitch document builder and costing sheet both originate here.*

### M2.2 — 2nd Meeting with Client to Co-create Solutions

- **Interim client contact:** Check the fundamental analysis but NOT the solutions before the meeting.
- **M2 Presentation:** Arrange a 90-min boardroom meeting with a whiteboard. Share feedback on problems/key challenges (avoid PowerPoint if possible). Restate challenges and why move to the fundamental challenge. Present options informally through their eyes, co-create on the whiteboard.
- **Packaging the solutions:** Using client's language, position solutions into their broader area of responsibility. Ask how they will take this forward, who will be involved, and how WW can help with their internal approval journey.
- **Self-check:** Is this solution ready for M3 presentation to Full Exec Team?
- Yes → determine: roles and decision-making authority (any WW meetings needed?), influencers to get support/approval, explain costing and WW gaining new savings 3-5x fees.

### M3.5 INTERNAL — Preparing for the Co-presented M3 Pitch

- **"Live through the full project"** — Visualise the entire project (P1 to P4). How will the project run for the next 9 months. Based on this knowledge, begin to write the pitch proposal.
- **Prepare the presentation:** Design in simple stages. Problem is restated clearly (to be discussed and buy-in achieved). The proposed solution. Present in a funnel: big picture down to details of what we are going to do. Keep it short: 15-20 slides. Examples of pitch decks are in the knowledge bank.
- **Rehearse with the Sponsor:** Rehearse who says what. Have the Sponsor present the key points. At the end of rehearsal, encourage the Sponsor to change the pitch, but not substance, to ensure they own the project.
- **Agree deliverables:** High-level and detailed deliverables illustrated in a Word document. These need to be designed with care to ensure Whitewater has control over its contractual obligations.

### M3.0 — 3rd Meeting: Co-present to Full Exec Team

- **Understand profiles, roles, and agendas of participants.** Any potential detractors — meet in advance and get their comments into the pitch presentation.
- **M3 Presentation:** The Sponsor to introduce and (where possible) present or clarify key points. WW is there as part of the Sponsor's team. Encourage dissent and ensure all attendees participate.
- **Closing and next steps:** Agree all modifications to be included in the final Contract. Ensure all present have added something to the final shape to encourage buy-in.

### M4.5 INTERNAL — Finalising the Contract

- **Creating the contract:** Pass the M3 Presentation to **Angelus Morningstar** to create the 1st Draft of the Contract and brief him on any changes required following the M3 meeting. Check costing sheet again to ensure all client requirements and deliverables have been included. Pass any Procurement Department queries to Bernard Leung and/or Adam Salzer to provide company information.
- **Understand the Terms & Conditions:** The terms of the contract and any alteration to payment terms require **Board Approval** to be altered. If the client requires Whitewater to use their contract format, this needs to be passed to **Kane Salzer and/or Bernard Leung** for analysis and approval. **"Whitewater NEVER provides warrantees or Guarantees to its Clients."**
- **Final QC and review:** The final contract needs to be checked for QC by one of **Bernard Leung or Adam Salzer**. Check final approval and Purchase Order (where applicable) has been received before starting work.

### M4.0 & M5.0 — Negotiation & Sign-off of Contract

- Understand profiles, roles, and agendas of participants. Any potential detractors — meet in advance and get their comments into the pitch presentation.
- The Sponsor to introduce and (where possible) present or clarify key points. WW is there as part of the Sponsor's team. Encourage dissent and ensure all attendees participate.
- **Closing:** Agree all modifications to be included in the final Contract. Ensure all present have added something to the final shape to encourage buy-in.

## Costing Sheet Prototype — Complete Analysis

### Features (from WWRI-costing.html)

**5 tabs:** Project Setup, Phase Details, Summary, Quote & Invoicing (stub), Admin

**Core user actions:**
- Create/edit project metadata (client name, legal entity, project title, short name)
- Assign people (project lead, project partner, WWRI reviewer from approved list, referral partner)
- Configure financial parameters (currency: AUD/USD/EUR/GBP/JPY/CAD/CNH/NZD/SGD; govt impost: GST/VAT/None; WWRI %; referral %)
- Define up to 4 project phases (name, active toggle, start date, weeks — end date auto-calculated)
- Add/remove experts (name, role, daily fee) — minimum 1
- Add/remove services (name, weekly fee) — minimum 1
- Per-phase: actual fee override per expert, default days/week with per-week overrides
- Per-phase: service active/inactive per week (binary)
- Per-phase: timeline milestones and activity spans
- Export/import project as JSON
- Print/Export PDF
- Admin mode: PIN-protected, manage reviewer list, change PIN

### Data Model

**localStorage keys:** `ww_costing` (project data), `ww_costing_admin` (reviewers + PIN)

**Project schema:**
- Client overview: clientName, legalEntity, projectTitle, shortName
- People: projectLead, projectPartner, reviewer, referralPartner, referralActive (bool), referralPct
- Financial: currency, govtImpost, govtImpostRate, wwriPct (default 0.30)
- Experts array: [{name, role, dailyFee}] — min 1, default 3
- Services array: [{name, weeklyFee}] — min 1, default 1
- Phases array (fixed 4): [{name, active, startDate, endDate, weeks, timeline[], experts[], services[]}]
- Invoicing (stub): invoiceSchedule, invoiceSplit, invoiceNotes
- Approval: approvedBy (exists but never rendered)

### Critical Business Rules

1. **WWRI contribution is a markup, not a deduction.** Formula: `fee / (1 - wwriPct) * wwriPct`. At 30%: $700 fee → $300 WWRI → $1000 client charge. The 30% is the client-charge share, not a deduction from fees.
2. **WWRI % default 30%. Changes require Board approval.** Field is admin-locked.
3. **Referral fee: 5% (inactive involvement) or 10% (active). Variations require Board approval.** Field is admin-locked. Referral fee applies to projectSubtotal (fees + services + WWRI), not just fees. Fee is 0 if no referral partner named.
4. **Govt impost rate is stored but NEVER applied to calculations** — gap in prototype.
5. **Only active phases contribute to totals.**
6. **Expert per-phase fee override** takes precedence over global dailyFee.
7. **Default reviewers:** Adam Salzer, Bernard Leung, Bruce Hamilton, Ian Riley, Niel Malan, Nicolette Grams, Robert Bruce
8. **Default admin PIN:** 0000

### Prototype Gaps (to address in M Suite)

- **Quote & Invoicing tab is a stub** — invoicing configuration and schedule are placeholder text only
- **Govt impost stored but never applied** — no tax calculation anywhere
- **No approval workflow** — approvedBy field exists but is never displayed or set; no status tracking (draft/submitted/approved/rejected); no timestamps; no audit trail
- **No reviewer notification** — selecting a reviewer does nothing beyond storing the name
- **No multi-project support** — one project at a time in localStorage
- **No authentication** — admin PIN in plaintext localStorage, trivially bypassed
- **No print layout** — print CSS rules exist but no print-specific content is generated
- **No data validation on import** — minimal schema checking
- **No undo/redo**
- **Single-user only** — no collaboration, real-time sync, or conflict resolution
- **No mobile layout** — desktop-only

### UI Design System (shared across WWRI tools)

**Palette:** BG #F5F4F0 (warm off-white), SUR #FFF, BRD #DDDBD6, TXT #1A1A1A, SUB #555550, MUT #888884, TEL #009898 (teal primary), AMB #C07A00, GRN #1E8C4A, RED #C0392B

**Typography:** System font stack (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto). Monospace for numbers (Cascadia Code, Consolas).

**Components:** Cards (.card), tables (.tbl), buttons (primary teal, ghost outlined, danger red), field labels (11px uppercase), badges, tab bar with teal underline, sticky nav bar with logo. The structured interview prototype uses identical palette and component patterns (ww- prefixed classes).

## HubSpot Integration Requirements

- M Suite is a **workspace**, NOT a replacement for HubSpot
- HubSpot remains the pipeline system of record
- Integration should link to HubSpot deals to track M+ stage progression
- Integration should sync with **HubSpot tasks** to keep task lists current
- No pipeline reporting in M Suite — that stays in the Admin Toolkit
- Existing Admin Toolkit imports HubSpot TSV exports manually; M Suite integration could eventually provide cleaner data flow but this is not MVP-critical

## SharePoint Context

- Existing SharePoint structure with per-IE folders (hot-desk model)
- IEs manage their own filing — inconsistent structure
- M Suite should provide a single, organised space for BD documents
- Documents/data should be saved to SharePoint automatically
- Exact SharePoint site structure and API integration approach TBD in architecture

## Technical Context

- **Auth:** Microsoft 365 SSO (all IEs have M365 accounts)
- **Users:** ~20 active IEs, growing. Plus Angelus as admin/reviewer, 7 named reviewers.
- **Notifications:** Microsoft Teams (likely via Graph API or webhooks)
- **Data persistence:** TBD — options include SharePoint lists, Azure Cosmos DB, Azure SQL. Architecture decision needed.
- **Hosting:** TBD — Azure ecosystem natural fit given M365 dependency
- **Current prototype:** Single HTML file (~1480 lines), no framework, no dependencies. Calculation engine is clean and portable.

## Key People

- **Angelus Morningstar** — WWRI operator, M Suite admin, contract drafter (M4), sole user of Admin Toolkit
- **Bernard Leung** — Reviewer, procurement, contract QC, client contract format analysis
- **Adam Salzer** — Reviewer, procurement, contract QC
- **Kane Salzer** — Client contract format analysis
- **Niel Malan** — Reviewer (also referenced as COO in Admin Toolkit finance data)
- **Bruce Hamilton, Ian Riley, Nicolette Grams, Robert Bruce** — Reviewers

## Referenced Methodologies

- **P1-P4:** WW project delivery phases, referenced in M2.1 option development and M3 pitch preparation. These define how projects are structured and visualised. Separate from M+ Process (BD) — P-process is delivery.
- **5 Whys:** Used in M2.1 for problem statement development from stated challenges to fundamental challenges.

## Rejected Ideas / Explicit Non-Scope

- **M Suite as CRM/pipeline tracker** — rejected. HubSpot does this. M Suite is the workspace.
- **Decision gates as enforced blocks** — rejected. Gates are advisory self-checks for IEs to assess opportunity cost. IEs make the call.
- **Client-facing portal** — out of scope for foreseeable future.
- **Mobile-native app** — responsive web sufficient.
- **Pipeline dashboards/reporting in M Suite** — stays in Admin Toolkit.
- **P Suite modules** — separate product entirely.

## Open Questions for PRD/Architecture

1. **Data persistence architecture** — SharePoint lists vs. proper database (Azure). Impacts everything: multi-user access, review workflows, reporting, performance.
2. **HubSpot integration depth** — API-level bidirectional sync, or lighter-touch (links + manual stage updates)?
3. **SharePoint folder structure** — what's the target schema for BD document organisation?
4. **Offline requirements** — consultants travel. Does the app need to work offline?
5. **Existing opportunity migration** — how do in-flight deals get into M Suite?
6. **Process change governance** — how are M+ SOP updates reflected in the app?
7. **IE input validation** — brief built primarily from Angelus's perspective. Recommend pulse-checking 2-3 IEs on pain points and priorities.
8. **Board-approval thresholds** — what specifically triggers Board vs. standard reviewer approval beyond WWRI % and referral % changes?
9. **Quote & Invoicing** — the prototype stubs this. What's the actual invoicing workflow? Is this M Suite scope or does it belong elsewhere?
10. **P1-P4 methodology content** — referenced in M2.1 and M3. Does this need to be accessible within M Suite, or is it assumed knowledge?

## Market Context (Summary)

- No off-the-shelf tool combines SOP-guided BD workflows + document generation + consulting-specific costing
- Closest alternatives: PandaDoc/Proposify (documents, no process), HubSpot/Salesforce (tracking, no guidance), Kantata/Accelo (delivery, weak BD)
- At 20 users with domain-specific methodology, custom build avoids: licence creep, integration tax, feature bloat, workaround complexity
- Trend: shift from CRM-centric to process-centric BD in consulting; M Suite directly fills this emerging gap
- Microsoft ecosystem deepening (Copilot, Loop, Graph API) favours tools built to work with M365
