# Structured Interview App — Productisation Proposal

**Prepared by:** Angelus Morningstar
**Date:** 1 April 2026
**Status:** For review and sign-off

---

## Context

The Structured Interview tool exists as a working proof-of-concept deployed at [wwri-structured-interview.netlify.app](https://wwri-structured-interview.netlify.app/). It demonstrates the core interview workflow — setup, live scoring with timer, calibration adjustments, and results visualisation (heatmaps, radar charts, benchmarks).

However, it is a single-file monolith (1,100 lines of HTML/JavaScript) that is not production-ready. It has no database — interview data is lost when the browser closes. It has no proper architecture — the entire application lives in one file with no separation of concerns. It cannot be shared between consultants, results cannot feed into downstream reporting, and it cannot be maintained or extended in its current form.

**The proposal is in two phases:**

1. **Immediate priority:** Make the Structured Interview app production-ready — proper architecture, database persistence, deployed and usable by consultants
2. **Next step:** Embed it as the first module of P Suite — WWRI's delivery-side platform, counterpart to M Suite (business development) — giving it a permanent home and a foundation for future delivery tools

---

## 1. Scope

### What exists today (proof-of-concept)
- Working prototype demonstrating the core interview workflow
- 6 topic libraries with 36 subtopics, customisable questions
- Interviewer calibration, interviewee management, scoring
- Results visualisation: heatmaps, radar charts, bar charts, benchmarks
- **Not production-ready:** single-file monolith, no database, no architecture, no multi-user support

### Phase 1 — Production-ready SI app (immediate priority)
- **Proper architecture** — decompose the monolith into a maintainable Next.js application with separated components, pages, and data layer
- **Database persistence** — interviews survive beyond a browser session, can be resumed, shared between consultants
- **Engagement management** — link interviews to client engagements, track status across multiple projects
- **Deployment** — hosted on Netlify with Neon PostgreSQL, accessible to consultants via a shared URL
- **Design system** — restyled to WWRI brand standards (consistent with M Suite)

### Phase 2 — P Suite integration (follows Phase 1)
- **P Suite shell** — shared navigation, URL structure, and platform framing alongside future delivery tools
- **Multi-user readiness** — consultant login (mock auth initially, Azure SSO when ready)
- **Intranet embed** — accessible via the WWRI SharePoint intranet
- **Extensibility** — foundation for future tools (MasterPlan builder, etc.)

### Out of scope
- Deep Dives tooling (Stage 2 — flagged as "difficult to lift" on the process map)
- Merlin exercise digitisation (Stage 3)
- MasterPlan builder (Stage 4 — future P Suite module)
- Azure SSO integration (deferred until broader rollout)
- AI-assisted analysis or reporting

### Agreed look & feel
The P Suite will use the same WWRI design system as M Suite — Tailwind CSS, consistent colour palette, shared NavBar and UI components. The interview workflow screens will be modernised from the current inline-styled prototype to match this design language.

---

## 2. Timeline

**Phase 1 — Production-ready SI app**

| Milestone | Target Date |
|-----------|-------------|
| Scope sign-off | 1 April 2026 (today) |
| Architecture rebuild + database + deploy | 2 April 2026 (Thursday) |
| *Easter long weekend* | *3–6 April* |
| First review session (Niel + Nicolette) | 7 April 2026 (Tuesday) |
| Iteration + final polish | 8 April 2026 |
| **Ready for user testing** | **9 April 2026** |

**Phase 2 — P Suite integration**

| Milestone | Target Date |
|-----------|-------------|
| P Suite scaffold + SI embedded | w/c 14 April 2026 |
| Intranet integration | w/c 14 April 2026 |

*This is an estimated optimal timeline assuming dedicated focus. Actual dates may shift depending on competing priorities and reviewer availability. Progress updates will be shared at each milestone so this is not a black box — visibility is built into the process.*

**Total development effort:** Phase 1: 2–3 days. Phase 2: 1 day. AI-assisted development (Claude Code) means the build is fast — the calendar is driven by review availability, not development time.

---

## 3. Development Status & Remaining Iterations

### Where we are now
- SI app: **proof-of-concept complete** — demonstrates the workflow but needs to be rebuilt with proper architecture for production use
- M Suite: database-connected, Netlify-ready — this is the proven architecture pattern P Suite will follow
- WWRI design system: built and tested across 7 UI components

### What remains
**Phase 1 — Production-ready SI app**
1. **Rebuild SI with proper architecture** — decompose the monolith into Next.js pages, React components, and server-side data layer (~3-4 hours)
2. **Add database layer** — Prisma models for engagements, interviews, scores (~2-3 hours)
3. **Design system alignment** — restyle to match WWRI brand standards (~2-3 hours)
4. **Deploy to Netlify + Neon** — same proven pattern as M Suite (~30 min)
5. **Iteration from review feedback** — based on Niel/Nicolette session (~half day)

**Phase 2 — P Suite integration**
6. **Scaffold P Suite** — Next.js app mirroring M Suite structure, embed SI app (~1-2 hours)
7. **Intranet link/embed** — add to WWRI SharePoint intranet (~1 hour)

### Review sessions & progress visibility
- **2–3 review sessions recommended**, 15–30 minutes each
- Proposed cadence: as each milestone completes (not calendar-driven)
- First review after build complete (target: Tuesday 7 April)
- **Progress updates** shared at each milestone — short written summary with screenshots and a link to the live deploy so reviewers can see exactly where things stand

---

## 4. Cost & Ownership

### Development cost
- **External cost: $0** — development is done in-house using Claude Code (AI-assisted)
- Development effort is Angelus's time

### Hosting & maintenance (monthly)
| Item | Cost |
|------|------|
| Netlify hosting | $0 (free tier — sufficient for ~20 users) |
| Neon PostgreSQL | $0 (free tier — 0.5 GB storage, sufficient for demo/early use) |
| Domain (optional) | ~$15/year if custom domain desired |
| **Total monthly** | **$0** (free tier covers the demo and initial rollout) |

*Note: If usage grows beyond free tier limits (unlikely at current scale), Netlify Pro is $19/mo and Neon Launch is $19/mo.*

### Ownership post-launch
| Responsibility | Owner |
|----------------|-------|
| Ongoing support & bug fixes | Angelus Morningstar |
| Feature requests & prioritisation | Niel Malan (or nominated product owner) |
| User feedback & testing | Nicolette Grams |
| Infrastructure (hosting, database) | Angelus Morningstar |

---

## 5. Definition of Done

Per the agreed standard, the Structured Interview App is launched when:

- [ ] All scope items above are delivered and working
- [ ] Final user testing completed by Niel and Nicolette, signed off
- [ ] App deployed and accessible to IEs via the WWRI intranet
- [ ] Named owners in place for ongoing support (as per table above)
- [ ] Interview data persists in database and can be accessed across sessions

---

## Why P Suite, not standalone

Embedding the SI app into P Suite rather than shipping it as a standalone page:

1. **Gives it a home** — it lives alongside future delivery tools rather than floating as an orphan URL
2. **Shares infrastructure** — same database, auth, hosting, and design system as M Suite. One platform to maintain, not many.
3. **Sets up the next tools** — the Stage 4 MasterPlan builder and other "easy to lift" capabilities from the Strategic Journey process map have a ready-made framework to slot into
4. **Looks professional** — when showing clients or internal stakeholders, a branded P Suite with navigation and consistent UX signals maturity

This is not scope creep — the P Suite scaffold is a few hours of work because it mirrors the already-built M Suite. The real work is rebuilding the SI app properly — but the proof-of-concept means the business logic, topic libraries, and UX patterns are already validated. We're not designing from scratch; we're engineering what's already been proven.
