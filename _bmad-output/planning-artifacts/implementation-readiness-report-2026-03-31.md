---
stepsCompleted: ['step-01-document-discovery', 'step-02-prd-analysis', 'step-03-epic-coverage-validation']
documentsAssessed:
  prd: prd-m-suite.md
  architecture: null
  epics: null
  ux: null
---

# Implementation Readiness Assessment Report

**Date:** 2026-03-31
**Project:** M Suite

## Document Inventory

| Document | File | Status |
|----------|------|--------|
| PRD | prd-m-suite.md | Complete |
| Architecture | — | Not yet created |
| Epics & Stories | — | Not yet created |
| UX Design | — | Not yet created |

**Assessment scope:** PRD readiness for downstream work (architecture, UX, epic breakdown).

## PRD Analysis

### Functional Requirements

56 FRs extracted across 8 capability areas:

**Authentication & Access Control (FR1-FR6):** M365 SSO login, role-based access (IE/Reviewer/Admin), IE data isolation, reviewer assignment visibility, admin network-wide access, role assignment.

**Opportunity Management (FR7-FR12):** Create opportunity, view opportunity list with M stage, progress through stages, mark "do not pursue", system records all state changes with timestamps, admin network-wide view.

**M+ Process Guidance (FR13-FR17):** Stage pages display SOP guidance combining .0 and .5 sub-stages, advisory self-check decision points at M0/M1/M2, record self-check decisions with notes, process guidance for stages without tooling, admin can update SOP content.

**Costing Sheet Module M2.5 (FR18-FR36):** Create costing linked to opportunity, project metadata, people assignment, financial parameters, up to 4 phases, expert management (min 1), service management (min 1), per-week day allocation with overrides, service weekly allocation, WWRI markup calculation (`fee / (1 - wwriPct) * wwriPct`), referral fee calculation (10%/5%), real-time phase totals, real-time project totals, summary views, per-phase fee override, auto-save, JSON export/import, timeline milestones and spans.

**Review Workflow (FR37-FR45):** Submit for review with reviewer selection, Teams notification to reviewer, reviewer views full costing, approve, request changes with comments, IE notified via Teams, status tracking (draft/submitted/in review/changes requested/approved), Board-approval flagging, reviewer pending items view.

**SharePoint Document Management (FR46-FR49):** Auto-file to correct SharePoint location, organise folders by opportunity/client, IE accesses documents through app, admin configures SharePoint schema.

**Administration (FR50-FR53):** Manage reviewer list, set system defaults (WWRI %, referral rates, thresholds), configure Board-approval triggers, enforce Board-approval flagging.

**Extensibility (FR54-FR56):** Add new stage modules without restructuring, add new data fields without restructuring, future integration points via abstracted layer.

### Non-Functional Requirements

**Performance (5):** Page load <2s, instant client-side costing calculations, auto-save <1s async, real-time propagation <3s, 20 concurrent users (50+ headroom).

**Security (6):** Encryption in transit and at rest, M365 SSO only, API-level RBAC enforcement, commercially sensitive data access restrictions, M365 token session management, audit trail for review actions.

**Usability (6):** "Could Marc use it?" standard for 50-60+ non-digital executives, max 3 clicks to any feature, auto-save everywhere, plain language errors, consistent M-stage navigation, undo for destructive actions.

**Reliability (3):** 99.5% uptime during AU/EU business hours, graceful API outage handling with retry queues, no data loss on browser close/crash/network interruption.

**Integration (4):** Microsoft Graph API (SSO, Teams, SharePoint), SharePoint auto-filing with configurable schema, graceful integration failure handling, abstracted integration layer for future HubSpot.

### Additional Requirements

- **Business rule:** WWRI contribution is a markup formula — `fee / (1 - wwriPct) * wwriPct` — not a deduction. At 30%: $700 fee → $300 WWRI → $1000 client charge.
- **Business rule:** Referral fee 5% (inactive) or 10% (active), applied to project subtotal. Variations require Board approval.
- **Design constraint:** WWRI visual language — teal #009898 primary, #F5F4F0 background, system font stack, monospace for numbers.
- **UX constraint:** Primary users are 50-60+ former C-suite executives, many digitally non-literate. Defines all interaction design decisions.
- **Architecture constraint:** Costing calculation engine must run client-side for instant micro-adjustment feedback, with async backend persistence.
- **Integration constraint:** Integration layer must be abstracted to support future HubSpot API addition without restructuring.

### PRD Completeness Assessment

| Criterion | Status | Notes |
|-----------|--------|-------|
| Vision and problem statement | Complete | Clear bottleneck narrative, methodology-as-software insight |
| Success criteria (measurable) | Complete | Specific targets: 15/20 adoption, 10+ costing, 48hr review |
| User journeys | Complete | 4 journeys covering IE, Reviewer, Admin, edge case |
| Functional requirements | Complete | 56 FRs across 8 capability areas, traceable to journeys |
| Non-functional requirements | Complete | 24 NFRs across 5 categories, measurable |
| MVP scope definition | Complete | Clear in/out boundaries, HubSpot explicitly deferred |
| Phased roadmap | Complete | Phase 1 (MVP), Phase 2 (Growth), Phase 3 (Expansion) |
| Risk mitigation | Complete | Technical, adoption, and resource risks with mitigations |
| Traceability chain | Strong | Vision → Success Criteria → Journeys → FRs verified |

## Epic Coverage Validation

**Status: NOT APPLICABLE** — Epics document does not yet exist for the M Suite. This is expected; the PRD was just completed. Epic breakdown is a recommended next step.

- Total PRD FRs: 56
- FRs covered in epics: 0
- Coverage percentage: 0% (epics not yet created)

## UX Alignment

**Status: NOT APPLICABLE** — UX Design document does not yet exist for the M Suite. This is expected at this stage.

## Overall Readiness Assessment

### PRD Readiness: READY FOR DOWNSTREAM WORK

The M Suite PRD is complete and sufficient to begin architecture, UX design, and epic breakdown. All required sections are present, requirements are traceable, and scope is well-defined.

### Gaps Identified

| Gap | Severity | Action Required |
|-----|----------|----------------|
| No Architecture document | Expected | Create architecture — first priority. Data persistence decision (TBD in PRD) must be resolved here. |
| No UX Design document | Expected | Create UX design — informed by "Could Marc use it?" constraint and design system. |
| No Epics & Stories | Expected | Create epics and stories — after architecture is defined. |
| Data persistence TBD | Medium | Architecture must resolve: SharePoint lists vs Azure database. Impacts real-time, multi-user, and role-based access patterns. |
| SharePoint folder schema undefined | Low | Define during architecture. Admin-configurable per FR49, but needs a default schema. |
| SOP content not authored | Medium | The M+ Process SOP guidance text for each stage (FR13, FR16) must be authored as content, separate from code. Source: Miro board screenshots captured during product brief. |
| Quote & Invoicing remains stubbed | Low | Explicitly deferred. No action needed for MVP. |

### Recommended Next Steps (in order)

1. **Create Architecture** — resolve data persistence, define SharePoint integration approach, specify real-time strategy, design integration abstraction layer
2. **Create UX Design** — apply "Could Marc use it?" constraint to wireframes, design the MPA page structure (M0-M5), define costing sheet interaction patterns
3. **Create Epics and Stories** — break 56 FRs into implementable work, map to architecture decisions
4. **Author SOP Content** — write the M+ Process guidance text for each stage page from the Miro board source material
5. **Re-run Implementation Readiness Check** — validate full coverage once all documents exist
