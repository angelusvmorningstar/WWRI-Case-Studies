# WWRI Task Backlog

<!-- CONFIG -->
owner: Angelus Morningstar
tz: Australia/Sydney
schema: 1.0
last-triage: 2026-06-26

<!-- SCHEMA
id: OPS-NNN | DEV-NNN
type: ops | dev
status: open | in-progress | waiting | blocked | watch | check-status | deferred | done
priority: high | medium | low
area: HubSpot CRM | Finance | HP Inc. | SharePoint | Rename | Pipeline | AI/Internal | Admin | Tools | Merlin | Case Studies | Dev
counterparty: name or self
owner: name (absent/self/Angelus = Angelus owns; another name = someone else's, monitor-only)
due: YYYY-MM-DD UTC or null
awaiting: (waiting/blocked only) what response/action is owed, and from whom
chase_by: YYYY-MM-DD — (waiting/blocked only) date to chase the counterparty if nothing received; surfaced at session-start under "Follow-ups to chase"
notes: freetext
source: direct | retrospective | transcript | email
-->

---

## HIGH PRIORITY

### [OPS-001] Pull full HubSpot Contact and Company property export
- **type:** ops
- **status:** open
- **priority:** high
- **area:** HubSpot CRM
- **counterparty:** Peter Novak
- **due:** 2026-10-01
- **source:** retrospective
- **notes:** AS IS verification. Without this, half of Peter's AS IS → TO BE gap assessment is "can this be built" not "does this already exist". Flagged outstanding since April. Blocks Peter's framework design.

### [OPS-002] Decide HubSpot tier upgrade (Sales Hub Professional)
- **type:** ops
- **status:** done
- **priority:** high
- **area:** HubSpot CRM
- **counterparty:** Nicolette (steer), HubSpot rep (seat split)
- **due:** 2026-10-01
- **source:** retrospective
- **notes:** Decision made (Jun 2026): stay with current licence structure for now, per discussions between Niel and Nicolette. Peter Novak confirmed in HubSpot Next Steps email 15 Jun. Revisit at Oct renewal.

### [OPS-003] Raise with Peter that framework should be built within Starter features
- **type:** ops
- **status:** open
- **priority:** high
- **area:** HubSpot CRM
- **counterparty:** Peter Novak
- **due:** 2026-07-15
- **source:** retrospective
- **notes:** Renewal leaning leaner — possibly dropping Data Hub Pro. Peter may be designing for Professional-only capabilities (automation, third pipeline) that the renewal could remove. Raise before go-live.

### [OPS-016] Reinvention rename: Niel/Kane scope confirmation + Nicolette addendum alignment
- **type:** ops
- **status:** open
- **priority:** high
- **area:** Rename
- **counterparty:** Niel, Kane, Nicolette
- **due:** 2026-07-01
- **source:** retrospective
- **notes:** Rename = **International Expert (IE) → Reinvention Partner (WRP)**. Title launched by Nicolette 9 Jun with usage SOPs (signatures/LinkedIn). SSOT = **`Reinvention_Partner_Naming_Project_Plan_v5.docx`** (SharePoint → Whitewater Reinvention Partners), authored by Angelus for Niel/Kane, **to be finalised 29 Jun**; priority changes done pre-Cohort-18 (end Aug). **Addendum approach already drafted:** existing IE agreements/NDAs NOT re-issued — each current RP gets a short DocuSign addendum (other terms in force); Cohort 18+ uses new RP Agreement/NDA templates. **TWO open parts:** (1) **Sign-off gate (by 29 Jun):** Niel+Kane confirm scope/owners; Nicolette align on addendum + external comms tone. (2) **Angelus's own workstreams, most due ~30 Jun:** RP Agreement/NDA templates (drafts done), **HubSpot audit** (properties/fields/lifecycle/templates/workflows/reports), **internal tools** (Toolkit/Costing/SI/subscription register — RP register + meeting rename already done this session), **third-party platforms** (Gnowbe/Miro/LinkedIn/Claude); then marketing materials (=OPS-014, 1–31 Jul) + Xero/finance docs (with Jeremy, 1–7 Jul). Other owners: Kane (Cohort 17 briefing + Cohort 18 onboarding pack), Ilonka (Gnowbe training), Kathleen (SharePoint/marketing). **Next Angelus action: chase the 29-Jun sign-off (Niel/Kane scope+owners; Nicolette addendum/tone) + start the 30-Jun implementation workstreams.**
- **IE→RP TOOL AUDIT (24 Jun):** swept toolkit / cost-tracker / structured-interview / hub for "International Expert"/"IE" stragglers. **Already migrated (no action):** cost-tracker (IE→RP key-remap shim in `store.js`); toolkit `register.json` ("Reinvention Partner"); toolkit pipeline parser (accepts both `IE Lead`/`RP Lead` headers); SI app (no IE refs); HubSpot `ie_lead` deal property **display label already "RP Lead"**. **FIXED this session:** `hub/index.html` role label "View as: IE" → "Reinvention Partner" (value key `ie` kept); `calc.js` comment IE→RP. **Judgment calls (left as-is):** HubSpot internal property name `ie_lead` — **keep** (label done; renaming breaks Toolkit/`hs.mjs`/rp-pipeline-sync); `ieFee`/`iePct` internal var names — cosmetic, skipped; `reference/WWRI-toolkit.html` — old snapshot full of "IE", not live (regenerate or archive, low priority). **STILL ANGELUS'S (HubSpot UI, not API-reachable via current token):** sweep HubSpot email templates, snippets, workflows, saved reports, lifecycle stages and contact-property labels for "IE"/"International Expert". Internal-tools workstream ~90% done; HubSpot UI sweep is the main remaining piece.

### [OPS-017] SharePoint automation: Bernard Global Admin consent
- **type:** ops
- **status:** blocked
- **priority:** high
- **area:** SharePoint
- **counterparty:** Bernard Leung
- **due:** null
- **source:** retrospective
- **notes:** Critical path blocker. Application Administrator role cannot grant tenant-wide consent. Bernard must provide Global Admin consent for Graph API write permissions. Also: Niel's decision on whether automation replaces, supplements, or only verifies the manual pass. Simran flagged: fix permissions model first, start with smaller wedge.

### [OPS-030] Accept Xero invitation for WW US entity
- **type:** ops
- **status:** done
- **priority:** high
- **area:** Finance
- **counterparty:** self
- **due:** null
- **source:** email
- **notes:** Jeremy set up WW US Xero overnight. Angelus imported Renesas invoices (export/import from WW AU). Access confirmed.

### [OPS-031] Send first Renesas invoice from WW US entity
- **type:** ops
- **status:** done
- **priority:** high
- **area:** Finance
- **counterparty:** Jeremy (owner), Rebecca (four-eyes)
- **due:** null
- **source:** email
- **notes:** Invoice imported to WW US Xero, logo added. **Ownership (clarified 17 Jun finance mtg):** the US-tax / readiness work — US tax accountant confirmation, Business Registration Number, sales-tax coding (template currently 0 tax / "International Sale") — is **Jeremy's** to own, discussed in detail. **Angelus's only role: send the invoice once Jeremy confirms it's ready** (four-eyes with Rebecca). **Done 2026-06-19:** Jeremy confirmed invoice ready; sent to client. Nicolette and Laurel notified by email.

### [OPS-032] Payday Super — set up in Xero before 1 July 2026
- **type:** ops
- **status:** waiting
- **priority:** medium
- **area:** Finance
- **counterparty:** Jeremy (owner)
- **owner:** Jeremy
- **due:** 2026-06-30
- **source:** email
- **notes:** New Australian Payday Super legislation effective 1 July 2026 (Xero emailed setup steps). **Ownership (clarified 17 Jun): this is Jeremy's task, not Angelus's.** Jeremy is handling the super position (meeting Altus 18 Jun re tax; super paid end July if not required sooner). No Angelus action — monitor only.

### [OPS-040] Research e-signature options vs DocuSign — share with Niel/Kane
- **type:** ops
- **status:** waiting
- **priority:** high
- **area:** Tools
- **counterparty:** Niel (requester), Kane (point on DocuSign relationship)
- **owner:** Kane
- **due:** null
- **source:** email
- **notes:** **OWNERSHIP HANDED TO KANE (19 Jun, Angelus):** the decision (switch vs renegotiate) and the DocuSign relationship now sit with Kane — not Angelus's to drive from here. The citations/sources sub-action is no longer an Angelus action unless Kane specifically asks. Monitor only. **DELIVERED 17 Jun:** research done (full brief: downloads/E-Signature Platform Comparison for WWRI_ Switch-or-Renegotiate Decision Brief.pdf) and a digestible summary emailed to Niel + Kane. Key findings: price on *senders* not *signers* (cohorts sign for free); ditch capped DocuSign eSignature plans; best fits — DocuSign IAM Standard (unlimited, deepest M365/SharePoint, ~$3,240/yr) / Zoho Sign Pro (cheapest uncapped, ~$1,150/yr) / PandaDoc Business (~$3,528/yr); avoid Dropbox Sign (dropped SharePoint Mar 2026) and signNow (same 100-sig cap). For Kane's DocuSign call Thu 18 Jun: push IAM Standard (not renew current tier + buy seats) + negotiate 3–5% renewal cap. **17 Jun ops mtg:** Niel read it twice; Kane to read after connect session, finds it useful as negotiation leverage for his DocuSign sales call **Thu 10:30 (info back after 11)**. Kane is exploring a bespoke "buy blocks of envelopes only" deal. Niel steer: if WW adopts a tool, **Whitewater pays via Jeremy**, not Kane personally. **Open Angelus sub-action: update the research doc to include sources/citations** so Kane can trace the figures (committed in mtg). Decision (switch vs renegotiate) parked until after Kane's Thursday call. Likely follow-up: short parallel pilot on a real cohort intake before annual commit.

### [OPS-043] Cost Tracker: BAU vs maximalist budget numbers for Niel
- **type:** ops
- **status:** done
- **priority:** high
- **area:** Tools
- **counterparty:** Niel
- **due:** 2026-06-18
- **source:** direct
- **notes:** Niel (17 Jun ops mtg) asked for two next-FY budget figures from the Cost Tracker, each as a screenshot: **(a) Business-as-usual** — current model (M365 basic + core/standard mix, HubSpot, Miro), **including the recruitment cycle (~50–55 people)**; BAU currently shows ~$51k. **(b) Maximalist** — everyone on full HubSpot, full Miro, Microsoft Standard + Copilot. ⚠️ Maximalist looked wrong (only +$20k) — **Copilot cost appears missing from that view**; investigate/verify the model before sending (Angelus said he'd run it tonight). Design ask: bake in a **"basic + minimal core licences"** fallback (basic + ~6 HubSpot + ~6 Miro seats) as the sustainable floor — ties into the Scenarios redesign. Note: the two existing views are *meant* to answer exactly this by toggling, but Angelus is unsure they calculate correctly — confirm.
- **PARKED (dashboard redesign — incomplete, revisit):** Angelus wants the Cost Tracker **Dashboard** (the $51,265 FY26/27 view) to surface **two headline numbers**. **(1) Business as usual** = current costs + projected costs driven by the **% of RP-linked subscriptions in the Subscription tab** → the baseline/as-is projected cost. **(2) [second number — not yet specified; thought was cut off, likely the maximalist/everyone-gets-everything figure per OPS-043].** Get the rest of this spec from Angelus before building.
- **PROGRESS 17 Jun (cost-tracker refactor):** (1) **DONE + PUSHED** (commit c6fcf06, main → auto-deploys via Azure SWA): attribution moved off the Subscriptions page (now unit-cost only) and onto the Forecast page as per-model editable rates; "Standard" model renamed "Maximum"; new `workbook.modelAttribution` store. (2) **DONE, NOT YET PUSHED** (uncommitted in working tree): both Basic & Maximum now list *every* per-RP subscription with its own editable attribution (0% = exclude), so each model is tailorable. (3) **Copilot price:** corrected in `seed/workbook.json` to AU$26.91/mo Resolved (was 55/Pending) — but seed is NOT used at runtime; the **live value lives in the Azure blob via /api/workbook and still needs updating** (give Claude the deployed URL to patch, or set Unit cost 26.91 on the Copilot row in the app). KEY: only *Resolved* assumptions compute, so Copilot (Pending) was reading as $0 — fixing it makes Maximum finally include Copilot cost (the gap Niel flagged). Uncommitted files: forecast-view.js, dashboard-view.js, subscription-models.js, app.css, seed/workbook.json.
- **PROGRESS 18 Jun (reviewed + fixed + pushed, commit fdd7fbd):** Verified the model logic locally via a compute harness and **found a real bug**: `lookupAssumption` only reads *Resolved* assumptions, but model attribution overrides on *Pending* base assumptions (Copilot, M365 Standard) kept Pending status → ignored → `computeForecast` fell back to **full attribution (1)**. So Copilot + M365 Standard were computing at 100% in **every** model: **Basic/BAU was overstated** and the toggle never moved them. **Fix:** `buildModelAssumptions` now stamps each override `Resolved`. Verified totals (per-RP cohort, FY26/27): **Basic = M365 Basic only ≈ AUD 5,454; Maximum = HubSpot+Copilot+Miro+Standard ≈ AUD 65,241** (Copilot now correctly in Maximum, not in Basic). Production build clean; committed + pushed to main (auto-deploys). **REMAINING before sending Niel:** the live app reads the workbook from the Azure blob — Copilot's **unit cost** isn't model-overridden, so it must be set to **AUD 26.91 + status Resolved on the live workbook** (in-app via Cost Register), else deployed Maximum reads Copilot unit cost as $0. Then screenshot the Dashboard hero total for Basic and Maximum.
- **PROGRESS 18 Jun (dashboard dual-hero, commit 72d0f12, pushed):** Dashboard now shows **both** headline numbers stacked — "Business as usual" + "Maximalist" — so no model switching needed, each with a live **Subscription attribution** strip (every cohort sub + its % of RPs, read from `modelAttribution`). Switched the headline basis to **whole-population** (`computeModelAnnualTotal`): every projected RP on the model's stack + fixed platform/staff, i.e. clean model-floor vs model-ceiling (per Niel's framing), not actual+additions. Verified locally on seed: BAU ≈ $36,060 vs Maximalist ≈ $95,847. **Live caveat still applies:** Copilot *unit cost* must be 26.91/Resolved on the Azure blob or Maximalist understates Copilot. FY recruitment table keeps its operational actual+cohort build-up (so its total differs from the heroes by design).
- **PROGRESS 18 Jun (headline breakdown, commit fc00c36, pushed):** Per Angelus, each hero (BAU + Maximalist) now itemises its FY total into **Platform/yr (x) + Current RPs/yr (y) + Model forecast/yr (z)** that sum to the top line. Reverted the headline basis from whole-population back to the **operational total (x+y+z)** so the breakdown reconciles. z (projected cohort additions under the model) is the only model-dependent component → it's where BAU vs Maximalist diverge once there's growth. Seed has z=0 (no growth) so both read equal there; live data (47→97) will differ.
- **18 Jun:** Explainer email **sent to Niel** (BAU vs maximalist now side-by-side with platform / current-RP / model-forecast breakdown; flagged the Copilot/Standard double-count fix). Dollar figures deliberately omitted pending live Copilot price. **18 Jun:** Copilot per-seat price now inbuilt to the cost-tracker (live workbook) — the last data caveat is resolved, so deployed Maximalist now includes Copilot at the correct price. **DONE 18 Jun:** explainer letter **and the BAU + Maximalist screenshots** sent to Niel ("Update to Cost Tracker", 18 Jun 04:43). Primary deliverable complete. **Note — still parked (not part of this task's close):** the "basic + minimal core licences" sustainable-floor view and the broader Scenarios redesign (see [[project_cost_tracker_scenarios_redesign]]) — carve into a new task if/when Niel wants it.

### [OPS-046] Package Cathay / "Global Air Cargo Carrier" case study for website
- **type:** ops
- **status:** waiting
- **priority:** high
- **area:** Case Studies
- **counterparty:** Nicolette / Niel / Kane
- **due:** null
- **source:** email
- **notes:** From the "Framing for High Tech Industry on WW Website" thread (Niel chasing progress 17 Jun; Nicolette set Angelus to package the Cathay study). **DONE 18 Jun:** ingested the approved one-pager text into case-studies.json ("Global Air Cargo Carrier"); regenerated the Word doc (Output 1); produced the Output 2 web HTML code block (`assets/Air Cargo Case Study — website block for Kane.md`); built a new PDF brochure generator (`.claude/skills/case-study-ingest/scripts/gen_cs_brochure.py`) and produced the branded 2-page PDF (Output 3) with hero image. Replied to Nicolette/Kane 18 Jun with the draft and **asked Kane for website CMS access in-thread** (supersedes the separately-drafted access email). **Waiting on:** Kane re website access to publish + final lead sign-off.

### [OPS-047] WW AllCompany list + Global Monthly RP Meeting (Nicolette)
- **type:** ops
- **status:** waiting
- **priority:** high
- **area:** SharePoint
- **counterparty:** Nicolette (requester), Kane (ch17 mailboxes)
- **due:** null
- **source:** email
- **notes:** Nicolette (18 Jun, HIGH): confirm WW AllCompany list includes all 68, confirm global-meeting invite covers them, rename meeting IE→RP. **DONE 19 Jun:** reconciled `Ww-Ri AllCompany` against the M365 directory; added the 12 people who have WW accounts but were missing → list now **52→64**; cancelled "Global Monthly IE Meeting" and reissued as **"Global Monthly RP Meeting"** (01:52); replied to Nicolette (01:54). **HANDED TO KANE (done):** the 01:54 reply (To: Nicolette, **Cc: Niel + Kane**) hands Kane the 9 cohort-17 people who have **no WW mailbox** yet — Alice Lopin, Bernard Tan, Darryl Wee, Eddie Ahmed, Jan Sorcek, Sietske Rozie, Sim Lim, Takehiko Aoki, Thomas McCabe — to create as part of onboarding. (Personal emails on file for Alice/Darryl/Sietske only.) **Waiting on Kane** to create the mailboxes; once done they auto-inherit the AllCompany list + RP meeting invite. **To fully confirm the "68"** still need Nicolette's master list to diff (or reconcile `_data/rp/IE Intake Master CONTROL SHEET 2025.xlsx`).

### [OPS-048] Register-as-SSOT + HubSpot/Miro seat automation
- **type:** ops
- **status:** waiting
- **priority:** medium
- **area:** Tools
- **counterparty:** Niel, Kane
- **due:** null
- **source:** email
- **notes:** **19 Jun:** reconciled the Cost Tracker RP register to the live M365 licence directory (export 19 Jun) — m365 tiers now match actual licences (6 Std / 50 Basic); applied standing rule **unlicensed in M365 ⇒ inactive** (54 active / 71 inactive / 125 total); added 10 missing licensed people; merged Jacqui Lane dupe; fixed Jeremy D'Cruz typo. Emailed Niel+Kane (01:43) proposing the **active-RP register become the single authoritative source**. **Decision flagged for them:** Glen Casey + Winfried Schultz hold Basic licences but are inactive — reactivate or release. **Waiting on:** Niel/Kane buy-in. **Next automation:** HubSpot seats can be auto-reconciled via a Private App token (`settings.users.read`); Miro auto-pull is Enterprise-only (WWRI on Business → manual CSV export). Sync scripts: `cost-tracker/api/_m365_sync.js`, `_register_cleanup.js`. See [[cost-tracker-current-state]]. **23 Jun: presence-reconcile built (weekly digest, Mon 08:00) — finds 28 register entries missing a HubSpot seat.** First attempted a blanket `core` default (28 seats) — caught + **reverted** (HubSpot API exposes no tier; that would have overstated paid seats/cost). **RESOLVED 23 Jun with the fresh HubSpot Users export** (`_data/hubspot/hubspot-users-portal-145021882-2026-06-23.csv`, 60 users, has `Paid Seat`/`Seats`): applied **accurate tiers — 1 core (Jack Garzella) / 27 free (view-only)** via `apply-hs-tiers-from-export.mjs`. So the register catch-up was real on presence but cost-trivial (only +1 paid seat). 0 tier mismatches on the 16 already-recorded. Reconcile digest now clean (0 adds). Backups: `_workbook-backup-pre-tierapply-2026-06-23.json`. **Going-forward workflow:** weekly digest flags new seats (presence); to tier them, pull a fresh Users export + run `apply-hs-tiers-from-export.mjs --csv <file>`. Scripts in `cost-tracker/api/`. **Residuals resolved 23 Jun:** cleared **Alice Lopin** (stale free seat); **added 15** missing HubSpot-seat holders to the register (14 free + Jeremy D'Cruz core) via `reconcile-unmatched.mjs --add`; **Rhiannon Melan** excluded (departed intern — flagged for HubSpot offboarding, see OPS-056). Register now = accurate SSOT of HubSpot seats/tiers; weekly reconcile digest reads clean. Backups: `_workbook-backup-pre-unmatched-2026-06-23.json`. **23 Jun (later) — register HARMONISED to the IE Skills Matrix (the SSOT Niel confirmed):** new `cost-tracker/api/harmonise-from-matrix.mjs` set `active` = matrix-Active (alumni/inactive/deactivated/8 pending-onboarders → inactive; Glen Casey reactivated), backfilled regions (80 entries, incl. variant-name fixes Ed van Zyl / Luis Faria e Maia / Daniel Vermaas), offboarded Winfried. **active 73→60.** Then Angelus removed live licences for the genuinely-gone (Winfried Schultz, Dario Marchetti, Hervé Richert, Jan Soucek [≠ Jan Sorcek], Steve Monaghan, Rhiannon Melan) and I stripped their register seats to match. Backups: `scratchpad/live-workbook-backup-pre-harmonise.json`, `…-pre-strip.json`. **RP REGISTER now surfaced in the WWRI Toolkit** (new "RP Register" mode): `cost-tracker/api/build-rp-snapshot.mjs` emits `toolkit/data/rp/register.json` (register + HubSpot adoption + matrix role/status); view = `toolkit/js/rp/register-view.js` (+css). Refresh via build-rp-snapshot.mjs. Code uncommitted — pending Angelus review + visual confirm in Chrome.

### [OPS-049] Send Domino's invoice — Friday 26 June
- **type:** ops
- **status:** done
- **priority:** high
- **area:** Finance
- **counterparty:** Adam Salzer / Dieter Haberl / Eric Yutaka Tai / Luis Maia
- **due:** 2026-06-26
- **closed:** 2026-06-22
- **source:** email
- **notes:** **DONE 22 Jun — Angelus sent the corrected invoice to Domino's.** Invoice Tx1377 (WW AU / Whitewater Reinventions, AUD 127,300.00, "Middle of Phase 2 @ 25%", due 30 Jul). Adam (19 Jun) asked Accounts to rerelease dated 26 June; Angelus followed up with Adam directly (WhatsApp/call) and sent. Note: "Eric" = Eric Yutaka Tai (yutaka.tai@dominos.co.jp), not van Antwerpen.

### [OPS-051] Send Nicolette HubSpot RP-adoption data before Global RP Meeting
- **type:** ops
- **status:** done
- **priority:** high
- **area:** HubSpot CRM
- **counterparty:** Nicolette (requester; cc Niel, Adam); Kane (alumni confirmation)
- **due:** 2026-06-23
- **closed:** 2026-06-24
- **source:** email
- **notes:** Nicolette (22 Jun): of 68 global RPs − 14 alumni (Kane's Excel) = 54, report % invited / % accepted-as-users / not-accepted list, split APAC/Americas/EMEA. **DONE 23 Jun — replied to Nicolette (cc Niel, Adam) with a validated workbook** (`downloads/HubSpot RP Adoption by region 2026-06-23.xlsx`). **NIEL REDIRECT (23 Jun):** Niel pushed back — use the **IE Skills Matrix - 2025.xlsx** (Active IE List tab) as SSOT, filter to active only. **REBUILT on active basis → `downloads/HubSpot RP Adoption — Active basis 2026-06-23.xlsx`** (4 tabs: Summary / Detail 53 active / QA / HubSpot invitees 60). **Headline: 53 active RPs, 100% invited, 53% accepted (28)** — APAC 18→44%, Americas 13→69%, EMEA 22→50%. Validated against Angelus's `Accepted Users Hubspot.csv` (28) + `Hubspot Invite Pending.csv` (29) +3 deactivated = 60. Reconciles: 29 pending = 25 active RPs + 4 non-active (alumni Marchetti/Richert, inactive Jan Soucek, pending Karine Artus). **Flags carried into the sheet:** matrix reads 53 active/13 alumni vs Niel's stated 51/14 (QA tab); 53 active = 43 Reinvention Partners + 10 leadership/support; Dieter treated as active (HubSpot access restricted per OPS-054, not departed). Builder: `scratchpad/build_adoption.py` + durable matrix extract `_data/rp/ie-matrix-2026-06-23.json`. **NEXT: draft reply to Niel (cc Nicolette, Adam)** with the workbook + the 51/14-vs-53/13 question. **DONE 24 Jun (email re-audit):** replied to Niel (08:49) with the active-basis workbook; took a call and applied his adjustments; Niel forwarded the numbers to Nicolette, who confirmed **"This is the analysis I was looking for"** (09:54). The 51-vs-53 question is **resolved** — Niel ruled it an acceptable source variance (Miro 51 / HubSpot-matrix 53) until everything is on one environment. Core ask complete. **Follow-on tracked separately as OPS-058** (Nicolette's not-accepted-by-region list + regional reminders).

### [OPS-050] HubSpot pipeline restructure — M0→P4 + Partner Pipeline (S0–S4)
- **type:** ops
- **status:** in-progress
- **priority:** high
- **area:** HubSpot CRM
- **counterparty:** Peter Novak / Niel (Nicolette/Adam sign-off)
- **due:** 2026-08-01
- **source:** transcript
- **notes:** From 22 Jun HubSpot working session (Peter/Niel/Angelus, "Hubspot Chat Option 1" transcript). Plan: add P1–P4 delivery stages to the client pipeline (full M0→P4); build the partner pathway as **S0–S4 mirroring the M-funnel** (Research→Close); normalise the duplicated lead-stage. **23 Jun (proof-of-capability, reversible):** renamed "Partnership Pipeline"→"Partner Pipeline" and restructured its live stages to S0 Research→S4 Close + Formalised/Lost (2 deals migrated). Confirmed full HubSpot write access (pipelines/properties/association-labels). **Gate:** Nicolette/Adam sign-off before client-pipeline changes. Pending design: "Partner" association label on deals + per-deal partner-engagement-stage property (data lives on deal, not a separate proposals pipeline). See memory api-access-overview / project_m_stages.

### [OPS-055] M Process intranet page — first draft (due COB 24 Jun)
- **type:** ops
- **status:** waiting
- **priority:** high
- **area:** SharePoint
- **counterparty:** Kathleen (format) / Nicolette (Ref 2 review)
- **due:** 2026-06-30
- **awaiting:** Kathleen (format pass) + Nicolette (Ref 2 review, COB 26 Jun) on the first draft
- **chase_by:** 2026-06-27
- **source:** direct
- **notes:** **FIRST DRAFT DELIVERED 23 Jun 04:55 (outbound audit)** — sent "Draft M Process" to Kathleen, cc Nicolette: "first draft for the M Process using the template… pulls from Sharepoint, my own knowledge, and the Miro M Process board." Delivered a day ahead of the COB 24 Jun deadline. **Next Angelus milestone: Ref 3 Second Draft, COB 30 Jun.** ⚠️ Confirm the `[TO COMPLETE]` time-in-stage rule (Niel) + `[AI-verify]` M4 contract owners were resolved before sending, or close them in the second draft. **MISSED in earlier triage — logged 23 Jun.** From the SharePoint intranet content brief (`Intranet content page_The M Process.docx`, WhitewaterUsers › 1. Kathleen McGovern › SharePoint pages) + the **"Whitewater Intranet User Journeys"** deck (downloads/; SharePoint landing-page redesign, launch ~9 Jul). **Production schedule: Ref 1 First Draft = Angelus, due COB Wed 24 Jun**; Ref 3 Second Draft = Angelus, COB 30 Jun; reviews Nicolette/Adam/Kathleen through 10 Jul. Page structure (per brief): Intro (goal/audience/prereqs) → Steps M0–M4 (≤10–15, action-voiced, visual placeholders for Kathleen) → If/Then + FAQ → Definition of Done → CTA linking forward to the **P-Process page** (when/how M→P). **Sources now in hand:** Knowledge Bank `01. M Process` (stage-structured), Miro **"M+ Process"** board (`uXjVM06ajJI=`, API-readable) + "Whitewater Core Processes" (`uXjVHXmnTr4=`), live HubSpot M0–M4 stage labels. Claude can draft. Likely sibling: a **P-Process page** to follow. **Tooling built 23 Jun:** `.claude/skills/intranet-page-ingest/` skill (registry of all 6 pages + sources + a doc-builder) — invoke it to draft this (and the other five) into the template. **First draft generated 23 Jun** (ahead of deadline) → `downloads/intranet-pages/Intranet content page_The M Process (DRAFT).docx`, source-grounded from the M+ Process Miro board + live HubSpot M0–M4. **Open before review chain:** resolve `[TO COMPLETE]` time-in-stage rule (Niel — not yet agreed) + `[AI - verify]` M4 contract owners; then Angelus review → Nicolette (Ref 2, COB 26 Jun). **24 Jun (Sharepoint Meeting transcript mined):** alignment meeting (Nicolette, Kathleen, Angelus) confirmed the working model — **Kathleen project-manages the launch pages; Nicolette co-authors with Angelus; Niel is aligned** with the plan/deadlines. M Process is one of **three launch-with pages** (New Starters + P Process). Kathleen has saved the draft as the single point of truth. M may get post-launch adjustments. New Starters page handled by **Ilonka + Kathleen** (not Angelus). P Process page now tracked as **OPS-057**. Summary doc: `ops/meetings/summaries/Meeting Summary SharePoint Launch Alignment 23 June 2026.docx`.

### [OPS-060] Azure trial expiring (~3 days) — protect live SI app + Cost Tracker
- **type:** ops
- **status:** done
- **priority:** high
- **area:** Tools
- **counterparty:** self
- **due:** 2026-06-26
- **closed:** 2026-06-24
- **source:** email
- **RESOLVED 24 Jun:** Angelus upgraded the Azure subscription (off the expiring trial). SI app + API re-verified live (HTTP 200) post-upgrade; live resources (red-pond/gray-tree/wwridatabase) protected. Trial cliff removed.
- **notes:** ⚠️ **Time-critical.** Azure emailed 24 Jun 00:09 "Your Azure trial is ending within three days — upgrade to keep using your account." Production apps run on Azure: **SI app** (`red-pond-0da017a00` Static Web App + `wwridatabase` storage + Functions API, RG WWRI-RPs) and **likely the Cost Tracker** (`gray-tree-043d6aa00` SWA — 2nd SWA token in repo). On trial expiry, resources are disabled then deleted — apps go OFFLINE (incl. the SI app Niel is mid-testing). **Both verified live (HTTP 200) as of 24 Jun, so window intact.** **Fix = upgrade the trial subscription to Pay-As-You-Go in-place** (Portal → Subscriptions → Upgrade): keeps all resources, no migration/redeploy; footprint is ~$0 (SWA Free tier + cents of storage). **Action: confirm in the portal which subscription hosts red-pond/gray-tree/wwridatabase, then upgrade before it lapses.** No Azure CLI / Az module installed locally — Claude can install `az` + drive it once Angelus runs `az login`. See [[structured-interview-app]].

### [OPS-057] P Process intranet page — first draft
- **type:** ops
- **status:** waiting
- **priority:** high
- **area:** SharePoint
- **counterparty:** Kathleen (PM) / Nicolette / Adam (P content owner)
- **due:** null
- **awaiting:** HOLD — do not send/circulate until Angelus signs off. Then: Angelus review → Niel/Adam confirm P1–P4 vs 5-phase + stats → Nicolette (Ref 2) → Kathleen format
- **chase_by:** 2026-06-27
- **source:** transcript
- **notes:** **FIRST DRAFT DELIVERED 24 Jun** → `ops/intranet/pages/Intranet content page_The P Process (DRAFT).docx` (+ `the-p-process.content.json`). Deep-researched via the `intranet-page-ingest` skill from: Knowledge Bank `02. P Process` → `WhitewaterTX P Process - Summary.docx` (authoritative phase structure), the Whitewater Core Processes Miro board, and live HubSpot (confirmed **no P-stages exist yet** — M0–M4 only). Structured as **P1 Engagement of Strategic Owners (→ SPoT + MasterPlan) / P2 Engagement of Implementation Owners (→ Day of Change) / P3 Activation of the Enterprise / P4 From Guide to Support**, each with sub-phases. **Judgment calls flagged for review:** (1) source is a repurposed IT client proposal → abstracted to generic; (2) ~~doc says "5-phase" vs P1–P4~~ **RESOLVED 24 Jun: Phase 5 is retired (confirmed by Angelus) — framework is P1–P4, the old mentoring/sustain Phase 5 folded into P4; draft updated to state this definitively, `[AI-verify]` removed**; (3) honored the meeting's "go-live with what exists" — P3/P4 thinner (folder sizes 87MB/5MB), P4 marked `[TO COMPLETE]` (Adam still building), HubSpot P-tracking `[TO COMPLETE]` pending OPS-050. From the 23 Jun Sharepoint Meeting (alignment with Nicolette + Kathleen). **DEEPER SHAREPOINT VALIDATION 24 Jun (per Angelus's "validate against SharePoint" check):** drilled into the per-phase subfolders + overview deck (not just the Summary doc). Outcome: (a) **P4 fleshed out** with its real sub-phases — 4.1 Navigating at Speed & On-target / 4.2 Monthly & Quarterly Reviews / 4.3 Refreshing Energy & Engagement (dropped the P4 `[TO COMPLETE]` black-box); (b) **added an "Optional add-on modules" section** — the 14-module extension library (Org Design, Process Reengineering, Tech Transformation, Salesforce Effectiveness, Strategic People Planning, Harmonious Rightsizing, Change Readiness, Risk/Root-Cause Analysis, Authority Matrix, Code of Conduct, PIP, Future Business Opportunities) which the first draft omitted entirely; (c) softened the P3 hedge (its 3.1/3.2/3.3 structure is defined). Phase structure now fully reconciled to the SharePoint folder tree. **FULL DEEP-DIVE VALIDATION 24 Jun (5 parallel research agents, one per phase + add-ons — read the actual sub-phase method docs, not just the Summary):** corrected/enriched every phase. P1: added outcome-based workstreams (not by function), the 4+2 workstream structure, readiness diagnostic + assessment pack, Conditions for Success, single "End of Phase 1 report" deliverable; "Merlin workshops"→"a Merlin workshop". P2: added the opt-in ownership mechanic, the Assurance Action Plan + cascade, slogan/visual, control systems, Day-of-Change structure (frontline-aimed, equal presentation/breakout, "start not finish"). P3: **removed an unsupported claim from the first draft ("~12 people, led by Implementation Owners")** — replaced with Behaviour Change Workshops within 2 wks of Day of Change building STOP/DO commitments at 3 levels; added RAG thresholds (90/70%) + slip rules + two-tier cadence (Programme Director↔Implementation Owners, then lead↔CEO) + Team Assurance Report; 3.3 "pivot"→"revalidate". P4: confirmed genuinely thinnest (4.3 doc is a placeholder dup of 4.2) — kept an honest "least developed" caveat; aligned 4.2 to the real re-diagnosis content. Add-ons: **Change Readiness diagnostic is an empty stub → demoted to "in development"**; fixed KB path; added maturity note. All client-specific examples (Gooroo/Yoplait/Danone/PwC/BWI/tyre-mfr/SODIAAL/SMEC/Rotam etc.) kept OUT of the page. Draft now word-validated against the per-sub-phase SharePoint docs. P Process is one of the three launch-with intranet pages (alongside M Process / OPS-055 and New Starters). **Sibling to OPS-055; same template/skill** (`intranet-page-ingest`, all 6 pages registered). **Strategy agreed in the meeting:** publish a **go-live version with what exists today**; the further along P you go, the less it's documented — **P3 in particular is not yet built out (Adam is still building the rest of P)** → use placeholders / forward-links and add detail over the following months. **Due date not in transcript** (the timing plan Kathleen presented fell in a ~17-min transcription gap) — confirm the P Process deadline with Kathleen; launch window ~9 Jul per the User Journeys deck. Draft via the intranet skill → output to `ops/intranet/pages/`. source_ref: `ops/meetings/transcripts/processed/Sharepoint Meeting.docx`.

### [OPS-058] HubSpot RP not-accepted list by region + regional reminders
- **type:** ops
- **status:** open
- **priority:** high
- **area:** HubSpot CRM
- **counterparty:** Nicolette (requester); Adam (cc APAC); Niel (cc EMEA)
- **due:** null
- **source:** email
- **notes:** Follow-on from OPS-051. **Nicolette (23 Jun 13:19):** turn the list of RPs who have NOT accepted the HubSpot invite into a by-region list so follow-up can be divided — **Board members → Nicolette; APAC non-board → Angelus sends individual reminders cc Adam; EMEA → Angelus sends individual reminders cc Niel; Americas → Nicolette (still in training).** Nicolette (18:33) said she sent her own notes to Raj/Bernard/Luke/Dario/Laurel. **Angelus's portion (APAC non-board cc Adam + EMEA cc Niel) status UNCONFIRMED — logged open pending Angelus confirmation.** Source data: the Active-basis adoption workbook from OPS-051 (`ops/pipeline/rp-adoption/`).

### [OPS-059] Intranet pages — wider set first drafts (Way We Work, Operations, Marketing)
- **type:** ops
- **status:** waiting
- **priority:** medium
- **area:** SharePoint
- **counterparty:** Nicolette (Ref 2 review) / Kathleen (format)
- **due:** null
- **awaiting:** HOLD — do not send/circulate until Angelus signs off. Then: Angelus review → Nicolette/Kathleen review chain (same flow as M/P)
- **chase_by:** 2026-07-01
- **source:** direct
- **notes:** Beyond the launch trio (M/P/New Starters), drafted the rest of Angelus's intranet set 24 Jun via `intranet-page-ingest`: **The Way We Work** (grounded in `WWRI_Purpose & Culture 2026.pptx` — purpose + 9 leadership principles / Whitewater DNA; ways of working = ownership/proactivity/ask-for-help), **Operations** (grounded in the `00. Administration > 01. SOPs & Governance` library — SOP master list + activated SOPs + control/development plan; flagged undefined SOPs 008–010 and a missing who-owns-what RACI), **Marketing** (grounded in `01. Marketing` — Brand Assets & Templates, Message House & Positioning, collateral). Drafts in `ops/intranet/pages/` (+ matching `.content.json`). **Set status: 5 of 6 drafted (M, P, Way We Work, Operations, Marketing).** **New Starters is NOT here — owned by Ilonka + Kathleen** (per the Sharepoint Meeting); confirm with Kathleen whether she wants the skill to generate a starter draft for Ilonka. `[AI-verify]`/`[TO COMPLETE]` markers carried in each draft (culture principles wording; tool-access + marketing/SOP-governance owners). All 6 pages registered in `.claude/skills/intranet-page-ingest/pages.json`. **DEEP-DIVE VALIDATION 24 Jun (3 parallel agents — M Process excluded, already validated):** **Way We Work** — purpose + 9 leadership principles confirmed verbatim vs WWRI_Purpose & Culture 2026 (no newer statement exists); cleared the `[AI-verify]`; reframed "ownership/proactivity/ask-for-help" as page guidance (NOT documented doctrine — it's the page-brief framing, not in the source); fixed KB paths → 0 flags. **Operations** — read the actual SOP docs: only SOP 001 & 006 are formally activated (rest loose/draft); **corrected an unsupported claim (draft said contracts QC'd by 'Co-Founders' + board approval — not in the SOP)** → now Admin/Finance Manager drafts, authorised reviewer + engagement lead review; filled financial-approval owners (ELT/Admin & Finance Mgr, escalate to Director/Board per SOP 001 matrix), invoicing (Accounts team + Finance Mgr in Xero), SOP governance = ELT level; QC confirmed draft. Remaining open flags are genuine: tool-access owners (no SOP names them), confirm individuals in contract roles, no published RACI exists. **Marketing** — **resolved the positioning `[AI-verify]`**: the draft had mislabeled the firm purpose as the Message House; real tagline = **"Don't transform. Reinvent."**, claim = "further, faster, safer", with 5 conversation pillars (purpose cross-referenced to Way We Work, not pasted); marketing contact = **Kane**; corrected brand-asset list (no standalone logo folder, added Chatham House Rule, Outreach Playbook singular) → 0 flags. All client examples (PwC/Yoplait/Danone/Sodiaal/Domino's etc.) and named individuals kept OUT of all three pages.

---

## MEDIUM PRIORITY

### [OPS-061] Reconcile new RPs from June global meeting into register / HubSpot / AllCompany
- **type:** ops
- **status:** waiting
- **priority:** medium
- **area:** HubSpot CRM
- **counterparty:** Mike Swetman / Carl Meyer (invite acceptance)
- **due:** null
- **awaiting:** Mike Swetman + Carl Meyer to accept their HubSpot invites
- **chase_by:** 2026-06-27
- **source:** transcript
- **notes:** Mined from the June 2026 Global RP Monthly Meeting (combined summary in `ops/meetings/summaries/`). New RPs: **Julie Rhodovi, Ryan Eidsness** (new), **Mike Swetman** (training; APM Terminals opp), **Vanessa Iloste** (new, APAC/Singapore — full name resolved from the register), **Carl Meyer** (OPS-044). **RECONCILED 24 Jun (verified, not just proposed):** all five are already **active in the RP register / IE Skills Matrix SSOT** with correct regions (Julie/Ryan/Carl = Americas, Vanessa = APAC, Mike = EMEA) and a HubSpot free seat each; **verified all five on the `Ww-Ri AllCompany` list against the current 24-Jun export** (`_data/rp/Members_Ww-Ri AllCompany_06242026_145718.csv`, 65 members; the 06-19 export was stale). So register + AllCompany = done. **Only residual:** HubSpot invite acceptance — Julie/Ryan/Vanessa have **accepted**; **Mike Swetman (invited, never logged in)** and **Carl Meyer (OPS-044)** still pending → resend/accept via HubSpot admin UI (not API-drivable). **Monitor, not yours to drive:** HubSpot pipeline reflecting the meeting's commercial moves (Renesas won, HP RFP/SOW, Link Logistics SOW, 9 new M1s) — rp-pipeline-sync (DEV-002) if actioned. See [[rp-register-ssot-pipeline]], OPS-047/048. source_ref: `ops/meetings/transcripts/processed/Global RP Meeting June 2026 - *.docx`.

### [OPS-062] RP Register active-status / membership diverges from the IE matrix
- **type:** ops
- **status:** in-progress
- **priority:** medium
- **area:** Tools
- **counterparty:** self
- **due:** null
- **source:** direct
- **notes:** **Flagged by Angelus 24 Jun:** the RP Register's active status doesn't seem to match the IE matrix he supplied. **Confirmed + quantified** by the DEV-007 **S3 reconcile propose diff** (rebuilds from `ie-matrix-2026-06-23.json` + HubSpot export + Azure workbook blob, diffed vs live `toolkit/data/rp/register.json`, no write): **0 added · 15 removed · 86 changed.** (1) **86 changed**, many flipping **`active: false→true`** (e.g. Dario Marchetti, David Riegel, Dennis Sorenson) — the matrix marks people active that the register marks inactive. (2) **15 "removed"** = present in the live register but ABSENT from the matrix/workbook, **including the 5 new RPs from OPS-061** (Carl Meyer, Julie Rhodovi, Ryan Eidsness, Vanessa Iloste, Mike Swetman) **+ James Vigne, Karine Artus, Jeremy D'Cruz, Jim Wetrich, Luke Schrotberger, Tania Rowland, Yoshiaki Ito, Ales Fojtik, Geraldine Maouchi, Maria Berger.** **Diagnosis:** register and matrix have diverged BOTH ways — matrix fresher on active-status; register fresher on membership (holds people the matrix lacks, because OPS-061 added the new RPs to the register output directly, not to the upstream matrix/workbook). **So a blind rebuild would DELETE 15 people incl. the new RPs — NOT a safe one-click reconcile.** **TO DO:** (a) confirm which IE matrix is current/authoritative — is there a matrix newer than 2026-06-23 that already includes the new RPs + correct active flags? if so, ingest it to `_data/rp/` and re-propose; (b) decide the merge rule [gate (c)]: upstream updates `active`/status fields, but register-only additions are RETAINED (or flagged), never deleted; (c) make `build-rp-snapshot`/the reconcile merge-not-clobber before Approve is ever used; (d) then re-propose to bring active-status into line. **UNTIL THEN: do NOT click Approve on the cockpit reconcile** — the diff is safe to view, but approving would clobber the new RPs. Surfaced by [[rp-register-ssot-pipeline]]; see DEV-007 (S3), OPS-061.
  - **DIAGNOSED 24 Jun (pulled the LIVE matrix from SharePoint** — WWTXELT, `Whitewater Reinventions - IE Skills Matrix - 2025.xlsx`, driveId b!aLy3...; cached to scratchpad): **the live matrix is current & authoritative** — contains all 5 new RPs **active**, 53 active (statuses Active/Inactive/Alumnus/Deactivated/Pending). **The 15-removed/86-changed diff was purely an artefact of the STALE `ie-matrix-2026-06-23.json` extract the cockpit read.** Register active-flags AGREE with the live matrix for every shared person (**0 status conflicts**). 4 apparent mismatches are name-spellings: Daniel→"Daniel (Daan)" Vermaas, Eduard→"Ed" van Zyl, Luis Maia→"Luis Faria e Maia", **Zhou Zhiyong→"Joe Zhou"** (first 3 in build ALIASES; ADD Zhou↔Joe Zhou). **REAL residual = 6 register-active people NOT on the matrix Active IE List:** Eddie Ahmed, Antoine Hauguel, Jaqui Lane, John Hanna, John Hellinikakis, Kai Hughes → **Angelus to decide: leadership/support (keep active) vs stale (deactivate).** **PLAN:** (1) refresh extract → `_data/rp/ie-matrix-2026-06-24.json` from the live file; (2) re-propose (expect clean diff); (3) resolve the 6; (4) approve w/ sign-off. Live matrix also carries **Languages (cols 27-33)** + Region/Cohort → fold into the extract to give the register languages (feeds DEV-007 RP-database vision).
  - **ROOT CAUSE FOUND + SAFE PREP DONE 24 Jun (no writes):** the pipeline is matrix → `harmonise-from-matrix.mjs` (sets `active = matrixStatus==='Active'`, writes Azure `wwct/workbook.json` blob) → `build-rp-snapshot.mjs` (workbook → register.json). **`active`/membership come from the WORKBOOK, not the matrix directly** — and harmonise was reading a **dead session-scratchpad matrix path**, so the workbook's active flags were frozen against an old matrix. **FIXED (local, safe):** built durable `_data/rp/ie-matrix-2026-06-24.json` (126 ppl, 53 active, **+languages** cols 27-33); repointed `harmonise-from-matrix.mjs` at the latest `_data/rp/ie-matrix-*.json` (removed dead path) + added `zhouzhiyong→joezhou` alias. **DRY-RUN vs live matrix:** **39 active→false** (19 Deactivated, 11 Alumnus, 1 Inactive [Jan Soucek], **8 Pending** [judgment call — Takehiko Aoki, Thomas McCabe, Darryl Wee, Alice Lopin, Sietske Rozie, Bernard Tan, Sim Lim, Jess Tayel]) + ~30 region backfills. **29 register-active NOT on matrix = kept active by design** (leadership/support; incl. the earlier '6'). **Data-quality:** duplicate "Jaqui Lane"/"Jacqui Lane" (merge); Sorcek vs Soucek correctly distinct. **Membership gap:** the 5 new RPs are matrix-active but NOT in the workbook (115 vs 130) → rebuild still drops them; harmonise won't add matrix-only people → must add them to the workbook. **HELD FOR SIGN-OFF (writes Azure blob + deactivates 39):** decisions needed — (1) Pending = active or inactive? (2) confirm the 29 non-matrix stay active; (3) OK to add the 5 new RPs to the workbook. Then `harmonise --apply` → `build-rp-snapshot` → register.json; cockpit reconcile then clean.
  - **PENDING DECISION RESOLVED 24 Jun:** Angelus confirmed **Pending = mid-onboarding → keep ACTIVE.** Harmonise rule updated to `active = (status Active OR Pending)`. Re-dry-run: **54 changes = 31 active→false (19 Deactivated, 11 Alumnus, 1 Inactive) + 35 region backfills**; 8 Pending now retained active; 29 non-matrix retained. **(1) APPLIED 24 Jun (Angelus signed off):** `harmonise --apply` written to the live Azure workbook blob — 31 deactivated, 35 regions backfilled, 8 Pending kept active; backup `scratchpad/live-workbook-backup-pre-harmonise.json`. Re-dry-run = **0 changes (verified in sync).** **(2) DONE 24 Jun:** added the 5 new RPs to the workbook (backup `live-workbook-backup-pre-addrps.json`); regenerated register.json (120 ppl, 82 active, 5 new RPs present+active). **BUT membership gap is bigger than 5:** rebuild dropped 10 matrix-ACTIVE people who were in the old register but not the workbook (James Vigne, Jeremy D'Cruz, Jim Wetrich, Luke Schrotberger, Tania Rowland, Yoshiaki Ito, Ales Fojtik, Geraldine Maouchi, Maria Berger + Karine Artus[Pending]). **Full audit: 21 matrix Active(9)+Pending(12) people missing from the register/workbook.** register.json currently REGRESSED (missing these 21). **HELD FOR DECISION:** add all 21 to workbook (full matrix alignment) vs add the 9 Active now + hold the 12 brand-new Pending? The 12 Pending have no seat/subscription data (would default to none). Root issue = workbook isn't auto-populated from matrix; harmonise should ADD matrix-active people missing from the workbook (enhancement) so this doesn't recur. Old register.json (130/60) was overwritten (not git-tracked) — no rollback, but the workbook backups exist.
  - **RESOLVED 24 Jun (Angelus: "add all 21"):** added all 21 missing matrix Active+Pending to the workbook (backup `live-workbook-backup-pre-add21.json`); rebuilt register.json → **141 people, 103 active; verified 0 matrix Active+Pending missing; cockpit reconcile diff = CLEAN.** Register now matches the live matrix. **KPI nuance:** register "active" = 103 (53 matrix-Active RPs + 20 Pending/onboarding + ~30 non-matrix leadership/staff) — broader than the matrix's strict "53 active RPs" headline (Nicolette's figure). If a strict active-RP count is wanted on the dashboard, add a sub-count (role==='Reinvention Partner' && matrixStatus==='Active'). **FOLLOW-ONS (minor):** (a) workbook duplicate "Jaqui Lane"/"Jacqui Lane" — dedupe; (b) ENHANCEMENT [DONE 24 Jun, DEV-007 S6]: `harmonise-from-matrix` now AUTO-ADDS matrix Active/Pending people missing from the workbook (self-healing; also fixed its dead-scratchpad backup path); (c) [DONE 24 Jun, DEV-007] folded matrix Languages into build-rp-snapshot→register.json + RP Register UI (column + language filter). Cockpit users: refresh RP Register to see the corrected roster; restart cockpitd to pick up the S3 reconcile button.

### [OPS-063] Cost tracker — add Xero subscription costs (US + EU) + validate June vs July
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Finance
- **counterparty:** Jeremy (accountant)
- **due:** null
- **source:** transcript
- **notes:** From the 24 Jun Ops Meeting (+ Angelus's meeting with Jeremy). (1) The platform/subscription cost tracker currently does **not capture the annual Xero subscriptions** for the US and EU entities — add them. (2) **Validate the cost model**: Jeremy wants to check **June actuals vs the projected July** figure — they should match (no new cohort starts in July), which would give confidence in the model. HubSpot seat allocations incl. Cohort 17 already counted. source_ref: `ops/meetings/transcripts/processed/Operations Meeting 24 June 2026 (transcript).docx`.

### [OPS-064] July global monthly meetings — fix dates + organiser/invites
- **type:** ops
- **status:** in-progress
- **priority:** medium
- **area:** Operations
- **counterparty:** Kane / Niel
- **due:** 2026-07-21
- **source:** transcript
- **notes:** From 24 Jun Ops Meeting. **EMEA = 28 Jul** (4th Tuesday); **APAC/Americas** was wrongly set to the 22nd and must **move** (likely 21st/22nd per the EMEA-then-next-day pattern — confirm). Angelus started fixing on the call. Also: **make Niel an organiser** on the global meeting invites (and Nicolette/Adam as appropriate) so coverage/edits work; **Kane to confirm all invites include Angelus, Niel, Nicolette (+Adam)**. Vanessa Iloste's request to rename EMEA→EMEA/APAC was **declined** (names stay; partners may attend either/both). source_ref: same transcript.

### [OPS-065] AI capability session with Niel (ops knowledge-share)
- **type:** ops
- **status:** open
- **priority:** low
- **area:** AI/Internal
- **counterparty:** Niel
- **due:** null
- **source:** transcript
- **notes:** From 24 Jun Ops Meeting. Niel wants a dedicated session for the three of them to **harness AI operationally** (remove low-value noise so the team focuses on judgement work). Angelus to walk Niel through the assistant/cockpit (skills/workflows/harness). Also review what others have built: **Ryan Dancey** (3 AI agents on Slack for marketing/BD), **Eric**, **Simran**. Keep the line Kane drew: automate busy-work, never the judgement/relationship work. source_ref: same transcript.

### [DEV-008] Custom domain for the WWRI Azure apps
- **type:** dev
- **status:** open
- **priority:** low
- **area:** Tools
- **counterparty:** self
- **due:** null
- **source:** transcript
- **notes:** From 24 Jun Ops Meeting — Angelus wants to stop using the randomly generated `*.azurestaticapps.net` URLs (Cost Tracker `gray-tree-043d6aa00`, SI app `red-pond-0da017a00`) and serve them under a **proper custom domain** (more shareable/professional; easier for Niel et al. to bookmark). Likely needs buying/owning a domain + Azure Static Web Apps custom-domain config (CNAME/TXT). Low priority, quality-of-life. source_ref: `ops/meetings/transcripts/processed/Operations Meeting 24 June 2026 (transcript).docx`.

### [OPS-053] Review Miro team join requests
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Tools
- **counterparty:** self
- **due:** null
- **source:** email
- **notes:** Pending Miro "wants to join your team" requests: **Grace Mckanna, Nataliya Bauhuber** (Cohort 17 RP), **Ryan Dancey, Peter Thommen**. Approve legitimate RPs / deny others. Watch seat count vs OPS-022 (22-seat Business plan, Aug renewal). Ryan Dancey also relates to OPS-020/OPS-028.

### [OPS-005] Reconcile capital injection and loan entries
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Finance
- **counterparty:** self
- **due:** null
- **source:** retrospective
- **notes:** Injection came through as shareholder and intercompany loans totalling ~AUD 34,785 against AUD 35,000 sought. Confirm whether small shortfall is outstanding or unrecorded. Loan repayments absent from forward forecast — flatters projected position if any fall due within window. This is Angelus's remit, not the CFOs'.

### [OPS-007] HP proposal: resolve four in-deck comments
- **type:** ops
- **status:** waiting
- **priority:** medium
- **area:** HP Inc.
- **counterparty:** Nicolette
- **due:** null
- **source:** retrospective
- **notes:** Awaiting Nicolette's decision. Items: contents order vs. slide order; Phase 1B starting on a Saturday (1 Aug, 3 Aug if not intended); first-name reference to Horacio; EBITA vs. EBITDA on supply-chain case study.

### [OPS-009] SharePoint duplicate — prepare v2 for side-by-side comparison
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** SharePoint
- **counterparty:** Niel / Nicolette
- **due:** null
- **source:** retrospective
- **notes:** Claude Code work on local SharePoint duplicate. Prepare v2, specify what is required to finish, propose a completion date.

### [OPS-010] Apply HP/Whitewater costing sheet index fix
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** HP Inc.
- **counterparty:** self
- **due:** null
- **source:** retrospective
- **notes:** tblInvoicing1 duplicate index issue. A161 index correction plus latent A159 phase flag issue. Fix diagnosed and recommended.

### [OPS-012] Confirm Henri entered 8vance targets into HubSpot
- **type:** ops
- **status:** check-status
- **priority:** medium
- **area:** Pipeline
- **counterparty:** Henri
- **due:** null
- **source:** retrospective
- **notes:** End-of-May threshold (Nicolette's) has passed. Confirm whether company names and individuals have actually been entered into HubSpot, regardless of stage. Separate from the partnership question itself.

### [OPS-014] Reinvention Partner rename: update priority marketing materials
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Rename
- **counterparty:** self
- **due:** 2026-08-30
- **source:** retrospective
- **notes:** Phase 1 deliverables: pitch decks, capability statement, proposal template.

### [OPS-015] Provide billing data to Adam
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Admin
- **counterparty:** Adam Salzer
- **due:** null
- **source:** retrospective
- **notes:** **Unblocked 17 Jun — Luis's travel expenses now in hand** (captured on AP control sheet: Tx1379 Luis $13,484.74 / 9-Jun, Tx1373 Luis $12,887.36 / 4-Mar). Compile billing data and send to Adam.

### [OPS-018] Finance workbook Stage 8: native cashflow charts
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Finance
- **counterparty:** self
- **due:** null
- **source:** retrospective
- **notes:** Line chart, revenue-by-region column chart, cash sales pipeline stacked column chart. AU plus EU. Handover to Jeremy ongoing.

### [OPS-019] Merlin Initiative: confirm revenue splits and validate IE financial model
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Merlin
- **counterparty:** self
- **due:** null
- **source:** retrospective
- **notes:** Three regional sessions done, cross-regional analysis v2 finalised. SPoT: AUD 30M annual revenue by 30 Jun 2029. Next: confirm regional revenue splits; validate IE financial model (135–180 active IEs, EUR 200K income target per active IE).

### [OPS-020] AI working group: Nicolette steer on Teams chat + Ryan Dancey inclusion
- **type:** ops
- **status:** waiting
- **priority:** medium
- **area:** AI/Internal
- **counterparty:** Nicolette (steer), Ryan Dancey
- **due:** null
- **source:** retrospective
- **notes:** Email sent to Nicolette (cc Simran) putting two decisions to her: standing up a Teams group chat, and how to bring Ryan in. Ryan asked about a discussion forum — answer pending Nicolette's response.

### [OPS-021] Case study spec: alignment meeting with Nicolette
- **type:** ops
- **status:** waiting
- **priority:** medium
- **area:** Case Studies
- **counterparty:** Nicolette
- **due:** null
- **source:** retrospective
- **notes:** Awaiting Nicolette to schedule. No build begins until format, style, tone and word count are aligned. Her action from 21 April.

### [OPS-022] Miro licence review
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Tools
- **counterparty:** self
- **due:** 2026-07-15
- **source:** retrospective
- **notes:** Business plan, 22 seats. Guest vs. Visitor access model confirmed. Review ahead of August 2026 renewal.

### [OPS-033] Validate HP Project Costing in HubSpot (weekly)
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** HP Inc.
- **counterparty:** Nicolette
- **due:** 2026-06-23
- **source:** email
- **notes:** Recurring weekly check. Validated as of 16 Jun. Next due ~23 Jun.

### [OPS-034] Reflect Laurel's warehousing fees in WW systems
- **type:** ops
- **status:** waiting
- **priority:** medium
- **area:** Finance
- **counterparty:** Jeremy
- **owner:** Jeremy
- **due:** null
- **source:** email
- **notes:** Jeremy's task — Laurel Marshall's IE/referral fees for Renesas (mid-Dec 2026, end-Dec payment) to be reflected in WW systems. Believed handled but not confirmed. Follow up with Jeremy to verify. **17 Jun finance mtg:** Renesas IE payments deferred — **Nicolette to September**, Laurel to December. Angelus added a September note for Nicolette to the AP control sheet (December for Laurel already there). Domino's Phase 2 referral fees deferred to October — Oct marker also added to control sheet.

### [OPS-035] Reply to Seamus re HubSpot deal entry
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** HubSpot CRM
- **counterparty:** Seamus Power
- **due:** null
- **source:** email
- **notes:** Seamus has view-only seat — can't add deals. Decision needed: (A) upgrade to core seat if he'll use HubSpot regularly for BD; (B) reply telling him to email updates to Angelus who will do the data entry for now. Lean toward B unless Seamus confirms regular BD usage. Related to OPS-027.

### [OPS-036] Reschedule Cost Tracker review with Jeremy
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Tools
- **counterparty:** Jeremy
- **due:** null
- **source:** email
- **notes:** Attempted 16 Jun morning — Jeremy's internet was down. Reschedule once Jeremy is back online.

### [OPS-037] Christmas Accelerator IER Payments — outstanding balance
- **type:** ops
- **status:** check-status
- **priority:** high
- **area:** Finance
- **counterparty:** Adam Salzer / Luis Maia
- **due:** null
- **source:** email
- **notes:** Meeting held. Tx1354 renegotiated (CN1370 applied). Tx1371 Final = $17,550. IE split: Adam $7,425 (2×$3,712.50), Luis $3,712.50. Luis paid — AP control sheet had not been updated, hence appeared outstanding. **Update (16–18 Jun, Domino's Japan thread):** Jeremy confirmed "all paid already", paid on the 12th; AP sheet was stale. **Action to close:** verify the AP control sheet reflects all Tx1371 payments (incl. Adam's $3,712.50), then mark done.
- **VERIFIED AGAINST AP CONTROL SHEET 23 Jun** (live SharePoint read, "Dominoes Japan" tab — Christmas Acceleration block, rows 21–24): Tx1371 Final split into 3× $3,712.50 (Adam ×2, Luis ×1), total AP $11,137.50. **Luis $3,712.50 = paid (date stamped). Adam tranche 1 $3,712.50 = paid (inv 11503, date stamped). Adam tranche 2 $3,712.50 (row 22) = STILL BLANK — no paid date, no invoice no.** So the sheet is still stale for exactly the one line flagged. **To close:** confirm with Jeremy whether Adam's 2nd $3,712.50 was actually paid on the 12th (he said all paid); if yes, have Rebecca/Accounts stamp the paid date on row 22, then mark done. Earlier milestones clean: Tx1352 + Tx1353 both show Adam $14,850 / Luis $7,425 paid; Tx1354 credited (CN1370); Tx1358 cancelled.

### [OPS-039] Schedule meeting with Peter Novak re HubSpot spec
- **type:** ops
- **status:** done
- **priority:** high
- **area:** HubSpot CRM
- **counterparty:** Peter Novak
- **due:** null
- **source:** email
- **notes:** Peter emailed 15 Jun asking for a time to meet re the HubSpot specification (his "main areas": two sales processes — Lead-to-Cash and Lead-to-Partner MOU/Contract; Contact/Account lifecycle management; licence stays current for now). **17 Jun: replied asking for his availabilities.** **Update (17 Jun 23:46):** Peter offered Monday or Wednesday next week; Niel confirmed both work; Angelus replied to lock a day. **22 Jun: sent two opt-out invites for the Monday slot** (zones: Mountain=Peter UTC−6 MDT, Central Europe=Niel UTC+2 CEST, Sydney=Angelus UTC+10 AEST). **Option 1:** Mon 7am MT / 3pm CET / Mon 11pm Syd (Angelus takes the 11pm). **Option 2:** Mon 3pm MT / 11pm CET / Tue 7am Syd. Reply-all asked Peter+Niel to accept whichever works; if neither lands, regroup later this week. Risk flagged: Peter's 7am (Option 1) depends on him being at his desk early. Waiting on Peter/Niel acceptance. Related to OPS-001, OPS-003; note also the separate licence-structure meeting (audit item N4). **DONE 22 Jun:** the HubSpot spec session was held (Peter/Niel/Angelus, "Hubspot Chat Option 1" transcript); Peter accepted the invite. Decisions captured in **OPS-050**; remaining HubSpot work tracked there.

### [OPS-038] Mark Beliczky — pipeline update (M0/M1)
- **type:** ops
- **status:** done
- **priority:** medium
- **area:** Pipeline
- **counterparty:** Mark Beliczky
- **due:** null
- **source:** direct
- **notes:** DONE — Mark confirmed 17 Jun that all his target companies are in HubSpot. No further action.

### [OPS-041] Pascal Nyckees access — confirm WWRI mailbox access then reissue invite
- **type:** ops
- **status:** done
- **priority:** medium
- **area:** SharePoint
- **counterparty:** Pascal Nyckees
- **due:** null
- **closed:** 2026-06-19
- **source:** email
- **notes:** **CLOSED 19 Jun (email audit):** Pascal replied 18 Jun 08:49 "All ok :)" — HubSpot invite link worked, access confirmed. Trail: invite originally went to his WW mailbox (which he hadn't checked); Angelus reissued the direct HubSpot invite link 18 Jun 01:50; Pascal confirmed working same day.

### [OPS-025] Chase Zuzana Bato re Filip Kegels (potential client)
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Pipeline
- **counterparty:** Zuzana Bato
- **due:** null
- **source:** retrospective
- **notes:** Awaiting her response. Follow up.

### [OPS-026] Confirm Mar Gauci availability (Australia cohort)
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Pipeline
- **counterparty:** Mar Gauci
- **due:** null
- **source:** retrospective
- **notes:** Australia cohort availability to confirm. Note: "Mar Gauci" not "Mark".

### [OPS-027] Confirm Raj and Seamus availability and activation
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Pipeline
- **counterparty:** Raj, Seamus Power
- **due:** null
- **source:** retrospective
- **notes:** Availability and activation outstanding. Note: "Power" not "Powers" for Seamus.

### [OPS-044] Carl Meyer — HubSpot onboarding / assist
- **type:** ops
- **status:** waiting
- **priority:** medium
- **area:** HubSpot CRM
- **counterparty:** Carl Meyer (Kane requester)
- **due:** null
- **awaiting:** Carl to log in to HubSpot via the invite sent 17 Jun
- **chase_by:** 2026-06-25
- **source:** email
- **notes:** Kane asked 17 Jun to reach out and assist Carl with HubSpot (Carl in Milwaukee — his afternoon/evening = Angelus's morning). **Invite link sent 17 Jun 23:53** with admin-approval-bypass instructions. Waiting on Carl to log in; may need a walkthrough call once he's in. **24 Jun:** Carl attended the June Global RP Meeting (APAC/Americas) and is actively onboarding — confirm his HubSpot login/seat is live, then close. See also OPS-061.

### [OPS-045] HubSpot Deal Views — add 'RP Support' column
- **type:** ops
- **status:** done
- **priority:** medium
- **area:** HubSpot CRM
- **counterparty:** Niel
- **due:** null
- **source:** email
- **notes:** DONE — Niel 16 Jun asked to add the 'RP Support' column next to Deal Owner across all Deal Views. Completed (confirmed by Angelus 18 Jun).

---

## LOW PRIORITY / WATCH / DEFERRED

### [OPS-054] Watch: Dieter SharePoint access during DPJ Phase 3 negotiation
- **type:** ops
- **status:** watch
- **priority:** medium
- **area:** SharePoint
- **counterparty:** Adam / Luis
- **due:** null
- **source:** email
- **notes:** **DONE part (22 Jun):** Angelus removed Dieter's HubSpot **Users** access; Adam moved Domino's Japan **Contracts** to Luis's user so Dieter can't review during Phase 3 negotiation; Luis confirmed 23 Jun "right move." **RESIDUAL RISK (Luis 22 Jun):** Dieter still has **SharePoint** file access to the contracts ("just need to pray he doesn't use SharePoint"). Watch — consider tightening SharePoint permissions on the Domino's contracts folder.

### [OPS-056] Revoke Rhiannon Melan's HubSpot seat (offboarding)
- **type:** ops
- **status:** done
- **priority:** low
- **area:** HubSpot CRM
- **counterparty:** self
- **due:** null
- **closed:** 2026-06-23
- **source:** retrospective
- **notes:** **DONE 23 Jun — Angelus deactivated Rhiannon's HubSpot seat** (along with the other genuinely-gone people: Winfried Schultz, Dario Marchetti, Hervé Richert, Jan Soucek, Steve Monaghan). Free/view-only seat so no cost impact; register already excluded her. See OPS-048 for the full harmonisation.

### [OPS-052] Reply to Cary Clifford — reference for Rhiannon Melan
- **type:** ops
- **status:** done
- **priority:** low
- **area:** Admin
- **counterparty:** Cary Clifford (Camino Bakery)
- **due:** null
- **closed:** 2026-06-23
- **source:** email
- **notes:** **DONE 23 Jun** — reference sent. Rhiannon = 6-month WW intern (Angelus oversaw/worked alongside). Covered Cary's four Qs: strengths (proactive; drove company-data organisation/innovation; strong communicator; collaborative — well-suited to a wholesale & data manager role), no meaningful weakness (consistent high performer; early-career growth = continued breadth), rated highly / recommended without hesitation.

### [DEV-006] Structured Interview app — Azure data layer + deploy (LIVE)
- **type:** dev
- **status:** in-progress
- **priority:** medium
- **area:** Tools
- **counterparty:** Niel (tester)
- **due:** null
- **source:** direct
- **notes:** **DONE 23 Jun.** Rebuilt the SI React app onto a hardened Azure data layer: JSON-Schema-2020-12-validated engagement datasets (framework snapshotted per engagement), Azure Functions API (schema + cross-ref gated CRUD, multi-dataset), app wired to it (engagement picker → hydrate → debounced autosave — fixes the no-persistence blocker). Deployed as Azure **Static Web App** (repo `WWRI-Structured-Interviews`, RG WWRI-RPs) against existing **wwridatabase** storage (container `wwri-si`). **LIVE: https://red-pond-0da017a00.7.azurestaticapps.net** — full public CRUD verified end-to-end. **Remaining:** rotate wwridatabase key1 (shared in-session) + update SWA env; browser acceptance test; hand URL to Henri. See memory structured-interview-app. **24 Jun (email re-audit + diagnosis):** Niel tested, liked the setup flow, but reported an error on "result" + a persistence/back question. **Diagnosed:** Niel's screenshot was a **401 Unauthorized on a different, auth-gated app** (`identity.7.azurestaticapps.net`), NOT this SI tool — the SI app (`red-pond-0da017a00.7.azurestaticapps.net`) is verified **public** (HTTP 200, no `.auth` redirect, `/api/engagements` 200) and its data layer validates cleanly against the hardened schema for every shape the app emits. Likely Niel was sent/using the wrong link. **24 Jun: Angelus sent Niel the correct red-pond link.** **Awaiting Niel to retest Results there.** If it still errors, reopen — fix ready: guard `buildQuestions` (`tc.questions[stId]` → `(tc.questions||{})[stId]`, `st.examples[0]` → `(st.examples||[])[0]`) + add a Results error boundary. Persistence answer for Niel: there IS an Engagements picker + "← Engagements" button; no per-engagement deep link by design. Multi-interviewer collaboration on one project = a real future-phase request from Niel.
  - **TESTED 25 Jun (Niel + Angelus, Wednesday):** app working. Retest confirmed — 401 issue resolved; persistence/layout accepted. **Remaining open work:** (1) interviewer name missing from results page; (2) CSS centring (Setup/Results left-aligned); (3) future: import transcript to populate answer blocks (Niel's request, human scoring only).
  - **UI FLAG (Angelus, 24 Jun):** content in the SI app reads as largely **left-aligned, not centred** — looks unbalanced. Investigate the app's layout CSS (likely a missing max-width container / `margin:0 auto` on the main content wrapper, or left-aligned panels). Cosmetic/polish, but worth a pass before wider rollout to Henri. Confirm intended look with Angelus (centre the content column vs keep left-aligned for forms).
  - **CSS ASSESSMENT 24 Jun (`structured-interview/app/index.html`, single-file React + inline styles; no changes made):** root cause = **no shared layout wrapper** — every tab declares its own container inline and only SOME add `margin:'0 auto'`. **Left-aligned (maxWidth, no auto-margin):** Setup `L445` (900), bg/context editors `L628` (780)/`L647` (640), empty state `L696` (560), **Results/Benchmarks `L733` (1100)**. **Already centred:** Interview view `L669` (1100), Report `L948` (860), picker `L1134` (760). The two heaviest screens (Setup, Results) are in the left group → the imbalance Angelus saw. **Normalise:** (1) add `margin:'0 auto'` to the 5 left containers [fixes the visible issue]; (2) collapse the scattered maxWidths (560/640/760/780/860/900/1100) to a small scale (wide ~1100 / standard ~800 / narrow ~560); (3) standardise padding rhythm (h-pad ~36, consistent v-pad); (4) hoist a shared `pageWrap` const / `<Page>` wrapper so all tabs centre by default [durable fix, prevents recurrence]; (5) dedupe field styling — inline `fldStyle`/`fld` (`L366`) vs the `.ww-field` class. Held as a note per Angelus; do when greenlit.
  - **CONFIRMED IN OPS MEETING 24 Jun (Niel testing live):** the **401/results error is RESOLVED** — Niel reproduced his old path and the 401 no longer appears ("it seems like you've solved it"); he likes the layout/selection, far better than the Excel version. **NEW bug:** the **interviewer name does not appear on the results page** (it did in the Excel version) — fix. Angelus confirmed on the call the content **"should be centered"** (matches the CSS assessment above). **Future request (Niel):** import a recorded interview transcript to **populate the answer blocks** — but keep scoring as a HUMAN assessment (he explicitly does NOT want AI to score; assessment interprets the nature of the response, not just words). Niel to keep testing with a 2nd interviewer + use it with Henri for the AllSafe engagement. Source: `ops/meetings/transcripts/processed/Operations Meeting 24 June 2026 (transcript).docx`.

### [OPS-008] Compile list of areas where Claude tokens can optimise internal operations
- **type:** ops
- **status:** open
- **priority:** low
- **area:** AI/Internal
- **counterparty:** Nicolette
- **due:** null
- **source:** retrospective
- **notes:** Examples: meeting-note synthesis, case study adaptation. Explicitly not a productisation list. From 21 April action list.

### [OPS-011] Referral-fee formula overstatement — pricing governance
- **type:** ops
- **status:** deferred
- **priority:** low
- **area:** Finance
- **counterparty:** Niel / Nicolette / Adam
- **due:** null
- **source:** retrospective
- **notes:** Template pays referral as 10% of grossed-up client charge, creating a gap absorbed by WWRI margin. DJP locked and illustrative only. Three forward levers: treat referral as inclusive, correct template overstatement, consider capping/tiering on larger engagements. Not a DJP fix — future pricing only.

### [OPS-013] Watch: Accenture / Department of Defence Australia opportunity
- **type:** ops
- **status:** watch
- **priority:** low
- **area:** Pipeline
- **counterparty:** (surfaced via 8vance)
- **due:** null
- **source:** retrospective
- **notes:** Worth not losing if 8vance is wound down.

### [OPS-023] Claude Teams environment proposal to Niel
- **type:** ops
- **status:** open
- **priority:** low
- **area:** AI/Internal
- **counterparty:** Niel
- **due:** null
- **source:** retrospective
- **notes:** Potential broader WWRI rollout of Claude via Teams. Not yet formally put forward.

### [OPS-028] Respond to Ryan Dancey re discussion forum
- **type:** ops
- **status:** blocked
- **priority:** low
- **area:** AI/Internal
- **counterparty:** Ryan Dancey
- **due:** null
- **source:** retrospective
- **notes:** Ryan asked about a discussion forum. Blocked on OPS-020 (Nicolette's steer).

### [DEV-007] WW Cockpit — turn the Toolkit into an integrated, agentic cockpit (EPIC)
- **type:** dev
- **status:** in-progress
- **priority:** medium
- **area:** Tools
- **counterparty:** self
- **due:** null
- **source:** direct
- **notes:** **From the 24 Jun party-mode roundtable (Winston/Sally/John/Amelia/Bob).** Vision: evolve the local WW Toolkit (vanilla-JS, file://, JSON-from-Node-ETL, taskd:4317) into one integrated **cockpit** — left side-nav (SVG icon per function, TM Suite pattern), dashboard-as-overview, RP Register → editable RP database (languages/attributes), subscriptions/cost-modelling section, and finance/pipeline/subscriptions/RP that "speak to each other". **Supersedes/umbrellas** DEV-003 (Dashboard Kanban), DEV-004 (Projects mode), DEV-005 (stage-transition log); leverages DEV-002 (rp-pipeline-sync) as the first agentic action.
  - **Architecture consensus:** grow `taskd` → ONE small local Node service **`cockpitd`** that serves the cockpit over `http://localhost` (replaces file://), holds secrets, exposes a narrow API, and runs EVERY privileged/agentic action through one gate: **propose → approve → execute → append-only audit log**. Reuse existing build scripts + HubSpot helpers + the propose→approve→write skills (rp-pipeline-sync, case-study-ingest). HubSpot/Xero stay systems of record; cockpitd holds own truth + cached projections (with "as-of" stamps) + audit. Integration = shared canonical data, cross-link by **stable ID**, drill-through + carried context — NOT live bidirectional sync. **Storage seam:** all data access behind a repository module (getRP/listRPs/saveRP/mergeRP); **start JSON-on-disk**, migrate to SQLite later (~½ day once the seam exists); service owns writes, don't hand-edit raw files.
  - **Sequenced slices (Bob's plan, strangler-fig — ship each):** **S0 Walking skeleton** — cockpitd serves existing toolkit over http://localhost, backlog round-trip intact, `GET /health`. → **S1** one read endpoint + as-of stamp. → **S2** audit-log primitive (`audit.jsonl` + `logEvent()`). → **S3 KEYSTONE** one write action full spine (e.g. `POST /actions/build/rp-snapshot`: propose → diff → approve → execute → audit). → **S4** left nav + hash-router (chrome only). → **S5** data-seam module. → **S6** RP edit one field through the spine. → **S7** cross-link by stable ID + drill-through. → **S8** Dashboard v1 (what-needs-me + exceptions w/ staleness). → **S9** subscriptions/cost section. Order: S0→S1→S2→S3→S4→S5→S6→S7→S8→S9 (S4 may parallel after S0 but NOT before S3).
  - **Decision gates Angelus owns:** (a) most-handed-off assistant task = first agentic action [blocks S3] — *Claude's read from this session: the RP-register/pipeline reconcile is the strongest candidate (frequent + rp-pipeline-sync exists); email→action triage runner-up*; (b) co-pilot (sync) vs proposals-inbox (async) [blocks S3] — *steer: start co-pilot*; (c) RP-DB conflict default hand-edit-wins vs upstream-wins [blocks S6] — *steer: hand-edit-wins + provenance*; (d) which RP fields are genuinely needed, each tied to a recurring decision [blocks S6].
  - **Cut/defer:** global command bar; SQLite (until the seam hurts); bidirectional live sync; >1 agentic action before the first earns trust; full RP schema up front.
  - **S0 SHIPPED 24 Jun (walking skeleton):** built `scripts/tasks/cockpitd.mjs` (+ `start-cockpit.bat`) — grows taskd into a local service that serves the Toolkit over `http://127.0.0.1:4317/` AND keeps the backlog round-trip (`/tasks`, `PATCH /tasks/:id`) unchanged; `/health` now returns `{ok,asOf,service}`. Verified: serves `WWRI-Toolkit.html` + `./js`/`./css`/`./data` with correct MIME (ES modules as text/javascript), `/tasks` reads 63 tasks, traversal-guarded. **Key finding (the origin-change risk, now confirmed):** the Toolkit's finance/pipeline data lives in **`localStorage` (per-origin)** under the old `file://` origin and will NOT appear when served from `http://` — those views start empty on the new origin. Expected; this is exactly what the server-owned data layer (S5 seam) migrates. The `file://` version stays usable meanwhile. **BROWSER-ACCEPTED 24 Jun:** opened `http://127.0.0.1:4317/` — renders cleanly; Dashboard overview fully populated (Revenue/Pipeline/Outstanding/Won-Lost/Projects, from analytics.json+spine.json) and the Task Board works (60 tasks, Kanban, Mine-only). **Refines the finding:** JSON-backed views (Dashboard/Projects/RP) survive the origin change fine; the `localStorage` migration scope is narrower — only *imported* data (Finance detail: balance-sheet/P&L/cash-forecast; possibly the Pipeline deals grid). Spot-check Finance/Pipeline tabs to confirm exact scope for S5. Dashboard data stamp read 2026-06-22 (2 days stale) — a live argument for S1's as-of stamp.
  - **S1 SHIPPED 24 Jun (read endpoint + as-of stamp):** `cockpitd` now serves **`GET /meta`** — server-authoritative freshness per data file (embedded `generatedAt` if present, else file mtime, plus server `now` for age). New shared `toolkit/js/shared/freshness.js` (`loadMeta`/`asOfLabel`; graceful no-op on file://). Wired into **RP Register** footer → shows "as of <ts> (N days ago)", amber+⚠ past 3 days. Verified `/meta` returns sensible stamps (analytics/audit carry generatedAt 22 Jun; spine/deals via mtime; register.json 23 Jun). **Browser confirm:** open RP Register, check the as-of line renders. Trivially extendable to Projects (spine) — Dashboard already shows analytics.generatedAt.
  - **S2 SHIPPED 24 Jun (audit-log primitive):** `cockpitd` now has `logEvent()` appending structured timestamped JSONL to **`.cockpit/audit.jsonl`** (server-owned, git-ignored via `.cockpit/`); wired to the backlog-status PATCH + server.start. Verified lines write; nothing reads it yet (per plan) — it's the trail S3 writes through.
  - **S3 SHIPPED 24 Jun (KEYSTONE — agentic action through the full spine):** gates decided — **(a)** RP-register reconcile, **(b)** watch-and-approve (live). Built: `build-rp-snapshot.mjs --out <path>` (propose to temp, no clobber); cockpitd **`POST /actions/rp-reconcile/propose`** (rebuilds to temp, diffs vs live register, returns added/removed/changed, audits `action.propose`, **no write**) + **`/approve`** (commits the proposed file, audits `action.execute`); UI "↻ Reconcile from sources" button on RP Register → diff overlay → Approve/Cancel (`register-view.js`, propose→approve→write→audit, live register untouched until approve). **PROVEN on first run + immediately caught a real hazard** → see **OPS-062**: the propose diff vs the 23-Jun matrix is 0 added / 15 removed / 86 changed, and a blind approve would DELETE the 5 new RPs (OPS-061) — exactly the SSOT-clobber the gate exists to prevent. The diff-before-write gate did its job. **Merge semantics (don't-delete-additions) needed before Approve is safe (= gate (c)/S6).**
  - **S4 SHIPPED 24 Jun (left SVG side-nav):** replaced the top-banner mode-switcher with a sticky left rail (TM-Suite pattern, WWRI palette) — `WWRI/TOOLKIT` header, icon+label per mode (7 inline SVGs), active = teal left-border + surface highlight. Pure HTML+CSS in `WWRI-Toolkit.html` + `css/layout.css` (new `.app-shell`/`.sidebar`/`.app-main`; `.mode-switcher` reflowed vertical). **`app.js` untouched** — kept `.mode-switcher__btn`/`data-mode`/`--active`, so switching works unchanged. Visible on browser refresh (no cockpitd restart needed for static changes).
  - **S6 SHIPPED 24 Jun (reconcile trustworthy):** (1) cockpit reconcile **approve now backs up register.json** to `.cockpit/backups/register-<ts>.json` before overwriting (audited) — COO "never lose the SSOT"; (2) **`harmonise-from-matrix` now AUTO-ADDS** matrix Active/Pending people missing from the workbook (the OPS-062 root cause — was silently dropping them; now self-healing, idempotent, verified 0-now-because-already-complete); (3) fixed a **latent bug** — harmonise's backup wrote to a dead session-scratchpad path, now `.cockpit/backups/workbook-pre-harmonise-<ts>.json`. Merge policy confirmed: matrix wins `active`/region; manual seats/subscriptions preserved.
  - **S5 SHIPPED 24 Jun (data seam):** new `scripts/tasks/rp-repository.mjs` — the single module ALL cockpit RP reads/writes go through (`loadRegister`/`listRPs`/`getRP`/`registerAsOf` reads; `replaceRegister` write with backup-before-write moved inside; `saveRP`/`mergeRP` ready for per-record edits). **`mergeRP` is the one place gate-(c) lives:** source fields (active/region/matrixStatus/role/cohort/hubspotAdoption/email) update from upstream; manual fields (subscriptions/nda/contract/training) survive a reconcile — verified. cockpitd refactored to call the seam (propose reads via `loadRegister`, approve writes via `replaceRegister`). **Storage swap JSON→SQLite later = rewrite this ONE file.** Verified: repo unit-checks pass; cockpitd boots with seam wired.
  - **LANGUAGES FOLD-IN SHIPPED 24 Jun (RP-database vision #4):** `build-rp-snapshot` now copies `languages` from the matrix into each register person; RP Register view gained a **Languages column**, a **language filter dropdown** (16 distinct), and language-aware search. Register regenerated (141 ppl, 61 with languages). Serves the "match RPs to engagements by language" use case.
  - **S7 SHIPPED 24 Jun (drill-through — RP → their pipeline):** RP Register rows now show a "N deals ▸" chip for RPs who own deals; clicking expands an inline panel of that RP's pipeline (deal name · stage · amount · region), pulled from `deals.json` matched by `lead`. 37/41 deal leads match register RPs. First "speaks to each other" link (Sally's S7) — RP view reaching into pipeline data.
  - **NAV IA RESOLVED 24 Jun (Angelus chose "submenus in the sidebar" over a top tab bar):** unified the two-level nav — removed the top tab strip; sub-views now nest as an indented accordion under the active area in the left rail (only the active area expands; single-view areas show none). `app.js` `renderSubmenu()` + `.submenu` CSS; `.tab-bar` element removed from the shell.
  - **S8 SHIPPED 24 Jun (Dashboard "Needs attention" panel):** added an exceptions card between the KPIs and the Task Board, computed from live data — stale sources (>3d, via /meta freshness), receivables outstanding, active RPs invited-but-not-accepted, and overdue tasks (due passed, not done). Each with a severity dot; "View →" buttons deep-link to the relevant area via the sidebar. "All clear" when nothing's off. `overview-view.js` + `freshness.js`; reads analytics/register/`/tasks`.
  - **SHIPPED SO FAR: S0–S8 + languages + unified sidebar nav.** **REMAINING:** S9 (subscriptions/cost section); dedupe Jaqui/Jacqui Lane (OPS-062 follow-on a, needs canonical-spelling confirm); **RBAC/read-only roles = DEPLOYED Cost Tracker** (gray-tree), NOT the local single-user cockpit — scope for Niel's review separately. ⚠️ **cockpitd restart needed** to load S5+S6 server code (running bg server predates them). See [[finance-report-toolkit-current-state]], [[project_rp_pipeline_sync]].
  - **COO-MANDATED REQUIREMENTS (Niel, Ops Meeting 24 Jun) — endorses the cockpit-as-SSOT direction and adds hard requirements:** (1) **role-based access** — read-only vs read-write; Jeremy read-only (no status changes); custodians = Niel/Angelus/Kane (not even Nicolette edits status); define which views/buttons each internal user sees; (2) **audit trail / notification on every status change or RP deletion**; (3) **regular backups** (it's the single source of truth — lose it, lose the truth); (4) **no silent overwrite of manual edits** (Angelus once overwrote Niel's manual status changes — the merge/guard = gate (c)/S6); (5) internal-only tool, never shared externally. **Niel + Angelus to review/productionise next week (start of new FY).** This validates the whole epic (esp. the propose→approve→audit spine + permissions) and turns S5/S6 + an access-control slice into COO-requested work. Source: `ops/meetings/transcripts/processed/Operations Meeting 24 June 2026 (transcript).docx`.

### [DEV-004] Toolkit Projects mode — pipeline oversight view
- **type:** dev
- **status:** in-progress
- **priority:** medium
- **area:** Tools
- **counterparty:** self
- **due:** null
- **source:** direct
- **notes:** New "Projects" mode in WWRI Toolkit rendering the reconciled spine (`toolkit/data/pipeline/spine.json`, emitted by build-spine.mjs). Read-only oversight: KPIs (invoiced/outstanding/clients/projects), clickable SOP alert filters (billing-incomplete, untracked invoices, no-contract, outstanding), search, projects grouped by canonical client with source chips (xero/contract/hubspot), $ invoiced/due, contract status, billing badges (ABN/address/terms), HubSpot stage overlay. Files: `toolkit/js/projects/projects-view.js` + `css/projects/projects-view.css`; registered as mode in app.js + html. **Verified:** syntax + spine data (29 clients, 70 projects, $2.52M). **Not yet:** visual confirm in Chrome --app. Read-only v1; refresh via reconcile.mjs+build-spine.mjs. See [[project_pipeline_sot]].

### [DEV-005] Stage-transition event log — track pipeline trajectory (incl. regressions)
- **type:** dev
- **status:** open
- **priority:** medium
- **area:** Tools
- **counterparty:** self
- **due:** null
- **source:** direct
- **notes:** **Future build (flagged 22 Jun).** Own an append-only stage-transition log to track each deal's true journey M0→…→Won/Lost — critically including **backward moves** (pipeline goes up AND down the ladder; e.g. M3→M2→M3). HubSpot's native stage-history (`hs_date_entered_<stage>`, `hs_v2_cumulative_time_in_<stage>`, 70 props) is the closest source but **imperfect**: it's per-stage snapshots that overwrite/aggregate on re-entry, so the ordered sequence of moves is lost, and it has no IE-effort notion. **Design:** record `{dealId, from, to, ts, direction(advance/regress), source, reason, effortDays?}` per move. **Capture point:** the `rp-pipeline-sync` skill ([[project_rp_pipeline_sync]]) appends a transition record whenever it writes a stage change; backfill a seed from HubSpot property-history API. **Enables:** live funnel flow incl. drop-backs, stage conversion, velocity (time-in-stage across re-entries), win/loss-by-journey — the dynamic version of the FY22/23 Annual Report Won/Lost trajectory analysis ([[project_pipeline_sot]]). Effort-days (vs HubSpot's elapsed time) would need explicit capture.

### [DEV-002] RP Pipeline Sync skill — email → HubSpot (propose/approve/write)
- **type:** dev
- **status:** in-progress
- **priority:** medium
- **area:** Tools
- **counterparty:** self
- **due:** null
- **source:** direct
- **notes:** Angelus-facing skill that reads RP update emails, extracts a structured change set, shows it in-session for approval, then writes to HubSpot. **Scope (agreed 22 Jun):** deal stage moves (M0–M4), new-deal creation, company creation from email domains, contact create/update-and-confirm. Hard approval gate; never fabricate. **Built 22 Jun:** `.claude/skills/rp-pipeline-sync/` (SKILL.md + hubspot-reference.md with verified live stage map), `scripts/hubspot/hs.mjs` client (read/search/write + `deals-of-company`). HubSpot token (`pat-eu1…`) stashed at `~/.wwri-hubspot-token`; portal 145021882 (eu1). **Verified:** deal/company/contact/property reads OK; pipelines mapped (Opportunity `default` M0–M4→Closed Won; Partnership `2116575462`); RP roster = `ie_lead` enum; company→deals assoc lookup is the reliable deal-match path. **Scope gaps:** `crm.objects.owners.read` missing (not blocking — RP is enum); `*.write` scopes untested (surface at first approved write). **Next:** test end-to-end on a real RP update email; iterate extraction heuristics. Sibling to DEV-001 (RP-facing form). See [[project_m_stages]].

### [DEV-003] Toolkit Dashboard — urgency Kanban task board
- **type:** dev
- **status:** in-progress
- **priority:** medium
- **area:** Tools
- **counterparty:** self
- **due:** null
- **source:** direct
- **notes:** New primary "Dashboard" mode in WWRI Toolkit: urgency Kanban (Now/This Week/Later/Done) over `tasks/backlog.md` (single source of truth). **Built 22 Jun:** `scripts/tasks/parse-backlog.mjs` (md↔JSON + status round-trip + urgency), `scripts/tasks/taskd.mjs` (localhost:4317 adapter API, GET /tasks + PATCH /tasks/:id, CORS for file:// origin), `scripts/tasks/start-taskd.bat`; toolkit `js/dashboard/tasks-board.js` + `css/dashboard/tasks-board.css` (theme tokens only); registered as default mode in app.js + html. Per-card status dropdown PATCHes; drag-to-Done / drag-out-to-reopen. Toolkit stays on file:// (localStorage origin preserved); API bridges via CORS. **Verified:** parse (46 tasks), urgency split, status round-trip, API GET/PATCH/OPTIONS. **Next:** visual confirm in the Chrome --app; optional refinements (waiting/blocked treatment, parked toggle). See [[finance-report-toolkit-current-state]].

### [DEV-001] Azure Blob pipeline update interface
- **type:** dev
- **status:** deferred
- **priority:** low
- **area:** Tools
- **counterparty:** self
- **due:** null
- **source:** direct
- **notes:** Lightweight web UI (Azure SWA + Blob + Functions) for RPs to submit pipeline deal updates. HubSpot Service Key would handle reads and optionally write back to HubSpot. Same stack as Cost Tracker. Key design decision when scoping: direct HubSpot write vs. queue-for-review. Park until HubSpot Service Key + user sync is bedded in.

### [DEV-009] Oversight on the fishbone workflow (explore)
- **type:** dev
- **status:** deferred
- **priority:** low
- **area:** Tools
- **counterparty:** self
- **due:** null
- **source:** direct
- **notes:** **Parked as future dev 2026-06-25 (Angelus exploring).** Idea: give the cockpit oversight over the "fishbone" workflow — a tracking/visibility layer over fishbone (Ishikawa / root-cause analysis) activity. Likely ties to the P Process **Risk / Root-Cause Analysis** add-on module (see `ops/intranet/pages/the-p-process.content.json` → "Optional add-on modules"). **Scope undefined** — confirm with Angelus what "the fishbone workflow" concretely refers to (a specific WWRI process? a Miro board? a tool output?) and what "oversight" means (read-only dashboard view vs. a tracked/agentic action through the cockpit spine). Natural fit if it becomes a cockpit area — same propose→approve→audit + drill-through pattern as DEV-007. Do not start until Angelus greenlights and defines scope.

### [DEV-010] Centralise costing-sheet data into an Azure-blob spoke
- **type:** dev
- **status:** deferred
- **priority:** medium
- **area:** Tools
- **counterparty:** self
- **due:** null
- **source:** direct
- **notes:** **Future task, logged 2026-06-25.** A spoke in the cockpit-SSOT hub-spoke model ([[DEV-007]] architecture). Stand up the **costing sheet on its own Azure blob** (same deployed pattern as the Cost Tracker), then **discover and ingest the real costing-sheet Excels scattered in SharePoint** and convert them into the canonical blob format so **all costing-sheet data is centralised** into one store. Read-write spoke: edits made on the deployed costing app flow back to the cockpit SSOT via propose→approve→audit (no silent overwrite). **Discovery path:** `node scripts/sharepoint/sp.mjs search "costing"` (tenant-wide Graph file search, read-only) → `read <driveId> <itemId>` to pull each workbook → map columns to the m-suite costing schema (`m-suite`/`apps/m-suite` `lib/calculations.ts` + costing page) → write to blob. **Open scope to settle in the DEV-007 architecture pass:** the canonical costing schema, the field-ownership map (which fields the spoke may write back vs cockpit-owned), and the one-time conversion of legacy Excels vs ongoing sync. Do not start until the hub-spoke architecture (publish/propose-back contract) is defined.

### [DEV-011] Centralise structured-interview data into the new format
- **type:** dev
- **status:** deferred
- **priority:** medium
- **area:** Tools
- **counterparty:** self
- **due:** null
- **source:** direct
- **notes:** **Future task, logged 2026-06-25.** Sibling to [[DEV-010]] — the SI spoke in the cockpit-SSOT hub-spoke model ([[DEV-007]]). Structured-interview data currently lives in **spread-out bespoke assessment spreadsheets** (the Topics→Eval→Summary→Radar workbooks — see [[structured-interview-workbooks]]). **Discover those workbooks in SharePoint** (`node scripts/sharepoint/sp.mjs search "interview"` / by client folder) and **reconcile them into the new SI-app data format** — the Azure hardened-schema data layer being built for the deployed SI app ([[DEV-006]] / [[structured-interview-app]]). Read-write spoke: same propose→approve→audit reconcile back to the cockpit SSOT. **Open scope (DEV-007 architecture pass):** mapping the heterogeneous legacy workbook layouts onto the hardened SI schema, dedupe/identity across cohorts (mind [[jan-sorcek-vs-soucek]]), and one-time backfill vs ongoing capture. Do not start until the hub-spoke architecture is defined.
