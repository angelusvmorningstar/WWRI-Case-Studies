---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
lastStep: 14
status: 'complete'
completedAt: '2026-03-31'
inputDocuments:
  - product-brief-M-Suite.md
  - product-brief-M-Suite-distillate.md
  - prd-m-suite.md
project_name: 'M Suite'
user_name: 'Angelus'
date: '2026-03-31'
---

# UX Design Specification — M Suite

**Author:** Angelus
**Date:** 2026-03-31

---

## Executive Summary

### Project Vision

The M Suite is a guided BD workspace that encodes the WW M+ Process as software. The UX must make a complex, multi-stage methodology feel effortless for digitally non-literate senior executives — the app should feel like a knowledgeable colleague walking alongside them, not a software system demanding their compliance.

### Target Users

**Independent Experts (IEs)** — Primary users. 50-60+ year old former C-suite executives, many digitally non-literate. Accustomed to delegating technology to others. Will reject anything that feels complex, confusing, or "techy." The benchmark: "Could Marc use it?" — Marc being the least digitally literate consultant in the network. ~20 users, growing.

**Reviewers** — 7 senior partners (Bernard Leung, Adam Salzer, Bruce Hamilton, Ian Riley, Niel Malan, Nicolette Grams, Robert Bruce). Need to quickly see what's pending, review costings with pre-validated numbers, and approve or request changes. Time investment per review should be minimal.

**Admin (Angelus Morningstar)** — Sole WWRI employee. Configures system defaults (WWRI %, referral rates, Board-approval thresholds), manages reviewers, and oversees all opportunities across the network. Power user who needs network-wide visibility.

### Key Design Challenges

1. **The Marc Test.** Every screen must be usable by someone who typically hands off technology to others. This rules out complex forms, nested navigation, and multi-step wizards without clear progress. The costing sheet — a grid of interdependent calculations — is inherently complex; making it feel simple is the hardest UX problem in the product.

2. **Information density vs. cognitive load.** The costing sheet has 4 phases, multiple experts, services, weekly allocations, and financial rollups. IEs need instant feedback on changes but cannot be overwhelmed by a wall of data. Progressive disclosure is critical — show what's needed now, hide complexity until relevant.

3. **Process guidance without patronising.** Users are former CEOs. SOP guidance must feel like a helpful companion, not a training module. Tone must be peer-to-peer, not instructional.

4. **Two distinct interaction patterns.** SOP guidance pages (M0, M1, M3, M4/M5) are read-and-act content. The costing sheet (M2.5) is an intensive data-entry and calibration tool with real-time calculations. The UX must handle both gracefully within one design system.

### Design Opportunities

1. **The M Process as visual navigation.** A persistent M0→M5 progress indicator serves as both navigation and motivation — IEs always know where they are and what's next. Replaces the Miro board as the process "map."

2. **Costing sheet as guided builder, not spreadsheet.** Instead of showing the full grid upfront (like Excel), walk new IEs through setup step-by-step (project → phases → experts → allocation) with the summary building progressively. Experienced users can access the full grid directly.

3. **Review as lightweight conversation.** The review flow should feel like a quick dialogue, not a formal approval form. Low friction for busy senior partners.

## Core User Experience

### Defining Experience

The M Suite has two core interaction modes:

1. **Process navigation** (frequent, lightweight): IE opens the app, sees their opportunities, picks one, reads the guidance for their current stage, does the work, progresses to the next stage. This should feel like flipping through a well-organised notebook — low effort, always oriented.

2. **Costing calibration** (intensive, periodic): IE opens the costing sheet for an opportunity, sets up the project structure, then iteratively tweaks fees, days, and phases while watching the financial summary update in real-time. This should feel like adjusting dials on a mixing board — immediate feedback, no friction between thought and result.

### Platform Strategy

- **Intranet web application** — not public-facing, hosted internally
- **SSO is transparent** — no login screen. The app recognises the user on arrival via M365 SSO. "Welcome, Priya" from the first moment.
- **Desktop-first, tablet-functional** — primary use at a desk, but must work on iPad for client meeting contexts
- **Modern browsers only** — Chrome, Edge, Safari, Firefox (latest 2 versions)
- **No offline requirement** — intranet assumption means connectivity is available

### Effortless Interactions

These things should happen automatically, without user thought or action:

- **Auto-save** — every field change persists silently. No save button anywhere in the app.
- **SharePoint filing** — documents file to the correct location without the IE knowing or caring about folder structures.
- **Reviewer notification** — submitting for review sends a Teams message. The IE doesn't compose or send anything.
- **Calculation updates** — every number in the costing sheet recalculates instantly as inputs change. No "refresh" or "recalculate" action.
- **Stage tracking** — the app knows what stage each opportunity is at. The IE never has to manually update status.
- **User recognition** — the app knows who you are, what role you have, and what you're allowed to see. No role selection, no profile setup.

### Critical Success Moments

1. **First visit:** A new IE arrives and immediately understands what this app is for and what to do. The M process is visible, "Start new opportunity" is obvious, and nothing is confusing. Success = they don't need to ask anyone how to use it.

2. **First costing:** An IE who has never built a costing sheet opens the module and produces a complete, correct costing on the first attempt. Success = they understand every number, and the reviewer approves without changes.

3. **First review notification:** A reviewer gets a Teams message, clicks through, sees the costing summary, and approves in under 2 minutes. Success = the entire review loop closes without email, phone calls, or confusion.

4. **Monday morning overview:** Angelus opens the admin view and sees every opportunity across the network at a glance. Success = he doesn't need to message a single IE for an update.

### Experience Principles

1. **One clear action per screen.** Every page has an obvious primary action. If the user wonders "what do I do here?" — the design has failed.

2. **The app does the admin.** Calculations, filing, notifications, status tracking — all automatic. The IE does the consulting work; the app does everything else.

3. **Show the journey.** The M0→M5 process is always visible. The IE always knows where they are, where they've been, and what's next.

4. **Respect the user.** No patronising tutorials, no "getting started" wizards, no tooltips on obvious things. These are senior executives. The interface should be self-evident, not explained.

5. **Numbers update instantly.** In the costing sheet, every change ripples through the financial model in real-time. The delay between tweak and result must be zero.

## Desired Emotional Response

### Primary Emotional Goals

1. **Confident** — "I've got this, the numbers are right." The app removes doubt. Calculations are visibly correct, the process is clear, and the IE trusts the output without needing to verify with someone else.

2. **Relieved** — "That was so much easier than I expected." The bar is set by years of fighting with Excel spreadsheets and not knowing the M process steps. The M Suite should feel like a weight lifted — the hard part has been taken care of.

3. **In control** — "I can see exactly where everything stands." The IE is never lost. Their opportunities are visible, stages are clear, numbers are transparent. They feel like the pilot, not a passenger.

### Emotional Journey Mapping

| Moment | Desired Feeling | Design Implication |
|--------|----------------|-------------------|
| First visit | Welcomed, oriented | Personalised greeting, visible M process map, obvious "start here" |
| Opening a stage page | Clear, guided | SOP guidance is immediately visible, next action is obvious |
| Starting a costing | Capable, not overwhelmed | Progressive disclosure — setup first, complexity reveals as needed |
| Mid-costing calibration | In flow, responsive | Instant calculation feedback, no interruptions, auto-save |
| Submitting for review | Accomplished, done | Clear confirmation, "Bernard has been notified" — the IE's job is finished |
| Receiving approval | Validated, progressing | Simple notification, opportunity moves forward |
| Receiving change request | Informed, not criticised | Reviewer comments are constructive and specific, not a rejection |
| Monday morning check-in | Oriented, on top of things | Dashboard shows all opportunities at a glance, nothing is forgotten |

### Micro-Emotions

**Confidence over confusion** — every number has a visible explanation. The WWRI markup formula doesn't just produce a result; the IE can see how it was calculated. No black boxes.

**Trust over scepticism** — auto-save is silent but a subtle "saved" indicator builds trust that work isn't being lost. The system earns trust through reliability, not promises.

**Accomplishment over frustration** — completing a costing or progressing a stage should feel like ticking something off. Small moments of closure at each step.

### Design Implications

- **Confidence** → Show your working. Calculation breakdowns visible on demand. Summary totals update in real-time so the IE sees cause and effect.
- **Relief** → Reduce perceived complexity. The costing sheet has the same data as the Excel, but presented in digestible sections rather than a wall of cells.
- **Control** → Persistent navigation showing the M process. Every page reinforces "you are here, this is what's next." No dead ends.
- **Avoid "I'll call Angelus"** → If a user hesitates for more than 5 seconds, the design has failed. Every interaction must have an obvious next step. Error states offer recovery, not dead ends. Nothing requires external help.

### Emotional Design Principles

1. **Never make the user feel stupid.** If they can't figure something out, it's the app's fault, not theirs. Redesign the interaction, don't add a tooltip.

2. **Reward progress visibly.** Moving through M stages, completing a costing, getting an approval — these are achievements. The app should acknowledge them (subtly, not with confetti).

3. **Errors are conversations, not alarms.** When something goes wrong, the app explains what happened and what to do next. No red banners, no error codes, no panic.

4. **The app is the expert, so the user doesn't have to be.** Business rules, calculation logic, process steps — the app knows these. The IE brings the consulting knowledge; the app brings the methodology and maths.

## Design System Foundation

### Design System Choice

**Extend the existing WWRI design system.** The costing prototype and structured interview tool already establish a proven visual language. The M Suite adopts this system wholesale and extends it for multi-page application patterns.

### Rationale

- Consistency across WWRI products (Admin Toolkit, M Suite, P Suite share one brand)
- The palette, typography, and component patterns are already tested and familiar to Angelus
- No need to evaluate external frameworks — the existing system works and is lightweight

### Implementation Approach

- Extract the design tokens (colours, typography, spacing) from the existing prototypes into a shared CSS/design token file
- Build reusable components matching the established patterns (cards, tables, buttons, form fields, tab bars, badges)
- Add new patterns as needed: M-stage progress bar, opportunity cards, review status indicators

### Customisation Strategy

- The design system is owned by WWRI — no external dependency
- New components added as M Suite needs evolve (pitch builder, SOW generator)
- Consistent `ww-` class prefix convention maintained

## Visual Design Foundation

### Colour System

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#F5F4F0` | Page background (warm off-white) |
| Surface | `#FFFFFF` | Cards, panels, content areas |
| Border | `#DDDBD6` | Borders, dividers |
| Text Primary | `#1A1A1A` | Headings, body text |
| Text Secondary | `#555550` | Supporting text, descriptions |
| Text Muted | `#888884` | Labels, hints, disabled text |
| Teal (Primary) | `#009898` | Primary actions, active states, M-stage indicators, links |
| Amber | `#C07A00` | Warnings, in-progress states, "changes requested" review status |
| Green | `#1E8C4A` | Success, approved status, completed stages |
| Red | `#C0392B` | Destructive actions, Board-approval flags, stopped opportunities |

**Semantic colour usage:**
- Review status: Draft (muted), Submitted (teal), In Review (teal), Changes Requested (amber), Approved (green)
- Opportunity status: Active (teal), Stopped (red), Completed (green)
- M-stage progress: Completed (green), Current (teal), Future (muted)

### Typography System

- **Primary font:** System font stack — `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Monospace (numbers):** `'Cascadia Code', Consolas, monospace` — used for all currency values, percentages, and calculations
- **Scale:** 18px page titles, 14px section titles, 13px body/tables, 12px small/buttons, 11px labels/micro
- **Labels:** 11px uppercase, letter-spaced (`0.04em`), muted colour — used for field labels and table headers

### Spacing & Layout Foundation

- **Card pattern:** White background, 1px border (#DDDBD6), 8px border-radius, consistent internal padding
- **Page layout:** Max-width content area centred on page, warm off-white background
- **Sticky navigation:** 56px top nav bar with logo, current context, and user indicator
- **Consistent spacing scale:** 8px base unit (8, 16, 24, 32, 48)

## Design Direction

### Chosen Direction: Professional Warmth

The M Suite should feel like a premium, trusted business tool — not a consumer app and not an enterprise monolith. The warm off-white background and teal accents create a professional but approachable atmosphere. Clean, spacious layouts reduce cognitive load.

**Key visual principles:**
- **Spacious, not dense.** Generous whitespace between sections. One idea per visual area.
- **Professional, not playful.** No illustrations, no icons as decoration. Icons used functionally only (navigation, status).
- **Warm, not clinical.** The off-white background and rounded corners soften the enterprise feel. This should feel like a well-designed boardroom, not a hospital.

## User Journey Flows

### IE: New Opportunity Flow

```
Home (opportunity list)
  → "New Opportunity" button
  → Enter client name, prospect, description
  → Opportunity created at M0
  → M0 page: SOP guidance displayed
  → Self-check: "Is prospect transformational?"
    → Yes → Progress to M1
    → No → Mark as "do not pursue" (recorded)
  → M1 page: SOP guidance displayed
  → [Continue through stages...]
  → M2 page: SOP guidance + "Create Costing" button
    → Costing sheet opens (linked to opportunity)
```

### IE: Costing Sheet Flow

```
Costing Sheet
  → Project Setup (client, legal entity, people, financial params)
  → Phase Details (define phases, allocate experts/services per week)
    → Real-time calculations update as each field changes
    → Auto-save on every change
  → Summary (charges by phase, expert income, WWRI share)
  → "Send for Review" → Select reviewer → Confirm
    → Teams notification sent to reviewer
    → Status changes to "Submitted"
```

### Reviewer: Review Flow

```
Teams notification received
  → Click link → M Suite opens to costing review view
  → Summary visible: client, totals, WWRI margin, referral fee
  → Non-standard values highlighted (Board-approval flag)
  → "Approve" or "Request Changes" (with comment field)
  → Decision recorded with timestamp
  → IE notified via Teams
```

### Flow Optimisation Principles

- Every flow has a maximum of 3 decisions before reaching the goal
- Back navigation is always available — no trapping the user in a flow
- The reviewer flow from Teams notification to approval should take under 2 minutes

## Component Strategy

### Design System Components (from existing WWRI prototypes)

| Component | Source | Adaptation Needed |
|-----------|--------|------------------|
| Cards (`.card`) | Costing prototype | None — use as-is |
| Data tables (`.tbl`) | Costing prototype | Add sortable headers for opportunity list |
| Primary button (`.btn-primary`) | Costing prototype | None |
| Ghost button (`.btn-ghost`) | Costing prototype | None |
| Danger button (`.btn-danger`) | Costing prototype | None |
| Form inputs (`.field-input`) | Costing prototype | None |
| Select dropdowns (`.field-select`) | Costing prototype | None |
| Field labels (`.field-label`) | Costing prototype | None |
| Tab bar | Costing prototype | Adapt for M-stage navigation |
| Badges (`.badge`) | Costing prototype | Add review status variants |
| Sticky nav bar | Costing prototype | Add user name, opportunity context |

### Custom Components (new for M Suite)

| Component | Purpose | Key Behaviour |
|-----------|---------|--------------|
| M-Stage Progress Bar | Persistent navigation showing M0→M5 | Horizontal bar, clickable stages, colour-coded (completed/current/future), always visible |
| Opportunity Card | List item showing opportunity summary | Client name, current stage, last activity, review status if applicable |
| Review Status Badge | Shows costing review state | Draft/Submitted/In Review/Changes Requested/Approved with semantic colours |
| Self-Check Decision Panel | Advisory gate at M0/M1/M2 | Guidance text + "Pursue" / "Do not pursue" buttons + optional notes field |
| Costing Summary Panel | Running financial totals | Sticky or collapsible panel showing project totals while editing phase details |
| SOP Guidance Block | Stage-specific process content | Card with guidance text, checklists, expected outputs. Collapsible. |
| Auto-Save Indicator | Subtle "saved" confirmation | Small text near nav bar, appears briefly after each save, builds trust |

## UX Consistency Patterns

### Button Hierarchy

- **Primary (teal filled):** One per screen. The main action: "New Opportunity," "Send for Review," "Approve"
- **Ghost (outlined):** Secondary actions: "Export," "Request Changes," "Back"
- **Danger (red filled):** Destructive only: "Do not pursue," "Remove expert." Always with confirmation.
- **Text links:** Navigation within content. Never for actions that change data.

### Feedback Patterns

- **Auto-save:** Silent. Subtle "Saved" indicator near nav bar fades in and out. No toasts, no modals.
- **Submission success:** Inline confirmation replacing the submit button: "Bernard has been notified." Stays visible.
- **Review decision:** Inline confirmation: "Approved" or "Changes requested — Priya has been notified."
- **Errors:** Inline, near the field that caused it. Plain language. Recovery action visible.
- **Board-approval flag:** Amber highlight on the field + explanatory text: "This rate differs from the standard 30%. A reviewer will need to acknowledge this."

### Form Patterns

- **Auto-save on blur or change.** No save buttons. No submit-to-save.
- **Field labels always visible** above the input (not placeholder text that disappears).
- **Numeric inputs** use monospace font, right-aligned, with currency symbol prefix.
- **Dropdown selects** for constrained choices (currency, reviewer, government impost).
- **Validation on blur** — highlight the field gently, explain what's wrong in plain language below it.

### Navigation Patterns

- **Persistent top nav:** Logo, M-Stage Progress Bar, current opportunity name (if in context), user name
- **M-Stage Progress Bar:** Always visible when inside an opportunity. Clickable stages. Shows completed/current/future.
- **Opportunity list** as the home page. Always accessible via logo click or "Home" in nav.
- **Breadcrumb-style context:** When in a costing sheet: "Home > Meridian Logistics > M2 Costing"
- **No hamburger menus.** All primary navigation is visible. These users won't find hidden menus.

## Responsive Design & Accessibility

### Responsive Strategy

- **Desktop-first.** Primary design target is 1280px+ viewport.
- **Tablet (iPad) functional.** Costing sheet must work on iPad — the weekly allocation grid may need horizontal scroll on smaller screens.
- **No mobile optimisation required.** IEs won't use this on phones. If they do, it should be readable but not necessarily fully interactive.

### Breakpoint Strategy

| Breakpoint | Target | Behaviour |
|-----------|--------|-----------|
| 1280px+ | Desktop (primary) | Full layout, all columns visible |
| 768px–1279px | Tablet | Simplified grid, horizontal scroll for wide tables, stacked cards |
| <768px | Mobile (graceful degradation) | Readable, opportunity list works, costing sheet may require desktop |

### Accessibility Strategy

- **WCAG 2.1 AA** compliance as baseline
- **Large click/tap targets:** Minimum 44x44px for all interactive elements
- **Colour contrast:** All text meets 4.5:1 ratio against background. Status colours never convey meaning through colour alone — always paired with text or icon.
- **Keyboard navigation:** All actions reachable via keyboard. Tab order follows visual layout.
- **Focus indicators:** Teal focus ring (already in prototype CSS) on all focusable elements.
- **Font sizing:** Base 13px body, but no fixed sizes that prevent browser zoom. All em/rem-based.

### Testing Strategy

- **Marc Test:** Prototype tested with 2-3 IEs including at least one who struggles with current Excel tools
- **Screen reader:** Basic compatibility verified (semantic HTML, ARIA labels on interactive elements)
- **Keyboard-only:** Full costing sheet workflow completable via keyboard
