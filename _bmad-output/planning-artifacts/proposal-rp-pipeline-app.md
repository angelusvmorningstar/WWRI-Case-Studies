# Proposal: RP Pipeline App (working title)

**Status:** Proposal for review · **Author:** Angelus (synthesised from BMAD roundtable) · **Date:** 2026-06-03

A lightweight app that lets Recruitment Partners (RPs) capture and maintain their
contact and lead/pipeline data, funnelling it into HubSpot — without giving every
RP a paid HubSpot editing seat.

---

## 1. Problem

HubSpot is WWRI's CRM and **system of record (SoR)**. Most of the ~20 RPs have
**view-only** seats; only a few have paid **core** seats that can edit. So the
people generating the contacts and leads largely **cannot write to the SoR**.

The fallback — a shared Excel — fragments data: copies multiply, versions drift,
ownership is unclear, and there is no record of whether a contact ever reached
HubSpot. Buying ~20 core seats is out of budget.

## 2. Goal & hypothesis

**This is a friction-removal play, not a cost-saving one.** The bet:

> If RPs have a *direct, usable* place to keep their pipeline that they never have
> to think of as "doing CRM admin", they will keep it current — and we can funnel
> that into HubSpot cleanly.

The app is a **governed intake funnel into the SoR**, *not* a parallel CRM.
HubSpot remains the source of truth.

## 3. Decisions (resolved this round)

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Trial measures HABIT**, not one-time aggregation. North-star metric: do RPs **return unprompted** to work their pipeline over the trial window? | A one-time upload can look like success on day 1 and tell us nothing by day 30. The product only exists if the behaviour exists. |
| D2 | **Both input modes** in scope: (a) fixed-template **Excel upload** as a low-friction seeding on-ramp; (b) **quick capture form** as the daily loop that drives the habit. | Meet RPs where they are (their existing sheets) *and* give them the lightweight return loop the trial is testing. |
| D3 | **HubSpot sync method deferred** — pending a token check (see Prerequisite P1). Document both paths; default to **direct API** if a write-scoped token is available. | Avoids committing the build before confirming the cheapest reliable path. |
| D4 | Build as a **spoke in the existing hub-and-spoke suite** — shared plumbing, separate data model. Not a tab on Cost Tracker. | Reuse SSO, RP register, token infra, design system without coupling a fast-moving tool to Cost Tracker's release cadence. |
| D5 | **One-way app → HubSpot** sync only in v0. No two-way sync. | Two-way inherits conflict resolution — a tar pit. HubSpot stays SoR. |
| D6 | **Email is the dedupe key**; companies keyed on domain. Push only **app-owned fields** (never blank-overwrite). Store returned HubSpot record IDs locally. | Prevents duplicate-soup in the SoR and "we just nuked a record" overwrites. |

## 4. v0 scope

**In:**
- Auth via existing **M365 SSO**; RP identity from the existing **RP register** (every record auto-stamped with `rp_id` → free provenance/attribution).
- **Excel upload** against a single **fixed template** (published columns; off-shape sheets rejected — no generic parser).
- **Quick capture form** — mobile-first, one screen: name, company, email, a free-text "what happened", optional stage. Company **auto-complete** to prevent "Acme Corp" vs "ACME Ltd".
- **Review/dedupe grid** — flag dupes within an upload and against already-pushed HubSpot IDs; inline edit; bad rows excluded, not blocking.
- **Push to HubSpot** — batch upsert by email; store returned record IDs and sync status. (Transport mechanism per D3.)
- Per-RP **"my pipeline"** view — their book of business, sortable by who to chase.

**Out (deferred):**
- Two-way sync / reading canonical HubSpot state back into the app (see Open Q-A).
- Deal/pipeline-stage objects beyond contacts+lead status (see Open Q-B).
- Persisted column-mapping templates, conflict-merge UI, advanced validation rules.

## 5. Architecture sketch

- **Spoke** on the existing stack: Vite + ESM, Azure Static Web Apps, small server API, Whitewater design system.
- **HubSpot token lives server-side only** (never in the browser). The push runs through the API layer.
- **Own data model** (do not fold into Cost Tracker's schema). Indicative contact shape:
  `firstName, lastName, email (unique), phone, jobTitle, company, companyDomain,
   lifecycleStage, leadStatus, sourceRp, dateEntered, hubspotId, syncStatus, lawfulBasis`.
- Picklist fields (`lifecycleStage`, `leadStatus`) are **constrained dropdowns mirroring HubSpot's exact option values** — free text there breaks import.
- **Shared service note:** if the RP register is currently locked inside Cost Tracker, lifting it into shared plumbing is the one refactor worth doing first — it pays off across the suite.

## 6. Trial design

- **Seed:** RPs upload existing sheets once (also a free audit of how inconsistent the 20 sources really are).
- **Loop:** new leads go in via the capture form.
- **Instrument:** unprompted **return visits / records added without being asked**, per RP, over the window.
- **Kill criterion:** if RPs do not return unprompted to add or update a lead, this is a transport problem, not a product — stop and just collect/import Excels centrally.

## 7. Compliance (UK GDPR)

The app stores third-party personal data (contacts' names/emails/phones) outside the SoR.
- Capture a **source / lawful-basis** field ("how did the RP obtain this contact?") — even a dropdown.
- Define **retention**: the staging buffer should not become a permanent shadow CRM. Decide flush-after-sync vs. retain-as-RP-workspace (ties to Open Q-A).

## 8. Open decisions / prerequisites

| Ref | Question | Owner |
|-----|----------|-------|
| **P1** | Does the server API already hold a HubSpot token with **write** scope, or is it read-only? Resolves D3. | Angelus |
| **Q-A** | Do RPs need to **see their data back** (read path from HubSpot), or is v0 pure push? Decides whether retention = flush vs. keep-as-workspace, and whether the "my pipeline" view reads local-only or canonical. | Angelus |
| **Q-B** | Is v0 **contacts + lead status only**, or do RPs track **deal stages** too? Deals are a separate HubSpot object — roughly doubles the schema. | Angelus |
| **Q-C** | **Ownership/credit rule** when two RPs enter the same contact: first-to-enter wins, or flag-and-alert? Commercial, not technical. | Angelus |

## 9. Risks

- **Adoption** — 20 independent partners won't open a tool out of obligation; it must be genuinely the easiest place to work *their* pipeline. Primary risk; the trial exists to test it.
- **Snapshot ≠ habit** — the upload path can mask a dead product. Mitigated by the D1 return-visit metric.
- **Parser tax** — mitigated by the fixed-template rule (D2/Section 4).
- **Scope creep via "integrate into the suite"** — keep v0 a standalone spoke; earn integration after the friction hypothesis is validated.

## 10. Indicative effort

Roundtable estimate for the upload-only spine was a **3–4 day spike** (client-side
parse via SheetJS, dedupe grid, one push endpoint, ID storage). Adding the capture
form + per-RP view (D2) puts realistic v0 at **~1 sprint**. The load-bearing piece
is the HubSpot push; everything else is scaffolding that can be stubbed for the trial.

---

*Synthesised from a BMAD roundtable (John/PM, Winston/Architect, Mary/Analyst,
Sally/UX, Barry/Quick-Flow). Decisions D1–D3 confirmed by Angelus 2026-06-03.*
