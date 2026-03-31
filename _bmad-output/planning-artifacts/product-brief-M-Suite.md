---
title: "Product Brief: M Suite"
status: "complete"
created: "2026-03-31"
updated: "2026-03-31"
inputs:
  - "Miro board: M+ Process Overview (9 screens)"
  - "reference/WWRI-costing.html (costing sheet prototype)"
  - "reference/structured-interview.html (P Suite reference, shared design system)"
  - "Stakeholder conversations with Angelus Morningstar"
  - "Market landscape research (March 2026)"
---

# Product Brief: M Suite

## Executive Summary

Whitewater Reinventions (WWRI) has a proprietary business development methodology — the M+ Process — that its network of Independent Experts (IEs) follow to win transformation engagements. Today, that methodology lives in Miro boards, Excel spreadsheets, PowerPoint decks, and the heads of experienced practitioners. The M Suite turns the methodology into software.

The M Suite is a web application that encodes the entire M+ Process (M0 through M5) as an interactive, guided workspace. It is not a CRM or pipeline tracker — HubSpot remains the system of record for pipeline management. The M Suite is where IEs do the *work* of business development: researching prospects, building options, costing engagements, preparing pitches, and progressing through review gates. The app handles the administrative burden so IEs can focus on the consulting relationship.

Currently, only 2 of approximately 20 IEs use the costing sheet at all — the Excel tool is too complex for the rest. A friendly, guided costing module alone would be transformative. Combined with the full M+ Process encoded as stage-by-stage SOP guidance, the M Suite gives every IE — including new joiners — immediate access to institutional knowledge that currently takes weeks of mentoring to transfer.

Built on the Microsoft 365 ecosystem the network already uses, with HubSpot integration for task and stage tracking, the M Suite starts with the costing sheet and grows iteratively as stage-specific modules are developed.

## The Problem

WWRI's IEs are experienced transformation consultants, not administrators. Yet the M+ Process requires significant administrative discipline: client research must be documented, options must be costed accurately, pitch decks must follow brand standards, costings must be reviewed by senior partners, contracts must pass through legal QC, and documents must be filed correctly in SharePoint.

Today this is managed through:

- **An Excel costing sheet that only 2 people can use.** Business rules (WWRI margin calculations, referral fees, Board-approval thresholds) are buried in formulas. The other 18+ IEs either avoid costing entirely or rely on those two people, creating a bottleneck.
- **PowerPoint decks** built from scratch each time, with inconsistent branding and no quality gate.
- **Manual notification** — IEs email or message reviewers when a costing sheet needs sign-off, with no tracking of review status.
- **Tribal knowledge** — the M+ Process SOP exists as a Miro board and in mentor conversations, but is not embedded in the tools IEs actually use day-to-day.
- **Scattered SharePoint folders** — a hot-desk model where individuals manage their own filing, with no consistent structure for BD documents.
- **No connection between workspace and pipeline** — IEs do BD work in Excel/PowerPoint, then separately update HubSpot. Duplication and drift are inevitable.

The result: administrative friction slows deal progression, quality varies across the network, and scaling beyond 20 IEs will amplify these problems.

## The Solution

The M Suite presents the M+ Process as a stage-by-stage guided workspace. Each opportunity an IE pursues moves through the stages, with the app providing:

- **The methodology as the interface** — every stage (M0 through M5) presents SOP guidance: what to do, how to do it, what the outputs are, and what happens next. On day one, all stages have value as a process guide, even before dedicated tooling is built for each stage.
- **Purpose-built tools per stage** — starting with a costing calculator (M2.5), then a pitch document builder (M1.5), a proposal/SOW generator (M3.0), and more as needs emerge.
- **Review workflows** — when a costing sheet is complete, the assigned reviewer is notified via Microsoft Teams. Review status is tracked. Board-approval requirements for non-standard terms are flagged by the system.
- **Self-check decision points** — the reflection moments at M0, M1, and M2 are surfaced in the workflow, prompting IEs to assess whether the opportunity is worth the investment of their time. These are advisory, not blocking — IEs make the call, but the app ensures the question is asked and the decision recorded.
- **HubSpot integration** — M Suite links to HubSpot to track M+ stage progression and sync with HubSpot tasks, keeping pipeline data current without manual double-entry.
- **SharePoint integration** — documents are filed automatically in the correct location, replacing the manual hot-desk model.
- **Microsoft 365 SSO** — IEs log in with their existing accounts, no new credentials.

## What Makes This Different

The M Suite encodes WWRI's proprietary methodology as software. This is the core differentiator and the reason to build custom rather than buy off-the-shelf.

No existing tool combines SOP-guided BD workflows with integrated document generation and consulting-specific costing. The market is split between:

- **Proposal tools** (PandaDoc, Proposify) — good at documents, no process orchestration.
- **CRM pipelines** (HubSpot, Salesforce) — good at tracking deals, no stage-by-stage guidance on how to *do* the work.
- **PSA platforms** (Kantata, Accelo) — good at delivery, weak at pre-sale BD.

The M Suite sits alongside HubSpot, not in competition with it. HubSpot tracks where deals are; M Suite is where the work happens to move them forward.

For a network of 20 independent contractors with a domain-specific process, custom-built is the right call — no licence overhead, no integration tax, no feature bloat, and the methodology itself becomes a product asset rather than a training exercise.

## Who This Serves

**Primary: Independent Experts (IEs)** — Senior transformation consultants operating as independent contractors within the WWRI network. They are domain experts, not technologists. Most have never used the costing sheet because the Excel version is too complex. They need a tool that makes the M+ Process easy to follow, handles the admin, and lets them focus on client relationships. The "aha moment" is when the costing sheet calculates everything correctly on the first try, and the reviewer is notified automatically.

**Secondary: WWRI Leadership (Reviewers)** — A fixed panel (Bernard Leung, Adam Salzer, Bruce Hamilton, Ian Riley, Niel Malan, Nicolette Grams, Robert Bruce) who review costings, QC contracts, and approve deviations from standard terms. They need visibility into what's pending their review and the ability to approve or request changes via Teams.

**Tertiary: Angelus Morningstar (Admin/Operator)** — Manages the network, drafts contracts at M4, configures system defaults (WWRI %, referral rates, reviewer lists), and has oversight of all opportunities in flight.

## Success Criteria

- **Adoption**: At least 15 of 20 active IEs have created or progressed an opportunity in the M Suite within 90 days of launch.
- **Costing accessibility**: IEs who previously could not use the costing sheet are now producing costings independently (target: 10+ IEs in first quarter).
- **Costing accuracy**: Zero manual calculation errors in costing sheets (enforced by the calculation engine).
- **Review turnaround**: Reviewer notification-to-response time is tracked; target under 48 hours for standard reviews.
- **Process visibility**: Every opportunity has a recorded stage and decision history, visible to leadership without chasing IEs for updates.
- **Scalability signal**: Onboarding a new IE to the M+ Process is supported by the app — they can follow the guided workflow without dedicated mentoring.

## Scope

**MVP (Phase 1): The M+ Workspace with Costing Module**

- Microsoft 365 SSO authentication
- **Complete M+ Process workspace**: all stages (M0 through M5) with SOP guidance content, self-check decision points, and opportunity tracking. Every stage is usable as a process guide from day one.
- **Costing sheet module (M2.5)**: Full port of the prototype — project setup, phase allocation, expert/service grids, calculation engine, summary, quote/invoicing. With review workflow (assign reviewer, Teams notification, status tracking).
- HubSpot integration for M+ stage tracking and task sync
- SharePoint integration for document storage
- Admin controls (reviewer management, system defaults, Board-approval thresholds)

**Phase 2: Pitch Document Builder (M1.5)**

- Branded document generation replacing PowerPoint
- Template library (3-7 slide options deck format, based on knowledge bank examples)
- QC review workflow

**Phase 3: Proposal/SOW Generator (M3.0)**

- Deliverables document generation (Word format)
- Links to costing sheet data
- Contract-ready output for M4

**Future / Out of Scope for Now:**

- Client-facing portal or self-service
- Mobile-native app (responsive web is sufficient)
- P Suite modules (separate product)
- Pipeline reporting/dashboards (remains in the Admin Toolkit)

## Vision

If the M Suite succeeds, it becomes the workspace that defines how WWRI's network does business development. The M+ Process stops being something you learn from a mentor and becomes something the tool teaches you as you go. Every IE — from the most experienced to the newest joiner — works within a single guided environment that encodes 20 years of consulting methodology.

As the network grows beyond 20 IEs, the M Suite scales without adding administrative overhead. New consultants are productive faster, quality is consistent across the network, and leadership has real-time visibility into BD activity through HubSpot integration — without chasing people for updates.

Over time, the accumulated data — which stages lose opportunities, which approaches win, which IEs convert at which deal sizes — becomes a strategic asset for refining the M+ Process itself.
